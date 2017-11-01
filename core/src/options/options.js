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


const permission = {
  request(p) {
    chrome.permissions.request(p, (granted) => {
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
  },
  remove(p) {
    chrome.permissions.remove(p, (removed) => {
      if (removed) {
        permissionStatus.textContent = 'removed';
        setSaveStatus('Don\'t forget to save!', 7000);
        autoPlayBool.checked = false;
        autoPlayBool.setAttribute('disabled', true);
      }
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

const tabsPermission = {
  tabs: {
    permissions: ['tabs'],
    origins: ['http://*/', 'https://*/'],
  },
  check() {
    return permission.check(this.tabs);
  },
  manage() {
    if (autoLoadBool.checked) permission.request(this.tabs);
    else permission.remove(this.tabs);
  },
};


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

    tabsPermission.check()
      .then(() => {
        permissionStatus.textContent = 'granted';
      }, () => {
        permissionStatus.textContent = 'denied/removed';
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
  tabsPermission.check()
    .then(() => { permission.removeTabs(); });
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
autoLoadBool.addEventListener('change', tabsPermission.manage.bind(tabsPermission));

// invoked automatically
lowerLimitNum.addEventListener('input', validateNumInput);
upperLimitNum.addEventListener('input', validateNumInput);
document.addEventListener('DOMContentLoaded', restoreOptions);
