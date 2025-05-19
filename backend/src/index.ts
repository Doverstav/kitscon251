import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import {
  buildPushPayload,
  PushSubscription,
} from "@block65/webcrypto-web-push";
import { env } from "hono/adapter";

// webPush.setVapidDetails(
//   "mailto:doverstav@gmail.com",
//   vapid.publicKey,
//   vapid.privateKey
// );

const app = new Hono();

app.use(logger());
app.use(cors());

const subscriptions: { sub: PushSubscription; topic: string }[] = [];

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/subscriptions", async (c) => {
  const endpoint = c.req.query("endpoint");

  subscriptions.filter((sub) => {
    return sub.sub.endpoint !== endpoint;
  });

  return c.json({
    subscriptions: subscriptions.map((sub) => sub.topic),
  });
});

app.post("/subscribe", async (c) => {
  const body = await c.req.json();
  console.log("Subscription received:", body);
  subscriptions.push({ sub: body.subscription, topic: body.topic });
  return c.newResponse(null, 200);
});

app.post("/sendNotification", async (c) => {
  const body = await c.req.json();
  const topic = body.topic;

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = env<{
    VAPID_PUBLIC_KEY: string;
    VAPID_PRIVATE_KEY: string;
  }>(c);
  const vapid = {
    subject: "mailto:doverstav@gmail.com",
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  };
  await Promise.all(
    subscriptions.map(async (sub) => {
      if (sub.topic !== topic) {
        return;
      }
      // console.log("Sending notification to:", sub);
      try {
        const payload = await buildPushPayload(
          {
            data: JSON.stringify({
              message: "Test Notification",
              title: topic,
            }),
          },
          sub.sub,
          vapid
        );
        await fetch(sub.sub.endpoint, payload);
        // console.log(res);
        // console.log(await res.text());
        // await webPush.sendNotification(
        //   sub as PushSubscription,
        //   "Test Notification"
        // );
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    })
  );

  return c.newResponse(null, 200);
});

export default app;
