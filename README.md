# Leonida Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/samlakio20/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/samlakio20/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of **Grand Theft Auto VI**: every trophy with its official name, description and grade, a guide in our own words with its sources cited beside it, a roadmap to the platinum, and a checklist that saves your progress in the browser.

- **55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze; 28 of them hidden on PlayStation until earned.
- **Roadmap to the platinum** — about 200 hours in 3 stages (story, 100% checklist, cleanup), built from the official descriptions and the community guides.
- **The one missable trophy flagged** — Positive Mental Attitude, with the Chapter 1 balcony meditation called out.
- **Tracker** — tick trophies off (saved in localStorage), export progress to a file and import it back, filter by kind (story, missable, collectibles, activities, online) and grade, search, and a spoiler-free mode that hides hidden trophies until they are earned.
- **Cited, not copied** — every guide cites its sources (PowerPyx, GTABase, and the official list via Exophase/PSNProfiles). Two trophies with no confirmed trigger yet are marked unconfirmed, not guessed at.
- **Fully offline** — plain static files, no build step, no network requests at run time, no Rockstar artwork.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## How it is built

- `app/index.html` — the page: progress bar, filters, roadmap, checklist.
- `app/app.js` — the tracker: loads the trophies, renders the cards, saves progress, filters, spoiler mode, export/import.
- `app/style.css` — the look (our own neon-night theme).
- `app/data/trophies.json` — the 55 trophies: official name, description and grade, plus our guide, its sources, kind, missable flag and roadmap stage.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=b8eb5nb3&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
