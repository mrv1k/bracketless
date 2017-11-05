const lowerLimitNum = document.querySelector('#lowerLimit');
const upperLimitNum = document.querySelector('#upperLimit');
const autoLoadBool = document.querySelector('#autoLoad');
const autoPlayBool = document.querySelector('#autoPlay');

const autoPlayNote = document.querySelector('.autoPlay.note');
const tabsWebNavStatus = document.querySelector('.permission .status');
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


const permissionsAPI = {
  request(p) {
    return new Promise((resolve, reject) => {
      chrome.permissions.request(p, (granted) => {
        if (granted) resolve();
        else reject();
      });
    });
  },
  remove(p) {
    return new Promise((resolve, reject) => {
      chrome.permissions.remove(p, (removed) => {
        if (removed) resolve();
        else reject(new Error('The permissions have not been removed.'));
      });
    });
  },
  check(p) {
    return new Promise((resolve, reject) => {
      chrome.permissions.contains(p, (result) => {
        if (result) resolve(result);
        else reject(result);
      });
    });
  },
};

// Both permissions have same warning and required for auto-actions. Keep together
const tabsWebNavPerm = {
  permissions: ['tabs', 'webNavigation'],
  origins: ['*://*/'],
};

function manageTabsWebNavPerm() {
  if (autoLoadBool.checked) {
    permissionsAPI.request(tabsWebNavPerm)
      .then(() => {
        tabsWebNavStatus.textContent = 'granted';
        autoPlayNote.textContent = '';
        autoPlayBool.parentNode.classList.remove('secondary');
        autoPlayBool.removeAttribute('disabled');
        setSaveStatus('Don\'t forget to save!', 7000);

        chrome.storage.local.clear(); // clear all previously saved states
        chrome.runtime.sendMessage({});
      }, () => {
        tabsWebNavStatus.textContent = 'denied by the user';
        autoLoadBool.checked = false;
        autoPlayBool.setAttribute('disabled', true);
      });
  } else {
    permissionsAPI.remove(tabsWebNavPerm)
      .then(() => {
        tabsWebNavStatus.textContent = 'removed';
        setSaveStatus('Don\'t forget to save!', 7000);
        autoPlayBool.checked = false;
        autoPlayBool.setAttribute('disabled', true);
      })
      .catch((reason) => { throw reason; });
  }
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

    permissionsAPI.check(tabsWebNavPerm)
      .then(() => {
        tabsWebNavStatus.textContent = 'granted';
      }, () => {
        tabsWebNavStatus.textContent = 'denied/removed';
        // Checkbox checked and no tabs permission. User removed permission but forgot to save
        if (autoLoadBool.checked) autoLoadBool.checked = false;
      })
      .then(() => {
        if (!autoLoadBool.checked) {
          autoPlayNote.textContent = '(load required)';
          autoPlayBool.setAttribute('disabled', true);
        } else {
          autoPlayBool.parentNode.classList.remove('secondary');
          autoPlayBool.removeAttribute('disabled');
        }
      });
  });
}

function resetOptions() {
  permissionsAPI.check(tabsWebNavPerm)
    .then(() => permissionsAPI.remove(tabsWebNavPerm));
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
autoLoadBool.addEventListener('change', manageTabsWebNavPerm);

// invoked automatically
lowerLimitNum.addEventListener('input', validateNumInput);
upperLimitNum.addEventListener('input', validateNumInput);
document.addEventListener('DOMContentLoaded', restoreOptions);
