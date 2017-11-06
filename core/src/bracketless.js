/* eslint-disable no-param-reassign */

let regex; // Make global as it's used by both singleHandler and multiHandler

function getOptions() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, options => resolve(options));
  });
}

// Regex test cases here: https://regexr.com/3gv3c
function genBracketsRegex(options) {
  const genRegexStr = `(?:\\()([A-Z .,!?:"'\`\\\\/\\&+-]\\d?){${options.lowLimit},${options.upLimit}}(?:\\))`;
  regex = new RegExp(genRegexStr, 'gi');
  return regex;
}


function genTag(text) {
  const dataSafeText = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); // Make html safe
  return `<bracket-less data-bracketless="${dataSafeText}">${text}</bracket-less>`;
}

function injectTag(text, tag, target) {
  const replaceRegex = new RegExp(text.replace(/[.,!?:"'`\\/&-(+)]/g, '\\$&')); // Find exactly that text
  target.innerHTML = target.innerHTML.replace(replaceRegex, tag);
}

function singleHandler(textNode, multiClone) {
  const textArr = textNode.textContent.match(regex);
  const parent = multiClone || textNode.parentNode;

  if (textArr.length > 1) { // Invoked by multiHandler. eg: ["element", "element"]
    const replica = multiClone ? parent : parent.cloneNode(true);
    textArr.forEach((text) => {
      text = text.slice(1, -1); // Slice brackets "(" & ")"
      injectTag(text, genTag(text, replica), replica);
    });
    parent.innerHTML = replica.innerHTML;
  } else { // Single bracket. eg: "element"
    textArr[0] = textArr[0].slice(1, -1); // Slice brackets "(" & ")"
    injectTag(textArr[0], genTag(textArr[0]), parent);
  }
}

function multiHandler(textNodes) {
  const parentClone = textNodes[0].parentNode.cloneNode(true);
  textNodes.forEach((siblingText) => {
    singleHandler(siblingText, parentClone);
  });
  textNodes[0].parentNode.innerHTML = parentClone.innerHTML;
}

function iterateNodes(nodesArr) {
  nodesArr.forEach((textNode) => {
    if (Array.isArray(textNode)) {
      multiHandler(textNode);
    } else {
      singleHandler(textNode);
    }
  });
  return nodesArr.length;
}

function nativeTreeWalker(bracketsRegex) {
  const ignoredTags = ['A', 'PRE', 'CODE', 'SCRIPT', 'STYLE'];
  // Only accept nodes that have allowed text and are not in ignored tag
  const filter = {
    acceptNode(node) {
      if (bracketsRegex.test(node.data) && !ignoredTags.includes(node.parentNode.tagName)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, filter);
  walker.nextNode(); // First element is the root element!
  const nodes = [walker.currentNode]; // Store one value immediately so length is not 0
  const sameParent = [];

  while (walker.nextNode()) {
    const prev = nodes[nodes.length - 1];
    const cur = walker.currentNode;
    if (cur.parentNode.isSameNode(prev.parentNode)) {
      // Empty? Add prev element
      if (!sameParent.length) sameParent.push(prev);
      sameParent.push(cur);
    } else {
      // If sameParent is not empty replace last single node elem and empty
      if (sameParent.length) nodes[nodes.length - 1] = sameParent.splice(0);
      nodes.push(cur);
    }
  }
  // If no brackets found on the page. Current node will be root (body). Verify its type to be text
  if (walker.currentNode.nodeType !== 3) return [];
  return nodes;
}

const regexPr = getOptions()
  .then(genBracketsRegex);

regexPr
  .then(nativeTreeWalker)
  .then(iterateNodes)
  .then((count) => {
    if (count === 0) chrome.runtime.sendMessage({ disable: true });
  });
