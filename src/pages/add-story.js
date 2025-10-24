import StoryApi from "../api/story-api.js";
import IdbHelper from "../utils/idb-helper.js";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Notification from '../components/notification.js';

const AddStory = {
  async render() {
    const isGuest = sessionStorage.getItem('guest') === 'true';
    return `
      <div class="form-container">
        <h1>Buat Cerita Baru</h1>
        ${isGuest ? '<p>Anda masuk sebagai <strong>Guest</strong>. <a href="#/login">Login atau Register</a> untuk pengalaman penuh.</p>' : ''}
        <form id="add-story-form">
          <div class="form-group">
            <label for="description">Deskripsi</label>
            <textarea id="description" name="description" class="form-input" rows="4" required></textarea>
          </div>

          <div class="form-group">
            <label for="photo">Unggah Foto</label>
            <div id="drop-zone" class="drop-zone" tabindex="0">
              <p>Seret & lepas gambar di sini, atau klik untuk memilih file</p>
              <input type="file" id="photo" name="photo" class="form-input" accept="image/*" required>
            </div>
            <div id="image-preview" class="image-preview"></div>
            <button type="button" id="camera-button" class="camera-button">Gunakan Kamera</button>
          </div>
          
          <div id="camera-container" class="camera-container" style="display: none;">
            <video id="camera-feed" autoplay></video>
            <button type="button" id="capture-button" class="capture-button">Ambil Gambar</button>
            <canvas id="photo-canvas" style="display: none;"></canvas>
          </div>

          <div class="form-group">
            <label>Pilih Lokasi</label>
            <div id="map-picker" style="height: 300px; width: 100%;"></div>
            <input type="hidden" id="lat" name="lat">
            <input type="hidden" id="lon" name="lon">
            <div id="coords-display">Koordinat belum dipilih</div>
          </div>

          <button type="submit" class="form-button">Publikasikan Cerita</button>
        </form>
        <div id="error-message" class="error-message"></div>
      </div>
    `;
  },

  async afterRender() {
    // Perbaiki path ikon default Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });

    const dropZone = document.querySelector("#drop-zone");
    const photoInput = document.querySelector("#photo");
    const imagePreview = document.querySelector("#image-preview");

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        photoInput.files = files;
        previewImage(files[0]);
      }
    });

    dropZone.addEventListener("click", () => {
      photoInput.click();
    });

    dropZone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        photoInput.click();
      }
    });

    photoInput.addEventListener("change", () => {
      const files = photoInput.files;
      if (files.length > 0) {
        previewImage(files[0]);
      }
    });

    function previewImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Image preview">`;
        imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }

    const map = L.map("map-picker").setView([-2.548926, 118.0148634], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    const latInput = document.querySelector("#lat");
    const lonInput = document.querySelector("#lon");
    const coordsDisplay = document.querySelector("#coords-display");
    let marker = null;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      // Simpan koordinat ke input tersembunyi
      latInput.value = lat;
      lonInput.value = lng;

      // Tampilkan koordinat ke pengguna
      coordsDisplay.innerText = `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(
        4
      )}`;

      // Pindahkan marker ke lokasi baru (atau buat jika belum ada)
      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }
    });

    // --- Logika Kamera ---
    const cameraButton = document.querySelector("#camera-button");
    const cameraContainer = document.querySelector("#camera-container");
    const video = document.querySelector("#camera-feed");
    const captureButton = document.querySelector("#capture-button");
    const canvas = document.querySelector("#photo-canvas");
    let stream = null;

    cameraButton.addEventListener("click", async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        cameraContainer.style.display = "block";
      } catch (error) {
        console.error("Error accessing camera:", error);
        Notification.show({ message: "Tidak bisa mengakses kamera. Pastikan Anda memberikan izin.", type: 'error' });
      }
    });

    captureButton.addEventListener("click", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas
        .getContext("2d")
        .drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-photo.jpg", {
          type: "image/jpeg",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;
        previewImage(file); // Tambahkan pratinjau untuk gambar dari kamera
      }, "image/jpeg");

      // Matikan kamera setelah mengambil gambar
      stream.getTracks().forEach((track) => track.stop());
      cameraContainer.style.display = "none";
    });

    const addStoryForm = document.querySelector("#add-story-form");
    addStoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = addStoryForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-spinner" style="border-left-color: #fff; width: 20px; height: 20px; display: inline-block; margin: 0 auto;"></span> Mengunggah...';

      const errorMessageContainer = document.querySelector("#error-message");
      const description = document.querySelector("#description").value;
      const photo = document.querySelector("#photo").files[0];
      const lat = document.querySelector("#lat").value;
      const lon = document.querySelector("#lon").value;
      const isGuest = sessionStorage.getItem('guest') === 'true';

      // Validasi sederhana
      if (!description || !photo) {
        errorMessageContainer.innerText =
          "Deskripsi dan foto tidak boleh kosong!";
        
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return;
      }

      if (!navigator.onLine) {
        console.log("Offline mode detected. Saving story to IndexedDB.");
        try {
          const newStory = { description, photo, lat, lon };
          await IdbHelper.put(newStory);
          Notification.show({ message: "Anda sedang offline. Cerita disimpan secara lokal dan akan diunggah saat kembali online." });

          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(function(swRegistration) {
              return swRegistration.sync.register('sync-new-stories');
            });
          }
        } catch (error) {
          console.error("Failed to save story to IndexedDB:", error);
          Notification.show({ message: "Gagal menyimpan cerita secara lokal. Silakan coba lagi." });
        }
        window.location.hash = "#/";
        return;
      }

      try {
        if (isGuest) {
          await StoryApi.addNewStoryGuest({ description, photo, lat, lon });
        } else {
          await StoryApi.addNewStory({ description, photo, lat, lon });
        }
        Notification.show({ message: "Cerita berhasil ditambahkan!" });
        window.location.hash = "#/"; // Arahkan kembali ke beranda
      } catch (error) {
        errorMessageContainer.innerText = `Error: ${error.message}`;
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    });
  },
};

export default AddStory;