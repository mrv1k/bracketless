/* eslint-disable no-param-reassign */
function injectTag(text, el) {
  const dataSafeText = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); // so it doesn't break html layout
  const replaceRegex = new RegExp(text.replace(/[.,!?:"'`\\/&-(+)]/g, '\\$&')); // to match exactly that text
  const tag = `<bracket-less data-bracketless="${dataSafeText}">${text}</bracket-less>`;
  el.innerHTML = el.innerHTML.replace(replaceRegex, tag);
}

function testForBrackets(node, regex, parent) {
  if (node.nodeType === Node.TEXT_NODE && regex.test(node.textContent)) {
    const textArr = node.textContent.match(regex);
    if (textArr.length > 1) { // multiple brackets in one node
      const replica = parent.cloneNode(true);
      textArr.forEach(text => injectTag(text, replica));
      parent.outerHTML = replica.outerHTML; // outerHTML just to differentiate with innerHTML
    } else { // single brackets
      injectTag(textArr[0], parent);
    }
  }
}

function iterateNodes(inBracketsRegex) {
  const parents = document.querySelectorAll('body *:not(script):not(style):not(a):not(code):not(pre)');
  for (let i = 0; i < parents.length; i += 1) {
    if (parents[i].hasChildNodes()) {
      parents[i].childNodes.forEach((child) => {
        testForBrackets(child, inBracketsRegex, parents[i]);
      });
    }
  }
}

// Regex test cases here: https://regexr.com/3gtlq
function genBracketsRegex(options) {
  const genRegexStr = `(\\()([A-Z .,!?:"'\`\\\\/\\&+-]\\d?){${options.lowerRegexLimit},${options.upperRegexLimit}}(\\))`;
  return new RegExp(genRegexStr, 'gi');
}

function getOptions() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, options => resolve(options));
  });
}

getOptions()
  .then(genBracketsRegex)
  .then(iterateNodes)
  .catch();
