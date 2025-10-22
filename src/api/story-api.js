const CONFIG = {
    BASE_URL: 'https://story-api.dicoding.dev/v1',
};

// --- Fungsi Helper (dipisahkan dari objek) ---
function getUserToken() {
    return localStorage.getItem('user-token');
}

function saveUserToken(token) {
    localStorage.setItem('user-token', token);
}

// --- Objek API ---
const StoryApi = {
    async register({ name, email, password }) {
        const response = await fetch(`${CONFIG.BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        const responseJson = await response.json();

        if (responseJson.error) {
            throw new Error(responseJson.message);
        }

        return responseJson;
    },

    async login({ email, password }) {
        const response = await fetch(`${CONFIG.BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const responseJson = await response.json();

        if (responseJson.error) {
            throw new Error(responseJson.message);
        }

        // Panggil fungsi helper yang sudah dipisah
        saveUserToken(responseJson.loginResult.token);

        return responseJson;
    },

    async getAllStories() {
        const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
            method: 'GET',
            headers: {
                // Panggil fungsi helper yang sudah dipisah
                Authorization: `Bearer ${getUserToken()}`,
            },
        });

        const responseJson = await response.json();

        if (responseJson.error) {
            throw new Error(responseJson.message);
        }

        return responseJson;
    },

    async getStoryDetail(id) {
        const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
            headers: {
                Authorization: `Bearer ${getUserToken()}`,
            },
        });

        const responseJson = await response.json();

        if (responseJson.error) {
            throw new Error(responseJson.message);
        }

        return responseJson;
    },

    async addNewStory({ description, photo, lat, lon }) {
        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo', photo);
        // Hanya tambahkan lat/lon jika nilainya ada
        if (lat) formData.append('lat', lat);
        if (lon) formData.append('lon', lon);

        const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getUserToken()}`,
            },
            body: formData, // Kirim sebagai FormData
        });

        const responseJson = await response.json();

        if (responseJson.error) {
            throw new Error(responseJson.message);
        }

        return responseJson;
    },

    logout() {
        localStorage.removeItem('user-token');
    },
};

export default StoryApi;