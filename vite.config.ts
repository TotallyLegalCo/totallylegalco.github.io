import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const [owner, repository] = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const isUserSite = owner && repository === `${owner}.github.io`;
const base = process.env.GITHUB_ACTIONS && repository && !isUserSite ? `/${repository}/` : '/';

export default defineConfig({
  base,
  plugins: [svelte()],
  build: { outDir: 'dist', emptyOutDir: true }
});
