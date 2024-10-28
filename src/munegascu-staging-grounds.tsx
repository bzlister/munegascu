import * as React from "react";
import { MunegascuCanvasStyles } from "./munegascu-canvas-styles";

export const MunegascuStagingGrounds = React.memo(() => {
  console.log("Rendered staging grounds");

  return (
    <div style={{ display: "none" }}>
      <div id="staging-grounds-1" style={MunegascuCanvasStyles}></div>
      <div id="staging-grounds-2" style={MunegascuCanvasStyles}></div>
    </div>
  );
});
