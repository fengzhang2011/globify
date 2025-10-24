import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		// adapter-static configuration for nginx deployment
		adapter: adapter({
			// default options are shown. Set to '.' to output to current directory
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // SPA mode - all routes handled by index.html
			precompress: false,
			strict: true
		}),
		alias: {
			$components: 'src/components',
			$lib: 'src/lib'
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
