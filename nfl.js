/*
 * Ramstar signage: NFL slides.
 *
 * Data: nfl.json, built every 15 minutes from ESPN's public NFL endpoints by
 * scripts/build-nfl.mjs (run by .github/workflows/pages.yml, never committed).
 *
 * Used from slides.json as:
 *   { "type": "nfl-scoreboard", "duration": 16 }   this week's games, 8 per screen, byes last
 *   { "type": "nfl-standings",  "duration": 16 }   playoff picture, AFC then NFC ("conference": "AFC" for one)
 *   { "type": "nfl-next",       "duration": 16 }   next week's matchups with day and time, byes last
 * Optional on each: "logos": false (coloured circles with the team abbreviation
 * instead of logos), "url" (a different nfl.json, e.g. tests/fixture-nfl.json).
 *
 * A slide with more than one screen ("page") flips partway through its
 * duration: page k of N shows from k/N to (k+1)/N of the slide. All pages are
 * built up front and switched by CSS (nfl.css), so there are no timers.
 *
 * The slides hide themselves (load() rejects, so the player skips them) in the
 * off-season, when there are no games to show, or when nfl.json is more than
 * 36 hours old.
 *
 * The player calls load(slide) then render(slide, model). The pure parts are
 * exposed for testing: RamstarNFL.toModel(json, slide, now) and RamstarNFL.render(model).
 */
