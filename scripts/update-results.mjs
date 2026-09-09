import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computePoolStandings, normalizeMatch } from "./lib/compute-pool.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "data");

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SEASON = 2026;

function readJson(file) {
  return JSON.parse(readFileSync(join(dataDir, file), "utf8"));
}

function writeJson(file, data) {
  writeFileSync(join(dataDir, file), JSON.stringify(data, null, 2) + "\n");
}

async function fetchFromFootballData() {
  if (!API_KEY) {
    console.warn("FOOTBALL_DATA_API_KEY not set — skipping API fetch.");
    console.warn("Get a free key at https://www.football-data.org/client/register");
    return null;
  }

  const url = `https://api.football-data.org/v4/competitions/CL/matches?season=${SEASON}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": API_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.matches ?? [];
}

function getCurrentMatchday(matchdays) {
  const now = new Date();
  for (const md of matchdays.matchdays) {
    const start = new Date(md.start);
    const end = new Date(md.end);
    end.setHours(23, 59, 59, 999);
    if (now >= start && now <= end) return md.number;
    if (now < start) return md.number;
  }
  return matchdays.matchdays.at(-1)?.number ?? 1;
}

async function main() {
  const assignments = readJson("assignments.json");
  const matchdays = readJson("matchdays.json");
  let existingResults = readJson("results.json");

  let apiMatches = null;
  try {
    apiMatches = await fetchFromFootballData();
  } catch (err) {
    console.error(err.message);
    if (!existingResults.matches?.length) {
      process.exit(1);
    }
    console.warn("Using existing cached results.");
  }

  let matches;
  if (apiMatches) {
    matches = apiMatches.map(normalizeMatch);
    console.log(`Fetched ${matches.length} matches from football-data.org`);
  } else {
    matches = (existingResults.matches ?? []).map(normalizeMatch);
  }

  const finished = matches.filter((m) => m.status === "FINISHED");
  const scheduled = matches.filter((m) => m.status !== "FINISHED");

  const results = {
    season: assignments.season,
    competition: assignments.competition,
    updatedAt: new Date().toISOString(),
    source: apiMatches ? "football-data.org" : "cache",
    currentMatchday: getCurrentMatchday(matchdays),
    totalFinished: finished.length,
    totalScheduled: scheduled.length,
    matches,
  };

  const standings = computePoolStandings(assignments, matches);

  writeJson("results.json", results);
  writeJson("pool-standings.json", standings);

  console.log(`\nPool standings (${finished.length} matches finished):\n`);
  for (const p of standings.participants) {
    console.log(
      `  #${p.rank} ${p.participant}: ${p.totalPoints} pts (W${p.wins} D${p.draws} L${p.losses}, GD ${p.goalDifference >= 0 ? "+" : ""}${p.goalDifference})`
    );
  }

  console.log(`\nData written to data/results.json and data/pool-standings.json`);
}

main();
