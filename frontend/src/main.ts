import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

const app = mount(App, {
  target: document.getElementById("app")!,
});

window.addEventListener("load", async () => {
  console.log("Service Worker registration in progress...");
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`
      );
      console.log(reg);
      console.log("Service Worker registered successfully.");
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
});

export default app;
