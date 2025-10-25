import StoryApi from "../api/story-api.js";
import StoryDb from "../utils/db.js";
import PushNotification from "../utils/push-notification.js";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const Home = {
  async render() {
    const userToken = localStorage.getItem("user-token");
    const isGuest = sessionStorage.getItem("guest") === "true";

    if (isGuest) {
      return `
        <div class="auth-prompt">
          <h1>Akses Terbatas untuk Tamu</h1>
          <p>Silakan <a href="#/login">login</a> atau <a href="#/register">register</a> untuk mengakses semua fitur.</p>
        </div>
      `;
    }

    if (!userToken) {
      return `
      <div class="home-header" style="display: none;">
        <h2>Jelajahi Cerita Pengguna</h2>
        <div class="search-container">
          <input type="text" id="search-input" placeholder="Cari cerita berdasarkan deskripsi atau nama...">
        </div>
        <div class="date-filter-container">
          <input type="date" id="start-date">
          <span>-</span>
          <input type="date" id="end-date">
        </div>
        <div id="notification-bar"></div>
      </div>
      <div id="home-content"></div>
      `;
    }

    return `
      <div class="home-header">
        <h2>Jelajahi Cerita Pengguna</h2>
        <div class="search-container">
          <input type="text" id="search-input" placeholder="Cari cerita berdasarkan deskripsi atau nama...">
        </div>
        <div class="date-filter-container">
          <input type="date" id="start-date">
          <span>-</span>
          <input type="date" id="end-date">
        </div>
        <div id="notification-bar"></div>
      </div>
      <div id="home-content"></div>
    `;
  },

  async afterRender() {
    const homeContentContainer = document.querySelector("#home-content");
    const userToken = localStorage.getItem("user-token");
    const isGuest = sessionStorage.getItem("guest") === "true";

    if (isGuest) {
      return;
    }

    if (!userToken) {
      homeContentContainer.innerHTML = `
        <div class="auth-prompt">
          <h2>Selamat Datang di Story App</h2>
          <p>Untuk melihat cerita dari pengguna lain, silakan login terlebih dahulu. Belum punya akun? Atau <a href="#/login">masuk sebagai tamu</a>.</p>
          <div class="auth-prompt__actions">
            <a href="#/login" class="form-button">Login</a>
            <a href="#/register" class="form-button form-button--secondary">Register</a>
          </div>
        </div>
      `;
      return;
    }

    PushNotification.init();
    this.renderNotificationButton();

    homeContentContainer.innerHTML = `
      <div id="map" style="height: 400px; width: 100%; margin-bottom: 2rem;"></div>
      <div id="loading-spinner" class="loading-spinner" style="display: none;"></div>
      <div id="stories-container" class="stories-list">
        <p>Memuat cerita...</p>
      </div>
      <div id="pagination-container" class="pagination"></div>
    `;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    const streetMap = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );
    const topoMap = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      }
    );

    const satelliteMap = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    );

    const baseLayers = {
      "Street View": streetMap,
      "Topographic View": topoMap,
      "Satellite View": satelliteMap,
    };

    const map = L.map("map", { layers: [streetMap] }).setView(
      [-2.548926, 118.0148634],
      5
    );
    L.control.layers(baseLayers).addTo(map);

    const storiesContainer = document.querySelector("#stories-container");
    const paginationContainer = document.querySelector("#pagination-container");
    const loadingSpinner = document.querySelector("#loading-spinner");
    let currentPage = 1;
    const storiesPerPage = 12;

    const fetchAllStories = async () => {
      let allStories = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const response = await StoryApi.getAllStories(page, 50);
          if (response.listStory.length > 0) {
            allStories = allStories.concat(response.listStory);
            page++;
          } else {
            hasMore = false;
          }
        } catch (error) {
          console.error("Error fetching all stories:", error);
          hasMore = false;
        }
      }
      return allStories;
    };

    let allStories = [];
    let currentFilteredStories = [];

    const setupPagination = () => {
      paginationContainer.innerHTML = "";
      const totalPages = Math.ceil(
        currentFilteredStories.length / storiesPerPage
      );

      if (totalPages <= 1) return;

      for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("pagination-button");
        if (i === currentPage) {
          pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => {
          currentPage = i;
          renderStoryList();
          setupPagination();
        });
        paginationContainer.appendChild(pageButton);
      }
    };

    const renderStoryList = () => {
      const markers = {};
      storiesContainer.innerHTML = "";

      const startIndex = (currentPage - 1) * storiesPerPage;
      const endIndex = currentPage * storiesPerPage;
      const paginatedStories = currentFilteredStories.slice(
        startIndex,
        endIndex
      );

      if (paginatedStories.length === 0) {
        storiesContainer.innerHTML =
          "<p>No stories found matching your criteria.</p>";
        return;
      }

      paginatedStories.forEach((story) => {
        const storyElement = document.createElement("div");
        storyElement.classList.add("story-card");
        storyElement.setAttribute("tabindex", "0");

        const formattedDate = new Date(story.createdAt).toLocaleDateString(
          "id-ID",
          { day: "numeric", month: "long", year: "numeric" }
        );

        storyElement.innerHTML = `
          <img src="${story.photoUrl}" alt="Cerita dari ${story.name}">
          <div class="story-card-body">
              <h3>${story.name}</h3>
              <small class="story-date">${formattedDate}</small>
              <p>${story.description}</p>
              <div class="story-card__actions">
                <a href="#/story/${story.id}" class="story-card__button">Lihat Detail</a>
                <button class="bookmark-button" data-story-id="${story.id}">Bookmark</button>
              </div>
          </div>
        `;

        const bookmarkButton = storyElement.querySelector(".bookmark-button");
        StoryDb.getBookmarkedStory(story.id).then((bookmarkedStory) => {
          if (bookmarkedStory) {
            bookmarkButton.textContent = "Bookmarked";
            bookmarkButton.classList.add("bookmarked");
          }
        });

        bookmarkButton.addEventListener("click", async (event) => {
          event.stopPropagation();
          const storyId = event.target.dataset.storyId;
          const isBookmarked = bookmarkButton.classList.contains("bookmarked");

          if (isBookmarked) {
            await StoryDb.deleteBookmarkedStory(storyId);
            bookmarkButton.textContent = "Bookmark";
            bookmarkButton.classList.remove("bookmarked");
          } else {
            const storyToBookmark = allStories.find((s) => s.id === storyId);
            if (storyToBookmark) {
              await StoryDb.bookmarkStory(storyToBookmark);
              bookmarkButton.textContent = "Bookmarked";
              bookmarkButton.classList.add("bookmarked");
            }
          }
        });

        if (story.lat && story.lon) {
          const marker = L.marker([story.lat, story.lon]).addTo(map);
          marker.bindPopup(
            `<div style="width: 150px;">
              <img src="${story.photoUrl}" alt="${
              story.name
            }" style="width: 100%; height: auto; object-fit: cover; margin-bottom: 5px;"/>
              <b>${story.name}</b><br>
              ${story.description.substring(0, 30)}...
            </div>`
          );
          markers[story.id] = marker;

          storyElement.addEventListener("click", (event) => {
            if (event.target.tagName.toLowerCase() !== "a") {
              map.flyTo([story.lat, story.lon], 12);
              marker.openPopup();
            }
          });
        }

        storyElement.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            window.location.hash = `#/story/${story.id}`;
          } else if (
            story.lat &&
            story.lon &&
            (event.key === "ArrowUp" || event.key === "ArrowDown")
          ) {
            event.preventDefault();
            map.flyTo([story.lat, story.lon], 12);
            markers[story.id].openPopup();
          }
        });
        storiesContainer.appendChild(storyElement);
      });
    };

    const updateStories = () => {
      const searchTerm = document.querySelector("#search-input").value;
      const startDate = document.querySelector("#start-date").value;
      const endDate = document.querySelector("#end-date").value;

      let filtered = allStories;

      if (searchTerm) {
        filtered = filtered.filter(
          (story) =>
            story.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            story.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (startDate && endDate) {
        filtered = filtered.filter((story) => {
          const storyDate = new Date(story.createdAt);
          return (
            storyDate >= new Date(startDate) && storyDate <= new Date(endDate)
          );
        });
      }

      currentFilteredStories = filtered;
      currentPage = 1;
      renderStoryList();
      setupPagination();
    };

    const fetchAndRenderStories = async () => {
      try {
        loadingSpinner.style.display = "block";
        allStories = await fetchAllStories();
        await StoryDb.putAllStories(allStories);
      } catch (error) {
        console.log("Failed to fetch from network, trying IndexedDB...");
        allStories = await StoryDb.getAllStories();
      } finally {
        loadingSpinner.style.display = "none";
        currentFilteredStories = allStories;
        renderStoryList();
        setupPagination();
      }
    };

    fetchAndRenderStories();

    const searchInput = document.querySelector("#search-input");
    const startDateInput = document.querySelector("#start-date");
    const endDateInput = document.querySelector("#end-date");

    searchInput.addEventListener("input", updateStories);
    startDateInput.addEventListener("change", updateStories);
    endDateInput.addEventListener("change", updateStories);
  },

  async renderNotificationButton() {
    const notificationBar = document.querySelector("#notification-bar");
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      notificationBar.innerHTML =
        '<button id="notification-toggle" class="form-button form-button--secondary">Nonaktifkan Notifikasi</button>';
      document
        .querySelector("#notification-toggle")
        .addEventListener("click", async () => {
          await PushNotification.unsubscribe();
          this.renderNotificationButton();
        });
    } else {
      notificationBar.innerHTML =
        '<button id="notification-toggle" class="form-button">Aktifkan Notifikasi</button>';
      document
        .querySelector("#notification-toggle")
        .addEventListener("click", async () => {
          await PushNotification.subscribe();
          this.renderNotificationButton();
        });
    }
  },
};

export default Home;
