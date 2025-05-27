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
    <h1>Welcome to the app!</h1>
    <p>This is a simple Svelte app.</p>

    <SubscribeBox />
    <SubList />
  {/if}
</main>
