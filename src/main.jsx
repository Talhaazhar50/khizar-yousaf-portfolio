import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Start downloading the 3D room now, in parallel, instead of after React has mounted.
if (location.pathname === "/") import("./studio/StudioScene.jsx");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
