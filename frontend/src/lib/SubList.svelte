<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import SubListItem from "./SubListItem.svelte";
  import { slide } from "svelte/transition";

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
    <li transition:slide>
      <SubListItem {topic} />
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    transition:
      background-color 0.3s ease,
      border-radius 0.3s ease;
    padding: 0.5rem;
    border-width: 0 1px 0 1px;
    border-style: solid;
    border-color: light-dark(#213547, rgba(255, 255, 255, 0.87));
  }
  li:first-child {
    border-radius: 8px 8px 0 0;
    border-width: 1px 1px 0 1px;
  }
  li:last-child {
    border-radius: 0 0 8px 8px;
    border-width: 0 1px 1px 1px;
  }
  li:only-child {
    border-radius: 8px;
    border-width: 1px;
  }
  li:nth-child(even) {
    background-color: light-dark(#ffffff, #7e5869);
  }
  li:nth-child(odd) {
    background-color: light-dark(#f2f2ee, #5e8686);
  }
</style>
