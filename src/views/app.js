// src/views/app.js

import routes from "../utils/routes.js";
import UrlParser from "../utils/url-parser.js";

class App {
  constructor({ content }) {
    this._content = content;
  }

  async renderPage() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url];

    // Alternative DOM update for browsers that do not support view transition
    if (!document.startViewTransition) {
      this._content.innerHTML = await page.render();
      await page.afterRender();
      return;
    }

    // Update DOM with view transition
    document.startViewTransition(async () => {
      this._content.innerHTML = await page.render();
      await page.afterRender();
    });
  }
}

export default App;
