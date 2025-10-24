import { openDB } from "idb";

const DB_NAME = "story-app-db";
const STORE_NAME = "stories";
const VERSION = 1;

const dbPromise = openDB(DB_NAME, VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  },
});

const cleanUrl = (url) => {
  if (typeof url !== "string") return url;
  const match = url.match(/https?:\/\/[^\s`'"]+/);
  return match ? match[0] : url;
};

const StoryDb = {
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },

  async putStory(story) {
    if (!story) return;
    if (story.photoUrl) {
      story.photoUrl = cleanUrl(story.photoUrl);
    }
    return (await dbPromise).put(STORE_NAME, story);
  },

  async putAllStories(stories) {
    if (!stories || stories.length === 0) return;
    const tx = (await dbPromise).transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const story of stories) {
      if (story.photoUrl) {
        story.photoUrl = cleanUrl(story.photoUrl);
      }
      store.put(story);
    }
    return tx.done;
  },
};

export default StoryDb;
