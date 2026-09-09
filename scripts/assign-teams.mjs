import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const PARTICIPANTS = [
  "Dofa",
  "Latita",
  "Phillip",
  "Lwandle",
  "Sechaba",
  "Thato",
  "Kekesto",
  "Sandile",
];

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const potsData = JSON.parse(readFileSync(join(root, "data", "pots.json"), "utf8"));

const assignments = PARTICIPANTS.map((name) => ({
  participant: name,
  teams: [],
}));

const unassignedByPot = [];

for (const pot of potsData.pots) {
  const shuffledTeams = shuffle(pot.teams);
  const assignedTeams = shuffledTeams.slice(0, PARTICIPANTS.length);
  const leftover = shuffledTeams.slice(PARTICIPANTS.length);

  PARTICIPANTS.forEach((participant, index) => {
    const entry = assignments.find((a) => a.participant === participant);
    entry.teams.push({
      pot: pot.id,
      potName: pot.name,
      ...assignedTeams[index],
    });
  });

  if (leftover.length > 0) {
    unassignedByPot.push({
      pot: pot.id,
      potName: pot.name,
      teams: leftover,
    });
  }
}

const output = {
  season: potsData.season,
  competition: potsData.competition,
  generatedAt: new Date().toISOString(),
  participants: assignments,
  unassigned: unassignedByPot,
};

writeFileSync(join(root, "data", "assignments.json"), JSON.stringify(output, null, 2));

console.log("Champions League pool assignments generated:\n");
for (const entry of assignments) {
  console.log(`${entry.participant}:`);
  for (const team of entry.teams) {
    console.log(`  ${team.potName}: ${team.name} (${team.country})`);
  }
  console.log();
}

if (unassignedByPot.length > 0) {
  console.log("Unassigned (leftover from each pot):");
  for (const pot of unassignedByPot) {
    for (const team of pot.teams) {
      console.log(`  ${pot.potName}: ${team.name} (${team.country})`);
    }
  }
}
