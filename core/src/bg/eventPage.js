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
  getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (all) => {
        const activeIdArr = Object.keys(all).map(key => Number(key));
        resolve(activeIdArr);
      });
    });
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
          .then(() => resolve('load resolved'));
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
        .then(() => { resolve(`action resolved. enabled: ${active}`); });
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

// NOT INVOKED
function autoAction(tabId) {
  // call fns directly to bypass listenerAction condition checks
  chrome.storage.sync.get(null, (options) => {
    if (options.autoPlay) {
      load(tabId).then(() => activate(tabId, true));
    } else if (options.autoLoad) {
      load(tabId);
    }
  });
}
function addOnUpdated() {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // as there is no reliable way to detect page reload via onUpdated, do it the weird way
    if (changeInfo.status === 'complete' && !Object.prototype.hasOwnProperty.call(tab, 'url')) {
      tabState.remove(tabId); // activeTab page reload clean up
    }
  });
}

function getOpenTabIdList() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabList) => {
      resolve(tabList.map(tab => tab.id));
    });
  });
}
function garbageCollector() {
  return Promise.all([tabState.getAll(), getOpenTabIdList()])
    .then((tabIdArr) => {
      const activeList = tabIdArr[0];
      const openList = tabIdArr[1];

      if (activeList.length > 4) {
        activeList.forEach((id) => {
          if (openList.includes(id) === false) {
            tabState.remove(id);
          }
        });
      }
    });
}
function addOnRemoved() {
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // tab is focused (matters only for activeTab) and browser window gets closed
    if (removeInfo.isWindowClosing) {
      tabState.clearAll();
      return;
    }

    checkTabsWebNavPerm()
      .then(() => { // autoOptions enabled, tabs permission obtained
        tabState.remove(tabId);
      }, () => { // autoOptions disabled, clean up via activeTab
        garbageCollector(removeInfo);
      })
      .catch((reason) => {
        throw Error(`Bracketless. addOnRemoved. Reason: ${reason}`);
      });
  });
}


function eventPageListeners() {
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => listenerAction(tab.id));
  addOnUpdated();
  addOnRemoved();
}

onInstalled();
eventPageListeners();
