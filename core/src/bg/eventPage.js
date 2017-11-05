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
    checkOptsUse(syncDefault);
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


function load(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, { file: 'src/bracketless.js' }, () => {
      chrome.browserAction.setIcon({ tabId, path: { 16: 'icons/play16.png', 32: 'icons/play32.png' } });
      chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
      chrome.tabs.insertCSS(tabId, { file: 'css/action.css' });
      chrome.tabs.executeScript(tabId, { file: 'src/action.js' }, () => {
        tabState.set(tabId, false)
          .then(() => resolve('load'));
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
        .then(() => { resolve('action'); });
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
      return Promise.reject(new Error('listenerAction if else'));
    })
    .catch((reason) => {
      throw Error(`Bracketless. listenerAction. Reason: ${reason}`);
    });
}


function autoAction(tabId) {
  // call directly to bypass listenerAction conditional check
  chrome.storage.sync.get(null, (options) => {
    if (options.autoPlay) {
      load(tabId).then(() => activate(tabId, true));
    } else if (options.autoLoad) {
      load(tabId);
    }
  });
}

// filter out chrome util pages. examples: https://git.io/vFZhQ
const webNavFilter = { url: [{ hostContains: '.' }] };

function webNavCommitted() {
  chrome.webNavigation.onCommitted.addListener((details) => {
    // autoAction clean up (tabs & webNav permissions obtained)
    if (details.transitionType === 'reload') tabState.remove(details.tabId);
  }, webNavFilter);
}

function webNavLoaded() {
  chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    if (details.frameId === 0) autoAction(details.tabId);
  }, webNavFilter);
}


function tabsUpdated() {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // reload clean up, (just activeTab permission)
    // clean up every there's no url, in order to obtain url activeTab permission must be present
    if (changeInfo.status === 'complete' && !Object.prototype.hasOwnProperty.call(tab, 'url')) {
      tabState.remove(tabId);
    }
  });
}

function tabsRemoved() {
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (removeInfo.isWindowClosing) tabState.clearAll();
    else tabState.remove(tabId);
  });
}


function checkTabsWebNavPerm() {
  return new Promise((resolve, reject) => {
    chrome.permissions.contains({
      permissions: ['tabs', 'webNavigation'],
      origins: ['http://*/', 'https://*/'],
    }, (result) => {
      if (result) resolve(result);
      else reject(result);
    });
  });
}

function onEventPage() {
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => listenerAction(tab.id));

  checkTabsWebNavPerm()
    .then(() => {
      webNavCommitted();
      webNavLoaded();
    }, () => {
      tabsUpdated();
      tabsRemoved();
    });
}

function eventPageReload() {
  chrome.runtime.onMessage.addListener(() => { onEventPage(); });
}


onInstalled();
onEventPage();
eventPageReload();
