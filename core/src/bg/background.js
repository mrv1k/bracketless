let attachedTabs = {};

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  let tabId = tab.id;

  if (!attachedTabs[tabId]) {
    attachedTabs[tabId] = 'collapsed';
    chrome.tabs.executeScript({file: 'src/bg/collapse.js'});
  } else if (attachedTabs[tabId]) {
    delete attachedTabs[tabId];
    chrome.tabs.executeScript({file: 'src/bg/expand.js'});
  }
});
