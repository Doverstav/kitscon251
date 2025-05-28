<script lang="ts">
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";

  let { topic }: { topic: string } = $props();

  const queryClient = useQueryClient();

  let message = $state("");

  const unsubscribe = createMutation({
    mutationFn: async ({
      userId,
      topic,
    }: {
      userId: string;
      topic: string;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/unsubscribe`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic, userId }),
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

  const handleUnsubscribe = () => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("No userId found in localStorage");
      return;
    }
    $unsubscribe.mutate({ topic, userId: storedUserId });
  };

  const notify = createMutation({
    mutationFn: async ({
      topic,
      message,
      userId,
    }: {
      topic: string;
      message: string;
      userId: string;
    }) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/sendNotification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic, message, userId }),
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
    $notify.mutate({ topic, message, userId: storedUserId });

    message = ""; // Clear the message input after sending
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault(); // Prevents the default newline behavior
      handleNotify(); // Calls the notify function
    }
  };
</script>

<div class="subbox-header">
  <h3>{topic}</h3>
  <button onclick={handleUnsubscribe}>Unsubscribe</button>
</div>
<div class="subbox-body">
  <textarea
    class="message-input"
    bind:value={message}
    onkeydown={handleKeydown}
    placeholder="Message"
    rows="3"
  ></textarea>
  <button class="primary" onclick={handleNotify}
    >Message other subscribers</button
  >
</div>

<style>
  .subbox-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .subbox-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    row-gap: 10px;
    align-items: center;
    margin-bottom: 10px;
  }

  .message-input {
    width: 100%;
    resize: vertical;
  }
</style>
