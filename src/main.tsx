import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Swallow benign ResizeObserver loop errors globally
if (typeof window !== "undefined") {
  const resizeObserverErrors = [
    "ResizeObserver loop completed with undelivered notifications",
    "ResizeObserver loop limit exceeded",
  ];

  window.addEventListener("error", (e: ErrorEvent) => {
    if (
      resizeObserverErrors.some((msg) => e.message && e.message.includes(msg))
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
