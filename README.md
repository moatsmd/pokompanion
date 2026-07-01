# Pokompanion

An unofficial, searchable + browsable compendium for the game **Pokémon Pokopia**
(Nintendo Switch 2). Materials & how to source them, crafting recipes, item
database, and region guides.

Static Astro site with client-side full-text search (Pagefind). No backend.

## Structure

- `data/*.json` — the canonical game data (materials, items, recipes, regions,
  tools). Edit these to correct or expand content. `data/SCHEMA.md` documents
  the shape.
- `src/lib/data.ts` — loads the JSON, normalizes it, derives cross-links.
- `src/pages/` — routes. Index + `[id]` detail pages per section.
- `src/layouts/Base.astro`, `src/styles/global.css` — shell + design tokens.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321  (search inactive in dev — needs a build)
```

## Build (with search index)

```sh
npm run build      # astro build + pagefind index -> dist/
npm run preview    # serve dist/ locally, search works here
```

## Deploy — Cloudflare Pages

- Framework preset: **Astro**
- Build command: `npm run build`
- Output directory: `dist`

`npm run build` runs Pagefind after Astro so the search index ships in `dist/`.
After deploying, set `site` in `astro.config.mjs` to the real URL.

## Adding content

Append entries to the relevant `data/*.json` file following `data/SCHEMA.md`.
IDs are kebab-case of the name and are how entries cross-link, so keep them
consistent (e.g. a recipe ingredient `"lumber"` links to `materials/lumber`).
