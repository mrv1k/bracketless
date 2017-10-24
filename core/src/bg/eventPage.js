function createContextMenu() {
  chrome.contextMenus.create({ id: 'bracketless', title: 'garbageCollector()' });
}
// function updateContextMenu(text) {
//   chrome.contextMenus.update('bracketless', { title: text });
// }


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
        console.log(all);
        const activeIdArr = Object.keys(all).map(key => Number(key));
        resolve(activeIdArr);
      });
    });
  },
};


function load(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, { file: 'src/bracketless.js' }, () => {
      chrome.browserAction.setIcon({ tabId, path: 'icons/play.png' });
      chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
      // updateContextMenu('Collapse brackets');
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
    chrome.browserAction.setIcon({ tabId, path: `icons/${action.reverseIcon}.png` });
    chrome.browserAction.setTitle({ tabId, title: action.message });
    // updateContextMenu(state.message);
    chrome.tabs.sendMessage(tabId, active, () => {
      tabState.set(tabId, active)
        .then(() => { resolve(`action resolved. enabled: ${active}`); });
    });
  });
}

function listenerAction(tabId) {
  tabState.get(tabId)
    .then((state) => {
      console.warn('getState.then()');
      console.log(state);

      if (state === undefined) {
        return load(tabId);
      } else if (state === false) {
        return activate(tabId, true);
      } else if (state === true) {
        return activate(tabId, false);
      }
      return Promise.reject(new Error('listenerAction if else didn\'t work'));
    })
    .then((action) => {
      console.log(action);
      console.log('------------------------');
    });
}


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

function getOpenTabIdList() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabList) => {
      resolve(tabList.map(tab => tab.id));
    });
  });
}

function garbageCollector() {
  console.warn('REMINDER THAT YOU GET ACTIVE TAB PERMISSION BY USING GC THROUGH CONTEXT MENU');

  return Promise.all([tabState.getAll(), getOpenTabIdList()])
    .then((tabIdArr) => {
      const activeList = tabIdArr[0];
      const openList = tabIdArr[1];
      console.log(activeList);
      console.log(openList);

      if (activeList.length === 0 || activeList.length < 1) {
        console.log('Extension is not loaded, or Less than 1 state is saved');
      } else {
        activeList.forEach((id) => {
          console.log(id);
          if (openList.includes(id)) {
            console.log('tab is still alive, leave it');
          } else {
            tabState.remove(id);
            console.log('tab is NOT alive, collect it');
          }
        });
      }
    });
}

function addOnUpdated() {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Works only with auto options. Chrome browser utility tab check (requires tab permission)
    if (/(chrome)(?:[/:-])/.test(tab.url)) return;

    if (changeInfo.status === 'complete' && tab.active) {
      // no permission, either new tab or tab refresh
      console.log(`tab.url is ${tab.url}`);
      if (tab.url === undefined) {
        tabState.get(tabId)
          .then((state) => {
            // state loaded, no permission = tab refresh
            if (typeof state === 'boolean') tabState.remove(tabId);
          });

        // else will also catch when permission granted via activeTab, FIX IT
      } else {
        if (/#/.test(tab.url)) {
          console.log('this test is inefficient as it will prevent autoLoad from working');
        }
        autoAction(tabId);
      }
    }
  });
}

function removedListener(tabId, info) {
  tabState.get(tabId).then((state) => {
    if (state !== undefined) {
      // tab is focused and tab gets closed
      tabState.remove(tabId);
      // tab is focused and browser window gets closed
      if (info.insWindowClosing) tabState.clearAll();
    }
  });
}
function addOnRemoved() {
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    removedListener(tabId, removeInfo);
  });
}


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
    checkOptsUse(syncDefault); // if not in use, sync default
    createContextMenu();

    // listeners
    chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
    chrome.contextMenus.onClicked.addListener((_, tab) => { garbageCollector(); });
    addOnUpdated();
    addOnRemoved();
  });
}

onInstalled();
