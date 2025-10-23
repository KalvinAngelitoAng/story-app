import StoryApi from "../api/story-api.js";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const Home = {
  async render() {
    return `
      <h2>Jelajahi Cerita Pengguna</h2>
      <div id="home-content"></div>
    `;
  },

  async afterRender() {
    const homeContentContainer = document.querySelector("#home-content");
    const userToken = localStorage.getItem("user-token");

    if (!userToken) {
      homeContentContainer.innerHTML = `
        <div class="auth-prompt">
          <h2>Selamat Datang di Story App</h2>
          <p>Untuk melihat cerita dari pengguna lain, silakan login terlebih dahulu. Belum punya akun?</p>
          <div class="auth-prompt__actions">
            <a href="#/login" class="form-button">Login</a>
            <a href="#/register" class="form-button form-button--secondary">Register</a>
          </div>
        </div>
      `;
      return;
    }

    homeContentContainer.innerHTML = `
      <div id="map" style="height: 400px; width: 100%; margin-bottom: 2rem;"></div>
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
    let currentPage = 1;
    const storiesPerPage = 12;

    const renderStories = async (page) => {
      try {
        const response = await StoryApi.getAllStories(page, storiesPerPage);
        const stories = response.listStory;
        const markers = {};

        storiesContainer.innerHTML = "";
        if (stories.length === 0) {
          storiesContainer.innerHTML =
            "<p>Belum ada cerita yang dipublikasikan.</p>";
          return;
        }

        stories.forEach((story) => {
          const storyElement = document.createElement("div");
          storyElement.classList.add("story-card");
          storyElement.setAttribute("tabindex", "0");

          const formattedDate = new Date(story.createdAt).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          );

          storyElement.innerHTML = `
                        <img src="${story.photoUrl}" alt="Cerita dari ${story.name}">
                        <div class="story-card-body">
                            <h3>${story.name}</h3>
                            <small class="story-date">${formattedDate}</small>
                            <p>${story.description}</p>
                            <a href="#/story/${story.id}" class="story-card__button">Lihat Detail</a>
                        </div>
                    `;

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
      } catch (error) {
        storiesContainer.innerHTML = `<p>Error: Gagal memuat cerita. Coba refresh halaman.</p>`;
      }
    };

    const findTotalPages = async () => {
      let page = 1;
      let totalStories = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const response = await StoryApi.getAllStories(page, storiesPerPage);
          if (response.listStory.length > 0) {
            totalStories += response.listStory.length;
            page++;
          } else {
            hasMore = false;
          }
        } catch (error) {
          console.error(
            "Gagal mengambil cerita untuk penghitungan halaman:",
            error
          );
          hasMore = false;
        }
      }

      return Math.ceil(totalStories / storiesPerPage);
    };

    const renderPagination = async () => {
      const totalPages = await findTotalPages();
      paginationContainer.innerHTML = "";

      for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("pagination-button");
        if (i === currentPage) {
          pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => {
          currentPage = i;
          renderStories(currentPage);
          renderPagination();
        });
        paginationContainer.appendChild(pageButton);
      }
    };

    renderStories(currentPage);
    renderPagination();
  },
};

export default Home;
