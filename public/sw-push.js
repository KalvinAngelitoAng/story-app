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

  const urlToOpen = event.notification.data?.url || '/story-app/';
  const baseUrl = self.location.origin;
  const fullUrl = urlToOpen.startsWith('http') ? urlToOpen : `${baseUrl}${urlToOpen}`;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((windowClients) => {
      // Check if there's already a tab open with the same origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(fullUrl);
        
        if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
          // Navigate to the target URL and focus the tab
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(fullUrl);
            } else {
              // Fallback: send message to client to navigate
              client.postMessage({
                type: 'NAVIGATE',
                url: targetUrl.pathname + targetUrl.hash
              });
            }
          });
        }
      }
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    }).catch((error) => {
      console.error('Error handling notification click:', error);
      // Fallback: try to open window anyway
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
