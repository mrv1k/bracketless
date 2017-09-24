const elements = document.querySelectorAll('bracket-less');

function expandBrackets() {
  this.innerHTML = this.dataset.bracketless;
  this.classList.toggle('bracket-less');
}
function collapseBrackets() {
  this.innerHTML = '...';
  this.classList.toggle('bracket-less');
}
elements.forEach(el => el.addEventListener('click', expandBrackets.bind(el)));
elements.forEach(el => el.addEventListener('dblclick', collapseBrackets.bind(el)));

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
