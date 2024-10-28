import * as monaco from "monaco-editor";
import { MonacoConfig } from "./monaco-config";
import { EndOfLinePreference, EndOfLineSequence } from "./types";
import { PlaybackControl, Control } from "./control";

export class MunegascuEngine {
  private init: Promise<void>;
  private editor: monaco.editor.IStandaloneCodeEditor;

  constructor(private readonly text: string, private readonly languageId: string, private readonly elementId: string) {
    this.init = (monaco.languages.getLanguages().find((l) => l.id === languageId) as unknown as any)
      .loader()
      .then(({ conf }: { conf: monaco.languages.LanguageConfiguration }) => {
        monaco.languages.setLanguageConfiguration(languageId, conf);
      });
  }

  public async render(): Promise<PlaybackControl> {
    await this.init;
    const frames = this.type();
    return new PlaybackControl(new Control(this.editor, frames));
  }

  private type() {
    let { blueprint, src, eol } = this.standardize();
    this.editor = monaco.editor.create(document.getElementById(this.elementId), {
      ...MonacoConfig,
      value: "",
      language: this.languageId,
      automaticLayout: true,
    } as monaco.editor.IStandaloneEditorConstructionOptions);

    const model = this.editor.getModel();
    model.setEOL(this.eolStringToSequence(eol));
    const useCLRF = eol !== "\n";

    const frames: number[] = [];

    let i = 0;
    while (i < src.length) {
      const cursor = this.editor.getPosition();
      const range = model.getFullModelRange();
      const afterCursor = model.getValueInRange({ ...range, startLineNumber: cursor.lineNumber, startColumn: cursor.column });

      const [c, n] = this.tokenAt(src, i, useCLRF);
      const [c_model, _] = this.tokenAt(afterCursor, 0, useCLRF);

      if (c === eol) {
        const remaining = src.substring(i);
        debugger;

        if (afterCursor.length > 0 && afterCursor.length <= remaining.length && remaining.substring(0, afterCursor.length) === afterCursor) {
          this.editor.setPosition({ lineNumber: range.endLineNumber, column: range.endColumn });
          i = model.getOffsetAt(this.editor.getPosition());
          continue;
        }

        // determine whether newline character has 'Enter' semantics
        const modelNextLine = model.getLineCount() > cursor.lineNumber ? model.getLineContent(cursor.lineNumber + 1) : "";
        const blueprintNextLine = blueprint.getLineCount() > cursor.lineNumber ? blueprint.getLineContent(cursor.lineNumber + 1) : "";
        if (modelNextLine === blueprintNextLine) {
          this.editor.trigger("keyboard", "cursorDown", null);
          const newCursor = this.editor.getPosition();
          i = model.getCharacterCountInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: newCursor.lineNumber, endColumn: newCursor.column });
        } else {
          let whitespace = "";
          let j = i;
          while (j < src.length) {
            const [w, w_len] = this.tokenAt(src, j, useCLRF);
            if (w.trim() === "") {
              whitespace += w;
              j += w_len;
            } else break;
          }

          // model.pushEditOperations([new monaco.Selection(cursor.lineNumber, cursos.column, )])
          model.applyEdits([
            {
              text: whitespace,
              range: { startLineNumber: cursor.lineNumber, startColumn: cursor.column, endLineNumber: cursor.lineNumber, endColumn: cursor.column },
              forceMoveMarkers: true,
            },
          ]);
          const newCursor = this.editor.getPosition();

          // insert an extra newline if there was more content on the line after the cursor
          if (c_model !== eol) {
            this.editor.trigger("keyboard", "type", {
              text: eol,
              forceMoveMarkers: true,
            });
          }

          this.editor.setPosition(newCursor);
          i = model.getOffsetAt(newCursor);
        }
      } else if (c === c_model) {
        this.editor.setPosition({ lineNumber: cursor.lineNumber, column: cursor.column + n });
        i += n;
      } else {
        this.editor.trigger("keyboard", "type", {
          text: c,
          forceMoveMarkers: true,
        });

        i = model.getOffsetAt(this.editor.getPosition());
      }
    }

    return frames;
  }

  private standardize() {
    const hiddenEditor = monaco.editor.create(document.getElementById("staging-grounds-1"), {
      ...MonacoConfig,
      value: this.text,
      language: this.languageId,
      automaticLayout: true,
    } as monaco.editor.IStandaloneEditorConstructionOptions);
    const model = hiddenEditor.getModel();
    // model.normalizeIndentation(indentation);
    const eolPreference = this.eolSequenceToPreference(model.getEndOfLineSequence());
    const standardized = model.getValue(eolPreference);
    const eol = model.getEOL();

    return { blueprint: model, src: standardized, eol };
  }

  private eolSequenceToPreference(eolSequence: EndOfLineSequence) {
    return eolSequence === EndOfLineSequence.LF ? EndOfLinePreference.LF : EndOfLinePreference.CRLF;
  }

  private eolStringToSequence(eolString: string) {
    if (eolString === "\n") return EndOfLineSequence.LF;
    if (eolString === "\r\n") return EndOfLineSequence.CRLF;
    throw `Unexpected EOL string ${eolString}`;
  }

  private tokenAt(s: string, i: number, clrf: boolean): [string, number] {
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
}
