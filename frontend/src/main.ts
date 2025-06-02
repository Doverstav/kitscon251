import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

const app = mount(App, {
  target: document.getElementById("app")!,
});

window.addEventListener("load", async () => {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`
      );
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  if (localStorage.getItem("userId") === null) {
    localStorage.setItem("userId", crypto.randomUUID());
  }
});

export default app;
