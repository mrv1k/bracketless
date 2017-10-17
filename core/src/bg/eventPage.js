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
  chrome.contextMenus.create({ id: 'bracketless', title: 'Load bracketless' });
}
function updateContextMenus(text) {
  chrome.contextMenus.update('bracketless', { title: text });
}

function getTabStates() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (states) => {
      console.log('getTabStates');
      console.log(states);
      resolve(states);
    });
  });
}

// setState(tabId, 'loaded', true);
// setState(tabId, 'active', state.collapse);
function setState(tabId, state, value) {
  console.log('setState F', tabId, state, value);
  if (state === 'loaded') {
    const init = {};
    const proxy = {};
    proxy[state] = value; // {loaded: true}
    init[tabId] = proxy; // {451: proxy[state]} -> {451: {loaded: true}}
    chrome.storage.local.set(init);
    // {451: {loaded: true}}
  } else {
    getTabStates()
      .then((states) => {
        console.log(states[tabId]);
        states[tabId][state] = value;
        console.log(states[tabId]);
      });
  }

  // chrome.storage.local.clear();
}

// const loadedTabs = {};
// const activeTabs = {};

function load(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, { file: 'src/bracketless.js' }, () => {
      chrome.browserAction.setIcon({ tabId, path: 'icons/play.png' });
      chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
      updateContextMenus('Collapse brackets');
      chrome.tabs.insertCSS(tabId, { file: 'css/action.css' });
      chrome.tabs.executeScript(tabId, { file: 'src/action.js' }, () => {
        setState(tabId, 'loaded', true);
        resolve();
        // loadedTabs[tabId] = true -> tabId: {loaded: true, active: false}
      });
    });
  });
}

function doAction(tabId, action) {
  const state = action === 'play' ?
    { message: 'Pause collapsing', collapse: true, icon: 'pause' } :
    { message: 'Collapse brackets', collapse: false, icon: 'play' };
  chrome.browserAction.setIcon({ tabId, path: `icons/${state.icon}.png` });
  chrome.browserAction.setTitle({ tabId, title: state.message });
  // chrome.tabs.sendMessage(tabId, { collapse: state.collapse });

  setState(tabId, 'active', state.collapse);
  updateContextMenus(state.message);
}

// getTabStates()
//   .then((s) => {
//     console.log(s[tabId]);
//     console.log(s[tabId].loaded);
//     console.log(s[tabId].active);
//   });

function listenerAction(tabId) {
  load(tabId)
    .then(() => doAction(tabId, 'play'))
    .then(() => getTabStates())
    .then((s) => {
      console.log(s);
    });

  // if (!loadedTabs[tabId]) {
  // load(tabId);
  // } else if (!activeTabs[tabId]) {
  // doAction(tabId, 'play');
  // getTabStates().then((v) => { console.log('listener', v); });
  // } else if (activeTabs[tabId]) {
  //   doAction(tabId, 'pause');
  // }

  // if (getTabStates().then(s => !s[tabId].loaded)) {
  // not loaded, load
  // } else if (getTabStates().then(s => !s[tabId].active)) {
  // loaded not active, play
  // } else if (getTabStates().then(s => s[tabId].active)) {
  // loaded active, pause
  // }
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

chrome.runtime.onInstalled.addListener(() => {
  syncDefaultOptions();
  setUpContextMenus();
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => listenerAction(tab.id));
  // optionalPermsCheck()
  //   .then(autoAction, e => console.warn(e)); // no permission, just ignore?
});
