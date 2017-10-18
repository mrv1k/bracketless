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
      // getState(tabId)
      //   .then((result) => {
      //     console.log('resulto!', result);
      //     const active = result[tabId];
      //     active[result] = value;
      //     chrome.storage.local.set(active);
      //     // return active;
      //   });
      // .then((active) => {
      //   return new Promise((resolve) => {
      //     chrome.storage.local.set(active, () => resolve());
      //   });
      // });
    }
  });
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
        setState(tabId, 'loaded', true)
          .then(() => resolve());
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

function listenerAction(tabId) {
  // load(tabId)
  //   .then(() => doAction(tabId, 'play'))
  //   .then(() => getState(tabId))
  //   .then((result) => {
  //     console.log('last', result);
  //     chrome.storage.local.clear();
  //   });

  // if (!loadedTabs[tabId]) {
  // load(tabId);
  // } else if (!activeTabs[tabId]) {
  // doAction(tabId, 'play');
  // getTabStates().then((v) => { console.log('listener', v); });
  // } else if (activeTabs[tabId]) {
  //   doAction(tabId, 'pause');
  // }
  getState(tabId)
    .then((tabState) => {
      console.log('LA', tabState);

      if (undefined) {
        load(tabId);
        console.log('not loaded, load');
      } else if (!tabState.active) {
        doAction(tabId, 'play');
        console.log('loaded not active, play');
      } else if (tabState.active) {
        doAction(tabId, 'pause');
        console.log('loaded active, pause');
      }
    })
    .then(() => chrome.storage.local.clear());
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
