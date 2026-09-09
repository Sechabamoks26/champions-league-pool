import { namesMatch, toCanonicalName } from "./team-names.mjs";

export function matchPoints(homeScore, awayScore, isHome) {
  const gf = isHome ? homeScore : awayScore;
  const ga = isHome ? awayScore : homeScore;
  if (gf > ga) return { points: 3, result: "W", gf, ga };
  if (gf === ga) return { points: 1, result: "D", gf, ga };
  return { points: 0, result: "L", gf, ga };
}

export function normalizeMatch(raw) {
  const homeName = toCanonicalName(raw.homeTeam?.name ?? raw.home);
  const awayName = toCanonicalName(raw.awayTeam?.name ?? raw.away);
  const homeScore = raw.score?.fullTime?.home ?? raw.homeScore ?? null;
  const awayScore = raw.score?.fullTime?.away ?? raw.awayScore ?? null;
  const status = raw.status ?? (homeScore != null ? "FINISHED" : "SCHEDULED");

  return {
    id: raw.id ?? `${homeName}-${awayName}-${raw.utcDate ?? raw.date}`,
    matchday: raw.matchday ?? raw.matchDay ?? null,
    date: raw.utcDate ?? raw.date ?? null,
    home: homeName,
    away: awayName,
    homeScore,
    awayScore,
    status,
  };
}

export function computePoolStandings(assignments, matches) {
  const finished = matches.filter(
    (m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null
  );

  const participants = assignments.participants.map((entry) => {
    const teamNames = entry.teams.map((t) => t.name);
    let totalPoints = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const teamStats = {};
    const matchdayPoints = {};

    for (const team of entry.teams) {
      teamStats[team.name] = {
        pot: team.pot,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        matches: [],
      };
    }

    for (const match of finished) {
      for (const teamName of teamNames) {
        const isHome = namesMatch(match.home, teamName);
        const isAway = namesMatch(match.away, teamName);
        if (!isHome && !isAway) continue;

        const { points, result, gf, ga } = matchPoints(
          match.homeScore,
          match.awayScore,
          isHome
        );

        totalPoints += points;
        goalsFor += gf;
        goalsAgainst += ga;
        if (result === "W") wins++;
        else if (result === "D") draws++;
        else losses++;

        const stats = teamStats[teamName];
        stats.points += points;
        stats.played++;
        stats.gf += gf;
        stats.ga += ga;
        if (result === "W") stats.wins++;
        else if (result === "D") stats.draws++;
        else stats.losses++;
        stats.matches.push({
          matchday: match.matchday,
          opponent: isHome ? match.away : match.home,
          home: isHome,
          score: `${match.homeScore}-${match.awayScore}`,
          result,
          points,
        });

        const md = match.matchday ?? 0;
        matchdayPoints[md] = (matchdayPoints[md] ?? 0) + points;
      }
    }

    return {
      participant: entry.participant,
      teams: entry.teams,
      totalPoints,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      teamStats,
      matchdayPoints,
    };
  });

  participants.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  participants.forEach((p, i) => {
    p.rank = i + 1;
  });

  const matchdays = [...new Set(finished.map((m) => m.matchday).filter(Boolean))].sort(
    (a, b) => a - b
  );

  const matchdaySummaries = matchdays.map((md) => {
    const mdMatches = finished.filter((m) => m.matchday === md);
    const mdStandings = participants
      .map((p) => ({
        participant: p.participant,
        points: p.matchdayPoints[md] ?? 0,
      }))
      .sort((a, b) => b.points - a.points);

    return { matchday: md, matches: mdMatches, standings: mdStandings };
  });

  return {
    season: assignments.season,
    competition: assignments.competition,
    computedAt: new Date().toISOString(),
    scoring: { win: 3, draw: 1, loss: 0 },
    participants,
    matchdaySummaries,
    totalMatchesFinished: finished.length,
  };
}
