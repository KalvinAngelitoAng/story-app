self.addEventListener('push', (event) => {
  const notificationData = event.data.json();
  const title = notificationData.title || 'Story App';
  const options = {
    body: notificationData.body || 'Ada cerita baru untukmu!',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    actions: [
      {
        action: 'explore-action',
        title: 'Lihat Cerita',
      },
    ],
    data: {
      url: notificationData.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((windowClients) => {
      // Cek apakah ada tab yang sudah terbuka dengan URL yang sama
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak ada, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
