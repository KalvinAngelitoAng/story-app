importScripts('https://cdn.jsdelivr.net/npm/idb@8/build/umd.js');

const DB_NAME = 'story-app-database';
const STORE_NAME = 'pending-stories';
const DB_VERSION = 2; // Versi dinaikkan

let authToken = null; // Variabel untuk menyimpan token
let tokenPromise = null; // Promise untuk menunggu token

// Fungsi untuk meminta token dari client
const requestTokenFromClient = () => {
  if (tokenPromise) return tokenPromise;

  tokenPromise = new Promise((resolve, reject) => {
    const channel = new MessageChannel();

    channel.port1.onmessage = (event) => {
      if (event.data && event.data.type === 'TOKEN_RESPONSE') {
        authToken = event.data.token;
        console.log('Service Worker received token via request:', authToken ? 'Token received' : 'Token is null');
        resolve(authToken);
      } else {
        reject('No token received');
      }
      channel.port1.close();
    };

    self.clients.matchAll().then(clients => {
      if (clients && clients.length) {
        // Kirim pesan ke client yang paling baru aktif
        clients[0].postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
      } else {
        reject('No clients available to request token from.');
      }
    });

    // Timeout jika tidak ada respons dari client
    setTimeout(() => reject('Token request timed out'), 5000);
  });

  return tokenPromise;
};

// Listener untuk menerima token dari main thread (saat inisialisasi)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_TOKEN') {
    authToken = event.data.token;
    console.log('Service Worker received token:', authToken ? 'Token received' : 'Token is null');
  }
});

const dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  },
});

const IdbHelper = {
  async getAll() {
    return (await dbPromise).getAll(STORE_NAME);
  },
  async put(story) {
    return (await dbPromise).put(STORE_NAME, story);
  },
  async delete(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },
};

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-stories') {
    console.log('Syncing new stories...');
    event.waitUntil(syncNewStories());
  }
});

async function syncNewStories() {
  // Coba dapatkan token jika belum ada
  if (!authToken) {
    try {
      console.log('Token not found, requesting from client...');
      await requestTokenFromClient();
    } catch (error) {
      console.error('Failed to get token from client:', error);
      // Tidak bisa melanjutkan tanpa token
      return;
    }
  }

  const pendingStories = await IdbHelper.getAll();
  for (const story of pendingStories) {
    try {
      const formData = new FormData();
      formData.append('description', story.description);
      formData.append('photo', story.photo);
      if (story.lat) formData.append('lat', story.lat);
      if (story.lon) formData.append('lon', story.lon);

      if (!authToken) {
        console.error('Authentication token is not available. Skipping sync.');
        // Mungkin kirim notifikasi ke user bahwa perlu login ulang
        self.registration.showNotification('Sinkronisasi Gagal', {
          body: 'Token otentikasi tidak ditemukan. Silakan login kembali.',
          icon: '/icons/icon-192x192.png',
        });
        continue; // Lanjut ke cerita berikutnya
      }

      const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      await IdbHelper.delete(story.id);

      self.registration.showNotification('Cerita Berhasil Diunggah', {
        body: `Cerita "${story.description.substring(0, 30)}..." berhasil diunggah.`,
        icon: '/icons/icon-192x192.png',
      });

    } catch (error) {
      console.error('Failed to sync story:', error);
    }
  }
}
