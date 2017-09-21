// RegExp test cases here: http://regexr.com/3go12

function injectHTML() {
  // select everything in the body except <script>, <style>, <a>, <code>, <pre>
  const elements = document.querySelectorAll('body *:not(script):not(style):not(a):not(code):not(pre)');

  for (let i = 0; i < elements.length; i += 1) {
    if (elements[i].hasChildNodes()) {
      elements[i].childNodes.forEach((el) => {
        if (el.nodeType === Node.TEXT_NODE && el.nodeValue.match(/(\()([A-Z .,!?:"'`\\/&-]{10,100})\w*(\))/ig)) {

          const text = el.nodeValue.substring(el.nodeValue.indexOf('(') + 1, el.nodeValue.indexOf(')'));
          const regEx = new RegExp(text.replace(/[.,!?:"'`\\/&-()]/g, '\\$&')); // escape allowed characters + ()

          // data-bracketless=""  some symbols break layout, replace/change RegExp allowed symbols

          /* eslint-disable no-param-reassign */
          const htmlSafeText = text.replace(/&/g, '&amp;').replace(/"/g, "'");
          el.parentNode.innerHTML = el.parentNode.innerHTML
            .replace(regEx, `<bracket-less data-bracketless="${htmlSafeText}">${text}</bracket-less>`);
          /* eslint-enable no-param-reassign */
        }
      });
    }
  }
  // so that script will be injected once
  return true;
}
injectHTML();

// BUGS
// ignores text: "... (i.e., $99.99), ... (plus taxes) to buy it."
// @ https://github.com/getify/You-Dont-Know-JS/blob/master/up%20%26%20going/ch1.md#values--types

// (see Chapter 2). Loops (see "Loops")
// incorrectly grabs text: "see Chapter 2", and "). Loops ("
// @ https://github.com/getify/You-Dont-Know-JS/blob/master/up%20%26%20going/ch1.md#loops and go up
