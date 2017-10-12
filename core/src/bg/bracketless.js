/* eslint-disable no-param-reassign */
function injectTag(text, tag, target) {
  const replaceRegex = new RegExp(text.replace(/[.,!?:"'`\\/&-(+)]/g, '\\$&')); // to match exactly that text
  target.innerHTML = target.innerHTML.replace(replaceRegex, tag);
}

function genTag(text) {
  const dataSafeText = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); // so it doesn't break html layout
  return `<bracket-less data-bracketless="${dataSafeText}">${text}</bracket-less>`;
}

function singleHandler(textNode, regex, multipleClone) {
  const textArr = textNode.textContent.match(regex);
  const parent = multipleClone || textNode.parentNode;

  if (textArr.length > 1) { // multiple brackets
    const replica = multipleClone ? parent : parent.cloneNode(true);
    textArr.forEach((text) => { injectTag(text, genTag(text, replica), replica); });
    parent.innerHTML = replica.innerHTML;
  } else { // single bracket
    injectTag(textArr[0], genTag(textArr[0]), parent);
  }
}

function multipleHandler(textNodes, regex) {
  const parentClone = textNodes[0].parentNode.cloneNode(true);
  textNodes.forEach((siblingText) => {
    singleHandler(siblingText, regex, parentClone);
  });
  textNodes[0].parentNode.innerHTML = parentClone.innerHTML;
}

function iterateNodes(walkerObj) {
  walkerObj.nodesArr.forEach((textNode) => {
    if (Array.isArray(textNode)) {
      multipleHandler(textNode, walkerObj.regex);
    } else {
      singleHandler(textNode, walkerObj.regex);
    }
  });
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
  .then(iterateNodes)
  .catch();
