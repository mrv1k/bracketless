function syncDefault() {
  chrome.storage.sync.set({
    lowLimit: 13,
    upLimit: 255,
    autoLoad: false,
    autoPlay: false,
  });
}
function checkOptsUse(cb) {
  chrome.storage.sync.getBytesInUse(null, (bytes) => { if (bytes === 0) cb(); });
}

function onInstalled() {
  chrome.runtime.onInstalled.addListener(() => {
    checkOptsUse(syncDefault); // For easy retrieval in bracketless.js
    chrome.contextMenus.create({ id: 'bracketless', title: 'Bracketless: next action' });
  });
}


const tabState = {
  get(tabId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(tabId.toString(), (state) => {
        resolve(state[tabId]);
      });
    });
  },
  set(tabId, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [tabId]: value }, () => resolve());
    });
  },
  remove(tabId) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(tabId.toString(), () => resolve());
    });
  },
  clearAll() {
    chrome.storage.local.clear();
  },
};


function disableBrowserAction(tabId, message) {
  chrome.browserAction.setTitle({ tabId, title: `Disabled: ${message}` });
  chrome.browserAction.disable(tabId);
}

function checkBrowserAction(tabId) { // Check if not disabled
  return new Promise((resolve) => {
    chrome.browserAction.getTitle({ tabId }, (title) => {
      if (!title.includes('Disabled')) resolve();
    });
  });
}


function load(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, { file: 'src/bracketless.js' }, () => {
      chrome.tabs.insertCSS(tabId, { file: 'css/action.css' });
      chrome.tabs.executeScript(tabId, { file: 'src/action.js' }, () => {
        checkBrowserAction(tabId)
          .then(() => {
            chrome.browserAction.setIcon({ tabId, path: { 16: 'icons/play16.png', 32: 'icons/play32.png' } });
            chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
            tabState.set(tabId, false)
              .then(() => resolve('load'));
          });
      });
    });
  });
}

function activate(tabId, active) {
  return new Promise((resolve) => {
    const action = active === true ?
      { message: 'Pause collapsing', reverseIcon: 'pause' } :
      { message: 'Collapse brackets', reverseIcon: 'play' };
    chrome.browserAction.setIcon({ tabId, path: { 16: `icons/${action.reverseIcon}16.png`, 32: `icons/${action.reverseIcon}32.png` } });
    chrome.browserAction.setTitle({ tabId, title: action.message });
    chrome.tabs.sendMessage(tabId, active, () => {
      tabState.set(tabId, active)
        .then(() => resolve('action'));
    });
  });
}

function listenerAction(tabId) {
  tabState.get(tabId)
    .then((state) => {
      if (state === undefined) {
        return load(tabId);
      } else if (state === false) {
        return activate(tabId, true);
      } else if (state === true) {
        return activate(tabId, false);
      }
      return Promise.reject(new Error('Bracketless. listenerAction. if else'));
    })
    .catch((reason) => { throw reason; });
}

// Clean up with any permission(s)
function tabsRemoved() {
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (removeInfo.isWindowClosing) tabState.clearAll();
    else tabState.remove(tabId);
  });
}


// Only 'activeTab' permission
function tabsUpdated() {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Tab reload clean up. No .url access == no permission for this tab
    if (changeInfo.status === 'complete' && !Object.prototype.hasOwnProperty.call(tab, 'url')) {
      tabState.remove(tabId);
    }
  });
}


// Automation. 'tabs' and 'webNavigation' required
function checkTabsWebNavPerm() {
  return new Promise((resolve, reject) => {
    chrome.permissions.contains({
      permissions: ['tabs', 'webNavigation'],
      origins: ['*://*/'],
    }, (result) => {
      if (result) resolve(result);
      else reject(result);
    });
  });
}

function autoAction(tabId) {
  chrome.storage.sync.get(null, (options) => {
    if (options.autoPlay) {
      // Call directly to bypass listenerAction conditional check.
      load(tabId).then(() => activate(tabId, true));
    } else if (options.autoLoad) {
      load(tabId);
    }
  });
}

// Filter out chrome util pages. Examples: https://git.io/vFZhQ
const webNavFilter = { url: [{ hostContains: '.' }] };

function webNavCommitted() {
  chrome.webNavigation.onCommitted.addListener((details) => {
    // autoAction reload clean up. tabs & webNav permissions obtained
    if (details.transitionType === 'reload') tabState.remove(details.tabId);
  }, webNavFilter);
}

function webNavLoaded() {
  chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    if (details.frameId === 0) {
      // Chrome extensions cannot execute/insert the Chrome Web Store: more here https://goo.gl/3dRRe3
      if (details.url.includes('https://chrome.google.com/webstore')) {
        disableBrowserAction(details.tabId, 'Not allowed at webstore');
      } else {
        autoAction(details.tabId);
      }
    } // run only for main frame
  }, webNavFilter);
}


function onEventPage() {
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => listenerAction(tab.id));

  tabsRemoved();
  // Determine which API use to listen for events
  checkTabsWebNavPerm()
    .then(() => {
      webNavCommitted();
      webNavLoaded();
    }, tabsUpdated);
}


function addMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.disable) {
      disableBrowserAction(sender.tab.id, 'No brackets found');
      // No method to disable contextMenus for a single tab, leave as is
    } else if (request.permissionsUpdated) {
      onEventPage(); // Re-execute to apply permission changes
    } else {
      throw Error('Bracketless. addMessageListener. if else');
    }
  });
}


onInstalled();
onEventPage();
addMessageListener();
