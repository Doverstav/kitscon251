//@ts-nocheck
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);
  const body = event.data.json();
  const options = {
    body: body.message,
    icon: "/kitscon251/icon.png",
    badge: "/ktiscon251/icon.png",
  };
  event.waitUntil(self.registration.showNotification(body.title, options));
});
