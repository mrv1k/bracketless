const elements = document.querySelectorAll('bracket-less');

function doAction(e) {
  e.stopPropagation();

  if (e.target.tagName !== 'BRACKET-LESS') return;

  e.target.classList.toggle('bracket-less');
}

document.body.addEventListener('click', doAction);

function toggleCollapse(state) {
  if (state.active) { // play -> text collapsed
    elements.forEach(el => el.classList.add('bracket-less'));
  } else { // pause -> text displayed
    elements.forEach(el => el.classList.remove('bracket-less'));
  }
}

chrome.runtime.onMessage.addListener((state, _, sendResponse) => {
  toggleCollapse(state);
  sendResponse('action complete');
});
