let attachedTabs = {};

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  let tabId = tab.id;

  if (!attachedTabs[tabId]) {
    attachedTabs[tabId] = 'collapsed';
    chrome.browserAction.setIcon({tabId: tabId, path:'icons/pause.png'});
    chrome.browserAction.setTitle({tabId: tabId, title:'Pause collapsing'});

    chrome.tabs.executeScript({file: 'src/bg/collapse.js'});
  } else if (attachedTabs[tabId]) {
    delete attachedTabs[tabId];
    chrome.browserAction.setIcon({tabId: tabId, path:'icons/continue.png'});
    chrome.browserAction.setTitle({tabId: tabId, title:'Enable collapsing'});

    chrome.tabs.executeScript({file: 'src/bg/expand.js'});
  }
});
