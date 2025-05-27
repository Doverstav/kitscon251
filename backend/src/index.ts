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

type Bindings = {
  SUBSCRIPTIONS: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(logger());
app.use(cors());

type Subscription = {
  sub: PushSubscription;
  topics: string[];
  userId: string;
};

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/subscriptions", async (c) => {
  const userId = c.req.query("userId");

  if (!userId) {
    return c.newResponse("User ID is required", 400);
  }

  const userSubscription = await c.env.SUBSCRIPTIONS.get<Subscription>(userId, {
    type: "json",
  });

  return c.json({
    subscriptions: userSubscription?.topics,
  });
});

app.post("/subscribe", async (c) => {
  const body = await c.req.json();
  console.log("Subscription received:", body);
  if (!body.userId) {
    return c.newResponse("User ID is required", 400);
  }

  const userSubscription = await c.env.SUBSCRIPTIONS.get<Subscription>(
    body.userId,
    {
      type: "json",
    }
  );

  if (userSubscription === null) {
    await c.env.SUBSCRIPTIONS.put(
      body.userId,
      JSON.stringify({
        sub: body.subscription,
        topics: [body.topic],
        userId: body.userId,
      }),
      { expirationTtl: 60 * 60 * 24 } // Keep for 24 hours
    );
  } else if (!userSubscription.topics.includes(body.topic)) {
    await c.env.SUBSCRIPTIONS.put(
      body.userId,
      JSON.stringify({
        ...userSubscription,
        topics: [...userSubscription.topics, body.topic],
      }),
      { expirationTtl: 60 * 60 * 24 } // Keep for 24 hours
    );
  }

  return c.newResponse(null, 200);
});

app.delete("/unsubscribe", async (c) => {
  const body = await c.req.json();
  console.log("Unsubscription received:", body);
  if (!body.userId) {
    return c.newResponse("User ID is required", 400);
  }

  const userSubscription = await c.env.SUBSCRIPTIONS.get<Subscription>(
    body.userId,
    {
      type: "json",
    }
  );

  if (userSubscription === null) {
    return c.newResponse("No subscription found for this user", 404);
  }

  const updatedTopics = userSubscription.topics.filter(
    (topic) => topic !== body.topic
  );

  if (updatedTopics.length === 0) {
    await c.env.SUBSCRIPTIONS.delete(body.userId);
  } else {
    await c.env.SUBSCRIPTIONS.put(
      body.userId,
      JSON.stringify({
        ...userSubscription,
        topics: updatedTopics,
      }),
      { expirationTtl: 60 * 60 * 24 } // Keep for 24 hours
    );
  }

  return c.newResponse(null, 200);
});

app.post("/sendNotification", async (c) => {
  const { topic, message } = await c.req.json();
  const allUserIds = (await c.env.SUBSCRIPTIONS.list()).keys.map(
    (key) => key.name
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
    allUserIds.map(async (userId) => {
      const subscription = await c.env.SUBSCRIPTIONS.get<Subscription>(userId, {
        type: "json",
      });

      if (!subscription?.topics.includes(topic)) {
        return;
      }

      try {
        const payload = await buildPushPayload(
          {
            data: JSON.stringify({
              message: message || `New message regarding ${topic}`,
              title: topic,
            }),
          },
          subscription.sub,
          vapid
        );
        await fetch(subscription.sub.endpoint, payload);
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
