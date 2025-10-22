import StoryApi from '../api/story-api.js';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const Home = {
    async render() {
        return `
      <h2>Jelajahi Cerita Pengguna</h2>
      <div id="home-content"></div> 
    `;
    },

    async afterRender() {
        const homeContentContainer = document.querySelector('#home-content');
        const userToken = localStorage.getItem('user-token');

        if (!userToken) {
            // --- KONDISI JIKA PENGGUNA BELUM LOGIN ---
            homeContentContainer.innerHTML = `
        <div class="auth-prompt">
          <h2>Anda Belum Login</h2>
          <p>Untuk melihat cerita dari pengguna lain, silakan login terlebih dahulu. Belum punya akun?</p>
          <div class="auth-prompt__actions">
            <a href="#/login" class="form-button">Login</a>
            <a href="#/register" class="form-button form-button--secondary">Register</a>
          </div>
        </div>
      `;
            return; // Hentikan eksekusi fungsi di sini
        }

        // --- KONDISI JIKA PENGGUNA SUDAH LOGIN (Kode yang sudah ada) ---
        homeContentContainer.innerHTML = `
      <div id="map" style="height: 400px; width: 100%; margin-bottom: 2rem;"></div>
      <div id="stories-container" class="stories-list">
        <p>Memuat cerita...</p>
      </div>
    `;

        // Perbaiki path ikon default Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl: markerIcon,
            iconRetinaUrl: markerIcon2x,
            shadowUrl: markerShadow,
        });

        const map = L.map('map').setView([-2.548926, 118.0148634], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const storiesContainer = document.querySelector('#stories-container');
        try {
            const response = await StoryApi.getAllStories();
            const stories = response.listStory;

            storiesContainer.innerHTML = '';
            if (stories.length === 0) {
                storiesContainer.innerHTML = '<p>Belum ada cerita yang dipublikasikan.</p>';
                return;
            }

            stories.forEach((story) => {
                const storyElement = document.createElement('div');
                storyElement.classList.add('story-card');

                // 1. Membuat elemen bisa di-fokus oleh keyboard
                storyElement.setAttribute('tabindex', '0');

                const formattedDate = new Date(story.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                });

                storyElement.innerHTML = `
                    <img src="${story.photoUrl}" alt="Cerita dari ${story.name}">
                    <div class="story-card-body">
                        <h3>${story.name}</h3>
                        <small class="story-date">${formattedDate}</small>
                        <p>${story.description}</p>
                    </div>
                    `;

                // 2. Menambahkan event untuk klik dan tombol Enter
                const handleCardClick = () => {
                    window.location.hash = `#/story/${story.id}`;
                };

                storyElement.addEventListener('click', handleCardClick);
                storyElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        handleCardClick();
                    }
                });

                storiesContainer.appendChild(storyElement);

                // Tambahkan Marker ke Peta jika ada lokasi
                if (story.lat && story.lon) {
                    const marker = L.marker([story.lat, story.lon]).addTo(map);
                    marker.bindPopup(`
                        <div style="width: 150px;">
                        <img src="${story.photoUrl}" alt="${story.name}" style="width: 100%; height: auto; object-fit: cover;"/>
                        <b>${story.name}</b><br>
                        ${story.description.substring(0, 30)}...
                        </div>
                    `);
                }
            });

        } catch (error) {
            // Blok catch ini sekarang hanya akan menangani error untuk pengguna yang sudah login
            storiesContainer.innerHTML = `<p>Error: Gagal memuat cerita. Coba refresh halaman.</p>`;
        }
    },
};

export default Home;