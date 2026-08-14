import './styles/main.css';
import { registerServiceWorker } from './sw-register';
import { App } from './ui/app';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Hittade inget #app-element att montera spelet i.');

new App(root).start();
registerServiceWorker();
