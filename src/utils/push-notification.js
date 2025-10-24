import Notification from "../components/notification.js";

const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"; // Ganti dengan VAPID public key Anda

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PushNotification = {
  async init() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging is not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log("User is already subscribed.");
        // Di sini Anda bisa memperbarui status UI jika diperlukan
        return;
      }

      // Jika belum subscribe, kita akan siapkan proses subscribe
      // yang akan dipicu oleh interaksi pengguna (misalnya, klik tombol)
    } catch (error) {
      console.error("Error during push notification initialization:", error);
    }
  },

  async subscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("User is subscribed:", subscription);
      Notification.show({ message: "Anda telah berlangganan notifikasi." });
      // Kirim subscription object ke server Anda untuk disimpan
      // await YourApi.saveSubscription(subscription);

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe the user: ", error);
      if (Notification.permission === "denied") {
        console.warn("Permission for notifications was denied");
        // Di sini Anda bisa menonaktifkan tombol subscribe
      }
    }
  },

  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("User is unsubscribed.");
        Notification.show({
          message: "Anda telah berhenti berlangganan notifikasi.",
        });
        // Kirim pemberitahuan ke server Anda untuk menghapus subscription
        // await YourApi.deleteSubscription(subscription.endpoint);
        return true;
      }
    } catch (error) {
      console.error("Error unsubscribing", error);
    }
  },
};

export default PushNotification;
