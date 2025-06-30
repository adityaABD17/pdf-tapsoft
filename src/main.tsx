import React from "react";
import App from "./App";
import ReactDOM from "react-dom/client";
import "./components/pdfWorkerSetup";

// Use StrictMode for debugging
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
