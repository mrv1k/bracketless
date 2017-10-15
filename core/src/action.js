const elements = document.querySelectorAll('bracket-less');

function doAction() {
  this.classList.toggle('bracket-less');
}

elements.forEach(el => el.addEventListener('click', doAction.bind(el)));

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
