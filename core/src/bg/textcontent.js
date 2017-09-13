function nativeSelector() {
  // select everything in the body except <script>, <style>, <a>, <code>, <pre>
  const elements = document.querySelectorAll('body *:not(script):not(style):not(a):not(code):not(pre)');

  let results = [];
  let child;
  let parentNumber = 0;
  for(let i = 0; i < elements.length; i++) {
    child = elements[i].childNodes[0];

    // view RegExp test cases here: http://regexr.com/3go12
    // Node.TEXT_NODE = 3
    if(elements[i].hasChildNodes() && child.nodeType == Node.TEXT_NODE &&
      child.nodeValue.match(/(\()([A-Z .,!?:"'`\\/&-]{4,})\w*(\))/ig)) {      
      let bracketsText = child.nodeValue.substring(child.nodeValue.indexOf('(') + 1, child.nodeValue.indexOf(')'));
      results.push({bracketsText: bracketsText, fullText: child.nodeValue});
      
      elements[i].classList.add('extension-bracketless-parent', 'extension-bracketless-parent-' + parentNumber);
      parentNumber++;
      let customRegExp = new RegExp(bracketsText);
      elements[i].innerHTML = child.nodeValue.replace(customRegExp, `<bracket-less>${bracketsText}</bracket-less>`);
    }    
    // (i.e., $99.99) @ https://github.com/getify/You-Dont-Know-JS/blob/master/up%20%26%20going/ch1.md
    // bug, gets matched. numbers shouldn't match
  }
  return results;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  sendResponse(nativeSelector());
});