(function () {
  "use strict";

  const T = window.RamstarTemplates;
  const { h, add } = T;
  const URL_DEFAULT = "nfl.json";
  const CACHE_MINUTES = 10;   // fetch at most this often per TV
  const MAX_AGE_HOURS = 36;   // older data than this is hidden, not shown
  const PER_PAGE = 8;         // games per screen
  const LOGO_TIMEOUT_MS = 4000;
  const cache = new Map();    // url -> { json, fetchedAt }
  const badLogos = new Set(); // logo URLs that failed: drawn as circles instead

  const TITLES = { "nfl-scoreboard": "NFL Scoreboard", "nfl-standings": "NFL Standings", "nfl-next": "NFL Up Next" };

  // ---------- model ----------

  function chunk(list, size) {
    const out = [];
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out.length ? out : [[]];
  }

  // Games 8 per page; byes under the last page's games (nfl.css makes the
  // cards a little shorter when that page also has a fourth row of games).
  function weekPages(section) {
    const pages = chunk(section.games, PER_PAGE).map((games) => ({ games, byes: [] }));
    pages[pages.length - 1].byes = section.byes || [];
    return pages;
  }

  function toModel(json, slide, now) {
    if (!json || typeof json !== "object") throw new Error("nfl.json is empty");
    const age = now - new Date(json.generatedAt);
    // Saved test files (tests/fixture-nfl.json) are marked "fixture" and never expire.
    if (!json.fixture && !(age < MAX_AGE_HOURS * 3600 * 1000)) throw new Error("nfl.json is out of date");
    if (json.phase === "off") throw new Error("NFL off-season");

    const kind = slide.type;
    const base = {
      kind,
      tag: slide.tag || TITLES[kind],
      teams: json.teams || {},
      logos: slide.logos !== false,
      updated: new Date(json.generatedAt)
    };

    if (kind === "nfl-standings") {
      if (!json.standings) throw new Error("No NFL standings to show");
      const confs = ["AFC", "NFC"].filter((c) => !slide.conference || String(slide.conference).toUpperCase() === c);
      const pages = confs.filter((c) => json.standings[c]).map((c) => ({ title: c, rows: json.standings[c] }));
      if (!pages.length) throw new Error("No NFL standings to show");
      return { ...base, kicker: json.current ? json.current.label : "", pages };
    }

    const section = kind === "nfl-next" ? json.next : json.current;
    if (!section || !section.games || !section.games.length) throw new Error("No NFL games to show");
    return {
      ...base,
      title: section.label,
      kicker: section.range,
      pages: weekPages(section)
    };
  }

  // ---------- network + cache ----------

  function withCacheBust(url) {
    return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
  }

  async function fetchJson(url) {
    const now = Date.now();
    const hit = cache.get(url);
    if (hit && now - hit.fetchedAt < CACHE_MINUTES * 60 * 1000) return hit.json;
    try {
      const response = await fetch(withCacheBust(url), { cache: "no-store" });
      if (!response.ok) throw new Error(`nfl.json returned HTTP ${response.status}`);
      const json = await response.json();
      cache.set(url, { json, fetchedAt: now });
      return json;
    } catch (err) {
      if (hit) { // network blip: the age check in toModel decides if it's still usable
        console.warn("NFL refresh failed, using cached data:", err);
        return hit.json;
      }
      throw err;
    }
  }

  // Resolves either way: a logo that fails or is slow is drawn as a circle.
  function preloadLogo(src) {
    return new Promise((resolve) => {
      if (!src || badLogos.has(src)) return resolve();
      const img = new Image();
      const timer = setTimeout(() => { badLogos.add(src); resolve(); }, LOGO_TIMEOUT_MS);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); badLogos.add(src); resolve(); };
      img.src = src;
    });
  }

  function teamsOn(model) {
    const set = new Set();
    model.pages.forEach((p) => {
      (p.games || []).forEach((g) => { set.add(g.away); set.add(g.home); });
      (p.byes || []).forEach((t) => set.add(t));
      (p.rows || []).forEach((r) => set.add(r.team));
    });
    return [...set];
  }

  async function load(slide) {
    const json = await fetchJson(slide.url || URL_DEFAULT);
    const model = toModel(json, slide, new Date());
    // Names are fitted by measuring text, so the font must be ready first.
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load("700 46px 'Barlow Condensed'"),
        document.fonts.load("800 46px 'Barlow Condensed'")
      ]).catch(() => {});
    }
    if (model.logos) {
      await Promise.all(teamsOn(model).map((ab) => preloadLogo(model.teams[ab] && model.teams[ab].logo)));
    }
    return model;
  }

  // ---------- drawing helpers ----------

  let measureCtx = null;
  function textWidth(text, font) {
    measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }

  // Full name if it fits on one line, else the nickname, else the abbreviation.
  // Names are shown in capitals, so that is what gets measured. The CSS also
  // never wraps (nowrap + ellipsis) as a last resort.
  function fittedName(team, abbr, font, maxWidth) {
    const options = team ? [team.name, team.short, abbr] : [abbr];
    return options.find((n) => n && textWidth(n.toUpperCase(), font) <= maxWidth) || options[options.length - 1];
  }

  function mark(model, abbr, className) {
    const team = model.teams[abbr] || {};
    const wrap = h("span", `nfl-mark ${className || ""}`);
    if (model.logos && team.logo && !badLogos.has(team.logo)) {
      const img = h("img");
      img.src = team.logo;
      img.alt = "";
      img.onerror = () => { badLogos.add(team.logo); wrap.replaceChildren(circle(team, abbr)); };
      wrap.appendChild(img);
    } else {
      wrap.appendChild(circle(team, abbr));
    }
    return wrap;
  }

  function circle(team, abbr) {
    const c = h("span", "nfl-circle", abbr);
    c.style.background = team.color || "#194B98";
    c.style.color = team.text || "#FFFFFF";
    if (abbr.length > 2) c.classList.add("nfl-circle--3");
    return c;
  }

  // Page k of n is on screen from k/n to (k+1)/n of the slide (see nfl.css).
  function pageEl(k, n) {
    const page = h("div", "nfl-page");
    page.style.setProperty("--p-from", String(k / n));
    page.style.setProperty("--p-to", String((k + 1) / n));
    if (k > 0) page.classList.add("nfl-page--later");
    if (k < n - 1) page.classList.add("nfl-page--flips");
    return page;
  }

  // Parts of page k rise in one after another: page 0 after the header,
  // later pages from the moment they appear.
  function stagger(node, k, i, firstMs) {
    node.classList.add("nfl-in");
    node.style.setProperty("--d", k === 0
      ? `${firstMs + i * 90}ms`
      : `calc((var(--slide-dur, 11s) - 1s) * var(--p-from) + ${200 + i * 90}ms)`);
    node.style.setProperty("--o", `${i * 30}ms`);
    return node;
  }

  function pageCount(k, n) {
    return n > 1 ? h("div", "nfl-pager", `${k + 1} / ${n}`) : null;
  }

  function header(model, anim, title, kicker, perPageTitle) {
    const head = h("div", "nfl-header");
    const left = h("div", "nfl-header-left");
    add(left, anim(T.tag(model.tag)));
    if (!perPageTitle) {
      const line = anim(h("div", "nfl-titleline"));
      add(line, h("h1", "nfl-title", title), kicker ? h("div", "nfl-kicker", kicker) : null);
      add(left, line);
    }
    add(head, left, T.logoBadge("nfl"));
    return head;
  }

  function footer(model) {
    const time = model.updated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const day = model.updated.toLocaleDateString("en-US", { weekday: "short" });
    return h("div", "nfl-source", `NFL data: ESPN · updated ${day} ${time}`);
  }

  // ---------- scoreboard / up next ----------

  const CARD_NAME_FONT = "700 46px 'Barlow Condensed'";
  const CARD_NAME_MAX = 360;   // px left for a name in a game card (see .nfl-card in nfl.css)

  function teamLine(model, abbr, score, isLoser) {
    const line = h("div", `nfl-line${isLoser ? " is-loser" : ""}`);
    add(line,
      mark(model, abbr),
      h("span", "nfl-name", fittedName(model.teams[abbr], abbr, CARD_NAME_FONT, CARD_NAME_MAX)),
      score !== undefined ? h("span", "nfl-score", score) : null
    );
    return line;
  }

  function gameCard(model, g) {
    const card = h("div", `nfl-card nfl-card--${g.state}`);
    const teams = h("div", "nfl-card-teams");
    const final = g.state === "post";
    add(teams,
      teamLine(model, g.away, g.awayScore, final && g.awayScore < g.homeScore),
      teamLine(model, g.home, g.homeScore, final && g.homeScore < g.awayScore)
    );
    const status = h("div", "nfl-status");
    if (g.state === "pre") {
      add(status, h("span", "nfl-status-day", g.day), h("span", "nfl-status-time", g.time));
    } else if (g.state === "in") {
      add(status, h("span", "nfl-live", "Live"), h("span", "nfl-status-time", g.status));
    } else {
      add(status, h("span", "nfl-status-final", g.status));
    }
    add(card, teams, status);
    return card;
  }

  function byeStrip(model, byes) {
    const strip = h("div", "nfl-byes");
    add(strip, h("span", "nfl-byes-label", "On bye"));
    const list = h("div", "nfl-byes-list");
    byes.forEach((ab) => {
      const item = h("span", "nfl-bye");
      const team = model.teams[ab];
      add(item, mark(model, ab, "nfl-mark--small"), h("span", "nfl-bye-name", team ? team.short : ab));
      list.appendChild(item);
    });
    strip.appendChild(list);
    return strip;
  }

  function renderWeek(model, root, anim) {
    const n = model.pages.length;
    const body = h("div", "nfl-body");
    const firstMs = anim.lastLands() - 200;
    model.pages.forEach((p, k) => {
      const page = pageEl(k, n);
      if (p.byes.length && p.games.length > 6) page.classList.add("nfl-page--tight");
      const grid = h("div", "nfl-grid");
      let i = 0;
      p.games.forEach((g) => grid.appendChild(stagger(gameCard(model, g), k, i++, firstMs)));
      add(page, grid);
      if (p.byes.length) add(page, stagger(byeStrip(model, p.byes), k, i++, firstMs));
      add(page, pageCount(k, n));
      body.appendChild(page);
    });
    add(root, body);
  }

  // ---------- standings ----------

  const ROW_NAME_FONT = "700 42px 'Barlow Condensed'";
  const ROW_NAME_MAX = 380;    // px left for a name in a standings row (see .nfl-row in nfl.css)
  const CLINCHED = { z: "Clinched division", y: "Clinched wild card", x: "Clinched playoffs", "*": "Clinched bye" };

  function record(r) {
    return r.t ? `${r.w}-${r.l}-${r.t}` : `${r.w}-${r.l}`;
  }

  function standingRow(model, r) {
    const out = r.clincher === "e";
    const row = h("div", `nfl-row${out ? " is-out" : ""}${r.seed <= 7 ? " is-in" : ""}`);
    let note;
    if (r.seed === 1) note = "Bye";
    else if (r.seed <= 4) note = r.division;
    else if (r.seed <= 7) note = "WC";
    else if (out) note = "Out";
    else note = r.gb7 ? `${r.gb7} GB` : "—";
    const name = h("span", "nfl-name", fittedName(model.teams[r.team], r.team, ROW_NAME_FONT, ROW_NAME_MAX));
    add(row,
      h("span", "nfl-seed", r.seed),
      mark(model, r.team),
      name,
      h("span", "nfl-record", record(r)),
      h("span", `nfl-note${CLINCHED[r.clincher] ? " is-clinched" : ""}`, note)
    );
    if (CLINCHED[r.clincher]) row.title = CLINCHED[r.clincher];
    return row;
  }

  function renderStandings(model, root, anim) {
    const n = model.pages.length;
    const body = h("div", "nfl-body");
    const firstMs = anim.lastLands() - 200;
    model.pages.forEach((p, k) => {
      const page = pageEl(k, n);
      let i = 0;
      const line = stagger(h("div", "nfl-titleline"), k, i++, firstMs);
      add(line, h("h1", "nfl-title", p.title), model.kicker ? h("div", "nfl-kicker", model.kicker) : null);
      const cols = h("div", "nfl-columns");
      [["In the playoffs today", p.rows.slice(0, 7)], ["In the hunt", p.rows.slice(7)]].forEach(([label, rows]) => {
        const col = h("div", "nfl-col");
        add(col, stagger(h("div", "nfl-col-head", label), k, i++, firstMs));
        rows.forEach((r) => col.appendChild(stagger(standingRow(model, r), k, i++, firstMs)));
        cols.appendChild(col);
      });
      add(page, line, cols,
        h("div", "nfl-legend", "Bye = first-round bye · WC = wild card · GB = games behind the 7th seed"),
        pageCount(k, n));
      body.appendChild(page);
    });
    add(root, body);
  }

  // ---------- render ----------

  function render(model, slide) {
    const anim = T.sequencer();
    const root = T.slideRoot(`navy nfl nfl--${model.kind.replace("nfl-", "")}`, slide || {}, "none");
    const frame = h("div", "nfl-frame");
    const standings = model.kind === "nfl-standings";
    add(frame, header(model, anim, model.title, model.kicker, standings));
    add(root, frame);
    if (standings) renderStandings(model, frame, anim);
    else renderWeek(model, frame, anim);
    add(frame, footer(model));
    return root;
  }

  window.RamstarNFL = { load, toModel, render };

  const types = (window.RamstarTypes = window.RamstarTypes || {});
  ["nfl-scoreboard", "nfl-standings", "nfl-next"].forEach((name) => {
    types[name] = {
      load: (slide) => load(slide),
      render: (slide, model) => render(model, slide)
    };
  });
})();
