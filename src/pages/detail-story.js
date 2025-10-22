import StoryApi from '../api/story-api.js';
import UrlParser from '../utils/url-parser.js';

const DetailStory = {
    async render() {
        return `
      <div id="story-detail-container" class="story-detail">
        <p>Memuat detail cerita...</p>
      </div>
    `;
    },

    async afterRender() {
        const url = UrlParser.parseActiveUrlWithoutCombiner();
        const storyContainer = document.querySelector('#story-detail-container');

        try {
            const response = await StoryApi.getStoryDetail(url.id);
            const story = response.story;

            const formattedDate = new Date(story.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
            });

            storyContainer.innerHTML = `
        <img src="${story.photoUrl}" alt="Cerita dari ${story.name}" class="story-detail__image">
        <div class="story-detail__content">
          <h2 class="story-detail__name">${story.name}</h2>
          <small class="story-detail__date">Dibuat pada ${formattedDate}</small>
          <p class="story-detail__description">${story.description}</p>
        </div>
      `;
        } catch (error) {
            // --- PERUBAHAN DI SINI ---
            console.error(error); // Tetap tampilkan error teknis di console untuk developer
            storyContainer.innerHTML = `
        <div class="story-not-found">
          <h2>Oops! Cerita Tidak Ditemukan</h2>
          <p>Maaf, detail untuk cerita ini tidak tersedia atau mungkin telah dihapus.</p>
          <a href="#/" class="form-button">Kembali ke Beranda</a>
        </div>
      `;
        }
    },
};

export default DetailStory;