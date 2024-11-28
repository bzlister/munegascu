import * as React from "react";
import { MunegascuEngine } from "./munegascu-engine";
import { MunegascuStagingGrounds } from "./munegascu-staging-grounds";
import { PlaybackControl } from "./control";
import { MunegascuCanvasStyles, MunegascuControlStyles } from "./styles";

export const MunegascuContainer = (props: { text: string; languageId: string }) => {
  const { text, languageId } = props;
  const [controls, setControls] = React.useState<PlaybackControl>();

  React.useEffect(() => {
    const engine = new MunegascuEngine(text, languageId, "munegascu-container");
    engine.render().then((c) => {
      console.log(`Typing states computed. Number of frames: ${undefined}`);
      setControls(c);
    });
  }, []);

  return (
    <React.StrictMode>
      <MunegascuStagingGrounds />
      <div id="munegascu-container" style={MunegascuCanvasStyles} />
      <div style={MunegascuControlStyles}>
        <button onClick={() => controls?.previousFrame()}>Previous</button>
        <button onClick={() => controls?.nextFrame()}>Next</button>
      </div>
    </React.StrictMode>
  );
};
