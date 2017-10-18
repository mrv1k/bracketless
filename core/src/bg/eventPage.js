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
  chrome.contextMenus.create({ id: 'bracketless', title: 'DEV: CLEAN LOCAL STORAGE 0' });
}
function updateContextMenus(text) {
  chrome.contextMenus.update('bracketless', { title: 'DEV: CLEAN LOCAL STORAGE 1' });
}

function getState(tabId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(tabId.toString(), (state) => {
      console.log('getTabStates itself');
      console.log(state[tabId]);
      resolve(state[tabId]);
    });
  });
}

// setState(tabId, 'loaded', true);
// setState(tabId, 'active', state.collapse);
function setState(tabId, state, value) {
  console.log('F', tabId, state, value);
  return new Promise((resolve) => {
    if (state === 'loaded') {
      const init = {};
      const proxy = {};
      proxy[state] = value; // {loaded: true}
      init[tabId] = proxy; // {451: {loaded: true}}
      chrome.storage.local.set(init, () => resolve());
    } else {
      console.log('setState else');
      resolve();
    }
  });
}

function load(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, { file: 'src/bracketless.js' }, () => {
      chrome.browserAction.setIcon({ tabId, path: 'icons/play.png' });
      chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
      updateContextMenus('Collapse brackets');
      chrome.tabs.insertCSS(tabId, { file: 'css/action.css' });
      chrome.tabs.executeScript(tabId, { file: 'src/action.js' }, () => {
        setState(tabId, 'loaded', true)
          .then(() => resolve()); // 322: {loaded: true}
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

function listenerAction(tabId) {
  getState(tabId)
    .then((tabState) => {
      console.log('LA', tabState);

      if (!tabState) {
        load(tabId);
        console.log('not loaded, load');
      } else if (!tabState.active) {
        doAction(tabId, 'play');
        console.log('loaded not active, play');
      } else if (tabState.active) {
        doAction(tabId, 'pause');
        console.log('loaded active, pause');
      }
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

chrome.runtime.onInstalled.addListener(() => {
  syncDefaultOptions();
  setUpContextMenus();
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  // ! MODIFY FOR DEV ONLY! CLEAN UP FOR TESTING
  chrome.contextMenus.onClicked.addListener((_, tab) => chrome.storage.local.clear());
  // optionalPermsCheck()
  //   .then(autoAction, e => console.warn(e)); // no permission, just ignore?
});
