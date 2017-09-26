// Global variables only exist for the life of the page, so they get reset
// each time the page is unloaded.
const activeTabs = {};
const injected = {};

function load(tabId) {
  chrome.tabs.executeScript(tabId, { file: 'src/bg/injecthtml.js' }, (response) => {
    injected[tabId] = response;
    chrome.browserAction.setIcon({ tabId, path: 'icons/play.png' });
    chrome.browserAction.setTitle({ tabId, title: 'Collapse brackets' });
    chrome.tabs.insertCSS(tabId, { file: 'css/toggle.css' });
    chrome.tabs.executeScript(tabId, { file: 'src/bg/toggle_collapse.js' });
  });
}

function preload() {
  chrome.permissions.contains({
    permissions: ['tabs'],
    origins: ['http://*/', 'https://*/'],
  }, (result) => {
    if (result) {
      chrome.storage.sync.get(null, (options) => {
        if (options.autoActivate) {
          chrome.tabs.query({ active: true }, tabs => load(tabs[0].id));
        }
      });
    }
    // else {
    //   alert('Permission has been denied.');
    // }
  });
}

function playPause(tabId, action) {
  console.log(chrome.tabs);
  let message = action === 'play' ? 'Pause collapsing' : 'Collapse brackets';
  let collapse = action === 'play' ? true : false;

  activeTabs[tabId] = collapse;
  chrome.browserAction.setIcon({ tabId, path: `icons/${action}.png` });
  chrome.browserAction.setTitle({ tabId, title: message });
  chrome.tabs.sendMessage(tabId, { collapse: collapse });
}

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener((tab) => {
  const tabId = tab.id;
  if (!injected[tabId]) {
    load(tabId);
  } else if (!activeTabs[tabId]) {
    playPause(tabId, 'play');
  } else if (activeTabs[tabId]) {
    playPause(tabId, 'pause');
  }
});

// preload script if user granted tabs permission from options page
document.addEventListener('DOMContentLoaded', preload);
