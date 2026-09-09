# Champions League Pool 2025/26

A simple pool for tracking UEFA Champions League team assignments among friends.

## Participants

- Dofa
- Latita
- Phillip
- Lwandle
- Sechaba
- Thato
- Kekesto
- Sandile

Each participant is randomly assigned **one team from each of the four Champions League pots** (36 teams total across 4 pots).

## How it works

1. All 36 Champions League league-phase teams are split into 4 pots (based on the official 2025/26 draw).
2. For each pot, teams are shuffled and one is assigned to each of the 8 participants.
3. Assignments are saved to `data/assignments.json` and displayed on the web page.

## Re-draw teams

```bash
node scripts/assign-teams.mjs
```

## View the pool

Open `index.html` in a browser, or serve locally:

```bash
npx serve .
```

## GitHub Pages

This repo is set up for GitHub Pages — visit the repo's Settings → Pages to enable deployment from the `main` branch.
