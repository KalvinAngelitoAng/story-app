import Notification from "../components/notification.js";
import StoryApi from "../api/story-api.js";

const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

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

      // Check if user is already subscribed
      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("User is already subscribed, updating server subscription");
        try {
          await StoryApi.subscribeNotification(existingSubscription);
          Notification.show({ message: "Notifikasi sudah aktif." });
        } catch (error) {
          console.error("Failed to update subscription on server:", error);
          Notification.show({
            message: "Notifikasi sudah aktif, tapi gagal memperbarui server.",
            type: "warning",
          });
        }
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("User is subscribed:", subscription);

      // Send subscription object to API Story
      try {
        await StoryApi.subscribeNotification(subscription);
        Notification.show({ message: "Anda telah berlangganan notifikasi." });
      } catch (error) {
        console.error("Failed to save subscription to server:", error);
        // If server fails, unsubscribe locally to maintain consistency
        await subscription.unsubscribe();
        Notification.show({
          message: "Gagal berlangganan notifikasi. Silakan coba lagi.",
          type: "error",
        });
        throw error;
      }

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe the user: ", error);
      if (Notification.permission === "denied") {
        console.warn("Permission for notifications was denied");
        Notification.show({
          message: "Izin notifikasi ditolak. Aktifkan di pengaturan browser.",
          type: "error",
        });
      } else {
        Notification.show({
          message: "Gagal berlangganan notifikasi. Silakan coba lagi.",
          type: "error",
        });
      }
      throw error;
    }
  },

  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Hapus subscription dari API Story terlebih dahulu
        try {
          await StoryApi.unsubscribeNotification(subscription.endpoint);
        } catch (error) {
          console.error("Failed to remove subscription from server:", error);
        }

        await subscription.unsubscribe();
        console.log("User is unsubscribed");
        Notification.show({
          message: "Anda telah berhenti berlangganan notifikasi.",
        });
        return true;
      }
    } catch (error) {
      console.error("Error unsubscribing", error);
    }
  },
};

export default PushNotification;
