const lowerLimitNum = document.querySelector('#lowerLimit');
const upperLimitNum = document.querySelector('#upperLimit');
const autoLoadBool = document.querySelector('#autoLoad');
const autoPlayBool = document.querySelector('#autoPlay');

function restoreOptions() {
  chrome.storage.sync.get({
    lowerRegexLimit: 13,
    upperRegexLimit: 255,
    autoLoad: false,
    autoPlay: false,
  }, (items) => {
    lowerLimitNum.value = items.lowerRegexLimit;
    upperLimitNum.value = items.upperRegexLimit;
    autoLoadBool.checked = items.autoLoad;
    autoPlayBool.checked = items.autoPlay;
  });
}

function saveOptions() {
  chrome.storage.sync.set({
    lowerRegexLimit: lowerLimitNum.value,
    upperRegexLimit: upperLimitNum.value,
    autoLoad: autoLoadBool.checked,
    autoPlay: autoPlayBool.checked,
  }, () => {
    // Update status and let the user know options were saved
    const status = document.querySelector('#status');
    status.textContent = 'Options saved.';
    setTimeout(() => { status.textContent = ''; }, 1000);
  });
}

function resetOptions() {
  chrome.storage.sync.clear(() => {
    const status = document.querySelector('#status');
    status.textContent = 'Options reset.';
    setTimeout(() => {
      status.textContent = '';
      restoreOptions();
    }, 1500);
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#save').addEventListener('click', saveOptions);
document.querySelector('#reset').addEventListener('click', resetOptions);

document.getElementById('autoLoad').addEventListener('change', function requestPermissions() {
  if (this.checked) {
    chrome.permissions.request({
      permissions: ['tabs'],
      origins: ['http://*/', 'https://*/'],
    }, (granted) => {
      if (granted) {
        console.info('granted, save to settings as there is no toggling off YET');
      } else {
        console.error('declined, turn off html toggle mark');
      }
    });
  }
});
