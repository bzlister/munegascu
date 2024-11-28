import * as monaco from "monaco-editor";

export class Control {
  private frame: number;

  constructor(private readonly editor: monaco.editor.IStandaloneCodeEditor, private readonly views: string[]) {
    this.frame = views.length - 1;
  }

  public next() {
    if (this.frame < this.views.length - 1) {
      this.frame++;
      this.editor.setValue(this.views[this.frame]);
    }

    return this.progress();
  }

  public back() {
    if (this.frame > 0) {
      this.frame--;
      this.editor.setValue(this.views[this.frame]);
    }

    return this.progress();
  }

  public progress() {
    return this.frame / (this.views.length - 1);
  }
}

export class PlaybackControl {
  private playbackHandle: NodeJS.Timeout;

  constructor(private readonly control: Control) {}

  public nextFrame() {
    return this.control.next();
  }

  public previousFrame() {
    return this.control.back();
  }

  public progress() {
    return this.control.progress();
  }

  public reset() {
    while (this.control.back() !== 0) {}
  }

  public play(delay: number) {
    this.playbackHandle = setInterval(() => {
      const playing = this.nextFrame();
      if (playing === 1) {
        clearInterval(this.playbackHandle);
      }
    }, delay);
  }

  public pause() {
    clearInterval(this.playbackHandle);
  }
}
