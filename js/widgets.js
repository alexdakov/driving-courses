/* Interactive widgets, one per chapter. Each takes a container element and renders into it. */
(function () {
  const { signSVG, signImage, ICONS, DATA: SIGNDATA } = window.BGSigns;
  const { MARKINGS, DASH } = window.BGData;

  const h = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // nested sign inside a bigger SVG
  const signAt = (code, x, y, size) => signImage(code, x, y, size);

  function segmented(items, current, onPick, label) {
    const el = h(`<div class="seg" role="group" aria-label="${label}"></div>`);
    items.forEach(([val, text]) => {
      const b = h(`<button type="button" aria-pressed="${val === current}">${text}</button>`);
      b.addEventListener("click", () => {
        el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        onPick(val);
      });
      el.appendChild(b);
    });
    return el;
  }

  // ================= Signs explorer =================
  const KIND = { warn: ["Предупреждава", "wait"], priority: ["Предимство", "info"], ban: ["Забранява", "stop"], must: ["Задължава", "info"], info: ["Указва", "go"], end: ["Отменя", ""] };
  function signDetail(s) {
    const g = SIGNDATA.GROUPS.find((x) => x.g === s.g);
    return `<div class="sx-detail-img"><img src="${s.f}" alt="${s.c} ${s.n}"></div>
      <div class="sx-detail-body">
        <div class="sx-meta"><span class="sx-code">${s.c}</span><span>Група ${s.g} · ${g.title}</span><span class="pill ${KIND[s.k][1]}">${KIND[s.k][0]}</span></div>
        <h3>${s.n}</h3>
        <p>${s.d}</p>
        <div class="sx-mnem"><span>Как да запомниш</span><p>${s.m}</p></div>
      </div>`;
  }
  function signsWidget(root) {
    const ALL = SIGNDATA.SIGNS;
    let group = "Б", mode = "learn", query = "", current = ALL.find((s) => s.c === "Б1");
    const box = h(`<div class="widget sx">
      <div class="sx-groups" role="tablist" aria-label="Групи знаци"></div>
      <p class="sx-hook"></p>
      <div class="controls" style="align-items:center;justify-content:space-between">
        <div class="sx-modes"></div>
        <label class="sx-search"><span class="visually-hidden">Търси знак</span><input type="search" id="sx-q" placeholder="Търси: паркиране, Б2, деца…" autocomplete="off"></label>
      </div>
      <div class="sx-stage"></div>
    </div>`);
    const groupsEl = box.querySelector(".sx-groups"), hook = box.querySelector(".sx-hook"), stage = box.querySelector(".sx-stage");
    const input = box.querySelector("input");

    SIGNDATA.GROUPS.forEach((g) => {
      const first = ALL.find((s) => s.g === g.g);
      const b = h(`<button type="button" role="tab" data-g="${g.g}"><img src="${first.f}" alt=""><span><b>${g.g}</b> ${g.title}</span><small>${g.shape}</small></button>`);
      b.addEventListener("click", () => { group = g.g; query = ""; input.value = ""; current = ALL.find((s) => s.g === group); draw(); });
      groupsEl.appendChild(b);
    });
    box.querySelector(".sx-modes").appendChild(
      segmented([["learn", "Разгледай"], ["guess", "Познай"], ["deck", "Тесте карти"]], mode, (v) => { mode = v; draw(); }, "Режим")
    );
    input.addEventListener("input", () => { query = input.value.trim().toLowerCase(); mode = "learn"; box.querySelectorAll(".sx-modes button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0))); draw(); });

    const list = () => (query ? ALL.filter((s) => (s.c + " " + s.n + " " + s.d).toLowerCase().includes(query)) : ALL.filter((s) => s.g === group));

    function drawLearn() {
      const items = list();
      if (!items.length) { stage.innerHTML = `<p class="sx-empty">Няма знак, който да отговаря на „${query}“. Опитай с друга дума или код.</p>`; return; }
      if (!items.includes(current)) current = items[0];
      stage.innerHTML = `<div class="sx-learn"><div class="sx-grid" role="listbox" aria-label="Знаци"></div><div class="sx-detail" aria-live="polite"></div></div>`;
      const grid = stage.querySelector(".sx-grid"), det = stage.querySelector(".sx-detail");
      items.forEach((s) => {
        const b = h(`<button type="button" role="option" class="sx-tile" aria-selected="${s === current}" title="${s.n}"><img src="${s.f}" alt="" loading="lazy"><span>${s.c}</span></button>`);
        b.addEventListener("click", () => { current = s; grid.querySelectorAll(".sx-tile").forEach((x) => x.setAttribute("aria-selected", "false")); b.setAttribute("aria-selected", "true"); det.innerHTML = signDetail(s); });
        grid.appendChild(b);
      });
      det.innerHTML = signDetail(current);
    }

    let gScore = 0, gTotal = 0;
    function drawGuess() {
      const pool = list();
      const s = pool[Math.floor(Math.random() * pool.length)];
      const others = ALL.filter((x) => x.g === s.g && x.c !== s.c && x.k !== "end").sort(() => Math.random() - 0.5).slice(0, 2);
      const opts = [s, ...others].sort(() => Math.random() - 0.5);
      stage.innerHTML = `<div class="sx-guess"><div class="sx-guess-img"><img src="${s.f}" alt="Знак за познаване"><p>Какво означава този знак?</p><span class="quiz-count">Познати: ${gScore} от ${gTotal}</span></div><div class="opts"></div><div class="sx-out"></div></div>`;
      const o = stage.querySelector(".opts");
      opts.forEach((x, i) => {
        const b = h(`<button type="button" class="opt"><span class="k">${i + 1}</span><span>${x.n}</span></button>`);
        b.addEventListener("click", () => {
          gTotal++;
          const ok = x === s;
          if (ok) gScore++;
          o.querySelectorAll(".opt").forEach((y, k) => { y.disabled = true; if (opts[k] === s) y.classList.add("right"); });
          if (!ok) b.classList.add("wrong");
          const out = stage.querySelector(".sx-out");
          out.innerHTML = `<div class="explain"><span class="verdict ${ok ? "ok" : "no"}">${ok ? "Точно така." : "Не е това."}</span><span><b>${s.c} ${s.n}.</b> ${s.d}</span><div class="sx-mnem"><span>Как да запомниш</span><p>${s.m}</p></div></div>`;
          const n = h(`<button type="button" class="btn primary small" style="justify-self:start">Следващ знак →</button>`);
          n.addEventListener("click", drawGuess);
          out.appendChild(n);
          n.focus({ preventScroll: true });
        });
        o.appendChild(b);
      });
    }

    let deck = [], known = 0, open = false;
    function drawDeck(reset) {
      if (reset || !deck.length && !known) { deck = list().slice().sort(() => Math.random() - 0.5); known = 0; open = false; }
      if (!deck.length) {
        stage.innerHTML = `<div class="sx-deck"><div class="sx-card"><b>Тестето свърши – знаеш всички ${known}.</b><button type="button" class="btn primary small sx-again">Отначало</button></div></div>`;
        stage.querySelector(".sx-again").onclick = () => drawDeck(true);
        return;
      }
      const s = deck[0];
      stage.innerHTML = `<div class="sx-deck"><div class="sx-card ${open ? "open" : ""}"><img src="${s.f}" alt="Знак">${open ? `<div class="sx-card-body"><h3>${s.c} ${s.n}</h3><p>${s.d}</p><div class="sx-mnem"><span>Как да запомниш</span><p>${s.m}</p></div></div>` : `<p class="sx-card-q">Сети ли се какво означава?</p>`}</div>
        <div class="controls" style="justify-content:center">${open ? `<button type="button" class="btn sx-no">Не го знаех</button><button type="button" class="btn primary sx-yes">Знаех го</button>` : `<button type="button" class="btn primary sx-show">Обърни картата</button>`}</div>
        <p class="quiz-count" style="text-align:center">В тестето: ${deck.length} · знаеш: ${known}</p></div>`;
      const q = (c) => stage.querySelector(c);
      if (q(".sx-show")) q(".sx-show").onclick = () => { open = true; drawDeck(); };
      if (q(".sx-yes")) q(".sx-yes").onclick = () => { known++; deck.shift(); open = false; drawDeck(); };
      if (q(".sx-no")) q(".sx-no").onclick = () => { deck.push(deck.shift()); open = false; drawDeck(); };
    }

    function draw() {
      groupsEl.querySelectorAll("button").forEach((b) => { const on = !query && b.dataset.g === group; b.setAttribute("aria-selected", String(on)); });
      const g = SIGNDATA.GROUPS.find((x) => x.g === group);
      hook.innerHTML = query ? `Резултати за „${query}“ във всички групи.` : `<b>${g.shape}.</b> ${g.hook} <span class="sx-what">${g.what}</span>`;
      if (mode === "learn") drawLearn();
      else if (mode === "guess") drawGuess();
      else drawDeck(true);
    }
    draw();
    root.appendChild(box);
  }

  // ================= Road markings =================
  const car = (x, y, dir = 1, cls = "car-a") =>
    `<g transform="translate(${x} ${y}) scale(${dir} 1)"><rect x="-17" y="-8" width="34" height="16" rx="4" class="${cls}"/><rect x="4" y="-6" width="7" height="12" rx="1.5" class="r-glass"/></g>`;

  function roadBase(lines = true) {
    return `<rect x="0" y="0" width="300" height="120" class="r-grass"/><rect x="0" y="12" width="300" height="96" class="r-road"/>${
      lines ? `<rect x="0" y="15" width="300" height="2.5" class="r-paint"/><rect x="0" y="102.5" width="300" height="2.5" class="r-paint"/>` : ""
    }`;
  }
  function dashes(y, len, gap, from = 0, to = 300, th = 3, cls = "r-paint") {
    let s = "";
    for (let x = from; x < to; x += len + gap) s += `<rect x="${x}" y="${y - th / 2}" width="${Math.min(len, to - x)}" height="${th}" class="${cls}"/>`;
    return s;
  }
  function markSVG(id) {
    let s = roadBase();
    switch (id) {
      case "m1":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/>${car(70, 82)}${car(220, 38, -1, "car-b")}`;
        break;
      case "m2":
        s += `<rect x="0" y="55.5" width="300" height="3" class="r-paint"/><rect x="0" y="61.5" width="300" height="3" class="r-paint"/>${car(70, 84)}${car(220, 36, -1, "car-b")}`;
        break;
      case "m3":
        s += dashes(60, 30, 20) + car(60, 82) + `<path d="M84 82 C120 82 120 38 160 38" class="s-go" fill="none" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#mk-go)"/>`;
        break;
      case "warnline":
        s += dashes(60, 42, 10, 0, 200) + `<rect x="210" y="58.5" width="90" height="3" class="r-paint"/>` + car(60, 82);
        break;
      case "m5":
        s += `<rect x="0" y="54.5" width="300" height="3" class="r-paint"/>` + dashes(63, 30, 20) + car(50, 84) + car(250, 35, -1, "car-b") +
          `<path d="M74 84 C110 84 110 40 150 40" class="s-go" fill="none" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#mk-go)"/>`;
        break;
      case "m6":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/><rect x="222" y="62" width="8" height="40" class="r-paint"/><text x="198" y="82" class="r-text" font-size="15" font-weight="800" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 198 82)">STOP</text>${car(150, 82)}${signAt("B2", 236, 76, 30)}`;
        break;
      case "m7":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/>`;
        for (let y = 64; y < 102; y += 9) s += `<rect x="226" y="${y}" width="6" height="5" class="r-paint"/>`;
        s += `<polygon points="178,82 206,70 206,94" fill="none" class="s-paint" stroke-width="3"/>${car(120, 82)}${signAt("B1", 238, 74, 30)}`;
        break;
      case "m8":
        s = roadBase();
        for (let y = 20; y < 100; y += 13) s += `<rect x="128" y="${y}" width="44" height="8" class="r-paint"/>`;
        s += `${car(70, 82)}${car(240, 38, -1, "car-b")}`;
        break;
      case "m14": {
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/>`;
        let pts = "";
        for (let i = 0, x = 50; x <= 250; x += 12, i++) pts += `${x},${i % 2 ? 90 : 99} `;
        s += `<polyline points="${pts}" fill="none" class="s-yellow" stroke-width="3.5" stroke-linejoin="miter"/><text x="150" y="76" class="r-text" font-size="11" font-weight="700" text-anchor="middle">BUS</text>`;
        break;
      }
      case "m15":
        s += `<defs><clipPath id="cp-m15"><polygon points="60,60 150,44 240,44 240,76 150,76"/></clipPath></defs>`;
        s += `<g clip-path="url(#cp-m15)">`;
        for (let x = 40; x < 280; x += 12) s += `<line x1="${x}" y1="80" x2="${x + 32}" y2="40" class="s-paint" stroke-width="3"/>`;
        s += `</g><polygon points="60,60 150,44 240,44 240,76 150,76" fill="none" class="s-paint" stroke-width="3"/>${car(30, 86)}${car(280, 32, -1, "car-b")}`;
        break;
      case "m10": {
        s += dashes(44, 26, 18) + dashes(76, 26, 18);
        const arrow = (x, y, kind) => {
          if (kind === "s") return `<path d="M${x} ${y - 3} H${x + 30} V${y - 9} L${x + 44} ${y} L${x + 30} ${y + 9} V${y + 3} H${x} Z" class="r-paint"/>`;
          if (kind === "l") return `<path d="M${x} ${y - 3} H${x + 22} V${y - 14} H${x + 16} L${x + 25} ${y - 26} L${x + 34} ${y - 14} H${x + 28} V${y + 3} H${x} Z" class="r-paint"/>`;
          return `<path d="M${x} ${y + 3} H${x + 22} V${y + 14} H${x + 16} L${x + 25} ${y + 26} L${x + 34} ${y + 14} H${x + 28} V${y - 3} H${x} Z" class="r-paint"/>`;
        };
        s += arrow(150, 32, "l") + arrow(150, 60, "s") + arrow(150, 86, "r") + car(70, 28) + car(70, 60) + car(70, 92);
        break;
      }
      case "m17":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/><rect x="140" y="17" width="26" height="86" class="r-bump"/>`;
        for (let y = 66; y < 100; y += 12) s += `<polygon points="144,${y} 162,${y + 5} 144,${y + 10}" class="r-paint"/>`;
        for (let y = 22; y < 56; y += 12) s += `<polygon points="162,${y} 144,${y + 5} 162,${y + 10}" class="r-paint"/>`;
        s += car(70, 82) + car(240, 38, -1, "car-b");
        break;
    }
    return `<svg viewBox="0 0 300 120" role="img" aria-hidden="true"><defs><marker id="mk-go" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="f-go"/></marker></defs>${s}</svg>`;
  }

  function markingsWidget(root) {
    const grid = h(`<div class="mark-grid"></div>`);
    MARKINGS.forEach((m) => {
      grid.appendChild(h(`<article class="mark-card">${markSVG(m.id)}<div class="txt"><h4><span class="code">${m.code}</span>${m.name}</h4><p>${m.d}</p></div></article>`));
    });
    root.appendChild(grid);
  }

  // ================= Traffic light =================
  const TL_STATES = {
    red: { l: { r: 1 }, t: "Червена светлина", pill: ["stop", "Преминаването е забранено"], p: "Спираш преди стоп-линията. Ако няма такава – преди светофара. Ако светофарът е в средата на кръстовището, не навлизаш в него.", ref: "ППЗДвП чл. 31, ал. 7, т. 1" },
    ry: { l: { r: 1, y: 1 }, t: "Червена и жълта едновременно", pill: ["stop", "Забранено – предстои зелено"], p: "Все още е забранено. Сигналът само предупреждава, че след малко ще светне зелено. Подготви се, но не потегляй.", ref: "ППЗДвП чл. 31, ал. 7, т. 2" },
    green: { l: { g: 1 }, t: "Зелена светлина", pill: ["go", "Преминаването е разрешено"], p: "Минаваш, но не навлизаш, ако не можеш да напуснеш кръстовището до смяната на сигнала. При завой пропускаш пешеходците, а при ляв завой – и насрещните.", ref: "ППЗДвП чл. 31; ЗДвП чл. 37, 50а, 119" },
    yellow: { l: { y: 1 }, t: "Жълта светлина", pill: ["wait", "Внимание, спри!"], p: "Спираш. Продължаваш само ако си толкова близо, че не можеш да спреш безопасно. Ако вече си в кръстовището – освобождаваш го.", ref: "ППЗДвП чл. 31, ал. 7, т. 4" },
    flash: { l: { y: "blink" }, t: "Мигаща жълта светлина", pill: ["info", "Внимание!"], p: "Светофарът не регулира. Минаваш внимателно, а предимството се определя от знаците – или от правилото на дясното, ако няма знаци.", ref: "ППЗДвП чл. 37" },
    arrow: { l: { r: 1, a: 1 }, t: "Червено + зелена стрелка в допълнителната секция", pill: ["go", "Само в посоката на стрелката"], p: "Можеш да завиеш надясно, като пропуснеш пешеходците и колите, за които също има разрешаващ сигнал. Направо е забранено.", ref: "ППЗДвП чл. 32; ЗДвП чл. 35, ал. 4" },
    gblink: { l: { g: "blink" }, t: "Мигаща зелена светлина", pill: ["wait", "Зеленото изтича"], p: "На някои светофари зеленото мига преди жълтото. Не ускорявай, за да „хванеш“ сигнала – подготви се за спиране.", ref: "Предупредителен сигнал" },
  };
  function trafficLightWidget(root) {
    let state = "red";
    let timer = null;
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Светофар</h3><p>Избери сигнал или пусни цикъла.</p></div>
      <div class="split">
        <div style="display:grid;gap:14px;justify-items:center"><svg class="stage tl-svg" viewBox="0 0 220 300" style="max-width:260px"></svg></div>
        <div class="readout" aria-live="polite"></div>
      </div>
      <div class="controls"></div>
    </div>`);
    const svg = box.querySelector(".tl-svg");
    const readout = box.querySelector(".readout");
    const controls = box.querySelector(".controls");
    const order = [["red", "Червено"], ["ry", "Червено + жълто"], ["green", "Зелено"], ["yellow", "Жълто"], ["flash", "Мигащо жълто"], ["arrow", "Зелена стрелка"], ["gblink", "Мигащо зелено"]];
    const seg = segmented(order, state, (v) => { stop(); set(v); }, "Сигнал на светофара");
    controls.appendChild(seg);
    const play = h(`<button type="button" class="btn small">▶ Цикъл</button>`);
    controls.appendChild(play);
    play.addEventListener("click", () => (timer ? stop() : start()));

    function lamp(cx, cy, color, on) {
      const cls = on === "blink" ? "blink" : "";
      return `<circle cx="${cx}" cy="${cy}" r="30" fill="#24272b"/>${on ? `<circle class="${cls}" cx="${cx}" cy="${cy}" r="27" fill="${color}" style="filter:drop-shadow(0 0 12px ${color})"/>` : `<circle cx="${cx}" cy="${cy}" r="27" fill="#34383d"/>`}`;
    }
    function draw() {
      const L = TL_STATES[state].l;
      svg.innerHTML = `
        <rect x="64" y="252" width="16" height="48" fill="#5b6168"/>
        <rect x="32" y="12" width="80" height="244" rx="16" fill="#15181b"/>
        ${lamp(72, 56, "#ff3b30", L.r)}
        ${lamp(72, 134, "#ffc400", L.y)}
        ${lamp(72, 212, "#22d36b", L.g)}
        <rect x="118" y="178" width="70" height="68" rx="12" fill="#15181b"/>
        <circle cx="153" cy="212" r="27" fill="#24272b"/>
        ${L.a ? `<circle cx="153" cy="212" r="26" fill="#0c0e10"/><path d="M134 206 H156 V196 L174 212 L156 228 V218 H134 Z" fill="#22d36b" style="filter:drop-shadow(0 0 8px #22d36b)"/>` : `<path d="M134 206 H156 V196 L174 212 L156 228 V218 H134 Z" fill="#2c3035"/>`}
      `;
      const s = TL_STATES[state];
      readout.innerHTML = `<span class="pill ${s.pill[0]}">${s.pill[1]}</span><h4>${s.t}</h4><p>${s.p}</p><span class="lawref">${s.ref}</span>`;
    }
    function set(v) {
      state = v;
      seg.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(order[i][0] === v)));
      draw();
    }
    const cycle = [["red", 3200], ["ry", 1400], ["green", 3200], ["yellow", 1600]];
    function start() {
      let i = 0;
      play.textContent = "■ Спри цикъла";
      const step = () => {
        set(cycle[i][0]);
        timer = setTimeout(step, cycle[i][1]);
        i = (i + 1) % cycle.length;
      };
      step();
    }
    function stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      play.textContent = "▶ Цикъл";
    }
    draw();
    root.appendChild(box);
    const otherSignals = h(`<div class="rules" style="margin-top:12px">
      <div class="rule"><h4>Пешеходен светофар</h4><div class="body"><p>Две полета: червен стоящ и зелен вървящ човек. Пешеходците, заварени на платното от червеното, трябва да го освободят – дай им време.</p></div></div>
      <div class="rule"><h4>Светофар на градския транспорт</h4><div class="body"><p>Бели светлини – хоризонтална линия, стрелки. Отнася се само за автобуси, тролеи и трамваи – ти го игнорираш.</p></div><span class="lawref">ППЗДвП чл. 34</span></div>
    </div>`);
    root.appendChild(otherSignals);
  }

  // ================= Intersection helpers =================
  const DIRS = ["S", "W", "N", "E"]; // clockwise order on screen starting at the bottom
  const ROT = { S: 0, W: 90, N: 180, E: 270 };
  function rotPt(x, y, angle, cx = 150, cy = 150) {
    const a = rad(angle);
    const dx = x - cx, dy = y - cy;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  }
  function crossroads() {
    let s = `<rect x="-40" y="-40" width="380" height="380" class="r-grass"/><rect x="-40" y="112" width="380" height="76" class="r-road"/><rect x="112" y="-40" width="76" height="380" class="r-road"/>`;
    // centre dashes on each arm
    for (const d of DIRS) {
      const a = ROT[d];
      for (let y = 196; y < 300; y += 18) {
        const [x1, y1] = rotPt(149, y, a);
        const [x2, y2] = rotPt(151, y + 10, a);
        s += `<rect x="${Math.min(x1, x2)}" y="${Math.min(y1, y2)}" width="${Math.abs(x2 - x1)}" height="${Math.abs(y2 - y1)}" class="r-paint" opacity=".8"/>`;
      }
    }
    return s;
  }
  // path from an approach (car drives north from the bottom before rotation)
  const MOVE_PATH = {
    straight: "M167 214 L167 70",
    right: "M167 214 Q167 168 230 168",
    left: "M167 214 Q167 132 70 132",
  };
  function carShape(fill, label) {
    return `<rect x="156" y="216" width="22" height="38" rx="5" fill="${fill}" stroke="rgba(0,0,0,.35)"/><rect x="159" y="220" width="16" height="8" rx="2" fill="rgba(255,255,255,.75)"/>`;
  }

  // ================= Traffic controller =================
  function regulatorWidget(root) {
    let pose = "side";
    let facing = "S"; // direction the chest points to
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Сигнали на регулировчика</h3><p>Избери положение и завърти регулировчика. Колите показват кой може да мине.</p></div>
      <div class="split">
        <svg class="stage" viewBox="-34 -34 368 368"></svg>
        <div class="readout" aria-live="polite"></div>
      </div>
      <div class="controls"></div>
    </div>`);
    const svg = box.querySelector("svg");
    const readout = box.querySelector(".readout");
    const controls = box.querySelector(".controls");
    controls.appendChild(
      segmented([["up", "Ръка нагоре"], ["side", "Ръце встрани"], ["forward", "Дясна ръка напред"]], pose, (v) => { pose = v; draw(); }, "Положение")
    );
    const turn = h(`<button type="button" class="btn small">↻ Завърти регулировчика</button>`);
    turn.addEventListener("click", () => {
      facing = { S: "W", W: "N", N: "E", E: "S" }[facing];
      draw();
    });
    controls.appendChild(turn);

    const rightOf = { N: "E", E: "S", S: "W", W: "N" };
    const opposite = { N: "S", S: "N", E: "W", W: "E" };
    const nameOf = { N: "отгоре", S: "отдолу", E: "отдясно", W: "отляво" };

    function relation(app) {
      if (app === facing) return "chest";
      if (app === opposite[facing]) return "back";
      if (app === rightOf[facing]) return "right";
      return "left";
    }
    function status(rel) {
      if (pose === "up") return { ok: false, moves: [], label: "Стоп", short: "Стоп" };
      if (pose === "side") return rel === "left" || rel === "right" ? { ok: true, moves: ["straight", "right"], label: "Направо и надясно", short: "Направо, надясно" } : { ok: false, moves: [], label: "Стоп", short: "Стоп" };
      return rel === "left" ? { ok: true, moves: ["straight", "right", "left"], label: "Разрешено", short: "Разрешено" } : { ok: false, moves: [], label: "Стоп", short: "Стоп" };
    }
    const relName = { chest: "срещу гърдите", back: "срещу гърба", left: "срещу лявото рамо", right: "срещу дясното рамо" };

    function figure() {
      // drawn facing south (chest down), rotated to the facing direction
      const a = ROT[facing];
      let arms = "";
      if (pose === "side") arms = `<line x1="134" y1="150" x2="108" y2="150" class="s-ink" stroke-width="6" stroke-linecap="round"/><line x1="166" y1="150" x2="192" y2="150" class="s-ink" stroke-width="6" stroke-linecap="round"/><rect x="186" y="146" width="22" height="8" rx="3" fill="#fff" stroke="#111"/><rect x="194" y="146" width="7" height="8" fill="#d11"/>`;
      // the figure faces south: his right hand is on the screen-left (west)
      if (pose === "forward") arms = `<line x1="137" y1="152" x2="136" y2="180" class="s-ink" stroke-width="6" stroke-linecap="round"/><rect x="132" y="178" width="8" height="22" rx="3" fill="#fff" stroke="#111"/><rect x="132" y="186" width="8" height="7" fill="#d11"/>`;
      if (pose === "up") arms = `<circle cx="136" cy="150" r="7" class="f-amber"/><text x="136" y="151" font-size="10" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#111">↑</text>`;
      return `<g transform="rotate(${a} 150 150)">
        <ellipse cx="150" cy="150" rx="19" ry="9" class="f-uniform"/>
        <path d="M143 157 L150 166 L157 157 Z" class="f-amber"/>
        ${arms}
        <circle cx="150" cy="150" r="7.5" class="f-skin"/>
      </g>`;
    }

    function draw() {
      let s = crossroads();
      // zebra crossings to show pedestrian areas
      const ped = [];
      for (const d of DIRS) {
        const rel = relation(d);
        const st = status(rel);
        const a = ROT[d];
        const col = st.ok ? "#1aa64b" : "#d13b2f";
        s += `<g transform="rotate(${a} 150 150)">`;
        st.moves.forEach((m) => {
          s += `<path d="${MOVE_PATH[m]}" fill="none" stroke="#1aa64b" stroke-width="4" stroke-dasharray="7 5" marker-end="url(#mk-reg)"/>`;
        });
        s += carShape(col) + `</g>`;
        const [lx, ly] = rotPt(236, 272, a);
        s += `<g><rect x="${lx - 50}" y="${ly - 10}" width="100" height="20" rx="10" fill="${col}"/><text x="${lx}" y="${ly + 1}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${st.short}</text></g>`;
        ped.push({ d, rel, st });
      }
      s += figure();
      svg.innerHTML = `<defs><marker id="mk-reg" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#1aa64b"/></marker></defs>` + s;

      const poseText = {
        up: ["Дясна ръка вдигната вертикално", "„ВНИМАНИЕ, СПРИ!“ за всички. Който вече е в кръстовището, го освобождава. Не спира само този, който е толкова близо, че не може да спре безопасно.", "ЗДвП чл. 10, ал. 2, т. 1"],
        side: ["Ръце протегнати встрани (или спуснати след това)", "Минават водачите срещу лявото и дясното рамо – направо и надясно. Пешеходците пресичат пред гърдите или зад гърба му. Всички останали спират.", "ЗДвП чл. 10, ал. 2, т. 2"],
        forward: ["Дясна ръка протегната напред", "Минават само водачите срещу лявото му рамо. Пешеходците пресичат зад гърба му. Всички останали спират.", "ЗДвП чл. 10, ал. 2, т. 3"],
      }[pose];
      readout.innerHTML = `<h4>${poseText[0]}</h4><p>${poseText[1]}</p>
        <div style="display:grid;gap:6px">${ped
          .map((p) => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:.88rem"><span>Кола ${nameOf[p.d]} <span style="color:var(--muted)">(${relName[p.rel]})</span></span><span class="pill ${p.st.ok ? "go" : "stop"}">${p.st.label}</span></div>`)
          .join("")}</div>
        <span class="lawref">${poseText[2]}</span>`;
    }
    draw();
    root.appendChild(box);
  }

  // ================= Priority: animated scenarios =================
  function priorityWidget(root) {
    const keys = Object.keys(window.BGAnim.SCENARIOS);
    let idx = 0;
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Кой минава първи?</h3><p class="sc-count"></p></div>
      <div class="split">
        <div class="sc-anim"></div>
        <div class="readout" aria-live="polite"></div>
      </div>
    </div>`);
    const animEl = box.querySelector(".sc-anim"), readout = box.querySelector(".readout"), count = box.querySelector(".sc-count");
    function draw() {
      const key = keys[idx];
      const api = window.BGAnim.mount(animEl, key, { base: "", playLabel: "▶ Покажи реда" });
      const sc = api.scenario;
      count.textContent = `Ситуация ${idx + 1} от ${keys.length}`;
      readout.innerHTML = `<h4>${sc.title}</h4><p>Погледни знаците и посоките. Кой тръгва пръв?</p><div class="opts"></div><div class="sc-explain"></div>`;
      const opts = readout.querySelector(".opts");
      sc.cars.forEach((c, i) => {
        const b = h(`<button type="button" class="opt"><span class="k">${i + 1}</span><span>${c.tram ? "Трамваят" : "Колата"} <b>${c.id}</b></span></button>`);
        b.addEventListener("click", () => {
          const ok = c.id === sc.order[0];
          opts.querySelectorAll(".opt").forEach((x, k) => { x.disabled = true; if (sc.cars[k].id === sc.order[0]) x.classList.add("right"); });
          if (!ok) b.classList.add("wrong");
          const ex = readout.querySelector(".sc-explain");
          ex.innerHTML = `<div class="explain"><span class="verdict ${ok ? "ok" : "no"}">${ok ? "Вярно." : "Не съвсем."}</span><span>Редът е: <b>${sc.order.join(" → ")}</b>. Гледай анимацията.</span><span class="lawref">${sc.ref}</span></div>`;
          const next = h(`<button type="button" class="btn small" style="justify-self:start">${idx + 1 < keys.length ? "Следваща ситуация →" : "Започни отначало"}</button>`);
          next.addEventListener("click", () => { idx = (idx + 1) % keys.length; draw(); });
          ex.appendChild(next);
          api.play();
        });
        opts.appendChild(b);
      });
    }
    draw();
    root.appendChild(box);
  }

  // ================= Roundabout =================
  function roundaboutWidget(root) {
    let exit = 2;
    let lane = "outer";
    let raf = null;
    let tmo = null;
    const C = 170, RO = 88, RI = 62, OFF = 13;
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Път през кръговото</h3><p>Влизаш отдолу. Избери изход и лента, после „Пусни“.</p></div>
      <div class="split">
        <svg class="stage" viewBox="0 0 340 340"></svg>
        <div class="readout" aria-live="polite"></div>
      </div>
      <div class="controls"></div>
    </div>`);
    const svg = box.querySelector("svg");
    const readout = box.querySelector(".readout");
    const controls = box.querySelector(".controls");
    const exitSeg = segmented([[1, "1-ви изход (надясно)"], [2, "2-ри (направо)"], [3, "3-ти (наляво)"], [4, "Обратно"]], exit, (v) => { exit = v; setLane(lane); reset(); }, "Изход");
    controls.appendChild(exitSeg);
    let laneSeg = segmented([["outer", "Външна лента"], ["inner", "Вътрешна лента"]], lane, (v) => { setLane(v); reset(); }, "Лента");
    controls.appendChild(laneSeg);
    const playBtn = h(`<button type="button" class="btn small primary">▶ Пусни</button>`);
    playBtn.addEventListener("click", play);
    controls.appendChild(playBtn);

    function setLane(v) {
      lane = exit <= 2 ? "outer" : v;
      laneSeg.querySelectorAll("button").forEach((b, i) => {
        b.setAttribute("aria-pressed", String((i === 0 ? "outer" : "inner") === lane));
        if (i === 1) b.disabled = exit <= 2;
      });
    }

    const P = (r, a) => [C + r * Math.cos(rad(a)), C + r * Math.sin(rad(a))];
    const aOff = deg(Math.asin(OFF / RO));

    function buildPath() {
      const pts = [];
      const push = (x, y, phase, blink) => pts.push({ x, y, phase, blink });
      const aIn = 90 - aOff;
      const theta = 90 - 90 * exit;
      const aExit = theta + aOff;
      const aPrev = aExit + 90;
      const [ex0, ey0] = P(RO, aIn);
      for (let i = 0; i <= 24; i++) {
        const y = 345 + (ey0 - 345) * (i / 24);
        push(C + OFF, y, "enter", exit === 1 && i > 10 ? "R" : null);
      }
      const total = aIn - aExit;
      for (let d = 0; d <= total; d += 1) {
        const a = aIn - d;
        let r = RO;
        let phase = "ring";
        let blink = null;
        if (lane === "inner") {
          if (d < 25) { r = RO - (RO - RI) * (d / 25); phase = "laneIn"; blink = "L"; }
          else if (a > aExit + 50) r = RI;
          else if (a > aExit + 25) { r = RI + (RO - RI) * ((aExit + 50 - a) / 25); phase = "laneOut"; blink = "R"; }
          else { r = RO; phase = "signal"; blink = "R"; }
          if (phase === "ring" && a <= aPrev && exit > 1) { phase = "signal"; blink = "R"; }
        } else {
          if (exit === 1 || a <= aPrev) { phase = "signal"; blink = "R"; }
        }
        const [x, y] = P(r, a);
        push(x, y, phase, blink);
      }
      const [x1, y1] = P(RO, aExit);
      const dx = Math.cos(rad(theta)), dy = Math.sin(rad(theta));
      for (let i = 1; i <= 26; i++) push(x1 + dx * i * 4, y1 + dy * i * 4, "exit", i < 6 ? "R" : null);
      return pts;
    }

    function scene() {
      let s = `<rect width="340" height="340" class="r-grass"/>`;
      // arms
      s += `<rect x="144" y="0" width="52" height="340" class="r-road"/><rect x="0" y="144" width="340" height="52" class="r-road"/>`;
      s += `<circle cx="${C}" cy="${C}" r="101" class="r-road"/>`;
      s += `<circle cx="${C}" cy="${C}" r="75" fill="none" class="s-paint" stroke-width="2" stroke-dasharray="8 7" opacity=".85"/>`;
      s += `<circle cx="${C}" cy="${C}" r="50" class="r-island"/><circle cx="${C}" cy="${C}" r="50" fill="none" class="s-paint" stroke-width="2.5"/>`;
      // arm centre lines, zebras and give-way lines
      for (const a of [0, 90, 180, 270]) {
        s += `<g transform="rotate(${a} ${C} ${C})">`;
        s += `<rect x="168.5" y="272" width="3" height="68" class="r-paint" opacity=".9"/>`;
        for (let x = 148; x < 194; x += 8) s += `<rect x="${x}" y="292" width="5" height="16" class="r-paint"/>`;
        for (let x = 172; x < 194; x += 6) s += `<rect x="${x}" y="270" width="4" height="3" class="r-paint"/>`;
        s += `</g>`;
        const [sx, sy] = rotPt(207, 280, a, C, C);
        s += signAt("B1", sx - 11, sy - 11, 22);
        const [gx, gy] = rotPt(207, 304, a, C, C);
        s += signAt("G12", gx - 11, gy - 11, 22);
      }
      s += `<text x="${C}" y="${C}" font-size="11" text-anchor="middle" dominant-baseline="central" class="r-text-dark" font-weight="700">↺</text>`;
      // exit labels
      const labels = [[1, 0], [2, -90], [3, -180], [4, 90]];
      labels.forEach(([n, a]) => {
        const [x, y] = P(150, a);
        const tx = n === 4 ? 120 : x;
        const ty = n === 4 ? 320 : y;
        s += `<g><circle cx="${tx}" cy="${ty}" r="11" style="fill:${n === exit ? "var(--accent)" : "rgba(0,0,0,.55)"}"/><text x="${tx}" y="${ty + 1}" font-size="11" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${n}</text></g>`;
      });
      return s;
    }

    const PHASE = {
      enter: ["Влизане", "Б1 + Г12 на входа: намали и пропусни колите, които вече се движат в кръга. Пешеходната пътека е преди линията за изчакване."],
      ring: ["В кръга", "Движиш се обратно на часовниковата стрелка. Не спирай без нужда."],
      laneIn: ["Към вътрешната лента", "Престрояване наляво: мигач наляво и пропускане на движещите се във вътрешната лента."],
      laneOut: ["Обратно към външната лента", "Преди изхода се престрояваш навън: мигач надясно и пропускане на движещите се във външната лента."],
      signal: ["Десен мигач", "Следващият изход е твоят. Мигачът казва на чакащите на входовете и на колите зад теб, че напускаш кръга."],
      exit: ["Излизане", "Излизаш от външната лента – това е завой надясно. Пропусни пешеходците на пътеката."],
    };
    let pts = buildPath();
    function render(i) {
      const p = pts[Math.min(i, pts.length - 1)];
      const q = pts[Math.min(i + 1, pts.length - 1)];
      const prev = pts[Math.max(i - 1, 0)];
      const ang = deg(Math.atan2(q.y - prev.y, q.x - prev.x)) + 90;
      const d = pts.map((pt, k) => `${k ? "L" : "M"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
      const blinkOn = p.blink && Math.floor(i / 6) % 2 === 0;
      svg.innerHTML =
        scene() +
        `<path d="${d}" fill="none" style="stroke:var(--accent)" stroke-width="3" stroke-dasharray="6 6" opacity=".9"/>` +
        `<g transform="translate(${p.x} ${p.y}) rotate(${ang})"><rect x="-9" y="-16" width="18" height="32" rx="4" fill="#2b6fe0" stroke="rgba(0,0,0,.4)"/><rect x="-7" y="-13" width="14" height="7" rx="2" fill="rgba(255,255,255,.8)"/>
          <rect x="-10" y="-17" width="5" height="4" rx="1" fill="${p.blink === "L" && blinkOn ? "#ffb21a" : "#555"}"/><rect x="5" y="-17" width="5" height="4" rx="1" fill="${p.blink === "R" && blinkOn ? "#ffb21a" : "#555"}"/>
          <rect x="-10" y="13" width="5" height="4" rx="1" fill="${p.blink === "L" && blinkOn ? "#ffb21a" : "#555"}"/><rect x="5" y="13" width="5" height="4" rx="1" fill="${p.blink === "R" && blinkOn ? "#ffb21a" : "#555"}"/></g>`;
      const ph = PHASE[p.phase];
      const blinkTxt = p.blink === "R" ? `<span class="pill wait">◀ ▶ Мигач надясно</span>` : p.blink === "L" ? `<span class="pill wait">Мигач наляво</span>` : `<span class="pill">Без мигач</span>`;
      readout.innerHTML = `${blinkTxt}<h4>${ph[0]}</h4><p>${ph[1]}</p><span class="lawref">ЗДвП чл. 25, 26, 35, 119; ППЗДвП чл. 52</span>`;
    }
    function stopAnim() {
      if (raf) cancelAnimationFrame(raf);
      if (tmo) clearTimeout(tmo);
      raf = null;
      tmo = null;
    }
    function reset() {
      stopAnim();
      pts = buildPath();
      render(0);
      playBtn.textContent = "▶ Пусни";
    }
    function play() {
      if (raf || tmo) { reset(); return; }
      pts = buildPath();
      if (reduceMotion()) {
        // step through key moments instead of animating
        const keys = [0, ...pts.map((p, i) => (i && p.phase !== pts[i - 1].phase ? i : -1)).filter((i) => i > 0)];
        let k = 0;
        playBtn.textContent = "■ Спри";
        const step = () => {
          render(keys[k]);
          k++;
          if (k < keys.length) tmo = setTimeout(step, 1600);
          else { tmo = null; playBtn.textContent = "▶ Пусни пак"; }
        };
        step();
        return;
      }
      playBtn.textContent = "■ Спри";
      const t0 = performance.now();
      const dur = 2600 + pts.length * 18;
      const tick = (t) => {
        const f = clamp((t - t0) / dur, 0, 1);
        render(Math.round(f * (pts.length - 1)));
        if (f < 1) raf = requestAnimationFrame(tick);
        else { raf = null; playBtn.textContent = "▶ Пусни пак"; }
      };
      raf = requestAnimationFrame(tick);
    }
    setLane(lane);
    render(0);
    root.appendChild(box);
  }

  // ================= Parking on a street =================
  function parkingWidget(root) {
    const PX = 10; // px per metre
    const CAR = 4.5;
    let pos = 18;
    let mode = "park";
    const ZONES = [
      { from: 0, to: 15, name: "кръстовище", why: "На кръстовище и на по-малко от 5 м от него престоят и паркирането са забранени.", ref: "ЗДвП чл. 98, ал. 1, т. 6", kind: "both" },
      { from: 25, to: 34, name: "пешеходна пътека", why: "На пешеходна пътека и на по-малко от 5 м преди нея престоят и паркирането са забранени.", ref: "ЗДвП чл. 98, ал. 1, т. 5", kind: "both" },
      { from: 44, to: 56, name: "спирка", why: "На спирка паркирането е забранено. Престой – само за слизане на пътник и ако не пречиш на автобуса.", ref: "ЗДвП чл. 69; чл. 98, ал. 2, т. 3", kind: "park", stay: "wait" },
      { from: 61, to: 64, name: "вход на гараж", why: "Пред вход на гараж паркирането е забранено, когато затруднява достъпа. Престоят е разрешен.", ref: "ЗДвП чл. 98, ал. 2, т. 2", kind: "park" },
      { from: 65, to: 80, name: "кръстовище", why: "На кръстовище и на по-малко от 5 м от него престоят и паркирането са забранени.", ref: "ЗДвП чл. 98, ал. 1, т. 6", kind: "both" },
    ];
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Може ли тук?</h3><p>Премести колата покрай бордюра. Движението в твоята лента е отляво надясно.</p></div>
      <svg class="stage park-svg" viewBox="0 0 800 270" style="touch-action:none"></svg>
      <div class="controls" style="align-items:center"></div>
      <label class="range">Позиция на колата <input type="range" id="park-pos" min="0" max="75.5" step="0.5" value="${pos}"><output></output></label>
      <div class="readout" aria-live="polite"></div>
    </div>`);
    const svg = box.querySelector("svg");
    const range = box.querySelector("input");
    const out = box.querySelector("output");
    const readout = box.querySelector(".readout");
    box.querySelector(".controls").appendChild(
      segmented([["park", "Паркиране"], ["stay", "Престой"]], mode, (v) => { mode = v; draw(); }, "Вид спиране")
    );
    const showZones = h(`<button type="button" class="btn small" aria-pressed="false">Покажи забранените зони</button>`);
    let zonesOn = false;
    showZones.addEventListener("click", () => { zonesOn = !zonesOn; showZones.setAttribute("aria-pressed", String(zonesOn)); draw(); });
    box.querySelector(".controls").appendChild(showZones);

    function scene() {
      let s = `<rect width="800" height="270" class="r-grass"/>`;
      s += `<rect x="0" y="40" width="800" height="160" class="r-road"/>`;
      s += `<rect x="0" y="200" width="800" height="44" class="r-walk"/><rect x="0" y="198" width="800" height="4" class="r-curb"/>`;
      s += `<rect x="0" y="16" width="800" height="24" class="r-walk"/>`;
      // side streets at both ends (0-10 m, 70-80 m)
      s += `<rect x="0" y="0" width="100" height="270" class="r-road"/><rect x="700" y="0" width="100" height="270" class="r-road"/>`;
      for (let x = 100; x < 700; x += 40) s += `<rect x="${x + 6}" y="118.5" width="24" height="3" class="r-paint" opacity=".85"/>`;
      // zebra 30-34 m
      for (let y = 46; y < 196; y += 16) s += `<rect x="300" y="${y}" width="40" height="9" class="r-paint"/>`;
      // bus stop 44-56 m with yellow zigzag
      let zz = "";
      for (let i = 0, x = 440; x <= 560; x += 10, i++) zz += `${x},${i % 2 ? 182 : 194} `;
      s += `<polyline points="${zz}" fill="none" class="s-yellow" stroke-width="3"/>`;
      s += `<rect x="478" y="206" width="4" height="30" fill="#777"/><rect x="466" y="200" width="28" height="18" rx="3" fill="${"#1d5fb4"}"/><text x="480" y="210" font-size="10" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">BUS</text>`;
      // garage 61-64 m: driveway through the sidewalk
      s += `<rect x="610" y="200" width="30" height="44" class="r-drive"/><text x="625" y="258" font-size="11" text-anchor="middle" class="r-text-dark" font-weight="700">гараж</text>`;
      // metre ruler
      for (let m = 0; m <= 80; m += 10) s += `<text x="${m * PX}" y="266" font-size="10" text-anchor="${m === 0 ? "start" : m === 80 ? "end" : "middle"}" class="r-text-dark">${m} м</text>`;
      // oncoming car and parked car for context
      s += `<g transform="translate(230 80)"><rect x="-22" y="-10" width="44" height="20" rx="5" fill="#8a929c"/></g>`;
      if (zonesOn) {
        ZONES.forEach((z) => {
          const col = z.kind === "both" ? "rgba(214,40,30,.28)" : mode === "park" ? "rgba(214,40,30,.28)" : "rgba(242,179,0,.28)";
          if (z.kind === "park" && mode === "stay" && !z.stay) return;
          s += `<rect x="${z.from * PX}" y="160" width="${(z.to - z.from) * PX}" height="38" fill="${col}"/>`;
        });
      }
      return s;
    }
    function verdict() {
      const a = pos, b = pos + CAR;
      const hits = ZONES.filter((z) => a < z.to && b > z.from);
      const bad = hits.filter((z) => z.kind === "both" || (mode === "park" && z.kind === "park"));
      const cond = hits.filter((z) => mode === "stay" && z.stay === "wait");
      return { bad, cond };
    }
    function draw() {
      const { bad, cond } = verdict();
      const color = bad.length ? "#d13b2f" : cond.length ? "#f2b300" : "#1aa64b";
      svg.innerHTML =
        scene() +
        `<g transform="translate(${pos * PX} 180)"><rect x="0" y="-11" width="${CAR * PX}" height="22" rx="6" fill="#2b6fe0" stroke="${color}" stroke-width="4"/><rect x="${CAR * PX - 14}" y="-8" width="8" height="16" rx="2" fill="rgba(255,255,255,.8)"/></g>` +
        `<line x1="${pos * PX}" y1="150" x2="${pos * PX}" y2="205" stroke="${color}" stroke-dasharray="3 3"/><line x1="${(pos + CAR) * PX}" y1="150" x2="${(pos + CAR) * PX}" y2="205" stroke="${color}" stroke-dasharray="3 3"/>`;
      out.textContent = `${pos.toFixed(1)}–${(pos + CAR).toFixed(1)} м`;
      range.value = pos;
      const verb = mode === "park" ? "Паркирането" : "Престоят";
      if (bad.length) {
        readout.innerHTML = `<span class="pill stop">${verb} тук е забранен${mode === "park" ? "о" : ""}</span>${bad.map((z) => `<p><b>${z.name[0].toUpperCase() + z.name.slice(1)}.</b> ${z.why}</p><span class="lawref">${z.ref}</span>`).join("")}`;
      } else if (cond.length) {
        readout.innerHTML = `<span class="pill wait">Само за слизане на пътник</span><p>${cond[0].why}</p><span class="lawref">${cond[0].ref}</span>`;
      } else {
        const toZebraBefore = 30 - (pos + CAR);
        const extra = toZebraBefore > 0 && toZebraBefore < 12 ? ` До пешеходната пътека остават ${toZebraBefore.toFixed(1)} м.` : "";
        readout.innerHTML = `<span class="pill go">${verb} тук е разрешен${mode === "park" ? "о" : ""}</span><p>Спри възможно най-вдясно, успоредно на бордюра.${extra}</p><span class="lawref">ЗДвП чл. 94, ал. 3</span>`;
      }
    }
    range.addEventListener("input", () => { pos = parseFloat(range.value); draw(); });
    let dragging = false;
    const toMetres = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 800;
      return clamp(Math.round((x / PX - CAR / 2) * 2) / 2, 0, 75.5);
    };
    svg.addEventListener("pointerdown", (ev) => { dragging = true; svg.setPointerCapture(ev.pointerId); pos = toMetres(ev); draw(); });
    svg.addEventListener("pointermove", (ev) => { if (dragging) { pos = toMetres(ev); draw(); } });
    svg.addEventListener("pointerup", () => { dragging = false; });
    draw();
    root.appendChild(box);
  }

  // ================= Mirrors and blind spot =================
  function mirrorWidget(root) {
    const HALF = 9.5;
    let phi = HALF / 2;
    let carY = 250;
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Страничните огледала и мъртвата зона</h3><p>Изглед отгоре. Нагласи огледалата и премести колата в лявата лента.</p></div>
      <div class="split">
        <svg class="stage" viewBox="0 0 520 600" style="max-height:520px"></svg>
        <div style="display:grid;gap:14px;min-width:0">
          <div class="controls"></div>
          <label class="range">Ъгъл на огледалата навън <input type="range" id="mir-angle" min="0" max="24" step="0.5" value="${phi}"><output></output></label>
          <label class="range">Кола в лявата лента: отпред ↔ отзад <input type="range" id="mir-car" min="40" max="470" step="5" value="${carY}"><output></output></label>
          <div class="readout" aria-live="polite"></div>
        </div>
      </div>
    </div>`);
    const svg = box.querySelector("svg");
    const [rAngle, rCar] = box.querySelectorAll("input");
    const [oAngle, oCar] = box.querySelectorAll("output");
    const readout = box.querySelector(".readout");
    const ctr = box.querySelector(".controls");
    const presetClassic = h(`<button type="button" class="btn small">Класическа</button>`);
    const presetWide = h(`<button type="button" class="btn small">Разширена</button>`);
    presetClassic.addEventListener("click", () => { phi = HALF / 2; draw(); });
    presetWide.addEventListener("click", () => { phi = HALF + 2; draw(); });
    ctr.append(presetClassic, presetWide);

    const BODY = { x1: 222, x2: 298, y1: 150, y2: 310 };
    const ML = [213, 196], MR = [307, 196], MI = [260, 206];
    const EYE_Y = 220;
    const LEN = 900;

    function cone(m, side) {
      // side: -1 = left (outward is -x), +1 = right
      const a1 = phi - HALF, a2 = phi + HALF;
      const p = (a) => [m[0] + side * Math.sin(rad(a)) * LEN, m[1] + Math.cos(rad(a)) * LEN];
      const [x1, y1] = p(a1), [x2, y2] = p(a2);
      return `<polygon points="${m[0]},${m[1]} ${x1},${y1} ${x2},${y2}"/>`;
    }
    function angleRange(m, side, rect) {
      const corners = [[rect.x1, rect.y1], [rect.x2, rect.y1], [rect.x1, rect.y2], [rect.x2, rect.y2]];
      const as = corners.filter((c) => c[1] > m[1]).map((c) => deg(Math.atan2(side * (c[0] - m[0]), c[1] - m[1])));
      if (!as.length) return null;
      return [Math.min(...as), Math.max(...as)];
    }
    const overlap = (r, a, b) => r && r[1] >= a && r[0] <= b;

    function draw() {
      const other = { x1: 72, x2: 148, y1: carY, y2: carY + 160 };
      const inLeft = overlap(angleRange(ML, -1, other), phi - HALF, phi + HALF);
      const inInner = overlap(angleRange(MI, 1, other), -11, 11) && other.y2 > BODY.y2 + 20;
      const direct = other.y1 < EYE_Y - 30;
      const share = clamp((HALF - phi) / (2 * HALF), 0, 1);
      let s = `<rect width="520" height="600" class="r-road"/>`;
      for (const x of [185, 335]) for (let y = 0; y < 600; y += 40) s += `<rect x="${x - 1.5}" y="${y}" width="3" height="24" class="r-paint" opacity=".8"/>`;
      s += `<defs><clipPath id="clipL"><rect x="0" y="0" width="${BODY.x1}" height="600"/></clipPath><clipPath id="clipR"><rect x="${BODY.x2}" y="0" width="${520 - BODY.x2}" height="600"/></clipPath><clipPath id="clipI"><rect x="0" y="${BODY.y2}" width="520" height="${600 - BODY.y2}"/></clipPath></defs>`;
      s += `<g clip-path="url(#clipL)" fill="rgba(122,169,255,.28)" stroke="rgba(122,169,255,.8)">${cone(ML, -1)}</g>`;
      s += `<g clip-path="url(#clipR)" fill="rgba(122,169,255,.28)" stroke="rgba(122,169,255,.8)">${cone(MR, 1)}</g>`;
      s += `<g clip-path="url(#clipI)" fill="rgba(62,224,122,.18)" stroke="rgba(62,224,122,.7)"><polygon points="${MI[0]},${MI[1]} ${MI[0] - Math.tan(rad(11)) * LEN},${MI[1] + LEN} ${MI[0] + Math.tan(rad(11)) * LEN},${MI[1] + LEN}"/></g>`;
      // other car
      const oc = direct ? "#9aa1a9" : inLeft || inInner ? "#1aa64b" : "#d13b2f";
      s += `<rect x="${other.x1}" y="${other.y1}" width="76" height="160" rx="14" fill="${oc}" stroke="rgba(0,0,0,.35)"/><rect x="${other.x1 + 8}" y="${other.y1 + 28}" width="60" height="30" rx="6" fill="rgba(255,255,255,.65)"/>`;
      // own car
      s += `<rect x="${BODY.x1}" y="${BODY.y1}" width="76" height="160" rx="14" fill="#2b6fe0" stroke="rgba(0,0,0,.4)"/><rect x="${BODY.x1 + 8}" y="${BODY.y1 + 28}" width="60" height="30" rx="6" fill="rgba(255,255,255,.75)"/><rect x="${BODY.x1 + 10}" y="${BODY.y2 - 30}" width="56" height="18" rx="5" fill="rgba(255,255,255,.6)"/>`;
      s += `<rect x="${ML[0] - 9}" y="${ML[1] - 4}" width="10" height="8" rx="2" fill="#16181b"/><rect x="${MR[0] - 1}" y="${MR[1] - 4}" width="10" height="8" rx="2" fill="#16181b"/>`;
      s += `<circle cx="245" cy="${EYE_Y}" r="9" fill="#f1c9a5" stroke="#16181b"/>`;
      svg.innerHTML = s;
      oAngle.textContent = `${phi.toFixed(1)}°`;
      rAngle.value = phi;
      oCar.textContent = direct ? "до теб" : `${((other.y1 - EYE_Y) / 42).toFixed(1)} м зад теб`;
      rCar.value = carY;

      let quality;
      if (share > 0.4) quality = ["stop", "Твърде навътре", "Виждаш предимно собствената си кола. Съседната лента почти не е покрита."];
      else if (share >= 0.1) quality = ["go", "Класическа настройка", `Около ${Math.round(share * 100)}% от огледалото е твоята кола – добър ориентир. Мъртвата зона е по-голяма – поглед през рамо е задължителен.`];
      else if (phi <= 17) quality = ["info", "Разширена настройка", "Колата почти не се вижда, а огледалото поема там, където свършва вътрешното. Мъртвата зона е по-малка, но не изчезва."];
      else quality = ["wait", "Твърде навън", "Губиш връзка със собствената кола и се отваря празнина зад теб, която не покрива нито едно огледало."];

      const where = direct ? "Виждаш я директно, с периферното зрение." : inLeft && inInner ? "Вижда се в лявото и във вътрешното огледало." : inLeft ? "Вижда се в лявото огледало." : inInner ? "Вижда се само във вътрешното огледало." : "<b>Не се вижда в нито едно огледало – тя е в мъртвата зона.</b> Само поглед през рамо ще я покаже.";
      readout.innerHTML = `<span class="pill ${quality[0]}">${quality[1]}</span><p>${quality[2]}</p><p><b>Колата в лявата лента:</b> ${where}</p><span class="lawref">Поглед през рамо: ЗДвП чл. 25 – „да се убеди“</span>`;
    }
    rAngle.addEventListener("input", () => { phi = parseFloat(rAngle.value); draw(); });
    rCar.addEventListener("input", () => { carY = parseFloat(rCar.value); draw(); });
    draw();
    root.appendChild(box);
  }

  // ================= Dashboard =================
  function dashboardWidget(root) {
    let filter = "all";
    let selected = "oil";
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Контролни лампи</h3><p>Натисни символ, за да видиш какво означава и какво правиш.</p></div>
      <div class="controls"></div>
      <div class="legend-row"><span><i class="dot" style="background:#ff4a3d"></i>Спри безопасно</span><span><i class="dot" style="background:#ffb21a"></i>Провери скоро</span><span><i class="dot" style="background:#3ee07a"></i>Включено</span><span><i class="dot" style="background:#4c8dff"></i>Дълги светлини</span></div>
      <div class="dash-detail readout" aria-live="polite"></div>
      <div class="dash-grid"></div>
    </div>`);
    const grid = box.querySelector(".dash-grid");
    const detail = box.querySelector(".dash-detail");
    box.querySelector(".controls").appendChild(
      segmented([["all", "Всички"], ["red", "Червени"], ["amber", "Жълти"], ["green", "Зелени и сини"]], filter, (v) => { filter = v; draw(); }, "Цвят")
    );
    const word = { red: "Червен", amber: "Жълт", green: "Зелен", blue: "Син" };
    function showDetail() {
      const d = DASH.find((x) => x.id === selected);
      detail.innerHTML = `<div class="lamp ${d.color}">${ICONS[d.id]}</div><div style="display:grid;gap:6px;min-width:0"><span class="pill ${d.color === "red" ? "stop" : d.color === "amber" ? "wait" : d.color === "blue" ? "info" : "go"}">${word[d.color]}</span><h4>${d.name}</h4><p>${d.what}</p><p><b>Какво правиш:</b> ${d.act}</p></div>`;
    }
    function draw() {
      grid.innerHTML = "";
      DASH.filter((d) => filter === "all" || d.color === filter || (filter === "green" && d.color === "blue")).forEach((d) => {
        const b = h(`<button type="button" class="dash-btn ${d.color}" aria-pressed="${d.id === selected}">${ICONS[d.id]}<span>${d.name}</span></button>`);
        b.addEventListener("click", () => {
          selected = d.id;
          grid.querySelectorAll(".dash-btn").forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
          showDetail();
        });
        grid.appendChild(b);
      });
      showDetail();
    }
    draw();
    root.appendChild(box);
  }

  // ================= Stopping distance =================
  function stoppingWidget(root) {
    let v = 90;
    let react = 1;
    const SURF = [
      { id: "dry", name: "Сух асфалт", mu: 0.8, col: "var(--green)" },
      { id: "wet", name: "Мокър асфалт", mu: 0.5, col: "var(--accent)" },
      { id: "snow", name: "Утъпкан сняг", mu: 0.25, col: "var(--amber)" },
      { id: "ice", name: "Лед", mu: 0.1, col: "var(--red)" },
    ];
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Спирачен път</h3><p>Ориентировъчно: зависи от гумите, колата и наклона.</p></div>
      <div class="controls" style="align-items:center"></div>
      <label class="range">Скорост <input type="range" id="stop-speed" min="20" max="140" step="5" value="${v}"><output></output></label>
      <div class="bars" style="display:grid;gap:10px"></div>
      <p class="sd-note" style="font-size:.88rem;color:var(--muted)"></p>
    </div>`);
    const range = box.querySelector("input");
    const out = box.querySelector("output");
    const bars = box.querySelector(".bars");
    const note = box.querySelector(".sd-note");
    box.querySelector(".controls").appendChild(
      segmented([[1, "Реакция 1 s – внимателен"], [2, "Реакция 2 s – уморен или разсеян"]], react, (x) => { react = x; draw(); }, "Време за реакция")
    );
    function draw() {
      const ms = v / 3.6;
      const r = ms * react;
      const rows = SURF.map((s) => ({ ...s, r, b: (ms * ms) / (2 * s.mu * 9.81) }));
      const max = Math.max(...rows.map((x) => x.r + x.b));
      bars.innerHTML = rows
        .map(
          (x) => `<div style="display:grid;grid-template-columns:minmax(92px,120px) minmax(0,1fr) 64px;gap:10px;align-items:center;font-size:.88rem">
            <span>${x.name}</span>
            <div style="display:flex;height:16px;border-radius:4px;overflow:hidden;background:var(--surface-2)">
              <i style="width:${((x.r / max) * 100).toFixed(1)}%;background:var(--muted);opacity:.55"></i>
              <i style="width:${((x.b / max) * 100).toFixed(1)}%;background:${x.col}"></i>
            </div>
            <b style="font-family:var(--mono);text-align:right;font-variant-numeric:tabular-nums">${Math.round(x.r + x.b)} м</b>
          </div>`
        )
        .join("");
      out.textContent = `${v} km/h`;
      note.innerHTML = `Сивото е пътят, изминат, докато реагираш (${Math.round(r)} м) – колата още не спира. При двойно по-висока скорост спирачният път е около четири пъти по-дълъг.`;
    }
    range.addEventListener("input", () => { v = parseInt(range.value, 10); draw(); });
    draw();
    root.appendChild(box);
  }

  window.BGWidgets = {
    znaci: signsWidget,
    markirovka: markingsWidget,
    svetofar: trafficLightWidget,
    regulirovchik: regulatorWidget,
    predimstvo: priorityWidget,
    krugovo: roundaboutWidget,
    parkirane: parkingWidget,
    ogledala: mirrorWidget,
    tablo: dashboardWidget,
    vreme: stoppingWidget,
  };
})();
