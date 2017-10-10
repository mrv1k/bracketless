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

function nativeTreeWalker(bracketsRegex) {
  const ignoredTags = ['A', 'PRE', 'CODE', 'SCRIPT', 'STYLE'];
  // only accept nodes that have allowed text and are not in ignored tag
  const filter = {
    acceptNode(node) {
      if (bracketsRegex.test(node.data) && !ignoredTags.includes(node.parentNode.tagName)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, filter);
  walker.nextNode(); // first element is the root element!
  const nodes = [walker.currentNode]; // store one value immediately so length is not 0
  const sameParent = [];

  while (walker.nextNode()) {
    const prev = nodes[nodes.length - 1];
    const cur = walker.currentNode;
    if (cur.parentNode.isSameNode(prev.parentNode)) {
      // empty? add prev element
      if (!sameParent.length) sameParent.push(prev);
      sameParent.push(cur);
    } else {
      // if not empty replace last single elem and empty
      if (sameParent.length) nodes[nodes.length - 1] = sameParent.splice(0);
      nodes.push(cur);
    }
  }
  console.log(nodes);
  return { nodesArr: nodes, regex: bracketsRegex };
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
  .then(nativeTreeWalker)
  .catch();
