function toggleCollapsing(textcontent) {
  const bracketless = document.querySelectorAll('bracket-less');
  console.log(bracketless);
  if (textcontent.collapse) {
    console.log('collapsed');
  } else {
    console.log('not collapsed');
  }  
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  sendResponse(toggleCollapsing(message));
});
