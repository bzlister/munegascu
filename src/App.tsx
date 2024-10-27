import * as React from "react";
import { MunegascuContainer } from "./munegascu-container";

const text = `(xparam) => {
  console.log("Hellooo");
  console.log("What are you doing?");
}`;

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <MunegascuContainer text={text} languageId="javascript" />
    </React.StrictMode>
  );
};

export default App;
