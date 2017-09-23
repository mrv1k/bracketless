function saveOptions() {
  const lowerRegexLimit = document.getElementById('lowerLimit').value;
  const upperRegexLimit = document.getElementById('upperLimit').value;
  const autoActivate = document.getElementById('autoActivate').checked;
  const autoPlay = document.getElementById('autoPlay').checked;

  chrome.storage.sync.set({
    lowerRegexLimit,
    upperRegexLimit,
    autoActivate,
    autoPlay,
  }, () => {
    // Update status and let the user know options were saved
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => { status.textContent = ''; }, 1000);
  });
}

function restoreOptions() {
  // default values
  chrome.storage.sync.get({
    lowerRegexLimit: 10,
    upperRegexLimit: 100,
    autoActivate: false,
    autoPlay: false,
  }, (items) => {
    document.getElementById('lowerLimit').value = items.lowerRegexLimit;
    document.getElementById('upperLimit').value = items.upperRegexLimit;
    document.getElementById('autoActivate').checked = items.autoActivate;
    document.getElementById('autoPlay').checked = items.autoPlay;
  });
}

function resetOptions() {
  chrome.storage.sync.clear(() => {
    const status = document.getElementById('status');
    status.textContent = 'Options reset.';
    setTimeout(() => {
      status.textContent = '';
      restoreOptions();
    }, 1500);
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);
