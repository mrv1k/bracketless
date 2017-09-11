(function collapseBrackets() {
  const elements  = document.getElementsByTagName('*');
  
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    
    for (let j = 0; j < element.childNodes.length; j++) {
      let node = element.childNodes[j];
  
      if (node.nodeType === 3) {
        let text = node.nodeValue;
        let replaceBrackets = text.replace(/\b(collapsed)\b/g, 'expanded');
  
        if (replaceBrackets !== text) {
          element.replaceChild(document.createTextNode(replaceBrackets), node);
        }
      }
    }
  }
})();
