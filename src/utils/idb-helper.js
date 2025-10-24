import { openDB } from 'idb';

const DB_NAME = 'story-app-database';
const STORE_NAME = 'pending-stories';
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
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

export default IdbHelper;
