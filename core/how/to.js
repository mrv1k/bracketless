// showcase version of action.js
const elements = document.querySelectorAll('bracket-less');
const optionsBtn = document.querySelector('#go-to-options');
const collapsedNodes = document.querySelectorAll('.collapsed');

const playBtn = document.querySelector('#playBtn');
const pauseBtn = document.querySelector('#pauseBtn');

const extensionSimulator9000 = document.querySelector('#extensionSimulator9000');
const simStatusText = document.querySelector('#simulatorStatusText');
const simStatus = document.querySelector('#simulatorStatus');
const simImg = document.querySelector('#simulationImg');
const simIcons = {
  play: '../icons/play32.png',
  pause: '../icons/pause32.png',
};

function doAction(e) {
  if (e.target.tagName !== 'BRACKET-LESS') return;

  e.target.classList.toggle('bracket-less');
  e.stopPropagation();
}

document.body.addEventListener('click', doAction);
collapsedNodes.forEach(el => el.click());

function activate(active) {
  if (active) { // Play
    elements.forEach(el => el.classList.add('bracket-less'));
  } else { // Pause
    elements.forEach(el => el.classList.remove('bracket-less'));
  }
}

function updateSimulation(text, img, status) {
  simStatusText.textContent = text;
  simImg.src = img;
  simStatus.textContent = status;
}

function simulateExtension() {
  const state = simStatus.textContent;
  if (state === 'notloaded') {
    updateSimulation('Launched: loaded', simIcons.play, 'loaded');
    activate(false);
  } else if (state === 'paused' || state === 'loaded') {
    updateSimulation('Play: collapsed', simIcons.pause, 'playing');
    activate(true);
  } else if (state === 'playing') {
    updateSimulation('Pause: expanded', simIcons.play, 'paused');
    activate(false);
  }
}

playBtn.addEventListener('click', activate.bind(null, true));
pauseBtn.addEventListener('click', activate.bind(null, false));
extensionSimulator9000.addEventListener('click', simulateExtension);


// open extension options
optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
