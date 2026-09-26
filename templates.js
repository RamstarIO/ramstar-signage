/*
 * Ramstar signage: template slide types.
 *
 * Each template from the design canvas is a slide type whose words come from
 * slides.json, so a new slide is a few lines of JSON: no design tool, no export.
 * Every part of a slide (tag, headline, details) rises in one after another,
 * the same entrance the weather slide uses.
 *
 *   { "type": "birthdays", "month": "October", "people": [{ "day": "3", "name": "Jane Doe" }] }
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
    return function anim(node) {
      if (!node) return node;
      node.classList.add("t-in");
      node.style.setProperty("--d", `${300 + step * 300}ms`);
      step += 1;
      return node;
    };
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

  function slideRoot(theme) {
    return h("div", `t-slide t-slide--${theme}`);
  }

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
  function countUp(node, finalText, delayMs) {
    const digits = String(finalText).replace(/,/g, "");
    if (!/^\d+$/.test(digits)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(digits);
    const withCommas = String(finalText).includes(",");
    const format = (n) => (withCommas ? n.toLocaleString("en-US") : String(n));
    node.textContent = format(0);
    setTimeout(() => {
      const start = performance.now();
      const duration = 1400;
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        node.textContent = format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }, delayMs);
  }

  // ---------- Birthdays ----------

  types.birthdays = {
    render(slide) {
      const anim = sequencer();
      const month = slide.month || new Date().toLocaleDateString("en-US", { month: "long" });
      const people = Array.isArray(slide.people) ? slide.people.slice(0, 8) : [];
      const root = slideRoot("navy");
      add(root, star("t-star--birthdays", "#194B98"));

      const frame = h("div", "t-frame t-frame--birthdays");
      add(frame,
        anim(tag(slide.tag || "Birthdays")),
        anim(withAccent("t-title t-title--150", slide.headline || `Happy Birthday\n*${month}*`))
      );
      const grid = anim(h("div", `t-names${people.length > 4 ? " t-names--many" : ""}`));
      people.forEach((p) => {
        const row = h("div", "t-name");
        add(row, h("span", "t-name-day", p.day), h("span", "t-name-text", p.name));
        grid.appendChild(row);
      });
      add(frame, grid);
      add(root, frame, logoBadge("right"));
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
      const root = slideRoot("light t-slide--split");
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
        anim(h("h1", "t-title t-title--128", slide.name)),
        slide.since ? anim(h("div", "t-kicker", `Partners since ${slide.since}`)) : null,
        slide.blurb ? anim(h("p", "t-body t-body--50", slide.blurb)) : null
      );
      add(root, left, right, logoBadge("right"));
      return root;
    }
  };

  // ---------- Milestone ----------

  types.milestone = {
    render(slide) {
      const anim = sequencer();
      const root = slideRoot("navy");
      add(root, star("t-star--milestone", "#194B98"));
      const frame = h("div", "t-frame t-frame--center");
      const number = anim(h("div", "t-big-number", slide.number));
      add(frame,
        anim(tag(slide.tag || "Milestone")),
        number,
        anim(h("div", "t-milestone-label", slide.label)),
        slide.note ? anim(h("p", "t-body t-body--48 t-muted", slide.note)) : null
      );
      countUp(number, slide.number || "", 600);
      add(root, frame, logoBadge("right"));
      return root;
    }
  };

  // ---------- Company value ----------

  types.value = {
    render(slide) {
      const anim = sequencer();
      const root = slideRoot("light");
      add(root, star("t-star--value", "#E3DED5"));
      const frame = h("div", "t-frame t-frame--value");
      const head = h("div", "t-row");
      add(head, tag(slide.tag || "Our Values", "navy"), slide.index ? h("div", "t-index", slide.index) : null);
      add(frame,
        anim(head),
        anim(h("h1", "t-title t-title--200", slide.name)),
        anim(h("div", "t-rule")),
        slide.meaning ? anim(h("p", "t-body t-body--58", slide.meaning)) : null
      );
      if (slide.example) {
        const ex = h("p", "t-body t-body--44 t-blue t-example");
        add(ex, h("span", "t-strong", "In action: "), document.createTextNode(slide.example));
        add(frame, anim(ex));
      }
      add(root, frame, logoBadge("right"));
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
      const root = slideRoot("navy t-slide--event");

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
        add(side, anim(h("div", "t-event-today", "Today")));
      } else if (left !== null) {
        const n = anim(h("div", "t-event-n", String(left)));
        add(side, n, anim(h("div", "t-event-unit", left === 1 ? "Day to go" : "Days to go")));
      } else {
        add(side, anim(h("div", "t-event-unit", "Save the date")));
      }
      add(root, main, side, logoBadge("left"));
      return root;
    }
  };

  // ---------- Safety ----------

  types.safety = {
    render(slide) {
      const anim = sequencer();
      const root = slideRoot("orange");
      add(root, star("t-star--safety", "#FFAE4A"));
      const frame = h("div", "t-frame t-frame--safety");

      // Either a fixed number ("days": 123) or computed from the last incident date ("since").
      let days = slide.days;
      const since = parseDay(slide.since);
      if (since) days = Math.max(0, daysBetween(since, today()));

      const counter = h("div", "t-safety-counter");
      const number = h("div", "t-safety-number", days !== undefined ? String(days) : "");
      add(counter, number, withAccent("t-safety-label", slide.label || "Days without a\nlost-time incident"));
      add(frame, anim(tag(slide.tag || "Safety First", "navy")), anim(counter));
      if (days !== undefined) countUp(number, String(days), 600);

      if (slide.tip) {
        const tip = h("div", "t-safety-tip");
        add(tip, h("div", "t-safety-tip-label", slide.tipLabel || "Tip of the week"), h("div", "t-safety-tip-text", slide.tip));
        add(frame, anim(tip));
      }
      add(root, frame, logoBadge("right"));
      return root;
    }
  };
})();
