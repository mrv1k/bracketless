const elements = document.querySelectorAll('bracket-less');

function doAction(e) {
  if (e.target.tagName !== 'BRACKET-LESS') return;

  e.target.classList.toggle('bracket-css');
  e.stopPropagation();
}

document.body.addEventListener('click', doAction);

function activate(active) {
  if (active) { // Play
    elements.forEach(el => el.classList.add('bracket-css'));
  } else { // Pause
    elements.forEach(el => el.classList.remove('bracket-css'));
  }
}

chrome.runtime.onMessage.addListener((active) => {
  activate(active);
});
