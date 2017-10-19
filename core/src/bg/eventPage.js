function syncDefaultOptions() {
  chrome.storage.sync.getBytesInUse(null, (bytes) => {
    if (bytes === 0) {
      chrome.storage.sync.set({
        lowLimit: 13,
        upLimit: 255,
        autoLoad: false,
        autoPlay: false,
      });
    }
  });
}

function setUpContextMenus() {
  chrome.contextMenus.create({ id: 'bracketless', title: 'local.clear()' });
}
function updateContextMenus(text) {
  chrome.contextMenus.update('bracketless', { title: text });
}

function getState(tabId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(tabId.toString(), (state) => {
      console.warn('getState');
      console.log(state[tabId]);
      resolve(state[tabId]);
    });
  });
}

function setLoadState(tabId) {
  console.warn('setLoadState');
  console.log(tabId);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [tabId]: {} }, () => resolve());
  });
}

function setActiveState(tabId, tabState, value) {
  console.warn('setActiveState');
  const activeTabState = tabState;
  activeTabState.active = value;
  console.log(activeTabState);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [tabId]: activeTabState }, () => resolve());
  });
}

function load(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, { file: 'src/bracketless.js' }, () => {
      chrome.browserAction.setIcon({ tabId, path: 'icons/play.png' });
      chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
      // updateContextMenus('Collapse brackets');
      chrome.tabs.insertCSS(tabId, { file: 'css/action.css' });
      chrome.tabs.executeScript(tabId, { file: 'src/action.js' }, () => {
        setLoadState(tabId)
          .then(() => resolve('load resolved')); // { 322: {} }
      });
    });
  });
}

function doAction(tabId, tabState, action) {
  return new Promise((resolve) => {
    const state = action === 'play' ?
      { message: 'Pause collapsing', collapse: true, icon: 'pause' } :
      { message: 'Collapse brackets', collapse: false, icon: 'play' };
    chrome.browserAction.setIcon({ tabId, path: `icons/${state.icon}.png` });
    chrome.browserAction.setTitle({ tabId, title: state.message });
    // updateContextMenus(state.message);
    chrome.tabs.sendMessage(tabId, { collapse: state.collapse }, (response) => {
      console.warn('doAction sendMessage responseFn');
      console.log(response);
      setActiveState(tabId, tabState, state.collapse)
        .then(() => { resolve(`action resolved: ${action}`); }); // { 322: {active: bool}
    });
  });
}

function listenerAction(tabId) {
  getState(tabId)
    .then((tabState) => {
      console.warn('getState.then()');
      console.log(tabState);

      if (!tabState) {
        console.warn('not loaded, load');
        console.log(tabState, '->', !tabState);
        return load(tabId);

      } else if (!tabState.active) {
        console.warn('loaded not active, play');
        console.log(tabState.active, '->', !tabState.active);
        return doAction(tabId, tabState, 'play');

      } else if (tabState.active) {
        console.warn('loaded active, pause');
        console.log(tabState.active, '->', 'doesn\`t use bool reverse');
        return doAction(tabId, tabState, 'pause');
      }
      return Promise.reject(new Error('listenerAction if else didn\'t work'));
    })
    .then((action) => {
      console.log(action);
      console.log('------------------------');
    });
}

function optionalPermsCheck() {
  return new Promise((resolve, reject) => chrome.permissions.contains({
    permissions: ['tabs'],
    origins: ['http://*/', 'https://*/'],
  }, (permission) => {
    if (permission) resolve(permission);
    else reject(new Error(`Bracketless. Tabs at any origins was denied. Permission: ${permission}`));
  }));
}

function autoAction() {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // if (this is not the same page AND already loaded) OR (chrome browser utility page) - like "chrome://"
    if ((tabId !== tab.id && loadedTabs[tabId]) || /(chrome)(?:[/:-])/.test(tab.url)) return;
    if (changeInfo.status === 'complete' && tab.active) {
      chrome.storage.sync.get(null, (options) => {
        if (options.autoLoad && options.autoPlay === false) load(tabId);
        if (options.autoLoad && options.autoPlay) {
          load(tabId)
            .then(() => doAction(tabId, 'play'));
        }
      });
    }
  });
}


function localClear() {
  chrome.storage.local.clear(() => {
    chrome.storage.local.get(null, (cleared) => {
      console.warn('local.clear()');
      console.log(cleared);
    });
  });
}

function localGetAll() {
  chrome.storage.local.get(null, (all) => {
    console.warn('local.get(null)');
    console.log(all);
  });
}

// !PRODUCTION BREAKING! Dev QoL (Quality of Life)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    // localClear();
    localGetAll();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  syncDefaultOptions();
  setUpContextMenus();
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => localClear());
  // optionalPermsCheck()
  //   .then(autoAction, e => console.warn(e)); // no permission, just ignore?
});
