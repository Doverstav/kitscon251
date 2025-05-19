//@ts-nocheck
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);
  const body = event.data.json();
  const options = {
    body: body.message,
    icon: "/icon.png",
    badge: "/icon.png",
  };
  event.waitUntil(self.registration.showNotification(body.title, options));
});
