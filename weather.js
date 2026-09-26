/*
 * Ramstar signage: live weather slide.
 *
 * Data: Environment and Climate Change Canada (ECCC) city page weather,
 * served by MSC GeoMet's OGC API. Free, no API key, commercial use allowed
 * with attribution (shown on the slide).
 *
 * Used from slides.json as:
 *   { "type": "weather", "station": "on-94", "label": "Oldcastle, ON" }
 *
 * The player calls:
 *   RamstarWeather.load(slide)   -> Promise<model>   (network, cached)
 *   RamstarWeather.render(model) -> HTMLElement      (pure, no network)
 * Keeping "get the data" and "draw the data" separate means the drawing can
 * be tested with a saved JSON file (see tests/).
 */
(function () {
  "use strict";

  const API = "https://api.weather.gc.ca/collections/citypageweather-realtime/items/";
  const CACHE_MINUTES = 15;        // fetch at most this often per TV
  const MAX_STALE_HOURS = 6;       // after this, stop showing old data
  const cache = new Map();         // station -> { model, fetchedAt }

  // ---------- reading ECCC's JSON ----------
  // ECCC wraps values as {"value": {"en": 13.8, "fr": 13.8}} or {"en": "Cloudy"}.
  function en(x) {
    if (x === null || x === undefined) return undefined;
    if (typeof x !== "object") return x;
    if ("value" in x) return en(x.value);
    if ("en" in x) return x.en;
    return undefined;
  }

  function num(x) {
    const v = Number(en(x));
    return Number.isFinite(v) ? v : null;
  }

  function tempOf(period, cls) {
    const list = period && period.temperatures && period.temperatures.temperature;
    const t = (Array.isArray(list) ? list : []).find((item) => en(item.class) === cls);
    return t ? num(t) : null;
  }

  // Maps ECCC icon codes (https://weather.gc.ca/weathericons/NN.gif) to our icon set.
  function iconType(code) {
    const c = Number(code);
    if ([0, 1].includes(c)) return "sun";
    if ([2, 3, 4, 5, 22].includes(c)) return "partly";
    if ([6, 11, 12, 13, 28, 36].includes(c)) return "rain";
    if ([7, 14, 15, 27, 37].includes(c)) return "mix";
    if ([8, 16, 17, 18, 25, 26, 38, 40].includes(c)) return "snow";
    if ([9, 19, 39, 41, 42, 46, 47, 48].includes(c)) return "thunder";
    if ([23, 24, 44, 45].includes(c)) return "fog";
    if ([30, 31].includes(c)) return "moon";
    if ([32, 33, 34, 35].includes(c)) return "partly-night";
    if (c === 43) return "wind";
    return "cloud";
  }

  function timeLabel(date) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function capitalise(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Turns the raw ECCC feature into exactly what the slide needs.
  function toModel(feature, slide, now) {
    const p = feature.properties || {};
    const cc = p.currentConditions || {};
    const forecasts = (p.forecastGroup && p.forecastGroup.forecasts) || [];
    const first = forecasts[0];
    const temp = num(cc.temperature);
    if (temp === null) throw new Error("Weather feed has no current temperature");

    // "Feels like": wind chill only when it's actually cold, humidex only when warm.
    let feels = null;
    const windChill = num(cc.windChill);
    const humidex = num(cc.humidex);
    if (temp <= 10 && windChill !== null && windChill < temp && windChill > temp - 30) feels = windChill;
    if (temp >= 20 && humidex !== null && humidex > temp) feels = humidex;

    // Today's range. After the day period has passed, ECCC starts with "Tonight".
    const firstIsDay = tempOf(first, "high") !== null;
    let range;
    if (firstIsDay) {
      const low = tempOf(forecasts[1], "low");
      range = `High ${Math.round(tempOf(first, "high"))}°` + (low !== null ? ` / Low ${Math.round(low)}°` : "");
    } else if (first) {
      range = `Tonight: low ${Math.round(tempOf(first, "low"))}°`;
    } else {
      range = "";
    }
    // One line each, so a long combination never wraps mid-phrase.
    const detail = [feels !== null ? `Feels like ${Math.round(feels)}°` : null, range].filter(Boolean);

    // Stats: wind, humidity, UV (or pressure), sunrise/sunset.
    const stats = [];
    const speed = num(cc.wind && cc.wind.speed);
    const gust = num(cc.wind && cc.wind.gust);
    const dir = en(cc.wind && cc.wind.direction) || "";
    if (speed !== null) {
      stats.push({
        label: gust !== null && gust >= speed + 10 ? `Wind · gusts ${Math.round(gust)}` : "Wind",
        value: speed === 0 ? "Calm" : `${Math.round(speed)} km/h ${dir}`.trim()
      });
    }
    const rh = num(cc.relativeHumidity);
    if (rh !== null) stats.push({ label: "Humidity", value: `${Math.round(rh)}%` });

    const uvIndex = forecasts.slice(0, 2).findIndex((f) => f && f.uv);
    if (uvIndex !== -1) {
      const uv = forecasts[uvIndex].uv;
      const isTomorrow = !firstIsDay;
      stats.push({
        label: isTomorrow ? "UV tomorrow" : "UV index",
        value: `${en(uv.index)} · ${capitalise(en(uv.category))}`
      });
    } else {
      const kpa = num(cc.pressure);
      if (kpa !== null) stats.push({ label: "Pressure", value: `${kpa.toFixed(1)} kPa` });
    }

    const rise = p.riseSet && new Date(en(p.riseSet.sunrise));
    const set = p.riseSet && new Date(en(p.riseSet.sunset));
    if (rise && !isNaN(rise) && now < rise) stats.push({ label: "Sunrise", value: timeLabel(rise) });
    else if (set && !isNaN(set)) stats.push({ label: "Sunset", value: timeLabel(set) });

    // Next five days: each daytime period, paired with the night that follows it.
    const days = [];
    forecasts.forEach((f, i) => {
      if (days.length >= 5) return;
      if (i === 0 && firstIsDay) return; // that's today, already shown above
      const high = tempOf(f, "high");
      if (high === null) return;
      const name = en(f.period && f.period.value) || en(f.period && f.period.textForecastName) || "";
      const pop = num(f.abbreviatedForecast && f.abbreviatedForecast.pop);
      days.push({
        name: name.slice(0, 3),
        icon: iconType(en(f.abbreviatedForecast && f.abbreviatedForecast.icon)),
        summary: en(f.abbreviatedForecast && f.abbreviatedForecast.textSummary) || "",
        high: Math.round(high),
        low: tempOf(forecasts[i + 1], "low"),
        pop: pop
      });
    });

    // Weather alerts (warnings, watches, statements).
    const warnings = Array.isArray(p.warnings) ? p.warnings : [];
    const alert = warnings.length
      ? (en(warnings[0].description) || en(warnings[0].type) || en(warnings[0].event) || "Weather alert in effect")
      : null;

    const observed = new Date(en(cc.timestamp) || p.lastUpdated || now);

    return {
      place: slide.label || en(p.name) || "",
      station: en(cc.station) || en(p.name) || "",
      temp: Math.round(temp),
      condition: en(cc.condition) || "",
      icon: iconType(en(cc.iconCode)),
      detail,
      stats: stats.slice(0, 4),
      days,
      alert,
      observed,
      today: now
    };
  }

  // ---------- network + cache ----------

  async function load(slide) {
    const station = slide.station || "on-94";
    const now = Date.now();
    const hit = cache.get(station);
    if (hit && now - hit.fetchedAt < CACHE_MINUTES * 60 * 1000) {
      return { ...hit.model, today: new Date() };
    }

    const url = slide.url || `${API}${encodeURIComponent(station)}?f=json&lang=en`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Weather feed returned HTTP ${response.status}`);
      const model = toModel(await response.json(), slide, new Date());
      cache.set(station, { model, fetchedAt: now });
      return model;
    } catch (err) {
      // Network blip: keep showing the last good data for a while.
      if (hit && now - hit.fetchedAt < MAX_STALE_HOURS * 60 * 60 * 1000) {
        console.warn("Weather refresh failed, using cached data:", err);
        return { ...hit.model, today: new Date() };
      }
      throw err;
    }
  }

  // ---------- drawing ----------

  const ORANGE = "#F7941D";
  const WHITE = "#FFFFFF";
  const RAIN = "#7FB2FF";

  const CLOUD_LOW = "M14 36h20a8 8 0 0 0 0-16 11 11 0 0 0-21-2A9 9 0 0 0 14 36z";
  const CLOUD_HIGH = "M14 30h20a8 8 0 0 0 0-16 11 11 0 0 0-21-2A9 9 0 0 0 14 30z";
  const CLOUD_SMALL = "M16 38h18a7 7 0 0 0 0-14 9.5 9.5 0 0 0-18-1.5A7.5 7.5 0 0 0 16 38z";
  const SUN_RAYS = "M24 6v4M24 38v4M6 24h4M38 24h4M11.3 11.3l2.8 2.8M33.9 33.9l2.8 2.8M11.3 36.7l2.8-2.8M33.9 14.1l2.8-2.8";

  // Static, trusted SVG markup only. No feed data ever goes into these strings.
  function iconSvg(type, size, strokeWidth) {
    const open = `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`;
    const parts = {
      "sun": `<circle cx="24" cy="24" r="8" stroke="${ORANGE}"/><path d="${SUN_RAYS}" stroke="${ORANGE}"/>`,
      "partly": `<circle cx="18" cy="16" r="6" stroke="${ORANGE}"/><path d="M18 5v2.5M8.5 9.5l1.8 1.8M5 16h2.5M27.5 9.5l-1.8 1.8" stroke="${ORANGE}"/><path d="${CLOUD_SMALL}" stroke="${WHITE}"/>`,
      "cloud": `<path d="${CLOUD_LOW}" stroke="${WHITE}"/>`,
      "rain": `<path d="${CLOUD_HIGH}" stroke="${WHITE}"/><path d="M18 35l-2 6M26 35l-2 6M34 35l-2 6" stroke="${RAIN}"/>`,
      "snow": `<path d="${CLOUD_HIGH}" stroke="${WHITE}"/><path d="M17 37v0M25 37v0M33 37v0M21 43v0M29 43v0" stroke="${WHITE}" stroke-width="${strokeWidth * 1.6}"/>`,
      "mix": `<path d="${CLOUD_HIGH}" stroke="${WHITE}"/><path d="M18 35l-2 6M30 35l-2 6" stroke="${RAIN}"/><path d="M24 38v0M34 43v0" stroke="${WHITE}" stroke-width="${strokeWidth * 1.6}"/>`,
      "thunder": `<path d="${CLOUD_HIGH}" stroke="${WHITE}"/><path d="M26 32l-5 8h6l-4 7" stroke="${ORANGE}"/>`,
      "fog": `<path d="M8 18h32M12 26h28M8 34h26M14 42h22" stroke="${WHITE}"/>`,
      "moon": `<path d="M30 9a15 15 0 1 0 9 26 12 12 0 1 1-9-26z" stroke="${ORANGE}"/>`,
      "partly-night": `<path d="M17 6a9 9 0 1 0 8 13 7 7 0 1 1-8-13z" stroke="${ORANGE}"/><path d="${CLOUD_SMALL}" stroke="${WHITE}"/>`,
      "wind": `<path d="M6 18h22a5 5 0 1 0-5-5M6 26h30a5 5 0 1 1-5 5M6 34h16" stroke="${WHITE}"/>`
    };
    return open + (parts[type] || parts.cloud) + "</svg>";
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function icon(type, size, strokeWidth, className) {
    const wrap = el("span", className);
    wrap.innerHTML = iconSvg(type, size, strokeWidth);
    return wrap;
  }

  const STAR = '<svg viewBox="0 0 100 100" fill="none" stroke="#194B98" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><polygon points="50,2 61.76,33.82 95.65,35.17 69.02,56.18 78.21,88.83 50,70 21.79,88.83 30.98,56.18 4.35,35.17 38.24,33.82"/></svg>';

  // Builds Design A ("Big Number") at a fixed 1920x1080; the player scales it.
  function render(model) {
    const root = el("div", model.alert ? "wx wx--alert" : "wx");

    const star = el("div", "wx-star");
    star.innerHTML = STAR;
    root.appendChild(star);

    const frame = el("div", "wx-frame");
    root.appendChild(frame);

    // Header: tag, date, logo
    const header = el("div", "wx-header wx-anim");
    const left = el("div", "wx-header-left");
    left.appendChild(el("div", "wx-tag", "Weather"));
    left.appendChild(el("div", "wx-date",
      model.today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })));
    if (model.place) left.appendChild(el("div", "wx-place", model.place));
    header.appendChild(left);
    const badge = el("div", "wx-logo");
    const logo = el("img");
    logo.src = "assets/ramstar-logo.png";
    logo.alt = "Ramstar";
    badge.appendChild(logo);
    header.appendChild(badge);
    frame.appendChild(header);

    if (model.alert) frame.appendChild(el("div", "wx-alert wx-anim", `Weather alert: ${model.alert}`));

    // Middle: big temperature + stats
    const middle = el("div", "wx-middle");
    const now = el("div", "wx-now wx-anim");
    now.appendChild(icon(model.icon, 230, 2.6, "wx-now-icon"));
    const nowText = el("div", "wx-now-text");
    nowText.appendChild(el("div", "wx-temp", `${model.temp}°`));
    const condition = el("div", "wx-condition", model.condition);
    if (model.condition.length > 16) condition.classList.add("is-long");
    nowText.appendChild(condition);
    model.detail.forEach((line) => nowText.appendChild(el("div", "wx-detail", line)));
    now.appendChild(nowText);
    middle.appendChild(now);

    const stats = el("div", "wx-stats wx-anim");
    model.stats.forEach((s) => {
      const stat = el("div", "wx-stat");
      stat.appendChild(el("span", "wx-stat-label", s.label));
      stat.appendChild(el("span", "wx-stat-value", s.value));
      stats.appendChild(stat);
    });
    middle.appendChild(stats);
    frame.appendChild(middle);

    // Bottom: 5-day strip
    const strip = el("div", "wx-strip wx-anim");
    model.days.forEach((d) => {
      const card = el("div", "wx-day");
      card.appendChild(icon(d.icon, 72, 3, "wx-day-icon"));
      const text = el("div", "wx-day-text");
      const name = el("span", "wx-day-name", d.name);
      if (d.pop) name.appendChild(el("span", "wx-day-pop", ` ${d.pop}%`));
      text.appendChild(name);
      const temps = el("span", "wx-day-temps", `${d.high}°`);
      if (d.low !== null && d.low !== undefined) temps.appendChild(el("span", "wx-day-low", ` ${Math.round(d.low)}°`));
      text.appendChild(temps);
      card.appendChild(text);
      card.title = d.summary;
      strip.appendChild(card);
    });
    frame.appendChild(strip);

    frame.appendChild(el("div", "wx-source",
      `Environment and Climate Change Canada · ${model.station} · observed ${timeLabel(model.observed)}`));

    return root;
  }

  window.RamstarWeather = { load, render, toModel, iconType };

  // Register as a slide type for the player (see templates.js for the others).
  window.RamstarTypes = window.RamstarTypes || {};
  window.RamstarTypes.weather = {
    load: (slide) => load(slide),
    render: (slide, model) => render(model)
  };
})();
