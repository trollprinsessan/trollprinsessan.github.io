# norrsken100

The Norrsken100 page: the film, the manifest, the list of the hundred
companies (grid and index, with filters and search), The Latest and the FAQ.

A Next.js 15 / React 19 project, exported as static files. No server and no
database: the companies are in `lib/companies.json`.

## Run

```bash
npm ci
npm run dev        # http://localhost:3000
```

## Build

Two ways to publish the same page.

**As a site of its own** - static HTML in `out/`, for any static host:

```bash
npm run build
```

Set `NK_BASE=/some/path` when the site is served under a subpath.

**Embedded in another page** - a script and a stylesheet the host page loads,
so the page sits in the host's own document (no iframe) between the host's
menu and footer; the page's own menu and footer are left out:

```bash
npm run embed -- https://<where-the-files-are-served>
```

The output folder (`dist-embed/<date>_<commit>/`) holds the bundle, the
public files, a `vercel.json` (cross-origin access, no indexing) and
`EMBED-SNIPPET.html`: the three lines that go in the host page's embed
element. On Vercel, set the build command to
`npm run embed -- https://$VERCEL_PROJECT_PRODUCTION_URL dist` and the output
directory to `dist`.

## Where things are

| Path | What |
|---|---|
| `app/` | the page, its layout and the global stylesheet |
| `components/page-body.tsx` | the page's sections in order |
| `components/archive.tsx` | the list: grid, index, filters, search, the company views |
| `components/modules/` | the other sections (hero, manifest, latest, FAQ, footer) |
| `components/variants/` | the layouts of the parts, one folder per part |
| `components/settings/` | which layout each part uses, and the switches |
| `lib/` | the data and what is read off it (pictures, countries, campaigns) |
| `embed/`, `scripts/embed.mjs` | the embedded build |
| `public/` | pictures, film, fonts |

## Settings

`components/settings/versions.ts` names the layout of each part of the page
and the state of each switch. Components read them with `useVersion` and
`useToggle`; stylesheets read them as attributes on `<html>`
(`html[data-v-<part>="v2"]`, `html[data-t-<switch>="on"]`).

## Pictures

`scripts/optimize-images.py` writes the web-weight copies the page loads:
card-size stills in `public/n100/card/`, row thumbnails in
`public/n100/thumb/`, and each animation as animated WebP
(`<name>.anim.webp`). `lib/art-direction.ts` maps a company to its picture;
animations are named there as their sources (`.gif`) and loaded as the WebP
copy. To add or replace an animation, put the `.gif` beside the others and
run the script (needs Python 3 with Pillow).

## Data

`npm run transform` rebuilds `lib/companies.json` from the source CSV
(`scripts/transform-csv.mjs`).
