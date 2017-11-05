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
    return new Promise((resolve, reject) => {
      chrome.permissions.request(p, (granted) => {
        if (granted) {
          permissionStatus.textContent = 'granted';
          autoPlayNote.textContent = '';
          autoPlayBool.parentNode.classList.remove('secondary');
          autoPlayBool.removeAttribute('disabled');
          setSaveStatus('Don\'t forget to save!', 7000);
          chrome.storage.local.clear(); // clear all previously saved states
          resolve();
        } else {
          permissionStatus.textContent = 'denied by the user';
          autoLoadBool.checked = false;
          autoPlayBool.setAttribute('disabled', true);
          reject();
        }
      });
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

const tabsWebNavPerm = {
  // Both permissions have same warning and required for auto-actions. Keep together
  perms: {
    permissions: ['tabs', 'webNavigation'],
    origins: ['http://*/', 'https://*/'],
  },
  check() {
    return permission.check(this.perms);
  },
  manage() {
    // Request Warning: Read and modify all your data on all websites you visit
    if (autoLoadBool.checked) {
      permission.request(this.perms)
        .then(() => {
          chrome.runtime.sendMessage({});
        }, () => {
          console.warn('denied');
        });
    } else {
      permission.remove(this.perms);
    }
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

    tabsWebNavPerm.check()
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
  tabsWebNavPerm.check()
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
autoLoadBool.addEventListener('change', tabsWebNavPerm.manage.bind(tabsWebNavPerm));

// invoked automatically
lowerLimitNum.addEventListener('input', validateNumInput);
upperLimitNum.addEventListener('input', validateNumInput);
document.addEventListener('DOMContentLoaded', restoreOptions);
