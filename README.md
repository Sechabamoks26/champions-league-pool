# Champions League Pool 2026/27

A live pool website that tracks UEFA Champions League results and updates standings automatically after every matchday.

## Participants

Dofa · Latita · Phillip · Lwandle · Sechaba · Thato · Kekesto · Sandile

Each player is randomly assigned **one team from each of the four Champions League pots** (36 teams total).

## Scoring

Points from your 4 assigned teams each matchday:

| Result | Points |
|--------|--------|
| Win    | 3      |
| Draw   | 1      |
| Loss   | 0      |

## Website

The site has three views:

- **Standings** — live pool leaderboard
- **Matchdays** — UEFA results per matchday + pool points earned
- **Teams** — each player's assigned teams and individual stats

### Run locally

```bash
npm run serve
```

Open http://localhost:3000

## Auto-updates after each matchday

A GitHub Action runs daily (and after match nights) to:

1. Fetch latest Champions League results from [football-data.org](https://www.football-data.org/)
2. Calculate pool standings
3. Commit updated `data/results.json` and `data/pool-standings.json`

### Setup GitHub

1. Push this repo to GitHub
2. Add a repository secret: **Settings → Secrets → Actions → New secret**
   - Name: `FOOTBALL_DATA_API_KEY`
   - Value: your free API key from [football-data.org/client/register](https://www.football-data.org/client/register)
3. Enable **GitHub Pages**: Settings → Pages → Deploy from branch `main`, folder `/ (root)`
4. The Action will run automatically; you can also trigger it manually from the Actions tab

### Manual update

```bash
FOOTBALL_DATA_API_KEY=your_key npm run update
```

### Re-draw team assignments

```bash
npm run assign
npm run update
```

## Matchday schedule (2026/27)

| MD | Dates |
|----|-------|
| 1  | 8–10 Sep 2026 |
| 2  | 13–14 Oct 2026 |
| 3  | 20–21 Oct 2026 |
| 4  | 3–4 Nov 2026 |
| 5  | 24–25 Nov 2026 |
| 6  | 8–9 Dec 2026 |
| 7  | 19–20 Jan 2027 |
| 8  | 27 Jan 2027 |
