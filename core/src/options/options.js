const lowerLimitNum = document.querySelector('#lowerLimit');
const upperLimitNum = document.querySelector('#upperLimit');
const autoLoadBool = document.querySelector('#autoLoad');
const autoPlayBool = document.querySelector('#autoPlay');

const autoPlayNote = document.querySelector('.autoPlay.note');
const permissionStatus = document.querySelector('.permission .status');
const saveStatus = document.querySelector('.toolbar .status');

const saveBtn = document.querySelector('#save-btn');
const resetBtn = document.querySelector('#reset-btn');


function setSaveStatus(text, timeout = 2000, cb) {
  saveStatus.textContent = text;
  setTimeout(() => {
    saveStatus.textContent = '';
    if (cb) cb();
  }, timeout);
}

function saveOptions() {
  chrome.storage.sync.set({
    lowLimit: lowerLimitNum.value,
    upLimit: upperLimitNum.value,
    autoLoad: autoLoadBool.checked,
    autoPlay: autoPlayBool.checked,
  }, setSaveStatus.bind(null, 'Options saved'));
}


function requestPermissions(permission) {
  chrome.permissions.request(permission, (granted) => {
    if (granted) {
      permissionStatus.textContent = 'granted';
      autoPlayNote.textContent = '';
      autoPlayBool.parentNode.classList.remove('secondary');
      autoPlayBool.removeAttribute('disabled');
      setSaveStatus('Don\'t forget to save!', 7000);
      chrome.storage.local.clear(); // clear all previously saved states
    } else {
      permissionStatus.textContent = 'denied by the user';
      autoLoadBool.checked = false;
      autoPlayBool.setAttribute('disabled', true);
    }
  });
}
function removePermission(permission) {
  chrome.permissions.remove(permission, (removed) => {
    if (removed) {
      permissionStatus.textContent = 'removed';
      setSaveStatus('Don\'t forget to save!', 7000);
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

    if (!autoLoadBool.checked) {
      permissionStatus.textContent = 'denied';
      autoPlayNote.textContent = '(load required)';
      autoPlayBool.setAttribute('disabled', true);
    } else {
      permissionStatus.textContent = 'granted';
      autoPlayBool.parentNode.classList.remove('secondary');
      autoPlayBool.removeAttribute('disabled');
    }
  });
}

function resetOptions() {
  permissionHandler(); // remove permission if any
  chrome.storage.sync.clear(setSaveStatus.bind(null, 'Options reset', 2000, restoreOptions));
}


function validateNumInput() {
  if (!this.checkValidity() || (Number(lowerLimitNum.value) > Number(upperLimitNum.value))) {
    saveBtn.setAttribute('disabled', true);
  } else { saveBtn.removeAttribute('disabled'); }
}


// user interactions
saveBtn.addEventListener('click', saveOptions);
resetBtn.addEventListener('click', resetOptions);
autoLoadBool.addEventListener('change', permissionHandler);

// invoked automatically
lowerLimitNum.addEventListener('input', validateNumInput);
upperLimitNum.addEventListener('input', validateNumInput);
document.addEventListener('DOMContentLoaded', restoreOptions);
