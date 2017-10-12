/* eslint-disable no-param-reassign */
function genTag(text, parent, single = false) {
  const dataSafeText = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); // so it doesn't break html layout
  const replaceRegex = new RegExp(text.replace(/[.,!?:"'`\\/&-(+)]/g, '\\$&')); // to match exactly that text
  const tag = `<bracket-less data-bracketless="${dataSafeText}">${text}</bracket-less>`;
  if (single) return parent.innerHTML.replace(replaceRegex, tag);
  parent.innerHTML = parent.innerHTML.replace(replaceRegex, tag);
  return undefined;
}

function singleHandler(textNode, regex) {
  const textArr = textNode.textContent.match(regex);
  // multiple brackets in one text node
  if (textArr.length > 1) {
    const replica = textNode.parentNode.cloneNode(true);
    textArr.forEach(text => genTag(text, replica));
    return replica;
  }
  // single bracket in one text node
  return genTag(textArr[0], textNode.parentNode, true);
}

function multipleHandler() {
}

function iterateNodes(walkerObj) {
  // obj.nodesArr = [elem, [elem, elem], elem, elem];
  walkerObj.nodesArr.forEach((textNode) => {
    // complex multiple elements structure
    let tagInjection;
    if (Array.isArray(textNode)) {
      multipleHandler();
    } else { // simple single structure
      tagInjection = singleHandler(textNode, walkerObj.regex);
      textNode.parentNode.innerHTML = tagInjection;
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
