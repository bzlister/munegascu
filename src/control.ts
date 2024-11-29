import * as monaco from "monaco-editor";
import { IViewManager } from "./view-manager";

export class PlaybackControl {
  private frame: number;
  private playbackHandle: NodeJS.Timeout;

  constructor(private readonly editor: monaco.editor.IStandaloneCodeEditor, private readonly viewManager: IViewManager) {
    this.frame = viewManager.numViews - 1;
  }

  public next() {
    if (this.frame < this.viewManager.numViews - 1) {
      this.frame++;
      this.update();
    }

    return this.progress();
  }

  public back() {
    if (this.frame > 0) {
      this.frame--;
      this.update();
    }

    return this.progress();
  }

  public reset() {
    this.frame = 0;
    this.update();
  }

  public play(delay: number) {
    this.playbackHandle = setInterval(() => {
      const playing = this.next();
      if (playing === 1) {
        clearInterval(this.playbackHandle);
      }
    }, delay);
  }

  public pause() {
    clearInterval(this.playbackHandle);
  }

  public progress() {
    return this.viewManager.numViews > 1 ? 0 : this.frame / (this.viewManager.numViews - 1);
  }

  private update() {
    const view = this.viewManager.getView(this.frame);
    this.editor.setValue(view.text);
    this.editor.setPosition(view.cursor);
  }
}
