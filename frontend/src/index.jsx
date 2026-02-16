import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/animations.css";
import "./styles/index.css";
import "./styles/tailwind.css";

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => {
    if (globalThis.crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
      return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex
        .slice(8, 10)
        .join("")}-${hex.slice(10, 16).join("")}`;
    }
    let time = Date.now();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const rand = (time + Math.random() * 16) % 16 | 0;
      time = Math.floor(time / 16);
      return (char === "x" ? rand : (rand & 0x3) | 0x8).toString(16);
    });
  };
}

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("Root element not found. Make sure you have <div id='root'></div> in your index.html");
}
