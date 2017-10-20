function createContextMenu() {
  chrome.contextMenus.create({ id: 'bracketless', title: 'getAll().clearAll()' });
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
  getAll() { // Dev QoL
    chrome.storage.local.get(null, (all) => {
      console.warn('local.get(null)');
      console.log(all);
      this.clearAll();
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


// function checkPermission() {
//   return new Promise((resolve, reject) => chrome.permissions.contains({
//     permissions: ['tabs'],
//     origins: ['http://*/', 'https://*/'],
//   }, (permission) => {
//     if (permission) resolve(permission);
//     else reject(new Error(`Bracketless. Tabs at any origins was denied. Permission: ${permission}`));
//   }));
// }

function addOnUpdated() {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // if (this is not the same page AND already loaded) OR (chrome browser utility page) - like "chrome://"
    // if ((tabId !== tab.id && loadedTabs[tabId]) || /(chrome)(?:[/:-])/.test(tab.url)) return;
    // if (changeInfo.status === 'complete' && tab.active) {
    //   chrome.storage.sync.get(null, (options) => {
    //     if (options.autoLoad && options.autoPlay === false) load(tabId);
    //     if (options.autoLoad && options.autoPlay) {
    //       load(tabId)
    //         .then(() => activate(tabId, true));
    //     }
    //   });
    // }
  });
}

function removedListener(tabId, info) {
  tabState.get(tabId).then((state) => {
    // act only if state is defined (obtained currentTab permission)
    if (state !== undefined) {
      console.warn('onRemoved IF');
      console.log(state, info);

      // tab is focused and tab gets closed
      tabState.remove(tabId);

      // tab is focused and browser window gets closed
      if (info.insWindowClosing) {
        tabState.clearAll();
      }
    } else {
      console.warn('onRemoved ELSE');
    }
  });
}
function addOnRemoved() {
  chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.warn('onRemoved');
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
    chrome.contextMenus.onClicked.addListener((_, tab) => tabState.getAll());
    addOnUpdated();
    addOnRemoved();
    // checkPermission()
    //   .then(autoAction, e => console.warn(e)); // no permission, just ignore?
  });
}

onInstalled();
