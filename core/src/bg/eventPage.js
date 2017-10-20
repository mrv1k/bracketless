function createContextMenus() {
  chrome.contextMenus.create({ id: 'bracketless', title: 'local.clear()' });
}

function updateContextMenus(text) {
  chrome.contextMenus.update('bracketless', { title: text });
}

const tabState = {
  get(tabId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(tabId.toString(), (singleState) => {
        console.warn('getState');
        console.log(singleState[tabId]);
        resolve(singleState[tabId]);
      });
    });
  },
  set(tabId, value) {
    console.warn('setState');
    console.log(tabId, value);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [tabId]: value }, () => resolve());
    });
  },
  remove(tabId) {
    console.warn('removeState');
    console.log(tabId);
    return new Promise((resolve) => {
      chrome.storage.local.remove(tabId.toString(), () => resolve());
    });
  },
  getAll() { // Dev QoL
    chrome.storage.local.get(null, (all) => {
      console.warn('local.get(null)');
      console.log(all);
    });
  },
  clearAll() {
    chrome.storage.local.clear(() => {
      console.warn('local.clear(null)');
      this.getAll();
    });
  },
};

function load(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, { file: 'src/bracketless.js' }, () => {
      chrome.browserAction.setIcon({ tabId, path: 'icons/play.png' });
      chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
      // updateContextMenus('Collapse brackets');
      chrome.tabs.insertCSS(tabId, { file: 'css/action.css' });
      chrome.tabs.executeScript(tabId, { file: 'src/action.js' }, () => {
        tabState.set(tabId, false) // { 322: false }
          .then(() => resolve('load resolved'));
      });
    });
  });
}

function doAction(tabId, action) {
  return new Promise((resolve) => {
    const state = action === 'play' ?
      { message: 'Pause collapsing', active: true, icon: 'pause' } :
      { message: 'Collapse brackets', active: false, icon: 'play' };
    chrome.browserAction.setIcon({ tabId, path: `icons/${state.icon}.png` });
    chrome.browserAction.setTitle({ tabId, title: state.message });
    // updateContextMenus(state.message);
    chrome.tabs.sendMessage(tabId, { active: state.active }, (response) => {
      console.warn('doAction sendMessage responseFn');
      console.log(response);
      tabState.set(tabId, state.active) // { 322: bool}
        .then(() => { resolve(`action resolved: ${action}`); });
    });
  });
}


function listenerAction(tabId) {
  tabState.get(tabId)
    .then((state) => {
      console.warn('getState.then()');
      console.log(state);

      if (state === undefined) {
        console.log('not loaded, load');
        return load(tabId);
      } else if (state === false) {
        console.log('loaded not active, play');
        return doAction(tabId, 'play');
      } else if (state === true) {
        console.log('loaded active, pause');
        return doAction(tabId, 'pause');
      }
      return Promise.reject(new Error('listenerAction if else didn\'t work'));
    })
    .then((action) => {
      console.log(action);
      console.log('------------------------');
    });
}


function checkPermission() {
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    // localClear();
    tabState.getAll();
  }
});

// integer tabId, object removeInfo
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  tabState.get(tabId).then((diz) => {
    if (diz === undefined) {
      console.log('I have no power over hea.');
    } else {
      console.log('FEEL THE POWER!');
      tabState.remove(tabId);
    }
  });
});


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

chrome.runtime.onInstalled.addListener(() => {
  checkOptsUse(syncDefault); // if not in use, sync default
  createContextMenus();
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => tabState.clearAll());
  // checkPermission()
  //   .then(autoAction, e => console.warn(e)); // no permission, just ignore?
});
