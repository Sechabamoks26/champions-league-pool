/** Maps football-data.org (and other API) names to our pool team names. */
export const TEAM_ALIASES = {
  "Paris Saint-Germain": ["Paris Saint-Germain FC", "Paris Saint Germain", "PSG"],
  "Bayern Munich": ["FC Bayern München", "Bayern München", "FC Bayern Munich"],
  "Real Madrid": ["Real Madrid CF"],
  "Liverpool": ["Liverpool FC"],
  "Inter Milan": ["FC Internazionale Milano", "Internazionale", "Inter"],
  "Manchester City": ["Manchester City FC"],
  "Arsenal": ["Arsenal FC"],
  "Barcelona": ["FC Barcelona"],
  "Atletico Madrid": ["Club Atlético de Madrid", "Atlético Madrid", "Atletico de Madrid"],
  "Borussia Dortmund": ["BV Borussia 09 Dortmund", "BVB"],
  "Roma": ["AS Roma"],
  "Sporting CP": ["Sporting Clube de Portugal", "Sporting Lisbon", "Sporting"],
  "Aston Villa": ["Aston Villa FC"],
  "Porto": ["FC Porto"],
  "Manchester United": ["Manchester United FC"],
  "Club Brugge": ["Club Brugge KV", "Club Brugge K.V."],
  "Real Betis": ["Real Betis Balompié", "Real Betis Balompie"],
  "PSV Eindhoven": ["PSV", "PSV Eindhoven"],
  "Feyenoord": ["Feyenoord Rotterdam"],
  "Lille": ["Lille OSC", "LOSC Lille"],
  "Bodø/Glimt": ["FK Bodø/Glimt", "Bodo/Glimt", "FK Bodo/Glimt"],
  "Napoli": ["SSC Napoli"],
  "RB Leipzig": ["RasenBallsport Leipzig"],
  "Villarreal": ["Villarreal CF"],
  "Fenerbahce": ["Fenerbahçe SK", "Fenerbahçe", "Fenerbahce SK"],
  "Shakhtar Donetsk": ["FC Shakhtar Donetsk", "Shakhtar"],
  "Galatasaray": ["Galatasaray SK", "Galatasaray A.Ş."],
  "Slavia Praha": ["SK Slavia Praha", "Slavia Prague"],
  "Slovan Bratislava": ["ŠK Slovan Bratislava", "SK Slovan Bratislava"],
  "VfB Stuttgart": ["VfB Stuttgart"],
  "AEK Athens": ["AEK", "AEK Athens FC"],
  "LASK": ["LASK Linz"],
  "Como": ["Como 1907"],
  "Lens": ["RC Lens"],
  "Viking": ["Viking FK", "Viking Stavanger"],
  "Sabah": ["Sabah FK", "Sabah FC"],
};

const aliasToCanonical = new Map();
for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
  aliasToCanonical.set(normalize(canonical), canonical);
  for (const alias of aliases) {
    aliasToCanonical.set(normalize(alias), canonical);
  }
}

function normalize(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function toCanonicalName(name) {
  if (!name) return null;
  return aliasToCanonical.get(normalize(name)) ?? name;
}

export function namesMatch(a, b) {
  return toCanonicalName(a) === toCanonicalName(b);
}

export function getAllPoolTeamNames(pots) {
  const names = new Set();
  for (const pot of pots.pots) {
    for (const team of pot.teams) {
      names.add(team.name);
    }
  }
  return [...names];
}
