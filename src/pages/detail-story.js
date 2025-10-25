import StoryApi from "../api/story-api.js";

const DetailStory = {
  async render() {
    return `
      <div class="loading-spinner" style="display: none;"></div>
      <div id="story-detail-container">
        <p>Memuat detail cerita...</p>
      </div>
    `;
  },

  async afterRender() {
    const storyId = window.location.hash.split("/")[2];
    const storyContainer = document.querySelector("#story-detail-container");
    const loadingSpinner = document.querySelector(".loading-spinner");

    if (!storyId) {
      storyContainer.innerHTML = "<p>ID Cerita tidak ditemukan.</p>";
      return;
    }

    loadingSpinner.style.display = 'block';
    storyContainer.style.display = 'none';

    try {
      const response = await StoryApi.getStoryDetail(storyId);
      const story = response.story;

      const formattedDate = new Date(story.createdAt).toLocaleDateString(
        "id-ID",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

      storyContainer.innerHTML = `
        <div class="story-detail-card">
            <img src="${story.photoUrl}" alt="Foto dari ${story.name}" class="story-detail__image">
            <div class="story-detail__content">
                <h2 class="story-detail__name">${story.name}</h2>
                <p class="story-detail__date">Dibuat pada: ${formattedDate}</p>
                <p class="story-detail__description">${story.description}</p>
            </div>
        </div>
      `;
    } catch (error) {
      console.error(error);
      storyContainer.innerHTML = `
        <div class="story-not-found">
          <h2>Oops! Cerita Tidak Ditemukan</h2>
          <p>Maaf, detail untuk cerita ini tidak tersedia atau mungkin telah dihapus.</p>
          <a href="#/" class="form-button">Kembali ke Beranda</a>
        </div>
      `;
    } finally {
      loadingSpinner.style.display = 'none';
      storyContainer.style.display = 'block';
    }
  },
};

export default DetailStory;

