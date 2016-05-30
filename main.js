$(function () {
  var editor = CodeMirror(function (elt) {
    document.getElementById('main-editor').appendChild(elt);
  }, {
    lineNumbers: true,
    value: localStorage.getItem("elambda-main-editor-content") || "",
    mode:  "elambda",
    autoCloseBrackets: true,
    matchBrackets: true,
    highlightSelectionMatches: true,
    lint: true,
    gutters: ["CodeMirror-lint-markers"],
    height: 'auto',
    viewportMargin: Infinity
  });
  var editorEventThrottler = null;

  function update(e) {
    localStorage.setItem("elambda-main-editor-content", editor.getValue());
    if (editorEventThrottler) {
      clearTimeout(editorEventThrottler);
    }
    editorEventThrottler = setTimeout(compile, 100);
  }

  editor.on("change", update);

  function compile() {
    try {
      var expr = new elambda.Parser(editor.getValue()).parse();
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

  editor.focus();

  compile();
}());

$(document).on('keydown', function (e) {
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
  }
});