import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const [owner, repository] = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const isUserSite = owner && repository?.toLowerCase() === `${owner}.github.io`.toLowerCase();
const base = process.env.GITHUB_ACTIONS && repository && !isUserSite ? `/${repository}/` : '/';

export default defineConfig({
  base,
  plugins: [svelte()],
  build: { outDir: 'dist', emptyOutDir: true }
});
