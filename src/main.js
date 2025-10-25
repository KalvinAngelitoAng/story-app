import "leaflet/dist/leaflet.css";
import "./styles/main.css";
import "./styles/notification.css";
import App from "./views/app.js";
import StoryApi from "./api/story-api.js";
import { registerSW } from "virtual:pwa-register";
import Notification from "./components/notification.js";

// --- Fungsi untuk mengirim token ke Service Worker ---
const sendTokenToSW = (token) => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SET_TOKEN",
      token: token,
    });
  }
};

// --- Fungsi untuk memperbarui Navigasi ---
const updateNavigation = () => {
  const userToken = localStorage.getItem("user-token");
  const loginNav = document.querySelector("#login-nav");
  const registerNav = document.querySelector("#register-nav");
  const addStoryNav = document.querySelector("#add-story-nav");
  const bookmarksNav = document.querySelector("#bookmarks-nav");
  const logoutNav = document.querySelector("#logout-nav");

  if (userToken) {
    loginNav.style.display = "none";
    registerNav.style.display = "none";
    addStoryNav.style.display = "inline";
    bookmarksNav.style.display = "inline";
    logoutNav.style.display = "inline";
  } else {
    loginNav.style.display = "inline";
    registerNav.style.display = "inline";
    addStoryNav.style.display = "none";
    bookmarksNav.style.display = "none";
    logoutNav.style.display = "none";
  }
};

// --- Inisialisasi Aplikasi ---
const app = new App({
  content: document.querySelector("#main-content"),
});

// --- Event Listener Utama ---
window.addEventListener("hashchange", () => {
  app.renderPage();
  updateNavigation(); // Update nav setiap pindah halaman
});

window.addEventListener("load", () => {
  app.renderPage();
  updateNavigation(); // Update nav saat pertama kali buka

  const updateSW = registerSW({
    onNeedRefresh() {
      const r = confirm("Pembaruan tersedia. Muat ulang?");
      if (r) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log("Aplikasi siap bekerja offline.");
      // Kirim token saat SW siap
      const userToken = localStorage.getItem("user-token");
      if (userToken) {
        sendTokenToSW(userToken);
      }
    },
  });

  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("`beforeinstallprompt` event was fired.");
  });

  // --- Logika Logout ---
  const logoutNav = document.querySelector("#logout-nav");
  logoutNav.addEventListener("click", (event) => {
    event.preventDefault();
    StoryApi.logout();
    updateNavigation();
    window.location.hash = "#/login";
    Notification.show({ message: "Anda telah logout." });

    // Kirim pesan null token saat logout
    sendTokenToSW(null);
  });

  // --- Logika Skip to Content ---
  const skipLink = document.querySelector(".skip-link");
  const mainContent = document.querySelector("#main-content");

  skipLink.addEventListener("click", (event) => {
    event.preventDefault(); // Mencegah URL hash berubah
    mainContent.focus(); // Pindahkan fokus ke elemen main
  });

  // Listener untuk permintaan token dari Service Worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "GET_TOKEN") {
      const token = localStorage.getItem("user-token");
      console.log(
        "Client sending token to SW:",
        token ? "Token sent" : "Token is null"
      );
      event.ports[0].postMessage({ type: "TOKEN_RESPONSE", token: token });
    }
  });
});
