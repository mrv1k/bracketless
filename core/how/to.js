// showcase version of action.js
const optionsBtn = document.querySelector('#go-to-options');
const collapsedNodes = document.querySelectorAll('.collapsed');

const extensionSimulator9000 = document.querySelector('#extensionSimulator9000');
const simStatusText = document.querySelector('#simulatorStatusText');
const simStatus = document.querySelector('#simulatorStatus');
const simImg = document.querySelector('#simulationImg');
const simIcons = {
  play: '../icons/play32.png',
  pause: '../icons/pause32.png',
};

const basicMessage = document.querySelector('.basic-message');
const basicBrackets = document.querySelector('.basic-bracket');

/* ACTION.JS */
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
/* ACTION.JS END */

// Fake collapse notes
collapsedNodes.forEach(el => el.click());


basicBrackets.addEventListener('click', () => {
  if (basicBrackets.classList.contains('bracket-css')) {
    basicMessage.innerHTML = '<strong>Left click again</strong> text between brackets to collapse it.';
    basicBrackets.classList.add('bracket-css');
  } else {
    basicMessage.innerHTML = '<strong>Left click again</strong> to display it.';
    basicBrackets.classList.remove('bracket-css');
  }
});


function updateSimulation(text, img, status) {
  simStatusText.textContent = text;
  simImg.src = img;
  simStatus.textContent = status;
}

function simulateExtension() {
  const state = simStatus.textContent;
  if (state === 'notloaded') {
    updateSimulation('loaded', simIcons.play, 'loaded');
    activate(false);
  } else if (state === 'paused' || state === 'loaded') {
    updateSimulation('collapsed', simIcons.pause, 'playing');
    activate(true);
  } else if (state === 'playing') {
    updateSimulation('expanded', simIcons.play, 'paused');
    activate(false);
  }
}

extensionSimulator9000.addEventListener('click', simulateExtension);


// open extension options
optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

