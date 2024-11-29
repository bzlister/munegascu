import * as monaco from "monaco-editor";

export enum EndOfLineSequence {
  LF = 0, // \n
  CRLF = 1, // \r\n
}

export enum EndOfLinePreference {
  TextDefined = 0,
  LF = 1, // \n
  CRLF = 2, // \r\n
}

export type View = {
  text: string;
  cursor: Pick<monaco.Position, "column" | "lineNumber">;
};
