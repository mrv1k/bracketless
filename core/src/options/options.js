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

function setStatusText(text, timeout = 2000, cb) {
  status.textContent = text;
  setTimeout(() => {
    status.textContent = '';
    if (cb) cb();
  }, timeout);
}

function restoreOptions() {
  chrome.storage.sync.get({
    lowLimit: 13,
    upLimit: 255,
    autoLoad: false,
    autoPlay: false,
  }, (items) => {
    lowerLimitNum.value = items.lowLimit;
    upperLimitNum.value = items.upLimit;
    autoLoadBool.checked = items.autoLoad;
    autoPlayBool.checked = items.autoPlay;

    if (!autoLoadBool.checked) autoPlayBool.setAttribute('disabled', true);
    else autoPlayBool.removeAttribute('disabled');
  });
}

function saveOptions() {
  chrome.storage.sync.set({
    lowLimit: lowerLimitNum.value,
    upLimit: upperLimitNum.value,
    autoLoad: autoLoadBool.checked,
    autoPlay: autoPlayBool.checked,
  }, setStatusText.bind(null, 'Options saved.'));
}

function resetOptions() {
  chrome.storage.sync.clear(setStatusText.bind(null, 'Options reset.', 1500, restoreOptions));
}

function requestPermissions(permission) {
  chrome.permissions.request(permission, (granted) => {
    if (granted) {
      autoLoadBool.nextElementSibling.textContent = '(permission granted)';
      autoPlayBool.removeAttribute('disabled');
      setStatusText('Don\'t forget to save!', 7000);
    } else {
      autoLoadBool.nextElementSibling.textContent = '(permission denied)';
      autoLoadBool.checked = false;
      autoPlayBool.setAttribute('disabled', true);
    }
  });
}

function removePermission(permission) {
  chrome.permissions.remove(permission, (removed) => {
    if (removed) {
      autoLoadBool.nextElementSibling.textContent = '(permission removed)';
      setStatusText('Don\'t forget to save!', 7000);
      autoPlayBool.checked = false;
      autoPlayBool.setAttribute('disabled', true);
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

lowerLimitNum.addEventListener('input', validateNumInput);
upperLimitNum.addEventListener('input', validateNumInput);
document.addEventListener('DOMContentLoaded', restoreOptions);

saveBtn.addEventListener('click', saveOptions);
document.querySelector('#reset').addEventListener('click', resetOptions);
autoLoadBool.addEventListener('change', permissionHandler);
