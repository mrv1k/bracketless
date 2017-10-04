function syncDefaultOptions() {
  chrome.storage.sync.getBytesInUse(null, (bytes) => {
    if (bytes === 0) {
      chrome.storage.sync.set({
        lowerRegexLimit: 13,
        upperRegexLimit: 255,
        autoLoad: false,
        autoPlay: false,
      });
    }
  });
}

const activeTabs = {};
const loadedTabs = {};

function load(tabId) {
  chrome.tabs.executeScript(tabId, { file: 'src/bg/bracketless.js' }, (response) => {
    [loadedTabs[tabId]] = response;
    chrome.browserAction.setIcon({ tabId, path: 'icons/play.png' });
    chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
    chrome.tabs.insertCSS(tabId, { file: 'css/toggle.css' });
    chrome.tabs.executeScript(tabId, { file: 'src/bg/toggle_collapse.js' });
  });
}

function doAction(tabId, action) {
  const state = action === 'play' ?
    { message: 'Pause collapsing', collapse: true, icon: 'pause' } :
    { message: 'Collapse brackets', collapse: false, icon: 'play' };
  activeTabs[tabId] = state.collapse;
  chrome.browserAction.setIcon({ tabId, path: `icons/${state.icon}.png` });
  chrome.browserAction.setTitle({ tabId, title: state.message });
  chrome.tabs.sendMessage(tabId, { collapse: state.collapse });
}

function setUpContextMenus() {
  chrome.contextMenus.create({
    id: 'bracketless',
    title: 'Bracketless action',
  });
}
// activate play pause update?
// chrome.contextMenus.update();

function listenerAction(tabId) {
  if (!loadedTabs[tabId]) {
    load(tabId);
  } else if (!activeTabs[tabId]) {
    doAction(tabId, 'play');
  } else if (activeTabs[tabId]) {
    doAction(tabId, 'pause');
  }
}

function optionalPermsCheck() {
  return new Promise(resolve => chrome.permissions.contains({
    permissions: ['tabs'],
    origins: ['http://*/', 'https://*/'],
  }, granted => resolve(granted)));
}

function autoAction(tabPerm) {
  if (!tabPerm) return; // if permission false, return

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active && !/(chrome)(?:[/:-])/.test(tab.url)) {
      chrome.storage.sync.get(null, (options) => {
        // race condition, needs to get fixed
        if (options.autoLoad) listenerAction(tabId);
        if (options.autoPlay) listenerAction(tabId);
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  syncDefaultOptions();
  setUpContextMenus();
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => listenerAction(tab.id));
  optionalPermsCheck()
    .then((value) => {
      autoAction(value);
    });
});

