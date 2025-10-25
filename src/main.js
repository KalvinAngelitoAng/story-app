import "leaflet/dist/leaflet.css";
import "./styles/main.css";
import "./styles/notification.css";
import App from "./views/app.js";
import StoryApi from "./api/story-api.js";
import { registerSW } from "virtual:pwa-register";
import Notification from "./components/notification.js";


const sendTokenToSW = (token) => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SET_TOKEN",
      token: token,
    });
  }
};


const updateNavigation = () => {
    const bookmarksNav = document.querySelector("#bookmarks-nav");
    const addStoryNav = document.querySelector("#add-story-nav");
    const registerNav = document.querySelector("#register-nav");
    const loginNav = document.querySelector("#login-nav");
    const logoutNav = document.querySelector("#logout-nav");

    const token = localStorage.getItem("user-token");

    if (token) {
      bookmarksNav.style.display = "inline";
      addStoryNav.style.display = "inline";
      registerNav.style.display = "none";
      loginNav.style.display = "none";
      logoutNav.style.display = "inline";
    } else {
      bookmarksNav.style.display = "none";
      addStoryNav.style.display = "none";
      registerNav.style.display = "inline";
      loginNav.style.display = "inline";
      logoutNav.style.display = "none";
    }

    // Setup mobile menu toggle
    const menuToggle = document.querySelector('#menu-toggle');
    const navLinks = document.querySelector('#nav-links');
    const navbar = document.querySelector('.navbar');

    const closeMenu = () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    };

    if (menuToggle && navLinks && !menuToggle.__bound) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });
      menuToggle.__bound = true;
    }

    // Close when clicking a nav link
    if (navLinks && !navLinks.__boundLinks) {
      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          closeMenu();
        });
      });
      navLinks.__boundLinks = true;
    }

    // Close when clicking outside navbar
    if (!document.__navOutsideBound && navbar) {
      document.addEventListener('click', (e) => {
        const isOpen = navLinks && navLinks.classList.contains('open');
        if (!isOpen) return;
        const clickedInside = navbar.contains(e.target);
        if (!clickedInside) {
          closeMenu();
        }
      });
      document.__navOutsideBound = true;
    }
  };


const app = new App({
  content: document.querySelector("#main-content"),
});


window.addEventListener("hashchange", () => {
  app.renderPage();
  updateNavigation();
});

window.addEventListener("load", () => {
  app.renderPage();
  updateNavigation();

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
    } else if (event.data && event.data.type === "NAVIGATE") {
      // Handle navigation from service worker (notification clicks)
      const targetUrl = event.data.url;
      if (targetUrl && targetUrl !== window.location.pathname + window.location.hash) {
        window.location.href = targetUrl;
      }
    }
  });
});
