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
    "Notification" in window ? Notification.permission : undefined
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
      topic,
      subscription,
    }: {
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
          body: JSON.stringify({ topic, subscription }),
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
      });
    }

    subscriptionTopic = "";
  };

  const notify = createMutation({
    mutationFn: async (topic: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/sendNotification`,
        {
          method: "POST",
          body: JSON.stringify({ topic }),
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });

  const handleNotify = () => {
    $notify.mutate(notificationTopic);
  };

  const subscribedTopics = createQuery({
    queryKey: ["subscribedTopics"],
    queryFn: async () => {
      try {
        const swRegistration = await navigator.serviceWorker.getRegistration();
        const subscription =
          await swRegistration?.pushManager.getSubscription();
        const endpoint = subscription?.endpoint;
        if (!endpoint) {
          console.error("No subscription found");
          return;
        }
        const searchParams = new URLSearchParams({ endpoint });

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/subscriptions?${searchParams.toString()}`
        );
        return response.json();
      } catch (error) {
        console.error("Error getting subscription:", error);
      }
    },
    initialData: [],
  });
</script>

<main>
  {#if notificationPermission === "denied"}
    This page requires notification to be enabled to work
  {/if}

  <button
    hidden={notificationPermission === "granted"}
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
