#!/usr/bin/env node
/*
 * Builds nfl.json for the NFL slides (nfl.js) from ESPN's public NFL endpoints.
 * Run by .github/workflows/pages.yml on a schedule; never committed.
 *
 *   node scripts/build-nfl.mjs [out.json] [--now=2026-10-05T12:00:00Z]
 *
 * No dependencies: Node 20+ (global fetch, full ICU for Eastern time).
 * Exits non-zero if ESPN is unreachable or the data doesn't look right, so the
 * workflow keeps the last published nfl.json instead.
 *
 * Week rule: the scoreboard shows a week from its Thursday game through the
 * following Wednesday. ESPN's weeks run Wed 07:00Z to Wed 06:59Z, so we pick
 * the week containing (now - 24 h): the switch happens Thursday ~3 AM Eastern.
 * "next" is always the week after that.
 */
import { writeFileSync } from "node:fs";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const STANDINGS = "https://site.api.espn.com/apis/v2/sports/football/nfl/standings";
const TZ = "America/New_York";
const DAY_MS = 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const nowArg = args.find((a) => a.startsWith("--now="));
const outPath = args.find((a) => !a.startsWith("--"));
const now = nowArg ? new Date(nowArg.slice(6)) : new Date();

async function getJson(url) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function fail(message) {
  console.error(`build-nfl: ${message}`);
  process.exit(1);
}

// ---------- formatting (Eastern time) ----------

const fmt = (opts) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts });
const fmtDay = fmt({ weekday: "short" });
const fmtTime = fmt({ hour: "numeric", minute: "2-digit" });
const fmtDate = fmt({ month: "short", day: "numeric" });
const fmtLongDay = fmt({ weekday: "long", month: "short", day: "numeric" });

function hex(c) {
  return /^[0-9a-f]{6}$/i.test(c || "") ? `#${c.toUpperCase()}` : "#194B98";
}

// White or navy text, whichever reads better on the team colour.
function textOn(color) {
  const n = parseInt(color.slice(1), 16);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.35 ? "#0E2A56" : "#FFFFFF";
}

// ---------- teams ----------

function buildTeams(json) {
  const list = (json.sports?.[0]?.leagues?.[0]?.teams || []).map((t) => t.team);
  const teams = {};
  for (const t of list) {
    const logos = Array.isArray(t.logos) ? t.logos : [];
    const has = (...rels) => logos.find((l) => rels.every((r) => (l.rel || []).includes(r)) && l.rel.length === rels.length);
    const logo = has("full", "scoreboard", "dark") || has("full", "dark") || has("full", "default") || logos[0];
    const color = hex(t.color);
    teams[t.abbreviation] = {
      name: t.displayName,
      short: t.shortDisplayName || t.name,
      color,
      text: textOn(color),
      logo: logo ? logo.href : null
    };
  }
  if (Object.keys(teams).length !== 32) fail(`expected 32 teams, got ${Object.keys(teams).length}`);
  return teams;
}

// ---------- calendar / week choice ----------

function weeksFrom(scoreboard) {
  const league = scoreboard.leagues?.[0];
  const cal = Array.isArray(league?.calendar) ? league.calendar : [];
  const weeks = [];
  for (const part of cal) {
    const seasontype = Number(part.value);
    if (seasontype !== 2 && seasontype !== 3) continue; // regular season and playoffs only
    for (const e of part.entries || []) {
      weeks.push({
        seasontype,
        week: Number(e.value),
        label: e.label,
        start: new Date(e.startDate),
        end: new Date(e.endDate)
      });
    }
  }
  if (!weeks.length) fail("calendar has no regular-season weeks");
  return { year: league.season?.year, weeks };
}

// ---------- games ----------

function gameStatus(comp) {
  const st = comp.status || {};
  const type = st.type || {};
  const name = type.name || "";
  if (/POSTPONED|SUSPENDED|DELAYED/.test(name)) return { state: "postponed", status: "Postponed" };
  if (/CANCELED|CANCELLED/.test(name)) return { state: "postponed", status: "Canceled" };
  if (type.state === "post") return { state: "post", status: type.shortDetail || "Final" };
  if (type.state === "in") {
    if (name === "STATUS_HALFTIME") return { state: "in", status: "Half" };
    const q = st.period > 4 ? "OT" : `Q${st.period}`;
    if (name === "STATUS_END_PERIOD") return { state: "in", status: `End ${q}` };
    return { state: "in", status: `${q} ${st.displayClock || ""}`.trim() };
  }
  return { state: "pre", status: "" };
}

