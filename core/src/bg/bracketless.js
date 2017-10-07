function injectTag(el, text) {
  const dataSafeText = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); // so it doesn't break html layout
  const textRegex = new RegExp(text.replace(/[.,!?:"'`\\/&-(+)]/g, '\\$&')); // to match exactly that text
  const taggedText = `<bracket-less data-bracketless="${dataSafeText}">${text}</bracket-less>`;
  // eslint-disable-next-line no-param-reassign
  el.parentNode.innerHTML = el.parentNode.innerHTML.replace(textRegex, taggedText);
}

function testForBrackets(el, regex) {
  if (el.nodeType === Node.TEXT_NODE && regex.test(el.textContent)) {
    const textArr = el.textContent.match(regex);
    if (textArr.length > 1) {
      // TODO: handle multiple text elements in one parent element
      injectTag(el, textArr[0]);
    } else {
      injectTag(el, textArr[0]);
    }
  }
}

// Regex test cases here: https://regexr.com/3gtlq
function genLimitedRegex(options) {
  const genRegexStr = `(\\()([A-Z .,!?:"'\`\\\\/\\&+-]\\d?){${options.lowerRegexLimit},${options.upperRegexLimit}}(\\))`;
  return new RegExp(genRegexStr, 'gi');
}

function getNodes(options) {
  const parentNodes = document.querySelectorAll('body *:not(script):not(style):not(a):not(code):not(pre)');
  const inBracketsRegex = genLimitedRegex(options);

  for (let i = 0; i < parentNodes.length; i += 1) {
    if (parentNodes[i].hasChildNodes()) {
      parentNodes[i].childNodes.forEach(el => testForBrackets(el, inBracketsRegex));
    }
  }
}

function getOptions() {
  chrome.storage.sync.get(null, options => getNodes(options));
}

function init() {
  getOptions();
  return true;
}

init();
