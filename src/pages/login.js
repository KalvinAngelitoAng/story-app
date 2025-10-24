import StoryApi from '../api/story-api.js';
import Notification from '../components/notification.js';

const Login = {
    async render() {
        return `
      <div class="form-container">
        <h2>Login</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" class="form-input" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" class="form-input" required autocomplete="current-password">
          </div>
          <button type="submit" class="form-button">Login</button>
          <button type="button" id="guest-login-btn" class="form-button">Masuk sebagai Guest</button>
        </form>
        <div id="error-message" class="error-message"></div>
        <div id="loading-spinner" class="loading-spinner" style="display: none;"></div>
      </div>
    `;
    },

    async afterRender() {
        const loginForm = document.querySelector('#login-form');
        const loadingSpinner = document.querySelector('#loading-spinner');

        const guestLoginBtn = document.querySelector('#guest-login-btn');
        guestLoginBtn.addEventListener('click', () => {
            sessionStorage.setItem('guest', 'true');
            window.location.hash = '#/add-story';
        });

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.querySelector('#email').value;
            const password = document.querySelector('#password').value;
            const errorMessageContainer = document.querySelector('#error-message');

            loadingSpinner.style.display = 'block';
            errorMessageContainer.innerText = '';

            try {
                await StoryApi.login({ email, password });
                sessionStorage.removeItem('guest');
                Notification.show({ message: 'Login berhasil!' });
                window.location.hash = '#/';
            } catch (error) {
                errorMessageContainer.innerText = `Error: ${error.message}`;
            } finally {
                loadingSpinner.style.display = 'none';
            }
        });
    },
};

export default Login;