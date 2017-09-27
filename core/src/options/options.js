function saveOptions() {
  const lowerRegexLimit = document.getElementById('lowerLimit').value;
  const upperRegexLimit = document.getElementById('upperLimit').value;
  const autoLoad = document.getElementById('autoLoad').checked;
  const autoPlay = document.getElementById('autoPlay').checked;

  chrome.storage.sync.set({
    lowerRegexLimit,
    upperRegexLimit,
    autoLoad,
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
    lowerRegexLimit: 13,
    upperRegexLimit: 255,
    autoLoad: false,
    autoPlay: false,
  }, (items) => {
    document.getElementById('lowerLimit').value = items.lowerRegexLimit;
    document.getElementById('upperLimit').value = items.upperRegexLimit;
    document.getElementById('autoLoad').checked = items.autoLoad;
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

document.getElementById('autoLoad').addEventListener('change', function requestPermissions() {
  if (this.checked) {
    chrome.permissions.request({
      permissions: ['tabs'],
      origins: ['http://*/', 'https://*/'],
    }, (granted) => {
      if (granted) {
        console.info('granted');
      } else {
        console.error('declined');
      }
    });
  } else {
    chrome.permissions.contains({
      permissions: ['tabs'],
      origins: ['http://*/', 'https://*/'],
    }, (result) => {
      console.log(result);
    });
  }
});
