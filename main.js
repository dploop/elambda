var editor = document.getElementById('main-editor');
editor.value = localStorage.getItem("elambda-main-editor-content");
(function () {
  var editorEventThrottler = null;
  function update(e) {
    localStorage.setItem("elambda-main-editor-content", editor.value);
    if (editorEventThrottler) {
      clearTimeout(editorEventThrottler);
    }
    editorEventThrottler = setTimeout(compile, 100);
  }
  editor.addEventListener("keypress", update);
  editor.addEventListener("keydown", update);

  function compile() {
    try {
      var expr = new elambda.Parser(editor.value).parse();
      var runtime = new elambda.RuntimeContext();
      document.getElementById('result').textContent = runtime.evaluate(expr).toString();
      document.getElementById('error-message').textContent = '';
      document.getElementById('count').textContent = runtime.counter[0];
    } catch (e) {
      document.getElementById('result').textContent = '';
      document.getElementById('error-message').textContent = e.toString();
      document.getElementById('count').textContent = '';
    }
  }
  compile();
}());
