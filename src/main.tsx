import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Securely invoke the foundational Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('Service Worker actively engaged with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration encountered an anomaly:', error);
            });
    });
}