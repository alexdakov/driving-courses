/* Animated intersections: cars drive through one after another in the legal order.
   Colours come from CSS custom properties on the SVG's ancestors, so each design can restyle it:
   --x-grass, --x-road, --x-paint, --x-car-a, --x-car-b, --x-car-c, --x-tram, --x-label-bg, --x-label-ink. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const ROT = { S: 0, W: 90, N: 180, E: 270 };
  const C = 150;
  const rad = (d) => (d * Math.PI) / 180;
  const rot = (x, y, a) => {
    const r = rad(a), dx = x - C, dy = y - C;
    return [C + dx * Math.cos(r) - dy * Math.sin(r), C + dx * Math.sin(r) + dy * Math.cos(r)];
  };
  // Paths for a vehicle coming from the bottom (heading north), before rotation.
  const PATHS = {
    straight: "M167 262 L167 -60",
    right: "M167 262 L167 205 Q167 168 204 168 L360 168",
    left: "M167 262 L167 196 Q167 132 103 132 L-60 132",
  };
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SCENARIOS = {
    equal: {
      title: "Равнозначно кръстовище",
      cars: [
        { id: "А", from: "S", move: "straight", tone: "a" },
        { id: "Б", from: "E", move: "straight", tone: "b" },
      ],
      signs: {},
      order: ["Б", "А"],
      steps: ["Няма знаци – важи правилото на дясното. Б идва отдясно на А, затова минава първа.", "А тръгва, след като Б освободи кръстовището."],
      ref: "ЗДвП чл. 48",
    },
    leftTurn: {
      title: "Завой наляво",
      cars: [
        { id: "А", from: "S", move: "left", tone: "a" },
        { id: "Б", from: "N", move: "straight", tone: "b" },
      ],
      signs: {},
      order: ["Б", "А"],
      steps: ["А завива наляво и пропуска насрещната Б.", "Едва когато насреща е чисто, А завива."],
      ref: "ЗДвП чл. 37",
    },
    priorityRoad: {
      title: "Път с предимство",
      cars: [
        { id: "А", from: "W", move: "straight", tone: "a" },
        { id: "Б", from: "N", move: "straight", tone: "b" },
        { id: "В", from: "S", move: "right", tone: "c" },
      ],
      signs: { N: "Б3", S: "Б3", W: "Б1", E: "Б1" },
      order: ["Б", "В", "А"],
      steps: ["Б и В са на главния път (Б3). Б минава направо.", "В завива надясно по главния път – не пречи на никого от главния.", "А е след Б1 – тръгва последна, когато главният път е чист."],
      ref: "ЗДвП чл. 50",
    },
    three: {
      title: "Три коли, без знаци",
      cars: [
        { id: "А", from: "S", move: "straight", tone: "a" },
        { id: "Б", from: "W", move: "straight", tone: "b" },
        { id: "В", from: "N", move: "left", tone: "c" },
      ],
      signs: {},
      order: ["А", "Б", "В"],
      steps: ["Отдясно на А няма никого – А минава първа.", "Б пропуска А (тя е отдясно на Б), после минава.", "В завива наляво – пропуска всички останали и минава последна."],
      ref: "ЗДвП чл. 37, 48",
    },
    tram: {
      title: "Трамвай на равнозначно кръстовище",
      cars: [
        { id: "А", from: "S", move: "straight", tone: "a" },
        { id: "Т", from: "W", move: "straight", tone: "tram", tram: true },
      ],
      signs: {},
      order: ["Т", "А"],
      steps: ["Трамваят минава пръв – релсовите превозни средства имат предимство, дори да идват отляво.", "А тръгва след трамвая."],
      ref: "ЗДвП чл. 48",
    },
  };

  function el(name, attrs = {}, parent) {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }

  function mount(host, key = "equal", opts = {}) {
    const sc = typeof key === "string" ? SCENARIOS[key] : key;
    host.innerHTML = "";
    host.classList.add("xanim");
    const svg = el("svg", { viewBox: "-34 -34 368 368", class: "xanim-svg", role: "img", "aria-label": sc.title });
    host.appendChild(svg);
    const caption = document.createElement("div");
    caption.className = "xanim-caption";
    caption.setAttribute("aria-live", "polite");
    host.appendChild(caption);
    const controls = document.createElement("div");
    controls.className = "xanim-controls";
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "xanim-play";
    playBtn.textContent = opts.playLabel || "▶ Пусни";
    controls.appendChild(playBtn);
    host.appendChild(controls);

    // static scene
    el("rect", { x: -40, y: -40, width: 380, height: 380, style: "fill:var(--x-grass,#c9d8c2)" }, svg);
    el("rect", { x: -40, y: 112, width: 380, height: 76, style: "fill:var(--x-road,#3a3f46)" }, svg);
    el("rect", { x: 112, y: -40, width: 76, height: 380, style: "fill:var(--x-road,#3a3f46)" }, svg);
    for (const d of ["S", "W", "N", "E"]) {
      for (let y = 198; y < 340; y += 20) {
        const [x1, y1] = rot(148.5, y, ROT[d]);
        const [x2, y2] = rot(151.5, y + 11, ROT[d]);
        el("rect", { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), style: "fill:var(--x-paint,#f3f3ef);opacity:.85" }, svg);
      }
    }
    if (sc.cars.some((c) => c.tram)) {
      const t = sc.cars.find((c) => c.tram);
      const horiz = t.from === "W" || t.from === "E";
      for (const off of [161, 173]) {
        if (horiz) el("line", { x1: -40, y1: off, x2: 340, y2: off, style: "stroke:var(--x-rail,#8a8f96)", "stroke-width": 2 }, svg);
        else el("line", { x1: off, y1: -40, x2: off, y2: 340, style: "stroke:var(--x-rail,#8a8f96)", "stroke-width": 2 }, svg);
      }
    }
    for (const [d, code] of Object.entries(sc.signs || {})) {
      const [x, y] = rot(206, 224, ROT[d]);
      const file = (window.BGSignData && window.BGSignData.SIGNS.find((s) => s.c === code)?.f) || "";
      el("image", { href: (opts.base || "") + file, x: x - 14, y: y - 14, width: 28, height: 28 }, svg);
    }

    // paths and vehicles
    const pathLayer = el("g", { class: "xanim-paths" }, svg);
    const cars = sc.cars.map((c) => {
      const g = el("g", { transform: `rotate(${ROT[c.from]} ${C} ${C})` }, pathLayer);
      const p = el("path", { d: PATHS[c.move], fill: "none", style: `stroke:var(--x-car-${c.tone},#2b6fe0)`, "stroke-width": 3, "stroke-dasharray": "6 6", opacity: 0.55 }, g);
      const len = p.getTotalLength();
      const body = el("g", { class: "xanim-car" }, svg);
      const w = c.tram ? 24 : 22, hgt = c.tram ? 70 : 38;
      el("rect", { x: -w / 2, y: -hgt / 2, width: w, height: hgt, rx: 5, style: `fill:var(--x-car-${c.tone},#2b6fe0);stroke:rgba(0,0,0,.35)` }, body);
      el("rect", { x: -w / 2 + 3, y: -hgt / 2 + 4, width: w - 6, height: 8, rx: 2, fill: "rgba(255,255,255,.78)" }, body);
      const blink = c.move === "straight" ? null : el("circle", { cx: c.move === "left" ? -w / 2 : w / 2, cy: -hgt / 2 + 2, r: 3.2, fill: "#ffb21a", class: "xanim-blink" }, body);
      const badge = el("g", {}, body);
      el("circle", { cx: 0, cy: 6, r: 10, style: "fill:var(--x-label-bg,#fff);stroke:rgba(0,0,0,.4)" }, badge);
      const tx = el("text", { x: 0, y: 7, "text-anchor": "middle", "dominant-baseline": "central", "font-size": 12, "font-weight": 800, style: "fill:var(--x-label-ink,#111);font-family:inherit" }, badge);
      tx.textContent = c.id;
      const startAt = c.tram ? 22 : 0; // trams are longer: start a little further along
      return { ...c, path: p, len, body, badge, start: startAt };
    });

    function place(car, dist) {
      const d = Math.max(0, Math.min(car.len, dist));
      const a = car.path.getPointAtLength(d);
      const b = car.path.getPointAtLength(Math.min(car.len, d + 1));
      const [x, y] = rot(a.x, a.y, ROT[car.from]);
      const [x2, y2] = rot(b.x, b.y, ROT[car.from]);
      const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI + 90;
      car.body.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      car.badge.setAttribute("transform", `rotate(${-ang.toFixed(1)} 0 6)`);
    }
    function reset() {
      cars.forEach((c) => place(c, c.start));
      caption.innerHTML = `<b>${sc.title}.</b> Кой минава първи? Натисни бутона, за да видиш реда.`;
      playBtn.textContent = opts.playLabel || "▶ Пусни";
    }
    let raf = null, timers = [], runId = 0;
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      raf = null;
      timers = [];
    }
    function drive(car, dur) {
      return new Promise((res) => {
        const t0 = performance.now();
        const runIdAtStart = runId;
        const tick = (t) => {
          const f = Math.min(1, (t - t0) / dur);
          place(car, car.start + (car.len - car.start) * ease(f));
          if (f < 1 && runIdAtStart === runId) raf = requestAnimationFrame(tick);
          else { raf = null; res(); }
        };
        raf = requestAnimationFrame(tick);
      });
    }
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));
    let running = false;
    async function play() {
      stop();
      reset();
      running = true;
      const my = (runId = runId + 1);
      playBtn.textContent = "↺ Отначало";
      for (let i = 0; i < sc.order.length; i++) {
        if (my !== runId) return;
        const car = cars.find((c) => c.id === sc.order[i]);
        caption.innerHTML = `<span class="xanim-step">${i + 1}</span> ${sc.steps[i]}`;
        if (reduce()) { place(car, car.len); await wait(1800); continue; }
        await wait(500);
        await drive(car, car.tram ? 2600 : 2100);
      }
      if (my !== runId) return;
      running = false;
      caption.innerHTML += ` <span class="xanim-ref">${sc.ref}</span>`;
      playBtn.textContent = "↺ Пусни пак";
    }
    playBtn.addEventListener("click", () => {
      if (running) { runId++; running = false; stop(); reset(); } else play();
    });
    reset();
    return { play, reset, scenario: sc };
  }

  window.BGAnim = { mount, SCENARIOS };
})();
