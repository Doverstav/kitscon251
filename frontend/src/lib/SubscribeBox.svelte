<script lang="ts">
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";

  const queryClient = useQueryClient();

  let subscriptionTopic = $state("");

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
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, subscription, userId }),
      });
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
      $subscribe.mutate({
        topic: subscriptionTopic,
        subscription: subscription,
        userId: storedUserId,
      });
    } else {
      const newSubscription = await swRegistration?.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      $subscribe.mutate({
        topic: subscriptionTopic,
        subscription: newSubscription,
        userId: storedUserId,
      });
    }

    subscriptionTopic = "";
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubscribe();
    }
  };
</script>

<h2>Subscribe to topic</h2>
<div>
  <input
    placeholder="Topic"
    bind:value={subscriptionTopic}
    onkeydown={handleKeydown}
  />
  <button class="primary" onclick={handleSubscribe}>Subscribe</button>
</div>

<style>
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    row-gap: 10px;
  }

  input {
    flex: 1;
    margin-right: 10px;
  }
</style>
