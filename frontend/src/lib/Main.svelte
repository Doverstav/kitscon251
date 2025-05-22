<script lang="ts">
  import {
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";

  const queryClient = useQueryClient();

  let subscriptionTopic = $state("");
  let notificationTopic = $state("");
  let notificationPermission = $derived(
    "Notification" in window ? Notification.permission : null
  );

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notifications granted");
          notificationPermission = "granted";
          // Do something with the granted permission, like showing a notification
          new Notification("Notifications enabled");
        } else if (permission === "denied") {
          console.log("Notifications denied");
          notificationPermission = "denied";
        }
      });
    }
  };

  const subscribe = createMutation({
    mutationFn: async ({
      userId,
      topic,
      subscription,
    }: {
      userId: string;
      topic: string;
      subscription: PushSubscription;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic, subscription, userId }),
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribedTopics"] });
    },
  });

  const handleSubscribe = async () => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("No userId found in localStorage");
      return;
    }
    const swRegistration = await navigator.serviceWorker.getRegistration();
    if (!swRegistration) {
      console.error("Service Worker not registered");
      return;
    }
    const subscription = await swRegistration?.pushManager.getSubscription();
    if (subscription) {
      console.log("Already subscribed:", subscription);
      $subscribe.mutate({
        topic: subscriptionTopic,
        subscription: subscription,
        userId: storedUserId,
      });
    } else {
      console.log("Not subscribed yet, subscribing now...");
      const newSubscription = await swRegistration?.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });
      console.log("New subscription:", newSubscription);
      $subscribe.mutate({
        topic: subscriptionTopic,
        subscription: newSubscription,
        userId: storedUserId,
      });
    }

    subscriptionTopic = "";
  };

  const notify = createMutation({
    mutationFn: async ({
      topic,
      userId,
    }: {
      topic: string;
      userId: string;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/sendNotification`,
        {
          method: "POST",
          body: JSON.stringify({ topic, userId }),
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });

  const handleNotify = () => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("No userId found in localStorage");
      return;
    }
    $notify.mutate({ topic: notificationTopic, userId: storedUserId });
  };

  const subscribedTopics = createQuery({
    queryKey: ["subscribedTopics"],
    queryFn: async () => {
      try {
        const storedUserId = localStorage.getItem("userId");
        if (!storedUserId) {
          console.error("No userId found in localStorage");
          return [];
        }
        const searchParams = new URLSearchParams({ userId: storedUserId });

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/subscriptions?${searchParams.toString()}`
        );
        return response.json();
      } catch (error) {
        console.error("Error getting subscribed topics: ", error);
      }
    },
    initialData: [],
  });
</script>

<main>
  {#if notificationPermission === null}
    <p>
      Notification permission is not supported in this browser. Users on iOS may
      need to add this site to their homescreen to be able to receive
      notifications. This can be done by clicking the share icon and scrolling
      down to the correct option.
    </p>
  {/if}

  {#if notificationPermission === "denied"}
    <p>This page requires notification to be enabled to work</p>
  {/if}

  <button
    hidden={notificationPermission !== "default"}
    onclick={requestNotificationPermission}>Allow notifications</button
  >

  {#if notificationPermission === "granted"}
    <h1>Welcome to the app!</h1>
    <p>This is a simple Svelte app.</p>

    <div>
      <input placeholder="Topic" bind:value={subscriptionTopic} />
      <button onclick={handleSubscribe}>Subscribe</button>
    </div>
    <h2>Subscribed topics:</h2>
    <ul>
      {#each $subscribedTopics.data.subscriptions as topic}
        <li>{topic}</li>
      {/each}
    </ul>
    <div>
      <input placeholder="Topic" bind:value={notificationTopic} />
      <button onclick={handleNotify}>Send notification on topic</button>
    </div>
  {/if}
</main>
