const lowerLimitNum = document.querySelector('#lowerLimit');
const upperLimitNum = document.querySelector('#upperLimit');
const autoLoadBool = document.querySelector('#autoLoad');
const autoPlayBool = document.querySelector('#autoPlay');
const status = document.querySelector('#status');
const saveBtn = document.querySelector('#save');

function validateNumInput() {
  if (!this.checkValidity() || (Number(lowerLimitNum.value) > Number(upperLimitNum.value))) {
    saveBtn.setAttribute('disabled', true);
  } else { saveBtn.removeAttribute('disabled'); }
}

function setStatusText(text, timeout = 1000, cb) {
  status.textContent = text;
  setTimeout(() => { status.textContent = ''; }, timeout);
  if (cb) cb();
}

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
  }, setStatusText('Options saved.'));
}

function resetOptions() {
  chrome.storage.sync.clear(setStatusText('Options reset.', 1500, restoreOptions));
}

lowerLimitNum.addEventListener('input', validateNumInput);
upperLimitNum.addEventListener('input', validateNumInput);
document.addEventListener('DOMContentLoaded', restoreOptions);

saveBtn.addEventListener('click', saveOptions);
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
