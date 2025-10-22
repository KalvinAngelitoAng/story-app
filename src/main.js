import 'leaflet/dist/leaflet.css';
import './styles/main.css';
import App from './views/app.js';
import StoryApi from './api/story-api.js';

// --- Fungsi untuk memperbarui Navigasi ---
const updateNavigation = () => {
    const userToken = localStorage.getItem('user-token');
    const loginNav = document.querySelector('#login-nav');
    const registerNav = document.querySelector('#register-nav');
    const addStoryNav = document.querySelector('#add-story-nav');
    const logoutNav = document.querySelector('#logout-nav');

    if (userToken) {
        loginNav.style.display = 'none';
        registerNav.style.display = 'none';
        addStoryNav.style.display = 'inline';
        logoutNav.style.display = 'inline';
    } else {
        loginNav.style.display = 'inline';
        registerNav.style.display = 'inline';
        addStoryNav.style.display = 'none';
        logoutNav.style.display = 'none';
    }
};

// --- Inisialisasi Aplikasi ---
const app = new App({
    content: document.querySelector('#main-content'),
});

// --- Event Listener Utama ---
window.addEventListener('hashchange', () => {
    app.renderPage();
    updateNavigation(); // Update nav setiap pindah halaman
});

window.addEventListener('load', () => {
    app.renderPage();
    updateNavigation(); // Update nav saat pertama kali buka

    // --- Logika Logout ---
    const logoutNav = document.querySelector('#logout-nav');
    logoutNav.addEventListener('click', (event) => {
        event.preventDefault();
        StoryApi.logout();
        updateNavigation();
        window.location.hash = '#/login';
        alert('Anda telah logout.');
    });

    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('#main-content');

    skipLink.addEventListener('click', (event) => {
        event.preventDefault(); // Mencegah URL hash berubah
        mainContent.focus(); // Pindahkan fokus ke elemen main
    });
});