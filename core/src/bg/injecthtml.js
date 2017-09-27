// RegExp test cases here: http://regexr.com/3gqin

function genBracketsRegex(options) {
  const { lowerRegexLimit, upperRegexLimit } = options;
  // generate regex using with custom upper and lower character limits
  // eslint-disable-next-line no-useless-escape
  const genRegexStr = `(\\()([A-Z .,!?:"'\`\\\/&-]{${lowerRegexLimit},${upperRegexLimit}})\\w*(\\))`;
  return new RegExp(genRegexStr, 'gi');
}

function injectHTML(options) {
  const elements = document.querySelectorAll('body *:not(script):not(style):not(a):not(code):not(pre)');
  const inBracketsRegex = genBracketsRegex(options);

  for (let i = 0; i < elements.length; i += 1) {
    if (elements[i].hasChildNodes()) {
      elements[i].childNodes.forEach((el) => {
        if (el.nodeType === Node.TEXT_NODE && el.nodeValue.match(inBracketsRegex)) {
          const text = el.nodeValue.substring(el.nodeValue.indexOf('(') + 1, el.nodeValue.indexOf(')'));

          // escape allowed characters and "(", ")" to make it RegExp safe
          const matchedTextRegex = new RegExp(text.replace(/[.,!?:"'`\\/&-()]/g, '\\$&'));

          // replace symbols that break html layout: data-bracketless=""this" breaks"
          const htmlSafeText = text.replace(/&/g, '&amp;').replace(/"/g, "'");

          // eslint-disable-next-line no-param-reassign
          el.parentNode.innerHTML = el.parentNode.innerHTML
            .replace(matchedTextRegex, `<bracket-less data-bracketless="${htmlSafeText}">${text}</bracket-less>`);
        }
      });
    }
  }
}

// default values
function getOptions() {
  chrome.storage.sync.get({
    lowerRegexLimit: 10,
    upperRegexLimit: 100,
    autoLoad: false,
    autoPlay: false,
  }, options => injectHTML(options));
}

function done() {
  getOptions();
  return true;
}

done();
