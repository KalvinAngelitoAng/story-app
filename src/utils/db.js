import { openDB } from "idb";

const DB_NAME = "story-app-db";
const STORIES_STORE_NAME = "stories";
const BOOKMARKS_STORE_NAME = "bookmarked-stories";
const VERSION = 2; // Increment version to trigger upgrade

const dbPromise = openDB(DB_NAME, VERSION, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains(STORIES_STORE_NAME)) {
      db.createObjectStore(STORIES_STORE_NAME, { keyPath: "id" });
    }
    if (oldVersion < 2) {
      if (!db.objectStoreNames.contains(BOOKMARKS_STORE_NAME)) {
        db.createObjectStore(BOOKMARKS_STORE_NAME, { keyPath: "id" });
      }
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
    return (await dbPromise).getAll(STORIES_STORE_NAME);
  },

  async putStory(story) {
    if (!story) return;
    if (story.photoUrl) {
      story.photoUrl = cleanUrl(story.photoUrl);
    }
    return (await dbPromise).put(STORIES_STORE_NAME, story);
  },

  async putAllStories(stories) {
    if (!stories || stories.length === 0) return;
    const tx = (await dbPromise).transaction(STORIES_STORE_NAME, "readwrite");
    const store = tx.objectStore(STORIES_STORE_NAME);
    for (const story of stories) {
      if (story.photoUrl) {
        story.photoUrl = cleanUrl(story.photoUrl);
      }
      store.put(story);
    }
    return tx.done;
  },

  // Bookmark functions
  async getAllBookmarkedStories() {
    return (await dbPromise).getAll(BOOKMARKS_STORE_NAME);
  },

  async getBookmarkedStory(id) {
    return (await dbPromise).get(BOOKMARKS_STORE_NAME, id);
  },

  async bookmarkStory(story) {
    if (!story) return;
    return (await dbPromise).put(BOOKMARKS_STORE_NAME, story);
  },

  async deleteBookmarkedStory(id) {
    return (await dbPromise).delete(BOOKMARKS_STORE_NAME, id);
  },
};

export default StoryDb;
