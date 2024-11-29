import * as React from "react";
import { MunegascuEngine } from "./munegascu-engine";
import { MunegascuStagingGrounds } from "./munegascu-staging-grounds";
import { PlaybackControl } from "./control";
import { ViewManager } from "./view-manager";

export const MunegascuContainer = (props: { text: string; languageId: string }) => {
  const { text, languageId } = props;
  const [controls, setControls] = React.useState<PlaybackControl>();

  React.useEffect(() => {
    const engine = new MunegascuEngine(text, languageId, "munegascu-container", new ViewManager());
    engine.render().then((c) => {
      setControls(c);
    });
  }, [text, languageId]);

  return (
    <React.StrictMode>
      <MunegascuStagingGrounds />
      <div id="munegascu-container" />
      <div id="munegascu-controls">
        <button onClick={() => controls?.back()}>Previous</button>
        <button onClick={() => controls?.play(50)}>Play</button>
        <button onClick={() => controls?.pause()}>Pause</button>
        <button onClick={() => controls?.reset()}>Reset</button>
        <button onClick={() => controls?.next()}>Next</button>
      </div>
    </React.StrictMode>
  );
};
