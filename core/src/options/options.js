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

function requestPermissions(p) {
  chrome.permissions.request(p, (granted) => {
    if (granted) {
      console.info('granted');
    } else {
      console.log('declined');
    }
  });
}

function removePermission(p) {
  chrome.permissions.remove(p, (removed) => {
    if (removed) {
      console.info('removed');
    }
  });
}

function permissionHandler() {
  const tabPerm = {
    permissions: ['tabs'],
    origins: ['http://*/', 'https://*/'],
  };
  if (this.checked) requestPermissions(tabPerm);
  else removePermission(tabPerm);
}

autoLoadBool.addEventListener('change', permissionHandler);
