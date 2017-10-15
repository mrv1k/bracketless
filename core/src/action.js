const elements = document.querySelectorAll('bracket-less');
let clicks = 0;
let timer = null;

function expandBrackets(e) {
  e.innerHTML = e.dataset.bracketless;
  e.classList.toggle('bracket-less');
}
function collapseBrackets(e) {
  e.innerHTML = '...';
  e.classList.toggle('bracket-less');
}

function clicksHandler() {
  clicks += 1; // count clicks
  if (clicks === 1) {
    timer = setTimeout(() => {
      expandBrackets(this);
      clicks = 0;
    }, 322);
  } else {
    clearTimeout(timer); // prevent single-click action
    collapseBrackets(this);
    clicks = 0;
  }
}

elements.forEach(el => el.addEventListener('click', clicksHandler.bind(el)));

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
