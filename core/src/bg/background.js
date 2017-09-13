let attachedTabs = {};
let textContentArr;
// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {
  let tabId = tab.id;

  // https://developer.chrome.com/extensions/content_scripts#pi
  chrome.tabs.executeScript(tabId, { file: 'src/bg/textcontent.js' }, function () {
    chrome.tabs.sendMessage(tabId, {}, function (response) {
      textContentArr = response;
      console.log(textContentArr);
    });
  });

  if (!attachedTabs[tabId]) {
    attachedTabs[tabId] = 'collapsed';
    chrome.browserAction.setIcon({ tabId: tabId, path: 'icons/pause.png' });
    chrome.browserAction.setTitle({ tabId: tabId, title: 'Pause collapsing' });
    chrome.tabs.executeScript({ file: 'src/bg/collapse.js' });

  } else if (attachedTabs[tabId]) {
    delete attachedTabs[tabId];
    chrome.browserAction.setIcon({ tabId: tabId, path: 'icons/continue.png' });
    chrome.browserAction.setTitle({ tabId: tabId, title: 'Enable collapsing' });
    chrome.tabs.executeScript({ file: 'src/bg/expand.js' });
  }
});
