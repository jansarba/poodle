import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
// TUTAJ JEST KLUCZOWA ZMIANA: importujemy adapter-node zamiast adapter-auto
import adapter from '@sveltejs/adapter-node'; 

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// I TUTAJ ZMIANA: używamy skonfigurowanego adapter-node.
		// Domyślnie stworzy on folder 'build', którego potrzebuje Twój Dockerfile.
		adapter: adapter()
	}
};

export default config;