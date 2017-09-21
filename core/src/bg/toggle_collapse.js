const elements = document.querySelectorAll('bracket-less');

// when paused will collapse text to (...)
// when playing doesn't cause trouble

function toggleCollapse(state) {
  if (state.collapse) { // play -> text collapsed
    elements.forEach(el => el.classList.add('bracket-less'));
  } else { // pause -> text displayed
    elements.forEach(el => el.classList.remove('bracket-less'));
  }
}

chrome.runtime.onMessage.addListener((state, sender, sendResponse) => {
  sendResponse(toggleCollapse(state));
});
