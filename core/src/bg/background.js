// Global variables only exist for the life of the page, so they get reset
// each time the page is unloaded.
let attachedTabs = {};
let scriptInjected = false;

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {
  let tabId = tab.id;

  // https://developer.chrome.com/extensions/content_scripts#pi
  if (!scriptInjected) {
    chrome.tabs.executeScript(tabId, { file: 'src/bg/injecthtml.js' }, function (response) {
      scriptInjected = response;
      chrome.browserAction.setIcon({ tabId: tabId, path: 'icons/continue.png' });
      chrome.browserAction.setTitle({ tabId: tabId, title: 'Enable collapsing' });
    });
  } else {
    if (!attachedTabs[tabId]) {
      attachedTabs[tabId] = 'collapsed';
      chrome.browserAction.setIcon({ tabId: tabId, path: 'icons/pause.png' });
      chrome.browserAction.setTitle({ tabId: tabId, title: 'Pause collapsing' });
      chrome.tabs.sendMessage(tabId, { collapse: false });
    } else if (attachedTabs[tabId]) {
      delete attachedTabs[tabId];
      chrome.browserAction.setIcon({ tabId: tabId, path: 'icons/continue.png' });
      chrome.browserAction.setTitle({ tabId: tabId, title: 'Enable collapsing' });
      chrome.tabs.sendMessage(tabId, { collapse: true });
    }
  }
});
