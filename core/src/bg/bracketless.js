// Regex test cases here: http://regexr.com/3grj5
function genLimitedRegex(options) {
  const genRegexStr = `(\\()([A-Z .,!?:"'\`\\\\/&+-]{${options.lowerRegexLimit},${options.upperRegexLimit}})\\w*(\\))`;
  return new RegExp(genRegexStr, 'gi');
}

function injectTag(options) {
  const elements = document.querySelectorAll('body *:not(script):not(style):not(a):not(code):not(pre)');
  const inBracketsRegex = genLimitedRegex(options);

  for (let i = 0; i < elements.length; i += 1) {
    if (elements[i].hasChildNodes()) {
      elements[i].childNodes.forEach((el) => {
        if (el.nodeType === Node.TEXT_NODE && inBracketsRegex.test(el.textContent)) {
          const text = el.nodeValue.substring(el.nodeValue.indexOf('(') + 1, el.nodeValue.indexOf(')'));

          // escape allowed characters and "(", ")" to make it Regex safe
          const matchedTextRegex = new RegExp(text.replace(/[.,!?:"'`\\/&-(+)]/g, '\\$&'));

          // replace symbols that break html layout: data-bracketless=""this" breaks"
          const htmlSafeText = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

          // eslint-disable-next-line no-param-reassign
          el.parentNode.innerHTML = el.parentNode.innerHTML
            .replace(matchedTextRegex, `<bracket-less data-bracketless="${htmlSafeText}">${text}</bracket-less>`);
        }
      });
    }
  }
}

function getOptions() {
  chrome.storage.sync.get(null, options => injectTag(options));
}

function init() {
  getOptions();
  return true;
}

init();
