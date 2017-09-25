// Global variables only exist for the life of the page, so they get reset
// each time the page is unloaded.
const activeTabs = {};
const injected = {};

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener((tab) => {
  const tabId = tab.id;
  if (!injected[tabId]) {
    chrome.tabs.executeScript(tabId, { file: 'src/bg/injecthtml.js' }, (response) => {
      injected[tabId] = response;
      chrome.browserAction.setIcon({ tabId, path: 'icons/continue.png' });
      chrome.browserAction.setTitle({ tabId, title: 'Enable collapsing' });
      chrome.tabs.insertCSS(tabId, { file: 'css/toggle.css' });
      chrome.tabs.executeScript(tabId, { file: 'src/bg/toggle_collapse.js' });
    });
  } else if (!activeTabs[tabId]) {
    activeTabs[tabId] = true;
    chrome.browserAction.setIcon({ tabId, path: 'icons/pause.png' });
    chrome.browserAction.setTitle({ tabId, title: 'Pause collapsing' });
    chrome.tabs.sendMessage(tabId, { collapse: true });
  } else if (activeTabs[tabId]) {
    activeTabs[tabId] = false;
    chrome.browserAction.setIcon({ tabId, path: 'icons/continue.png' });
    chrome.browserAction.setTitle({ tabId, title: 'Enable collapsing' });
    chrome.tabs.sendMessage(tabId, { collapse: false });
  }
});
