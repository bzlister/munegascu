import * as monaco from "monaco-editor";
import { View } from "./types";

const DefaultView: View = {
  text: "",
  cursor: { column: 1, lineNumber: 1 },
};

export interface IViewManager {
  addView(text: string, cursor: monaco.Position): void;
  getView(frame: number): View;
  numViews: number;
}

export class ViewManager implements IViewManager {
  private views: View[] = [DefaultView];

  public addView(text: string, cursor: monaco.Position) {
    this.views.push({ text, cursor });
  }

  public getView(frame: number): View {
    return this.views[frame];
  }

  public get numViews() {
    return this.views.length;
  }
}
