const potColors = ["pot-1", "pot-2", "pot-3", "pot-4"];
let state = {
  standings: null,
  results: null,
  assignments: null,
  matchdays: null,
  activeTab: "standings",
  activeMatchday: 1,
};

async function loadData() {
  const [standings, results, assignments, matchdays] = await Promise.all([
    fetch("./data/pool-standings.json").then((r) => r.json()),
    fetch("./data/results.json").then((r) => r.json()),
    fetch("./data/assignments.json").then((r) => r.json()),
    fetch("./data/matchdays.json").then((r) => r.json()),
  ]);
  state.standings = standings;
  state.results = results;
  state.assignments = assignments;
  state.matchdays = matchdays;
  state.activeMatchday = results.currentMatchday ?? 1;
}

function formatDate(iso) {
  if (!iso) return "Not yet updated";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPoolTeam(name, standings) {
  const allTeams = new Set();
  for (const p of standings.participants) {
    for (const t of p.teams) allTeams.add(t.name);
  }
  return allTeams.has(name);
}

function renderHeader() {
  const { standings, results, matchdays } = state;
  const currentMd = matchdays.matchdays.find((m) => m.number === results.currentMatchday);

  document.getElementById("season-label").textContent =
    `${standings.season} — ${standings.competition}`;

  document.getElementById("meta-matchday").textContent =
    currentMd ? `${currentMd.label} in progress` : `Matchday ${results.currentMatchday}`;

  document.getElementById("meta-updated").textContent =
    `Updated ${formatDate(results.updatedAt || standings.computedAt)}`;

  document.getElementById("meta-matches").textContent =
    `${results.totalFinished} matches played`;
}

function renderStandings() {
  const { standings } = state;
  const tbody = document.getElementById("standings-body");

  tbody.innerHTML = standings.participants
    .map((p) => {
      const gdClass = p.goalDifference > 0 ? "positive" : p.goalDifference < 0 ? "negative" : "";
      const gdSign = p.goalDifference > 0 ? "+" : "";
      return `
        <tr>
          <td class="rank rank-${p.rank}">${p.rank}</td>
          <td class="participant-name">${p.participant}</td>
          <td class="points">${p.totalPoints}</td>
          <td class="stat-num">${p.wins}</td>
          <td class="stat-num">${p.draws}</td>
          <td class="stat-num">${p.losses}</td>
          <td class="stat-num">${p.goalsFor}</td>
          <td class="stat-num">${p.goalsAgainst}</td>
          <td class="stat-num ${gdClass}">${gdSign}${p.goalDifference}</td>
        </tr>`;
    })
    .join("");
}

function renderMatchdays() {
  const { standings, results, matchdays } = state;
  const mdTabs = document.getElementById("matchday-tabs");
  const poolTeams = new Set();
  for (const p of standings.participants) {
    for (const t of p.teams) poolTeams.add(t.name);
  }

  mdTabs.innerHTML = matchdays.matchdays
    .map((md) => {
      const mdMatches = results.matches.filter((m) => m.matchday === md.number);
      const finished = mdMatches.filter((m) => m.status === "FINISHED").length;
      const cls = md.number === state.activeMatchday ? "active" : "";
      const done = finished === mdMatches.length && mdMatches.length > 0 ? "finished" : "";
      return `<button class="md-tab ${cls} ${done}" data-md="${md.number}">${md.label}</button>`;
    })
    .join("");

  mdTabs.querySelectorAll(".md-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeMatchday = Number(btn.dataset.md);
      renderMatchdays();
    });
  });

  const mdMatches = results.matches
    .filter((m) => m.matchday === state.activeMatchday)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  const matchList = document.getElementById("match-list");
  if (mdMatches.length === 0) {
    matchList.innerHTML = `<p class="loading">No fixtures loaded yet for this matchday.</p>`;
  } else {
    matchList.innerHTML = mdMatches
      .map((m) => {
        const finished = m.status === "FINISHED";
        const score = finished
          ? `${m.homeScore} – ${m.awayScore}`
          : m.date
            ? new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
            : "TBC";
        const highlight =
          poolTeams.has(m.home) || poolTeams.has(m.away) ? "highlight" : "";
        return `
          <div class="match-row ${highlight}">
            <span class="home">${m.home}</span>
            <span class="match-score ${finished ? "finished" : "scheduled"}">${score}</span>
            <span class="away">${m.away}</span>
          </div>`;
      })
      .join("");
  }

  const summary = standings.matchdaySummaries.find(
    (s) => s.matchday === state.activeMatchday
  );
  const mdPool = document.getElementById("md-pool-standings");
  if (!summary || summary.standings.every((s) => s.points === 0)) {
    mdPool.innerHTML = `<p class="scoring-note">Pool points for this matchday will appear once matches finish.</p>`;
  } else {
    mdPool.innerHTML = summary.standings
      .map(
        (s) => `
        <div class="md-pool-row">
          <span>${s.participant}</span>
          <strong>${s.points} pts</strong>
        </div>`
      )
      .join("");
  }
}

function renderTeams() {
  const { standings } = state;
  const grid = document.getElementById("teams-grid");

  grid.innerHTML = standings.participants
    .map((p) => {
      const gdSign = p.goalDifference > 0 ? "+" : "";
      return `
        <article class="card">
          <div class="card-header">
            <div>
              <div class="participant">${p.participant}</div>
              <div class="card-record">W${p.wins} D${p.draws} L${p.losses} · GD ${gdSign}${p.goalDifference}</div>
            </div>
            <div style="text-align:right">
              <div class="card-points">${p.totalPoints}</div>
              <div class="card-rank">#${p.rank}</div>
            </div>
          </div>
          <div class="teams">
            ${p.teams
              .map((t) => {
                const stats = p.teamStats[t.name];
                const pts = stats?.points ?? 0;
                const played = stats?.played ?? 0;
                return `
                <div class="team-row">
                  <div class="pot-badge ${potColors[t.pot - 1]}">P${t.pot}</div>
                  <div class="team-info">
                    <div class="team-name">${t.name}</div>
                    <div class="team-country">${t.country}${played ? ` · ${played} played` : ""}</div>
                  </div>
                  <div class="team-pts">${pts} pts</div>
                </div>`;
              })
              .join("")}
          </div>
        </article>`;
    })
    .join("");
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("active", p.id === `panel-${tab}`);
  });
}

async function init() {
  try {
    await loadData();
    renderHeader();
    renderStandings();
    renderMatchdays();
    renderTeams();

    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    document.getElementById("app").style.display = "block";
    document.getElementById("loading").style.display = "none";
  } catch (err) {
    document.getElementById("loading").innerHTML =
      `<p class="error">Failed to load pool data. Run <code>npm run update</code> first.</p>`;
    console.error(err);
  }
}

init();
