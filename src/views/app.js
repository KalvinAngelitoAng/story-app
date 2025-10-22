// src/views/app.js

import routes from '../utils/routes.js';
import UrlParser from '../utils/url-parser.js';

class App {
    constructor({ content }) {
        this._content = content;
    }

    async renderPage() {
        // 1. Hapus class animasi untuk me-reset
        this._content.classList.remove('fade-in');

        // 2. Paksa browser untuk "reflow", ini trik agar animasi bisa berjalan lagi
        // eslint-disable-next-line no-void
        void this._content.offsetWidth;

        const url = UrlParser.parseActiveUrlWithCombiner();
        const page = routes[url];

        // 3. Render konten halaman baru
        this._content.innerHTML = await page.render();
        await page.afterRender();

        // 4. Tambahkan kembali class animasi agar efek transisi berjalan
        this._content.classList.add('fade-in');
    }
}

export default App;