import StoryApi from '../api/story-api.js';

const Register = {
    async render() {
        return `
      <div class="form-container">
        <h2>Register Akun Baru</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="name">Nama</label>
            <input type="text" id="name" name="name" class="form-input" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" class="form-input" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" class="form-input" minlength="8" required>
          </div>
          <button type="submit" class="form-button">Register</button>
        </form>
        <div id="error-message" class="error-message"></div>
      </div>
    `;
    },

    async afterRender() {
        const registerForm = document.querySelector('#register-form');
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.querySelector('#name').value;
            const email = document.querySelector('#email').value;
            const password = document.querySelector('#password').value;
            const errorMessageContainer = document.querySelector('#error-message');

            try {
                await StoryApi.register({ name, email, password });
                alert('Registrasi berhasil! Silakan login.');
                window.location.hash = '#/login';
            } catch (error) {
                errorMessageContainer.innerText = `Error: ${error.message}`;
            }
        });
    },
};

export default Register;