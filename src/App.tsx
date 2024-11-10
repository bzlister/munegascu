import * as React from "react";
import { MunegascuContainer } from "./munegascu-container";

const text = `this.init = (monaco.languages.getLanguages().find((l) => l.id === languageId) as unknown as any)
.loader()
.then(({ conf }: { conf: monaco.languages.LanguageConfiguration }) => {
  monaco.languages.setLanguageConfiguration(languageId, conf);
});`;

const App: React.FC = () => {
  return <MunegascuContainer text={text} languageId="typescript" />;
};

export default App;
