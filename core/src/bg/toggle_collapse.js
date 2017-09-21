const elements = document.querySelectorAll('bracket-less');

const mouseoverEvt = new Event('mouseover');
const mouseoutEvt = new Event('mouseout');
// when paused will collapse text to (...)
// when playing doesn't cause trouble

function displayText() {
  this.innerHTML = this.dataset.bracketless;
}
function hideText() {
  this.innerHTML = '...';
}

elements.forEach(el => el.addEventListener('mouseover', displayText.bind(el)), false);
elements.forEach(el => el.addEventListener('mouseout', hideText.bind(el)), false);

function toggleCollapse(state) {
  if (state.collapse) { // play -> text collapsed
    elements.forEach(el => el.dispatchEvent(mouseoutEvt));
  } else { // pause -> text displayed
    elements.forEach(el => el.dispatchEvent(mouseoverEvt));
  }
}

chrome.runtime.onMessage.addListener((state, sender, sendResponse) => {
  sendResponse(toggleCollapse(state));
});
