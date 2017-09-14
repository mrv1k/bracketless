function toggleCollapse(state) {
  const bracketless = document.querySelectorAll('bracket-less');
  console.log(bracketless);
  if (state.collapse) {
    console.log('collapsed');
  } else {
    console.log('not collapsed');
  }  
}

chrome.runtime.onMessage.addListener(function(state, sender, sendResponse) {
  sendResponse(toggleCollapse(state));
});
