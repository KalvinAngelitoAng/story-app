self.addEventListener("push", (event) => {
  const notificationData = event.data.json();
  const title = notificationData.title || "Story App";
  // Gunakan scope SW sebagai base path agar cocok dengan GitHub Pages project path
  const scopePath = new URL(self.registration.scope).pathname; // contoh: '/story-app/'
  const defaultIcon = `${scopePath}icons/icon-192x192.png`;

  const options = {
    body: notificationData.body || "Ada cerita baru untukmu!",
    icon: notificationData.icon || defaultIcon,
    badge: defaultIcon,
    actions: [
      {
        action: "explore-action",
        title: "Lihat Cerita",
      },
    ],
    data: {
      // Default ke hash-root agar sesuai dengan router aplikasi
      url: notificationData.url || "#/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "#/";

  // Bangun URL absolut yang selalu berada di dalam scope SW (mis. '/story-app/')
  const scope = self.registration.scope; // contoh: 'https://kalvinangelitoang.github.io/story-app/'
  let fullUrl;
  if (/^https?:\/\//.test(urlToOpen)) {
    fullUrl = urlToOpen;
  } else if (urlToOpen.startsWith("#")) {
    fullUrl = scope + urlToOpen; // hasil: '.../story-app/#/...'
  } else if (urlToOpen.startsWith("/")) {
    fullUrl = scope + urlToOpen.slice(1);
  } else {
    fullUrl = scope + urlToOpen;
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // Cek apakah sudah ada tab dengan origin yang sama
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(fullUrl);

          if (clientUrl.origin === targetUrl.origin && "focus" in client) {
            // Navigasi ke URL target dan fokuskan tab
            return client.focus().then(() => {
              if ("navigate" in client) {
                return client.navigate(fullUrl);
              } else {
                // Fallback: kirim pesan ke client untuk melakukan navigasi
                client.postMessage({
                  type: "NAVIGATE",
                  url: fullUrl,
                });
              }
            });
          }
        }
        // Jika belum ada tab, buka yang baru
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
      .catch((error) => {
        console.error("Error handling notification click:", error);
        // Fallback: tetap coba membuka window
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});