function buildWeek(json, w, teams) {
  const games = [];
  for (const ev of json.events || []) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors?.find((c) => c.homeAway === "home");
    const away = comp.competitors?.find((c) => c.homeAway === "away");
    const h = home?.team?.abbreviation;
    const a = away?.team?.abbreviation;
    if (!teams[h] || !teams[a]) continue; // e.g. the Pro Bowl (AFC vs NFC)
    const kickoff = new Date(ev.date);
    const { state, status } = gameStatus(comp);
    const tbd = comp.timeValid === false || /TBD/i.test(comp.status?.type?.detail || "");
    const game = {
      away: a,
      home: h,
      kickoff: kickoff.toISOString(),
      day: fmtDay.format(kickoff),
      dayLabel: fmtLongDay.format(kickoff),
      when: tbd ? `${fmtDay.format(kickoff)} TBD` : `${fmtDay.format(kickoff)} ${fmtTime.format(kickoff)}`,
      time: tbd ? "TBD" : fmtTime.format(kickoff),
      state,
      status
    };
    if (state === "in" || state === "post") {
      game.awayScore = Number(away.score) || 0;
      game.homeScore = Number(home.score) || 0;
    }
    const note = (comp.notes || []).find((n) => n.headline);
    if (note) game.note = note.headline;
    games.push(game);
  }
  if (!games.length) return null;
  games.sort((x, y) => x.kickoff.localeCompare(y.kickoff) || x.home.localeCompare(y.home));
  const byes = (json.week?.teamsOnBye || []).map((t) => t.abbreviation).filter((ab) => teams[ab]).sort();
  const first = new Date(games[0].kickoff);
  const last = new Date(games[games.length - 1].kickoff);
  const a = fmtDate.format(first);
  const b = fmtDate.format(last);
  return {
    label: w.label,
    seasontype: w.seasontype,
    week: w.week,
    range: a === b ? a : `${a} – ${b}`,
    games,
    byes
  };
}

// ---------- standings ----------

function buildStandings(json, teams) {
  const out = {};
  for (const conf of json.children || []) {
    const abbr = conf.abbreviation;
    if (abbr !== "AFC" && abbr !== "NFC") continue;
    const rows = [];
    for (const div of conf.children || []) {
      const division = String(div.name || "").replace(/^(AFC|NFC)\s+/, "");
      for (const e of div.standings?.entries || []) {
        const s = {};
        for (const st of e.stats || []) s[st.name || st.type] = st;
        const n = (k) => Number(s[k]?.value) || 0;
        rows.push({
          seed: Number(s.playoffSeed?.value),
          team: e.team?.abbreviation,
          w: n("wins"),
          l: n("losses"),
          t: n("ties"),
          division,
          clincher: s.clincher?.displayValue || null
        });
      }
    }
    rows.sort((x, y) => x.seed - y.seed);
    const seeds = rows.map((r) => r.seed).join(",");
    if (rows.length !== 16 || seeds !== Array.from({ length: 16 }, (_, i) => i + 1).join(",")) {
      fail(`${abbr} standings: expected playoff seeds 1-16, got [${seeds}]`);
    }
    if (rows.some((r) => !teams[r.team])) fail(`${abbr} standings: unknown team`);
    // Games behind the 7th seed (ESPN's gamesBehind is vs the conference leader).
    const seventh = rows[6];
    for (const r of rows) {
      const gb = ((seventh.w - r.w) + (r.l - seventh.l)) / 2;
      r.gb7 = r.seed > 7 && gb > 0 ? gb : null;
    }
    out[abbr] = rows;
  }
  if (!out.AFC || !out.NFC) fail("standings missing a conference");
  return out;
}

// ---------- main ----------

const scoreboard = await getJson(`${SITE}/scoreboard`).catch((e) => fail(e.message));
const { year, weeks } = weeksFrom(scoreboard);
const ref = new Date(now.getTime() - DAY_MS);
const idx = weeks.findIndex((w) => ref >= w.start && ref <= w.end);

const result = { generatedAt: now.toISOString(), phase: "off", season: year };

if (idx !== -1) {
  const cur = weeks[idx];
  const nxt = weeks[idx + 1] || null;
  result.phase = cur.seasontype === 2 ? "regular" : "post";

  const weekUrl = (w) => `${SITE}/scoreboard?dates=${year}&seasontype=${w.seasontype}&week=${w.week}`;
  const [teamsJson, curJson, nxtJson, standJson] = await Promise.all([
    getJson(`${SITE}/teams`),
    getJson(weekUrl(cur)),
    nxt ? getJson(weekUrl(nxt)) : null,
    result.phase === "regular" ? getJson(`${STANDINGS}?season=${year}&seasontype=2&level=3`) : null
  ]).catch((e) => fail(e.message));

  const teams = buildTeams(teamsJson);
  result.teams = teams;
  result.current = buildWeek(curJson, cur, teams);
  result.next = nxtJson ? buildWeek(nxtJson, nxt, teams) : null;
  result.standings = standJson ? buildStandings(standJson, teams) : null;
  if (cur.seasontype === 2 && !result.current) fail(`${cur.label} has no games`);
}

const text = JSON.stringify(result, null, 1) + "\n";
if (outPath) writeFileSync(outPath, text);
else process.stdout.write(text);
console.error(`build-nfl: ${result.phase}` +
  (result.current ? `, ${result.current.label} (${result.current.games.length} games, ${result.current.byes.length} byes)` : "") +
  (result.next ? `, next ${result.next.label}` : ""));
