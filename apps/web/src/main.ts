import { mount } from 'svelte';
import Framework7 from 'framework7/lite-bundle';
import Framework7Svelte from 'framework7-svelte';

// Import Framework7 and custom styles
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import './styles/app.css';
import './styles/learning-motion.css';

import App from './app.svelte';

// Initialize Framework7-Svelte plugin
Framework7.use(Framework7Svelte);

// Mount Svelte 5 App
const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
