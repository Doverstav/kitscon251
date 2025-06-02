<script lang="ts">
  import SubList from "./SubList.svelte";
  import SubscribeBox from "./SubscribeBox.svelte";

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
    <h1>KitsCon 25.1</h1>
    <p>
      This is a simple demo showcasing <a
        href="https://developer.mozilla.org/en-US/docs/Web/API/Push_API/Best_Practices#overview_of_web_push_notifications"
        >web push notifications</a
      >.
    </p>
    <p>
      Subscribe to any topics you want and send a message to any other
      subscribers on a topic! If you don't see a notification after recently
      subscribing, you may need to wait a short while as the backend storage is
      eventually consistent, so changes may need to propagate. If you don't want
      to receive any more notifications, unsubscribe from a topic alternatively
      block notifications on this site completely in your browser. Your
      subscriptions will also be automatically deleted 24 hours after the last
      update.
    </p>

    <SubscribeBox />
    <SubList />
  {/if}
</main>

<style>
  p {
    max-width: 500px;
    text-align: left;
  }
</style>
