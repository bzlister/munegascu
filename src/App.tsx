import * as React from "react";
import { MunegascuContainer } from "./munegascu-container";

const text = `const x = (...params: any[]) => {
  foo(params);
}`;
const App: React.FC = () => {
  return <MunegascuContainer text={text} languageId="typescript" />;
};

export default App;
