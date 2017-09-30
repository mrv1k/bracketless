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

const loadedTabs = {};
const injected = {};

function load(tabId) {
  chrome.tabs.executeScript(tabId, { file: 'src/bg/bracketless.js' }, (response) => {
    injected[tabId] = response;
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

  loadedTabs[tabId] = state.collapse;
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

function listenerAction(tabId) {
  if (!injected[tabId]) {
    load(tabId);
  } else if (!loadedTabs[tabId]) {
    doAction(tabId, 'play');
  } else if (loadedTabs[tabId]) {
    doAction(tabId, 'pause');
  }
}

// When the extension gets installed, set up the context menus
chrome.runtime.onInstalled.addListener(() => {
  syncDefaultOptions();
  setUpContextMenus();
  chrome.browserAction.onClicked.addListener(tab => listenerAction(tab.id));
  chrome.contextMenus.onClicked.addListener((_, tab) => listenerAction(tab.id));
});

// activate play pause update?
// chrome.contextMenus.update();

// optional functionality
// function autoAction() {
//   chrome.permissions.contains({
//     permissions: ['tabs'],
//     origins: ['http://*/', 'https://*/'],
//   }, (result) => {
//     if (result) {
//       chrome.storage.sync.get(null, (options) => {
//         if (options.autoLoad) {
//           chrome.tabs.query({ active: true }, tabs => load(tabs[0].id));
//         }
//         if (options.autoPlay) {
//           chrome.tabs.query({ active: true }, tabs => doAction(tabs[0].id, 'play'));
//         }
//       });
//     }
//   });
// }

// !BROKEN! preload script if user granted tabs permission from options page
// document.addEventListener('DOMContentLoaded', autoAction);
