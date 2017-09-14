const elements = document.querySelectorAll('bracket-less');

// when paused will collapse text to (...)
// when playing doesn't cause trouble

elements.forEach(el => el.addEventListener('mouseover', function displayText () {
  el.innerHTML = this.dataset.bracketless;
}));
elements.forEach(el => el.addEventListener('mouseout', function displayText () {
  el.innerHTML = '...';
}));


function toggleCollapse(state) {
  if (state.collapse) {
    elements.forEach(el => el.innerHTML = '...');
  } else {
    elements.forEach(el => el.innerHTML = el.dataset.bracketless);
  }
}

chrome.runtime.onMessage.addListener(function (state, sender, sendResponse) {
  sendResponse(toggleCollapse(state));
});
