const elements = document.querySelectorAll('bracket-less');

function doAction(e) {
  if (e.target.tagName !== 'BRACKET-LESS') return;

  e.target.classList.toggle('bracket-less');
  e.stopPropagation();
}

document.body.addEventListener('click', doAction);

function activate(active) {
  if (active) { // Play
    elements.forEach(el => el.classList.add('bracket-less'));
  } else { // Pause
    elements.forEach(el => el.classList.remove('bracket-less'));
  }
}

chrome.runtime.onMessage.addListener((active) => {
  activate(active);
});
