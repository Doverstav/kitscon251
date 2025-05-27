<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import SubListItem from "./SubListItem.svelte";

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

<h2>Subscribed topics:</h2>
{#if !$subscribedTopics.data.subscriptions || $subscribedTopics.data.subscriptions.length === 0}
  <p>No subscriptions found</p>
{/if}
<ul>
  {#each $subscribedTopics.data.subscriptions as topic (topic)}
    <li>
      <SubListItem {topic} />
    </li>
  {/each}
</ul>
