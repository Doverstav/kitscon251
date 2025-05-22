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

const subscriptions: {
  sub: PushSubscription;
  topics: string[];
  userId: string;
}[] = [];

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/subscriptions", async (c) => {
  const userId = c.req.query("userId");

  const userSubscriptions = subscriptions.filter((sub) => {
    return sub.userId === userId;
  });

  return c.json({
    subscriptions: userSubscriptions.flatMap((sub) => sub.topics),
  });
});

app.post("/subscribe", async (c) => {
  const body = await c.req.json();
  console.log("Subscription received:", body);
  if (!body.userId) {
    return c.newResponse("User ID is required", 400);
  }

  if (subscriptions.some((sub) => sub.userId === body.userId)) {
    subscriptions.map((sub) => {
      if (sub.userId === body.userId && !sub.topics.includes(body.topic)) {
        sub.topics.push(body.topic);
      }
    });
  } else {
    subscriptions.push({
      sub: body.subscription,
      topics: [body.topic],
      userId: body.userId,
    });
  }
  return c.newResponse(null, 200);
});

app.post("/sendNotification", async (c) => {
  const { topic, userId } = await c.req.json();
  const userSubscriptions = subscriptions.filter(
    (sub) => sub.userId === userId
  );

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
    userSubscriptions.map(async (sub) => {
      if (!sub.topics.includes(topic)) {
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
