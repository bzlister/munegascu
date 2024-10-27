import * as React from "react";
import * as ReactDOM from "react-dom/client"; // For React 18+
import App from "./App";

// Grab the root element in the HTML where React will be rendered
const rootElement = document.getElementById("root");

// Initialize and create a root for React to render
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement); // React 18 root API
  root.render(React.createElement(App));
}
