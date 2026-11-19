# gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/shelbyxxx1/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/shelbyxxx1/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Golden Hour Cover Studio — turn a photo and a caption into multi-panel GTA-style cover art, offline in the browser. Pick up to three photos (or one photo in every panel), drag to crop and position each panel, write the kicker, title and tagline, choose a size (1080×1080, 1080×1350, 1920×1080), a layout (Poster, Grid, Strip) and a colour grade (Golden Hour, Neon Nights, Vice Heat, Coast Noir), then export a PNG. The cover is drawn on canvas with a sunset or neon grade, a retro striped sun, palm silhouettes, a star row and bold condensed lettering.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network request: every script, font and sample photo is a file under `app/`, and your photos are read on your own machine, never uploaded.

## How it works

- `app/src/cover.js` — the renderer: `layoutPanels` computes the panel rectangles per size and layout, `drawPhotoPanel` cover-fits each photo with its zoom and shift, `applyGrade` adds the wash, halftone dots and vignette, and `drawCaptionBand` paints the sunset band with kicker, auto-fit title and script tagline. Decorations (`drawRetroSun`, `drawPalm`, `drawStarRow`, `drawVolumeStamp`) are drawn in code.
- `app/src/main.js` — the editor wiring: photo uploads, click-to-select panels, drag to pan, wheel to zoom, live preview, PNG export.
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

## Credits

- Fonts: Anton and Pacifico, both under the SIL Open Font License (see `app/fonts/OFL.txt` and `app/fonts/OFL-Pacifico.txt`). No Rockstar logo, artwork or font is used anywhere.
- Sample photos: `hero-woman.jpg`, `pier-man.jpg` and `neon-street.jpg` were made with an image model for this entry; `boulevard.jpg` and `pier.jpg` are the kit's free-to-use samples.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rtcpv23d&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
