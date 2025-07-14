import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	ssr: {
		// Mówimy Vite/SvelteKit, aby nie traktował tych pakietów jako "zewnętrzne".
		// Zamiast tego, spróbuje je dołączyć do paczki serwerowej, co często
		// rozwiązuje problemy z bibliotekami, które nie są czystym ESM.
		noExternal: ['svelte-i18n', 'svelte-calendar'],
	},
});
