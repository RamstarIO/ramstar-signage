/*
 * Ramstar signage: template slide types.
 *
 * Each template from the design canvas is a slide type whose words come from
 * slides.json, so a new slide is a few lines of JSON: no design tool, no export.
 * Every part of a slide (tag, headline, details) rises in one after another,
 * the same entrance the weather slide uses.
 *
 *   { "type": "birthdays", "month": "October", "decor": "balloons", "people": [{ "day": "Sat 3", "name": "Jane Doe" }] }
 *   ("title" is only your label in slides.json; use "headline" to change a heading.)
 *   { "type": "spotlight", "kind": "Customer", "name": "Acme Fab", "since": "2012",
 *     "blurb": "Laser-cut brackets every week.", "logo": "slides/logos/acme.png" }
 *   { "type": "milestone", "number": "100,000", "label": "Cuts completed", "note": "This year. Thank you, team." }
 *   { "type": "value", "index": "1 of 5", "name": "Safety", "meaning": "...", "example": "..." }
 *   { "type": "event", "name": "Fall BBQ", "date": "2026-10-17", "time": "12:00 PM",
 *     "location": "Shop floor", "note": "Burgers on us." }
 *   { "type": "safety", "since": "2026-01-12", "tip": "Gloves on for every cut." }
 *
 * Each type is { render(slide, data), load?(slide), isActive?(slide) } and is
 * registered on window.RamstarTypes, which the player (index.html) looks up.
 */
