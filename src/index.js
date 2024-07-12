import * as monaco from "monaco-editor";
import { typedAt } from "./parserUtils";
import { MonacoConfig } from "./config";

// Since packaging is done by you, you need
// to instruct the editor how you named the
// bundles that contain the web workers.
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === "json") {
      return "./json.worker.js";
    }
    if (label === "css" || label === "scss" || label === "less") {
      return "./css.worker.js";
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return "./html.worker.js";
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

let src = `(xparam) => {
  console.log("Hellooo");
}`;

const EndOfLineSequence = {
  LF: 0, // \n
  CRLF: 1, // \r\n
};

const EndOfLinePreference = {
  TextDefined: 0,
  LF: 1, // \n
  CRLF: 2, // \r\n
};

function EOLSequenceToPreference(x) {
  const key = Object.keys(EndOfLineSequence).filter((key) => EndOfLineSequence[key] === x);
  return EndOfLinePreference[key];
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const jsLang = monaco.languages.getLanguages().find((l) => l.id === "javascript");

jsLang.loader().then(async (js) => {
  monaco.languages.setLanguageConfiguration("javascript", js.conf);

  let eol;
  [src, eol] = standardize(src);
  const editor = monaco.editor.create(document.getElementById("container"), {
    ...MonacoConfig,
    value: "",
    language: "javascript",
  });

  const model = editor.getModel();
  const blueprint = new monaco.editor.createModel(src, "javascript");
  model.setEOL(eol);
  blueprint.setEOL(eol);
  const useCLRF = eol !== "\n";
  /*
  let tokens;
  let resolver;
  const ready = new Promise((r) => (resolver = r));
  setTimeout(() => {
    tokens = monaco.editor.tokenize(src, "javascript");
    resolver();
  }, 500);

  await ready;
  let i = 0;
  while (i <= src.length) {
    const text = typedAt(src, i, tokens, model.getEOL());
    document.getElementById("whiteboard").innerText = text;
    i++;
    await sleep(10);
  }
*/

  let i = 0;
  while (i < src.length) {
    const cursor = editor.getPosition();
    const range = model.getFullModelRange();
    const afterCursor = model.getValueInRange({ ...range, startLineNumber: cursor.lineNumber, startColumn: cursor.column });

    const [c, n] = tokenAt(src, i, useCLRF);
    const [c_model, _] = tokenAt(afterCursor, 0, useCLRF);

    if (c.includes("\n")) {
      debugger;
    }

    if (c === c_model) {
      debugger;
      const remaining = src.substring(i);
      if (remaining === afterCursor) {
        break; // done early!
      }

      if (c_model !== eol) {
        editor.setPosition({ lineNumber: cursor.lineNumber, column: cursor.column + n });
        i += n;
      } else {
        // determine whether newline character has 'Enter' semantics
        if (model.getLineContent(cursor + 1) === blueprint.getLineContent(cursor + 1)) {
          editor.trigger("keyboard", "cursorDown");
          const newCursor = editor.getPosition();
          i = model.getCharacterCountInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: newCursor.lineNumber, endColumn: newCursor.column });
          continue;
        } else {
          editor.trigger("keyboard", "type", {
            text: eol,
            forceMoveMarkers: true,
          });
          i = model.getOffsetAt(editor.getPosition()); // fix this
        }
      }
    } else {
      editor.trigger("keyboard", "type", {
        text: c,
        forceMoveMarkers: true,
      });

      i = model.getOffsetAt(editor.getPosition()); // fix this
    }

    await Promise.all([sleep(500)]); // should maybe wait for model to be updated too?
  }
});

function tokenAt(s, i, clrf) {
  if (s == null) {
    throw "Null reference";
  }

  if (i < 0 || i >= s.length) {
    return "";
  }

  const c = s.charAt(i);
  if (c === "\r") {
    const c2 = s.charAt(i + 1);
    if (c2 == "\n" && clrf) {
      return ["\r\n", 2];
    }
  }

  return [c, 1];
}

/*
editor.onDidChangeModelContent((event) => {
  const changes = event.changes;

  changes.forEach((change) => {
    if (change.text == '\n') {
      debugger;
      const position = change.range.getStartPosition();

      editor.executeEdits("", [
        {
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
          text: "$",
          forceMoveMarkers: true,
        },
      ]);

    }
  });
});
*/

function standardize(text) {
  const hiddenEditor = monaco.editor.create(document.getElementById("hidden"), {
    ...MonacoConfig,
    value: text,
    language: "javascript",
    automaticLayout: true,
  });
  const model = hiddenEditor.getModel();
  const eolPreference = EOLSequenceToPreference(model.getEndOfLineSequence());

  return [model.getValue(eolPreference), model.getEOL()];
}
