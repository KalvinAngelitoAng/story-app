import Home from '../pages/home.js';
import AddStory from '../pages/add-story.js';
import DetailStory from '../pages/detail-story.js';
import Login from '../pages/login.js';
import Register from '../pages/register.js';

const routes = {
    '/': Home,
    '/add-story': AddStory,
    '/story/:id': DetailStory,
    '/login': Login,
    '/register': Register,
};

export default routes;