(function () {
  "use strict";

  const types = (window.RamstarTypes = window.RamstarTypes || {});
  const DAY_MS = 24 * 60 * 60 * 1000;
  const LOGO = "assets/ramstar-logo.png";
  const STAR_POINTS = "50,2 61.76,33.82 95.65,35.17 69.02,56.18 78.21,88.83 50,70 21.79,88.83 30.98,56.18 4.35,35.17 38.24,33.82";

  // ---------- small helpers ----------

  // Creates an element. Text is always set with textContent, never as HTML,
  // so nothing typed into slides.json can inject markup into the page.
  function h(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null && text !== "") node.textContent = String(text);
    return node;
  }

  function add(parent, ...children) {
    children.forEach((c) => { if (c) parent.appendChild(c); });
    return parent;
  }

  // Marks elements to rise in, in the order this is called: 300 ms, 600 ms, ...
  function sequencer() {
    let step = 0;
    function anim(node) {
      if (!node) return node;
      node.classList.add("t-in");
      node.style.setProperty("--d", `${300 + step * 300}ms`);
      step += 1;
      return node;
    }
    // When the last part has nearly finished rising in (ms after the slide appears).
    anim.lastLands = () => 300 + Math.max(0, step - 1) * 300 + 500;
    return anim;
  }

  // The background star fades in last, once every part has arrived.
  function starLast(root, anim) {
    root.style.setProperty("--star-at", `${anim.lastLands()}ms`);
    return root;
  }

  function star(className, color) {
    const wrap = h("div", `t-star ${className}`);
    wrap.innerHTML = `<svg viewBox="0 0 100 100" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><polygon points="${STAR_POINTS}"/></svg>`;
    return wrap;
  }

  function logoBadge(position) {
    const badge = h("div", `t-logo t-logo--${position || "right"}`);
    const img = h("img");
    img.src = LOGO;
    img.alt = "Ramstar";
    badge.appendChild(img);
    return badge;
  }

  function tag(text, variant) {
    return h("div", `t-tag${variant ? " t-tag--" + variant : ""}`, text);
  }

  // "Happy *October*" -> October highlighted.
  function withAccent(className, text) {
    const node = h("h1", className);
    String(text || "").split(/(\*[^*]+\*)/).forEach((part) => {
      if (!part) return;
      if (part.startsWith("*") && part.endsWith("*")) node.appendChild(h("span", "t-accent", part.slice(1, -1)));
      else node.appendChild(document.createTextNode(part));
    });
    return node;
  }

  // Wraps a slide's hero text in a span so the ambient "steel sheen" can sweep across it.
  function hero(tag, className, text) {
    const node = h(tag, className);
    const span = makeHero(h("span", null, text));
    node.appendChild(span);
    node.heroSpan = span;
    return node;
  }

  // Turns a text span into "hero" text that can carry the sheen:
  //   <span class="t-hero">
  //     <span class="t-hero-text">OCTOBER</span>
  //     <span class="t-sheen" aria-hidden="true"><span class="t-sheen-text">OCTOBER</span></span>
  //   </span>
  // The sheen is a copy of the text in the highlight colour, seen through a
  // narrow masked window that slides across. Only transforms move, so the
  // graphics chip does all the work and nothing is repainted (Fire Stick-friendly).
  function makeHero(span) {
    const text = span.textContent;
    span.classList.add("t-hero");
    span.replaceChildren(h("span", "t-hero-text", text));
    const sheen = h("span", "t-sheen");
    sheen.setAttribute("aria-hidden", "true");
    sheen.appendChild(h("span", "t-sheen-text", text));
    span.appendChild(sheen);
    return span;
  }

  // Updates hero text (and its sheen copy) in place.
  function setHeroText(span, text) {
    span.querySelectorAll(".t-hero-text, .t-sheen-text").forEach((n) => { n.textContent = text; });
  }
  window.RamstarHero = { makeHero, setHeroText };

  // "moment" = the one attention-catching event just before halfway through a slide:
  //   "sheen" (a glint across the hero text) or "beat" (a type-specific pulse),
  //   or "none". Each type has a default; a slide can override it with "moment".
  function slideRoot(theme, slide, defaultMoment) {
    const moment = (slide && slide.moment) || defaultMoment || "none";
    return h("div", `t-slide t-slide--${theme} m-${moment}`);
  }

  // Shared with other slide-type files (nfl.js), so every slide is built the same way.
  window.RamstarTemplates = { h, add, sequencer, starLast, star, logoBadge, tag, slideRoot };

  // Local midnight for "YYYY-MM-DD" (avoids the UTC off-by-one of new Date("2026-10-17")).
  function parseDay(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }

  function today() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function daysBetween(from, to) {
    return Math.round((to - from) / DAY_MS);
  }

  function preload(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
  }

  // Counts a number up from 0 once the element has risen in.
  // Changing text forces the browser to lay out and repaint it, so the count
  // ticks about 12 times a second (like a mechanical counter) rather than on
  // every frame. That's ~6x less work on a Fire Stick, and it still reads as
  // a smooth count.
  const COUNT_TICK_MS = 80;
  function countUp(heroSpan, finalText, delayMs) {
    const digits = String(finalText).replace(/,/g, "");
    if (!/^\d+$/.test(digits)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(digits);
    const withCommas = String(finalText).includes(",");
    const format = (n) => (withCommas ? n.toLocaleString("en-US") : String(n));
    setHeroText(heroSpan, format(0));
    setTimeout(() => {
      const start = performance.now();
      const duration = 1400;
      const timer = setInterval(() => {
        const t = Math.min(1, (performance.now() - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setHeroText(heroSpan, format(Math.round(target * eased)));
        if (t >= 1) clearInterval(timer);
      }, COUNT_TICK_MS);
    }, delayMs);
  }

  // ---------- Birthdays ----------

  // ---------- Birthday decorations ----------
  // Background party touches behind the birthday names: "balloons" (faded
  // balloons rising), "confetti" (slow falling confetti), "cake" (a line-drawn
  // cake with flickering candles), or "none". Every moving piece is its own
  // small layer that only moves, turns or fades (the Fire Stick rule).

  const BD_COLORS = { orange: "#F7941D", white: "#FFFFFF", sky: "#6C9BE0", blue: "#3D7BDB" };

  // left px, width px, opacity, rise seconds, head start (0-1), colour, sway direction
  // Faded balloons are kept to blues and white on purpose: see-through orange
  // over navy mixes to a muddy brown, while blue-on-navy stays clean.
  const BALLOONS = [
    [90, 150, 0.26, 19, 0.05, "blue", "l"],
    [300, 120, 0.20, 23, 0.62, "sky", "r"],
    [500, 170, 0.14, 21, 0.33, "white", "l"],
    [720, 125, 0.22, 25, 0.84, "sky", "r"],
    [920, 185, 0.28, 18, 0.18, "blue", "l"],
    [1130, 135, 0.14, 22, 0.70, "white", "r"],
    [1330, 200, 0.24, 20, 0.45, "sky", "l"],
    [1560, 140, 0.28, 24, 0.93, "blue", "r"],
    [1740, 175, 0.15, 21, 0.25, "white", "l"],
    [1450, 110, 0.20, 26, 0.10, "sky", "r"],
  ];

  function balloonSvg() {
    return `<svg viewBox="0 0 100 200" aria-hidden="true">
      <path d="M50 4C24 4 8 26 8 52c0 30 24 52 42 58 18-6 42-28 42-58C92 26 76 4 50 4z" fill="currentColor"/>
      <ellipse cx="33" cy="34" rx="9" ry="15" transform="rotate(25 33 34)" fill="#FFFFFF" opacity="0.35"/>
      <path d="M44 117l6-8 6 8z" fill="currentColor"/>
      <path d="M50 117c-9 22 9 40-2 80" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  const CONFETTI_COUNT = 30;

  // Tiny repeatable random numbers, so the confetti lands the same way every time.
  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cakeSvg() {
    // Outline-only, like the star watermark. Flames are separate (they move).
    return `<svg viewBox="0 0 400 460" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="5">
        <path d="M14 440h372"/>
        <rect x="46" y="300" width="308" height="130" rx="12"/>
        <rect x="96" y="200" width="208" height="100" rx="10"/>
        <rect x="140" y="128" width="16" height="72" rx="3"/>
        <rect x="192" y="118" width="16" height="82" rx="3"/>
        <rect x="244" y="128" width="16" height="72" rx="3"/>
      </g>
      <g stroke="#F7941D" stroke-width="5">
        <path d="M46 326c20 0 20 22 38 22s18-22 38-22 20 30 38 30 18-30 38-30 20 22 38 22 18-22 38-22 20 26 38 26 18-26 30-26"/>
        <path d="M96 222c16 0 16 18 30 18s14-18 30-18 16 24 30 24 14-24 30-24 16 18 30 18 14-18 28-18 10 14 20 14"/>
      </g>
      <g fill="#F7941D" fill-opacity="0.8" stroke="none">
        <circle cx="96" cy="392" r="6"/><circle cx="160" cy="392" r="6"/><circle cx="224" cy="392" r="6"/>
        <circle cx="288" cy="392" r="6"/><circle cx="140" cy="266" r="5"/><circle cx="200" cy="266" r="5"/><circle cx="260" cy="266" r="5"/>
      </g>
    </svg>`;
  }

  function sparkleSvg(color) {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 0c2 12 8 18 20 20-12 2-18 8-20 20-2-12-8-18-20-20 12-2 18-8 20-20z" fill="${color}"/></svg>`;
  }

  function birthdayDecor(kind) {
    const wrap = h("div", `bd-decor bd-decor--${kind}`);
    if (kind === "balloons") {
      BALLOONS.forEach(([left, width, opacity, secs, head, color, dir]) => {
        const rise = h("div", "bd-balloon");
        rise.style.cssText = `left:${left}px;width:${width}px;height:${width * 2}px;opacity:${opacity};` +
          `color:${BD_COLORS[color]};animation-duration:${secs}s;animation-delay:${(-head * secs).toFixed(2)}s`;
        const sway = h("div", `bd-sway bd-sway--${dir}`);
        sway.style.animationDuration = `${(secs / 4).toFixed(2)}s`;
        sway.innerHTML = balloonSvg();
        rise.appendChild(sway);
        wrap.appendChild(rise);
      });
    } else if (kind === "confetti") {
      const rnd = seeded(1951);
      const colors = ["orange", "orange", "white", "sky"];
      for (let i = 0; i < CONFETTI_COUNT; i++) {
        const fall = h("div", `bd-confetti bd-confetti--${i % 2 ? "r" : "l"}`);
        const secs = 11 + rnd() * 7;
        const left = Math.round(40 + (i / CONFETTI_COUNT) * 1840 + rnd() * 60);
        fall.style.cssText = `left:${left}px;animation-duration:${secs.toFixed(2)}s;` +
          `animation-delay:${(-rnd() * secs).toFixed(2)}s`;
        const bit = h("div", "bd-bit");
        const round = rnd() < 0.3;
        const w = round ? 20 : 16 + Math.round(rnd() * 10);
        const ht = round ? 20 : 30 + Math.round(rnd() * 14);
        bit.style.cssText = `width:${w}px;height:${ht}px;border-radius:${round ? "50%" : "3px"};` +
          `background:${BD_COLORS[colors[Math.floor(rnd() * colors.length)]]};` +
          `opacity:${(0.7 + rnd() * 0.25).toFixed(2)};animation-duration:${(2.6 + rnd() * 2.4).toFixed(2)}s`;
        fall.appendChild(bit);
        wrap.appendChild(fall);
      }
    } else if (kind === "cake") {
      const cake = h("div", "bd-cake");
      cake.innerHTML = cakeSvg();
      // Flame centres in cake coordinates (candle tops)
      [[148, 128], [200, 118], [252, 128]].forEach(([x, y], i) => {
        const glow = h("div", "bd-glow");
        glow.style.cssText = `left:${x - 45}px;top:${y - 80}px;animation-delay:${i * 0.37}s`;
        const flame = h("div", "bd-flame");
        flame.style.cssText = `left:${x - 13}px;top:${y - 46}px;animation-delay:${i * 0.23}s`;
        flame.innerHTML = `<svg viewBox="0 0 26 44" aria-hidden="true"><path d="M13 0C17 12 26 20 26 30a13 13 0 0 1-26 0C0 20 9 12 13 0z" fill="#F7941D"/><path d="M13 16c2 6 6 10 6 16a6 6 0 0 1-12 0c0-6 4-10 6-16z" fill="#FFE2B8"/></svg>`;
        add(cake, glow, flame);
      });
      // Sparkles around the cake: left px, top px, size, colour, delay s
      [[-20, 40, 34, "#F7941D", 0], [360, 10, 26, "#FFFFFF", 0.9], [400, 200, 38, "#F7941D", 1.8],
       [-60, 250, 24, "#FFFFFF", 2.5], [330, 330, 20, "#6C9BE0", 1.3], [60, -40, 22, "#6C9BE0", 3.1]]
        .forEach(([x, y, size, color, delay]) => {
          const sp = h("div", "bd-sparkle");
          sp.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;animation-delay:${delay}s`;
          sp.innerHTML = sparkleSvg(color);
          cake.appendChild(sp);
        });
      wrap.appendChild(cake);
    }
    return wrap;
  }

  types.birthdays = {
    render(slide) {
      const anim = sequencer();
      const month = slide.month || new Date().toLocaleDateString("en-US", { month: "long" });
      const people = Array.isArray(slide.people) ? slide.people.slice(0, 8) : [];
      const decor = ["balloons", "confetti", "cake", "none"].includes(slide.decor) ? slide.decor : "balloons";
      const root = slideRoot("navy", slide, "beat");
      add(root, star("t-star--birthdays", "#194B98"));
      if (decor !== "none") add(root, birthdayDecor(decor));

      const frame = h("div", "t-frame t-frame--birthdays");
      add(frame,
        anim(tag(slide.tag || "Birthdays")),
        anim(withAccent("t-title t-title--150", slide.headline || `Happy Birthday\n*${month}*`))
      );
      const accent = frame.querySelector(".t-accent");
      if (accent) makeHero(accent);
      const grid = anim(h("div", `t-names${people.length > 4 ? " t-names--many" : ""}`));
      people.forEach((p, i) => {
        const row = h("div", "t-name");
        row.style.setProperty("--i", i); // the beat bumps each name in turn
        const name = h("span", "t-name-text", p.name);
        name.dataset.label = p.name; // drawn again, orange, for the beat's highlight
        add(row, h("span", "t-name-day", p.day), name);
        grid.appendChild(row);
      });
      add(frame, grid);
      add(root, frame, logoBadge("right"));
      starLast(root, anim);
      return root;
    }
  };

  // ---------- Customer / Supplier spotlight ----------

  types.spotlight = {
    load(slide) {
      return slide.logo ? preload(slide.logo) : null;
    },
    render(slide) {
      const anim = sequencer();
      const root = slideRoot("light t-slide--split", slide, "sheen");
      const left = h("div", "t-spot-left");
      add(left, star("t-star--spotlight", "#194B98"));
      const box = anim(h("div", "t-spot-logo"));
      if (slide.logo) {
        const img = h("img");
        img.src = slide.logo;
        img.alt = slide.name || "";
        box.appendChild(img);
      } else {
        box.appendChild(h("span", "t-spot-logo-text", slide.name || ""));
      }
      add(left, box);

      const right = h("div", "t-spot-right");
      add(right,
        anim(tag(slide.tag || `${slide.kind || "Customer"} Spotlight`)),
        anim(hero("h1", "t-title t-title--128", slide.name)),
        slide.since ? anim(h("div", "t-kicker", `Partners since ${slide.since}`)) : null,
        slide.blurb ? anim(h("p", "t-body t-body--50", slide.blurb)) : null
      );
      add(root, left, right, logoBadge("right"));
      starLast(root, anim);
      return root;
    }
  };

  // ---------- Milestone ----------

  types.milestone = {
    render(slide) {
      const anim = sequencer();
      const root = slideRoot("navy", slide, "beat");
      add(root, star("t-star--milestone", "#194B98"));
      const frame = h("div", "t-frame t-frame--center");
      const number = anim(hero("div", "t-big-number", slide.number));
      add(frame,
        anim(tag(slide.tag || "Milestone")),
        number,
        anim(h("div", "t-milestone-label", slide.label)),
        slide.note ? anim(h("p", "t-body t-body--48 t-muted", slide.note)) : null
      );
      countUp(number.heroSpan, slide.number || "", 600);
      add(root, frame, logoBadge("right"));
      starLast(root, anim);
      return root;
    }
  };

  // ---------- Company value ----------

  types.value = {
    render(slide) {
      const anim = sequencer();
      const root = slideRoot("light", slide, "sheen");
      add(root, star("t-star--value", "#E3DED5"));
      const frame = h("div", "t-frame t-frame--value");
      const head = h("div", "t-row");
      add(head, tag(slide.tag || "Our Values", "navy"), slide.index ? h("div", "t-index", slide.index) : null);
      add(frame,
        anim(head),
        anim(hero("h1", "t-title t-title--200", slide.name)),
        anim(h("div", "t-rule")),
        slide.meaning ? anim(h("p", "t-body t-body--58", slide.meaning)) : null
      );
      if (slide.example) {
        const ex = h("p", "t-body t-body--44 t-blue t-example");
        add(ex, h("span", "t-strong", "In action: "), document.createTextNode(slide.example));
        add(frame, anim(ex));
      }
      add(root, frame, logoBadge("right"));
      starLast(root, anim);
      return root;
    }
  };

  // ---------- Event countdown ----------

  types.event = {
    // Hide automatically after the event day unless an explicit "end" is set.
    isActive(slide) {
      const day = parseDay(slide.date);
      if (!day || slide.end) return true;
      return today() <= day;
    },
    render(slide) {
      const anim = sequencer();
      const day = parseDay(slide.date);
      const left = day ? daysBetween(today(), day) : null;
      const root = slideRoot("navy t-slide--event", slide, "beat");

      const main = h("div", "t-event-main");
      const when = h("div", "t-event-when");
      add(when,
        day ? h("div", null, day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })) : null,
        (slide.time || slide.location)
          ? h("div", "t-muted", [slide.time, slide.location].filter(Boolean).join(" · "))
          : null
      );
      add(main,
        anim(tag(slide.tag || "Coming Up")),
        anim(h("h1", "t-title t-title--150", slide.name)),
        anim(when),
        slide.note ? anim(h("p", "t-body t-body--44 t-muted", slide.note)) : null
      );

      const side = h("div", "t-event-side");
      add(side, star("t-star--event", "#FFAE4A"));
      if (left === 0) {
        add(side, anim(hero("div", "t-event-today", "Today")));
      } else if (left !== null) {
        const n = anim(hero("div", "t-event-n", String(left)));
        add(side, n, anim(h("div", "t-event-unit", left === 1 ? "Day to go" : "Days to go")));
      } else {
        add(side, anim(h("div", "t-event-unit", "Save the date")));
      }
      add(root, main, side, logoBadge("left"));
      starLast(root, anim);
      return root;
    }
  };

  // ---------- Safety ----------

  types.safety = {
    render(slide) {
      const anim = sequencer();
      const root = slideRoot("orange", slide, "beat");
      add(root, star("t-star--safety", "#FFAE4A"));
      const frame = h("div", "t-frame t-frame--safety");

      // Either a fixed number ("days": 123) or computed from the last incident date ("since").
      let days = slide.days;
      const since = parseDay(slide.since);
      if (since) days = Math.max(0, daysBetween(since, today()));

      const counter = h("div", "t-safety-counter");
      const number = hero("div", "t-safety-number", days !== undefined ? String(days) : "");
      add(counter, number, withAccent("t-safety-label", slide.label || "Days without a\nlost-time incident"));
      add(frame, anim(tag(slide.tag || "Safety First", "navy")), anim(counter));
      if (days !== undefined) countUp(number.heroSpan, String(days), 600);

      if (slide.tip) {
        const tip = h("div", "t-safety-tip");
        const tipLabel = h("div", "t-safety-tip-label", slide.tipLabel || "Tip of the week");
        tipLabel.dataset.label = tipLabel.textContent; // drawn again, white, for the beat's flash
        add(tip, tipLabel, h("div", "t-safety-tip-text", slide.tip));
        add(frame, anim(tip));
      }
      add(root, frame, logoBadge("right"));
      starLast(root, anim);
      return root;
    }
  };
  // ---------- Logo ----------
  //   { "type": "logo", "intro": "rise" | "wipe" | "words" | "assemble" | "glint",
  //     "slogan": "Unmatched Service & Technology" }
  // "intro" can also be a list, e.g. ["rise", "wipe", "glint"]: the slide then
  // uses the next intro in the list each time it comes round in the loop.
  // Logo slides hide the progress bar for a clean look (class no-progress).
  // A brand break between content slides: the logo, a slogan between two
  // orange rules, and the star. "intro" picks how it arrives. Every intro
  // animates only movement and fading, so it's smooth on the Fire Sticks.
  // The mid-slide moment is a glint of light across the logo itself.
  const LOGO_INTROS = ["rise", "wipe", "words", "assemble", "glint"];
  const INTRO_ALIASES = { star: "words" }; // "star" was the old name for "words"
  const introTurns = new Map();            // how many times each intro list has been shown

  // Picks this showing's intro: a single name, or the next one from a list.
  function pickIntro(slide) {
    const list = (Array.isArray(slide.intro) ? slide.intro : [slide.intro])
      .map((name) => INTRO_ALIASES[name] || name)
      .filter((name) => LOGO_INTROS.includes(name));
    if (list.length === 0) return "rise";
    const key = list.join(",");
    const turn = introTurns.get(key) || 0;
    introTurns.set(key, turn + 1);
    return list[turn % list.length];
  }

  // A light band that sweeps across the logo, shown only where the logo has
  // pixels (the logo image is used as a fixed mask; only the band moves).
  function logoGlint(src, which) {
    const glint = h("div", `lg-glint lg-glint--${which}`);
    glint.setAttribute("aria-hidden", "true");
    const mask = `url("${src}")`;
    glint.style.webkitMaskImage = mask;
    glint.style.maskImage = mask;
    glint.appendChild(h("div", "lg-glint-band"));
    return glint;
  }

  types.logo = {
    load(slide) {
      return preload(slide.logo || LOGO);
    },
    render(slide) {
      const src = slide.logo || LOGO;
      const intro = pickIntro(slide);
      const slogan = slide.slogan || "Unmatched Service & Technology";
      const root = slideRoot(`light lg lg--${intro} no-progress`, slide, "sheen");

      // Background star: the corner watermark, which fades in last.
      root.appendChild(star("t-star--logo", "#E3DED5"));

      const stack = h("div", "lg-stack");

      const logoWrap = h("div", "lg-logo-wrap lg-part");
      const img = h("img", "lg-logo");
      img.src = src;
      img.alt = "Ramstar";
      logoWrap.appendChild(img);
      if (intro === "glint") logoWrap.appendChild(logoGlint(src, "intro"));
      logoWrap.appendChild(logoGlint(src, "moment"));

      const line = h("div", "lg-line");
      const ruleL = h("div", "lg-rule lg-rule--l lg-part");
      const ruleR = h("div", "lg-rule lg-rule--r lg-part");
      const sloganEl = h("div", "lg-slogan");

      if (intro === "wipe") {
        // Revealed by a window sliding right while the text inside slides
        // left by the same amount: the text stays put and appears to be uncovered.
        const win = h("span", "lg-wipe lg-part");
        win.appendChild(h("span", "lg-wipe-in", slogan));
        sloganEl.appendChild(win);
      } else if (intro === "assemble") {
        // Two halves slide in from opposite sides and meet in the middle.
        const words = slogan.split(" ");
        const cut = Math.ceil(words.length / 2);
        sloganEl.appendChild(h("span", "lg-half lg-half--a lg-part", words.slice(0, cut).join(" ")));
        sloganEl.appendChild(document.createTextNode(" "));
        sloganEl.appendChild(h("span", "lg-half lg-half--b lg-part", words.slice(cut).join(" ")));
      } else if (intro === "words") {
        // Word by word.
        slogan.split(" ").forEach((w, i, all) => {
          const word = h("span", "lg-w lg-part", w);
          word.style.setProperty("--i", String(i));
          sloganEl.appendChild(word);
          if (i < all.length - 1) sloganEl.appendChild(document.createTextNode(" "));
        });
      } else {
        sloganEl.classList.add("lg-part");
        sloganEl.textContent = slogan;
      }

      add(line, ruleL, sloganEl, ruleR);
      add(stack, logoWrap, line);
      root.appendChild(stack);
      root.style.setProperty("--star-at", "2600ms");
      return root;
    }
  };

})();
