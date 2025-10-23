import Home from '../pages/home.js';
import Login from '../pages/login.js';
import Register from '../pages/register.js';
import AddStory from '../pages/add-story.js';
import DetailStory from '../pages/detail-story.js';

const routes = {
  '/': Home,
  '/login': Login,
  '/register': Register,
  '/add-story': AddStory,
  '/story/:id': DetailStory,
};

export default routes;
