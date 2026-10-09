/*
 * Ramstar signage: the welcome screen ("welcome mode").
 *
 * Not a playlist slide: the player (index.html) reads welcome.json every 30 s
 * and, while welcome mode is active, shows only this screen. It is registered
 * as a slide type so the player's normal crossfade brings it in and out.
 *
 *   welcome.json: { "on": true, "guest": "Acme Fabrication", "people": "Jane Doe & Sam Patel",
 *                   "from": "2026-10-09T09:00", "until": "2026-10-09T15:00" }
 *
 * Layout, sizes and the fit rule follow docs/design/welcome/welcome.html.
 */
(function () {
  "use strict";

  const types = (window.RamstarTypes = window.RamstarTypes || {});
  const { h, add, sequencer, starLast, star, slideRoot } = window.RamstarTemplates;

  const LOGO_REVERSE = "assets/ramstar-logo-reverse.png"; // white outline and star, for navy
  const GUEST_FONT = '800 200px "Barlow Condensed"';
  // Fit rule: the guest name stays on ONE line; shrink from 200 px in 4 px
  // steps until it fits 1600 px, but never below 110 px.
  const FIT = { max: 200, step: 4, width: 1600, min: 110 };

  // Font size (px) at which the guest name fits on one line. Measured once,
  // in a hidden copy on the page, because the slide isn't on the page yet.
  function fitGuest(text) {
    const probe = h("div", "t-slide t-welcome-probe");
    const name = add(probe, h("h1", "t-welcome-guest", text)).firstChild;
    document.body.appendChild(probe);
    let fs = FIT.max;
    name.style.fontSize = `${fs}px`;
    while (name.scrollWidth > FIT.width && fs > FIT.min) {
      fs -= FIT.step;
      name.style.fontSize = `${fs}px`;
    }
    probe.remove();
    return fs;
  }

  // A star with a brighter copy of its outline on top. The copy fades in and
  // out to make the star pulse (opacity only, no colour animation).
  function pulsingStar(className, color, glowColor) {
    const wrap = star(className, color);
    const glow = wrap.firstChild.cloneNode(true);
    glow.classList.add("t-star-glow");
    glow.setAttribute("stroke", glowColor);
    wrap.appendChild(glow);
    return wrap;
  }

  types.welcome = {
    // Wait for the headline font, so the fit is measured with the real letters.
    async load() {
      if (document.fonts && document.fonts.load) {
        try { await document.fonts.load(GUEST_FONT); } catch (e) { /* measure with what we have */ }
      }
      return null;
    },

    render(slide) {
      const guest = String(slide.guest || "").trim() || "Our Guests";
      const people = String(slide.people || "").trim();

      const root = slideRoot("navy", slide, "none");
      root.classList.add("t-slide--welcome", "no-progress");
      add(root, pulsingStar("t-star--welcome-a", "#194B98", "#3A72C8"), pulsingStar("t-star--welcome-b", "#163A72", "#2C5DA8"));

      const anim = sequencer();
      const col = h("div", "t-welcome-col");
      const name = h("h1", "t-welcome-guest", guest);
      name.style.fontSize = `${fitGuest(guest)}px`;
      add(col,
        anim(h("div", "t-welcome-kicker", "Welcome")),
        anim(name),
        anim(h("div", "t-welcome-rule")),
        people ? anim(h("p", "t-welcome-people", people)) : null,
        anim(h("p", "t-welcome-glad", "We're glad you're here.")));

      const logo = h("img", "t-welcome-logo");
      logo.src = LOGO_REVERSE;
      logo.alt = "Ramstar";
      add(root, col, anim(logo));
      return starLast(root, anim);
    }
  };
})();
