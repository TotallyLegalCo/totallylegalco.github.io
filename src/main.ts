import { mount } from 'svelte';
import App from './App.svelte';
import '../css/style.css';
import './enhancements.css';

const target = document.getElementById('svelte-app');
if (!target) throw new Error('Svelte mount target #svelte-app not found.');
mount(App, { target });
