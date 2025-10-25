import StoryDb from '../utils/db.js';

const Bookmarks = {
  async render() {
    return `
      <div class="content">
        <h2 class="content__heading">Bookmarked Stories</h2>
        <div id="bookmarked-stories" class="stories-list"></div>
      </div>
    `;
  },

  async afterRender() {
    const storiesContainer = document.querySelector('#bookmarked-stories');
    const stories = await StoryDb.getAllBookmarkedStories();

    if (stories.length === 0) {
      storiesContainer.innerHTML = '<p>You have no bookmarked stories.</p>';
      return;
    }

    stories.forEach(story => {
      const storyElement = document.createElement('div');
      storyElement.classList.add('story-card');
      storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="Story from ${story.name}">
        <div class="story-card-body">
            <h3>${story.name}</h3>
            <small class="story-date">${new Date(story.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
            <p>${story.description}</p>
            <div class="story-card__actions">
                <a href="#/story/${story.id}" class="story-card__button">Lihat Detail</a>
                <button class="remove-bookmark-button" data-story-id="${story.id}">Hapus Bookmark</button>
            </div>
        </div>
      `;
      storiesContainer.appendChild(storyElement);
    });

    storiesContainer.addEventListener('click', async (event) => {
      if (event.target.classList.contains('remove-bookmark-button')) {
        const storyId = event.target.dataset.storyId;
        await StoryDb.deleteBookmarkedStory(storyId);
        this.afterRender(); // Re-render the list
      }
    });
  },
};

export default Bookmarks;