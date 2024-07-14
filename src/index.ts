import * as monaco from "monaco-editor";

const MonacoConfig = {
  automaticLayout: true,
  autoIndent: "none",
  autoClosingQuotes: "always",
  autoClosingBrackets: "always",
  autoClosingComments: "always",
  autoClosingDelete: "always",
  autoClosingOvertype: "always",
};

let src = `(xparam) => {
  console.log("Hellooo");
  console.log("What are you doing?");
}`;

enum EndOfLineSequence {
  LF = 0, // \n
  CRLF = 1, // \r\n
}

enum EndOfLinePreference {
  TextDefined = 0,
  LF = 1, // \n
  CRLF = 2, // \r\n
}

function EOLSequenceToPreference(eolSequence: EndOfLineSequence) {
  return eolSequence === EndOfLineSequence.LF ? EndOfLinePreference.LF : EndOfLinePreference.CRLF;
}

function EOLStringToSequence(eolString: string) {
  if (eolString === "\n") return EndOfLineSequence.LF;
  if (eolString === "\r\n") return EndOfLineSequence.CRLF;
  throw `Unexpected EOL string ${eolString}`;
}

const jsLang = monaco.languages.getLanguages().find((l) => l.id === "javascript") as unknown as {
  loader(): Promise<{ conf: monaco.languages.LanguageConfiguration }>;
};

jsLang.loader().then(async (js) => {
  monaco.languages.setLanguageConfiguration("javascript", js.conf);

  let eol: string;
  [src, eol] = standardize(src);
  const editor = monaco.editor.create(document.getElementById("container"), {
    ...MonacoConfig,
    value: "",
    language: "javascript",
  } as monaco.editor.IStandaloneEditorConstructionOptions);

  const model = editor.getModel();
  const blueprint = monaco.editor.createModel(src, "javascript");
  model.setEOL(EOLStringToSequence(eol));
  blueprint.setEOL(EOLStringToSequence(eol));
  const useCLRF = eol !== "\n";

  let i = 0;
  while (i < src.length) {
    const cursor = editor.getPosition();
    const range = model.getFullModelRange();
    const afterCursor = model.getValueInRange({ ...range, startLineNumber: cursor.lineNumber, startColumn: cursor.column });

    const [c, n] = tokenAt(src, i, useCLRF);
    const [c_model, _] = tokenAt(afterCursor, 0, useCLRF);

    if (c === eol) {
      const remaining = src.substring(i);
      if (remaining === afterCursor) {
        break; // done early!
      }

      // determine whether newline character has 'Enter' semantics
      const modelNextLine = model.getLineCount() > cursor.lineNumber ? model.getLineContent(cursor.lineNumber + 1) : "";
      const blueprintNextLine = blueprint.getLineCount() > cursor.lineNumber ? blueprint.getLineContent(cursor.lineNumber + 1) : "";
      if (modelNextLine === blueprintNextLine) {
        editor.trigger("keyboard", "cursorDown", null);
        const newCursor = editor.getPosition();
        i = model.getCharacterCountInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: newCursor.lineNumber, endColumn: newCursor.column });
        continue;
      } else {
        let whitespace = "";
        let j = i;
        while (j < src.length) {
          const [w, w_len] = tokenAt(src, j, useCLRF);
          if (w.trim() === "") {
            whitespace += w;
            j += w_len;
          } else break;
        }

        model.applyEdits([
          {
            text: whitespace,
            range: { startLineNumber: cursor.lineNumber, startColumn: cursor.column, endLineNumber: cursor.lineNumber, endColumn: cursor.column },
            forceMoveMarkers: true,
          },
        ]);
        const newCursor = editor.getPosition();

        // insert an extra newline if there was more content on the line after the cursor
        if (c_model !== eol) {
          editor.trigger("keyboard", "type", {
            text: eol,
            forceMoveMarkers: true,
          });
        }

        editor.setPosition(newCursor);
        i = model.getOffsetAt(newCursor);
      }
    } else if (c === c_model) {
      editor.setPosition({ lineNumber: cursor.lineNumber, column: cursor.column + n });
      i += n;
    } else {
      editor.trigger("keyboard", "type", {
        text: c,
        forceMoveMarkers: true,
      });

      i = model.getOffsetAt(editor.getPosition()); // fix this
    }
  }
});

function tokenAt(s: string, i: number, clrf: boolean): [string, number] {
  if (s == null) {
    throw "Null reference";
  }

  if (i < 0 || i >= s.length) {
    return ["", 0];
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

function standardize(text: string): [string, string] {
  const hiddenEditor = monaco.editor.create(document.getElementById("hidden"), {
    ...MonacoConfig,
    value: text,
    language: "javascript",
    automaticLayout: true,
  } as monaco.editor.IStandaloneEditorConstructionOptions);
  const model = hiddenEditor.getModel();
  // model.normalizeIndentation(indentation);
  const eolPreference = EOLSequenceToPreference(model.getEndOfLineSequence());
  const standardized = model.getValue(eolPreference);
  const eol = model.getEOL();

  hiddenEditor.dispose();
  return [standardized, eol];
}
