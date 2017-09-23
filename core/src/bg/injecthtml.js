// RegExp test cases here: http://regexr.com/3gqin

function injectHTML() {
  // select everything in the body except <script>, <style>, <a>, <code>, <pre>
  const elements = document.querySelectorAll('body *:not(script):not(style):not(a):not(code):not(pre)');

  const userLowerLimit = 10;
  const userUpperLimit = 100;
  // eslint-disable-next-line no-useless-escape
  const generatedRegexTest = `(\\()([A-Z .,!?:"'\`\\\/&-]{${userLowerLimit},${userUpperLimit}})\\w*(\\))`;
  // generatedRegexTest =  /(\()([A-Z .,!?:"'`\\\/&-]{num,num})\w*(\))/gi
  const inBracketsRegex = new RegExp(generatedRegexTest, 'gi');

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
  // so that script will be injected once
  return true;
}
injectHTML();

// RegExp BUGS
// ignores text: "... (i.e., $99.99), ... (plus taxes) to buy it."
// @ https://github.com/getify/You-Dont-Know-JS/blob/master/up%20%26%20going/ch1.md#values--types

// (see Chapter 2). Loops (see "Loops")
// incorrectly grabs text: "see Chapter 2", and "). Loops ("
// @ https://github.com/getify/You-Dont-Know-JS/blob/master/up%20%26%20going/ch1.md#loops and go up
