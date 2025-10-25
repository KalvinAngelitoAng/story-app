const CONFIG = {
  BASE_URL: "https://story-api.dicoding.dev/v1",
};

function getUserToken() {
  return localStorage.getItem("user-token");
}

function saveUserToken(token) {
  localStorage.setItem("user-token", token);
}

const StoryApi = {
  async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async addNewStoryGuest({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);
    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);

    const response = await fetch(`${CONFIG.BASE_URL}/stories/guest`, {
      method: "POST",
      body: formData,
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    saveUserToken(responseJson.loginResult.token);

    return responseJson;
  },

  async getAllStories(page = 1, size = 12) {
    const response = await fetch(
      `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getUserToken()}`,
        },
      }
    );

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
    formData.append("description", description);
    formData.append("photo", photo);

    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getUserToken()}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async subscribeNotification(subscription) {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey
          ? btoa(
              String.fromCharCode(
                ...new Uint8Array(subscription.getKey("p256dh"))
              )
            )
          : subscription.keys?.p256dh,
        auth: subscription.getKey
          ? btoa(
              String.fromCharCode(
                ...new Uint8Array(subscription.getKey("auth"))
              )
            )
          : subscription.keys?.auth,
      },
    };

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getUserToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionData),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  async unsubscribeNotification(endpoint) {
    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getUserToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: endpoint,
      }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  },

  logout() {
    localStorage.removeItem("user-token");
  },
};

export default StoryApi;
