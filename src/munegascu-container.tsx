import * as React from "react";
import { MunegascuEngine } from "./munegascu-engine";
import { MunegascuStagingGrounds } from "./munegascu-staging-grounds";
import { IPlaybackControl } from "./playback-control";
import { MunegascuCanvasStyles } from "./munegascu-canvas-styles";

export const MunegascuContainer = (props: { text: string; languageId: string }) => {
  const { text, languageId } = props;
  const [controls, setControls] = React.useState<IPlaybackControl>();

  React.useEffect(() => {
    const engine = new MunegascuEngine(text, languageId, "monaco-container");
    engine.render().then((c) => {
      console.log(`Typing states computed. Number of frames: ${undefined}`);
      setControls(c);
    });
  }, []);

  return (
    <>
      <MunegascuStagingGrounds />
      <div id="monaco-container" style={MunegascuCanvasStyles} />
    </>
  );
};
