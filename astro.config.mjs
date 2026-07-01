// @ts-check
import { defineConfig } from 'astro/config';

// Static output (default). Deploys as plain files to Cloudflare Pages.
// Update `site` to the real domain once deployed for correct canonical URLs.
export default defineConfig({
  site: 'https://pokompanion.mattmoats.com',
  trailingSlash: 'ignore',
});
