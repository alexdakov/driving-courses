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
    let group = "Б", query = "", current = ALL.find((s) => s.c === "Б1");
    // opened from the search: show that sign
    const wanted = window.BGOpenSign && ALL.find((s) => s.c === window.BGOpenSign);
    window.BGOpenSign = null;
    if (wanted) { current = wanted; group = wanted.g; }
    const box = h(`<div class="widget sx">
      <div class="sx-groups" role="tablist" aria-label="Групи знаци"></div>
      <p class="sx-hook"></p>
      <div class="controls" style="align-items:center;justify-content:flex-end">
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
    // one more category: signs that are easy to mix up (content in js/more/podobni.js, drawn by js/extras.js)
    if (window.BGPodobni) {
      const g1 = ALL.find((s) => s.c === "Г1"), d4 = ALL.find((s) => s.c === "Д4");
      const b = h(`<button type="button" role="tab" data-g="podobni" class="sx-pod"><span class="sx-pair"><img src="${g1.f}" alt=""><img src="${d4.f}" alt=""></span><span><b>≈</b> Подобни знаци</span><small>как да не ги бъркаш</small></button>`);
      b.addEventListener("click", () => { group = "podobni"; query = ""; input.value = ""; draw(); });
      groupsEl.appendChild(b);
    }
    input.addEventListener("input", () => { query = input.value.trim().toLowerCase(); if (group === "podobni" && query) group = current.g; draw(); });

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

    function draw() {
      groupsEl.querySelectorAll("button").forEach((b) => { const on = !query && b.dataset.g === group; b.setAttribute("aria-selected", String(on)); });
      if (group === "podobni" && !query) {
        hook.innerHTML = `<b>Знаци, които си приличат.</b> Една стрелка, една черта или един цвят сменят значението. Първо формата и цветът, после символът.`;
        stage.innerHTML = "";
        window.BGPodobni(stage);
        return;
      }
      const g = SIGNDATA.GROUPS.find((x) => x.g === group);
      hook.innerHTML = query ? `Резултати за „${query}“ във всички групи.` : `<b>${g.shape}.</b> ${g.hook} <span class="sx-what">${g.what}</span>`;
      drawLearn();
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
  // moving group for the marking cards: values = translate list, kt = keyTimes
  const mv = (inner, values, kt, dur = 6) => `<g><animateTransform attributeName="transform" type="translate" values="${values}"${kt ? ` keyTimes="${kt}"` : ""} dur="${dur}s" repeatCount="indefinite"/>${inner}</g>`;
  const walkerDot = (x, y) => `<g transform="translate(${x} ${y})"><circle r="5.5" fill="#f08a24" stroke="#fff" stroke-width="1.5"/><circle cy="-8" r="3.5" fill="#f3c7a1"/></g>`;
  function markSVG(id) {
    let s = roadBase();
    switch (id) {
      case "m1":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/>${mv(car(70, 82), "0 0;180 0;-90 0;0 0", "0;.67;.67;1")}${mv(car(220, 38, -1, "car-b"), "0 0;-260 0;60 0;0 0", "0;.8;.8;1")}`;
        break;
      case "m2":
        s += `<rect x="0" y="55.5" width="300" height="3" class="r-paint"/><rect x="0" y="61.5" width="300" height="3" class="r-paint"/>${mv(car(70, 84), "0 0;180 0;-90 0;0 0", "0;.67;.67;1")}${mv(car(220, 36, -1, "car-b"), "0 0;-260 0;60 0;0 0", "0;.8;.8;1")}`;
        break;
      case "m3":
        s += dashes(60, 30, 20) + mv(car(60, 82), "0 0;30 0;100 -44;180 -44;180 -44", "0;.2;.55;.85;1") + `<path d="M84 82 C120 82 120 38 160 38" class="s-go" fill="none" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#mk-go)"/>`;
        break;
      case "warnline":
        s += dashes(60, 42, 10, 0, 200) + `<rect x="210" y="58.5" width="90" height="3" class="r-paint"/>` + car(150, 82, 1, "car-b") + mv(car(60, 82), "0 0;30 -44;130 -44;160 0;220 0;220 0", "0;.2;.55;.75;.95;1");
        break;
      case "m5":
        s += `<rect x="0" y="54.5" width="300" height="3" class="r-paint"/>` + dashes(63, 30, 20) + mv(car(50, 84), "0 0;30 0;100 -44;170 -44;170 -44", "0;.2;.55;.85;1") + mv(car(250, 35, -1, "car-b"), "0 0;-300 0;0 0", "0;.9;1") +
          `<path d="M74 84 C110 84 110 40 150 40" class="s-go" fill="none" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#mk-go)"/>`;
        break;
      case "m6":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/><rect x="222" y="62" width="8" height="40" class="r-paint"/><text x="198" y="82" class="r-text" font-size="15" font-weight="800" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 198 82)">STOP</text>${mv(car(150, 82), "-110 0;48 0;48 0;160 0;160 0", "0;.35;.6;.85;1")}${signAt("B2", 236, 76, 30)}`;
        break;
      case "m7":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/>`;
        for (let y = 64; y < 102; y += 9) s += `<rect x="226" y="${y}" width="6" height="5" class="r-paint"/>`;
        s += `<polygon points="178,82 206,70 206,94" fill="none" class="s-paint" stroke-width="3"/>${mv(car(120, 82), "-80 0;85 0;85 0;190 0;190 0", "0;.35;.55;.85;1")}${signAt("B1", 238, 74, 30)}`;
        break;
      case "m8":
        s = roadBase();
        for (let y = 20; y < 100; y += 13) s += `<rect x="128" y="${y}" width="44" height="8" class="r-paint"/>`;
        s += `${mv(car(70, 82), "0 0;35 0;35 0;200 0;200 0", "0;.2;.65;.95;1")}${mv(car(240, 38, -1, "car-b"), "0 0;-35 0;-35 0;-240 0;-240 0", "0;.2;.65;.95;1")}${mv(walkerDot(150, 112), "0 0;0 0;0 -96;0 -96", "0;.2;.62;1")}`;
        break;
      case "m14": {
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/>`;
        let pts = "";
        for (let i = 0, x = 50; x <= 250; x += 12, i++) pts += `${x},${i % 2 ? 90 : 99} `;
        s += `<polyline points="${pts}" fill="none" class="s-yellow" stroke-width="3.5" stroke-linejoin="miter"/><text x="150" y="76" class="r-text" font-size="11" font-weight="700" text-anchor="middle">BUS</text>${mv(`<rect x="-30" y="-10" width="60" height="20" rx="4" fill="#2ea44f"/><rect x="-24" y="-6" width="40" height="5" rx="1" fill="#cfe6fb"/>`, "-60 0;150 0;150 0;380 0;380 0", "0;.35;.65;1;1", 7).replace("<g>", '<g transform="translate(0 92)"><g>') + "</g>"}`;
        break;
      }
      case "m15":
        s += `<defs><clipPath id="cp-m15"><polygon points="60,60 150,44 240,44 240,76 150,76"/></clipPath></defs>`;
        s += `<g clip-path="url(#cp-m15)">`;
        for (let x = 40; x < 280; x += 12) s += `<line x1="${x}" y1="80" x2="${x + 32}" y2="40" class="s-paint" stroke-width="3"/>`;
        s += `</g><polygon points="60,60 150,44 240,44 240,76 150,76" fill="none" class="s-paint" stroke-width="3"/>${mv(car(30, 86), "0 0;300 0;0 0", "0;.9;1")}${mv(car(280, 32, -1, "car-b"), "0 0;-300 0;0 0", "0;.9;1")}`;
        break;
      case "m10": {
        s += dashes(44, 26, 18) + dashes(76, 26, 18);
        const arrow = (x, y, kind) => {
          if (kind === "s") return `<path d="M${x} ${y - 3} H${x + 30} V${y - 9} L${x + 44} ${y} L${x + 30} ${y + 9} V${y + 3} H${x} Z" class="r-paint"/>`;
          if (kind === "l") return `<path d="M${x} ${y - 3} H${x + 22} V${y - 14} H${x + 16} L${x + 25} ${y - 26} L${x + 34} ${y - 14} H${x + 28} V${y + 3} H${x} Z" class="r-paint"/>`;
          return `<path d="M${x} ${y + 3} H${x + 22} V${y + 14} H${x + 16} L${x + 25} ${y + 26} L${x + 34} ${y + 14} H${x + 28} V${y - 3} H${x} Z" class="r-paint"/>`;
        };
        s += arrow(150, 32, "l") + arrow(150, 60, "s") + arrow(150, 86, "r") + mv(car(70, 28), "0 0;140 0;180 -40;180 -40", "0;.6;.8;1") + mv(car(70, 60), "0 0;240 0;240 0", "0;.8;1") + mv(car(70, 92), "0 0;140 0;180 40;180 40", "0;.6;.8;1");
        break;
      }
      case "m17":
        s += `<rect x="0" y="58.5" width="300" height="3" class="r-paint"/><rect x="140" y="17" width="26" height="86" class="r-bump"/>`;
        for (let y = 66; y < 100; y += 12) s += `<polygon points="144,${y} 162,${y + 5} 144,${y + 10}" class="r-paint"/>`;
        for (let y = 22; y < 56; y += 12) s += `<polygon points="162,${y} 144,${y + 5} 162,${y + 10}" class="r-paint"/>`;
        s += mv(car(70, 82), "0 0;50 0;90 0;200 0;200 0", "0;.3;.65;.9;1") + mv(car(240, 38, -1, "car-b"), "0 0;-50 0;-90 0;-210 0;-210 0", "0;.3;.65;.9;1");
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
    red: { l: { r: 1 }, t: "Червена светлина", pill: ["stop", "Преминаването е забранено"], p: "Спираш преди стоп-линията. Ако няма такава – преди светофара. Ако светофарът е в средата на кръстовището, не навлизаш в него, нито на пешеходната пътека.", ref: "ППЗДвП чл. 31, ал. 7, т. 1" },
    ry: { l: { r: 1, y: 1 }, t: "Червена и жълта едновременно", pill: ["stop", "Забранено – предстои зелено"], p: "Все още е забранено. Сигналът само предупреждава, че след малко ще светне зелено. Подготви се, но не потегляй.", ref: "ППЗДвП чл. 31, ал. 7, т. 2" },
    green: { l: { g: 1 }, t: "Зелена светлина", pill: ["go", "Преминаването е разрешено"], p: "Минаваш, но не навлизаш, ако не можеш да напуснеш кръстовището до смяната на сигнала. При завой пропускаш пешеходците, а при ляв завой – и насрещните.", ref: "ППЗДвП чл. 31, ал. 7, т. 3; ЗДвП чл. 37, 50а, 119" },
    yellow: { l: { y: 1 }, t: "Жълта светлина", pill: ["wait", "Внимание, спри!"], p: "Спираш. Продължаваш само ако си толкова близо, че не можеш да спреш безопасно. Ако вече си в кръстовището – освобождаваш го.", ref: "ППЗДвП чл. 31, ал. 7, т. 4" },
    flash: { l: { y: "blink" }, t: "Мигаща жълта светлина", pill: ["info", "Внимание!"], p: "Светофарът не регулира. Минаваш внимателно, а предимството се определя от знаците – или от правилото на дясното, ако няма знаци.", ref: "ППЗДвП чл. 37; ЗДвП чл. 48, 50" },
    arrow: { l: { r: 1, a: 1 }, t: "Червено + зелена стрелка в допълнителната секция", pill: ["go", "Само в посоката на стрелката"], p: "Можеш да завиеш надясно, като пропуснеш пешеходците и колите, които минават през кръстовището. Направо е забранено.", ref: "ППЗДвП чл. 32; ЗДвП чл. 35, ал. 4" },
    gblink: { l: { g: "blink" }, t: "Мигаща зелена светлина", pill: ["wait", "Зеленото изтича"], p: "На някои светофари зеленото мига преди жълтото. Не ускорявай, за да „хванеш“ сигнала – подготви се за спиране.", ref: "Добра практика – ППЗДвП не урежда отделно мигащо зелено" },
  };
  function trafficLightWidget(root) {
    let state = "red";
    const order = [["red", "Червено"], ["ry", "Червено + жълто"], ["green", "Зелено"], ["yellow", "Жълто"], ["flash", "Мигащо жълто"], ["arrow", "Зелена стрелка"], ["gblink", "Мигащо зелено"]];
    // tiny three-lamp icon for each choice
    const mini = (k) => { const L = TL_STATES[k].l; const c = (on, col) => (on ? col : "#3a3f45"); return `<svg viewBox="0 0 16 40" aria-hidden="true"><rect width="16" height="40" rx="4" fill="#15181b"/><circle cx="8" cy="8" r="4.6" fill="${c(L.r, "#ff3b30")}"/><circle cx="8" cy="20" r="4.6" fill="${c(L.y, "#ffc400")}"/><circle cx="8" cy="32" r="4.6" fill="${c(L.g || L.a, "#22d36b")}"/></svg>`; };
    const box = h(`<div class="widget tl-w">
      <div class="widget-head"><h3>Светофар</h3><p>Избери сигнал, за да видиш какво означава.</p></div>
      <div class="tl-body">
        <div class="tl-stage"><svg class="stage tl-svg" viewBox="0 0 220 300" role="img" aria-label="Светофар"></svg></div>
        <div class="tl-side">
          <div class="tl-pick" role="group" aria-label="Сигнал на светофара">${order.map(([k, t]) => `<button type="button" data-k="${k}" aria-pressed="${k === state}">${mini(k)}<span>${t}</span></button>`).join("")}</div>
          <div class="readout" aria-live="polite"></div>
        </div>
      </div>
    </div>`);
    const svg = box.querySelector(".tl-svg");
    const readout = box.querySelector(".readout");
    const seg = box.querySelector(".tl-pick");
    seg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => set(b.dataset.k)));

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
    draw();
    root.appendChild(box);
    const otherSignals = h(`<div class="rules" style="margin-top:12px">
      <div class="rule"><div class="rule-text"><h4>Пешеходен светофар</h4><div class="body"><p>Две полета: червен стоящ и зелен вървящ човек. Пешеходците, заварени на платното от червеното, трябва да го освободят – дай им време.</p></div><span class="lawref">ППЗДвП чл. 35, ал. 4</span></div></div>
      <div class="rule"><div class="rule-text"><h4>Светофар на градския транспорт</h4><div class="body"><p>Бели светлини – хоризонтална линия, стрелки. Отнася се само за автобуси, тролеи и трамваи – ти спазваш обикновения светофар.</p></div><span class="lawref">ППЗДвП чл. 34</span></div></div>
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

  // drag on a 3D stage: left/right turns the camera around, up/down tilts it; double click resets.
  // The stage keeps vertical page scrolling on touch screens (touch-action: pan-y).
  function dragOrbit(el, active, onDrag, onReset) {
    let last = null;
    el.classList.add("draggable");
    el.addEventListener("pointerdown", (e) => { if (!active()) return; last = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId); el.classList.add("dragging"); });
    el.addEventListener("pointermove", (e) => {
      if (!last) return;
      const dx = e.clientX - last[0], dy = e.clientY - last[1];
      last = [e.clientX, e.clientY];
      if (dx || dy) onDrag(-dx * 0.5, dy * 0.3);
    });
    const end = () => { last = null; el.classList.remove("dragging"); };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("dblclick", () => { if (active() && onReset) onReset(); });
    el.addEventListener("keydown", (e) => {
      if (!active()) return;
      const k = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[e.key];
      if (k) { e.preventDefault(); onDrag(k[0], k[1]); }
    });
    el.setAttribute("tabindex", "0");
  }
  const dragHint = `<span class="drag-hint" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 12H3m0 0 3-3m-3 3 3 3M16 12h5m0 0-3-3m3 3-3 3M12 8V3m0 0-3 3m3-3 3 3M12 16v5m0 0-3-3m3 3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Влачи, за да завъртиш</span>`;
  const camEye = (cx, cy, R, orbit, tilt) => [cx + R * Math.cos(rad(tilt)) * Math.sin(rad(orbit)), cy + R * Math.cos(rad(tilt)) * Math.cos(rad(orbit)), R * Math.sin(rad(tilt))];

  // ================= Traffic controller =================
  function regulatorWidget(root) {
    let pose = "side";
    let facing = "S"; // direction the chest points to
    let view = "3d";
    let orbit = 35; // 3D camera angle around the crossing, degrees (0 = from the bottom of the map)
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Сигнали на регулировчика</h3><p>Избери положение и завърти регулировчика. Колите показват кой може да мине. В 3D можеш да въртиш камерата.</p></div>
      <div class="view-bar"></div>
      <div class="split">
        <div class="stage-wrap"><svg class="stage" viewBox="-34 -34 368 368" aria-label="Кръстовище с регулировчик. Влачи, за да завъртиш изгледа."></svg>${dragHint}</div>
        <div class="readout" aria-live="polite"></div>
      </div>
      <div class="controls"></div>
    </div>`);
    const svg = box.querySelector("svg");
    const readout = box.querySelector(".readout");
    const controls = box.querySelector(".controls");
    let tilt = 45;
    box.querySelector(".view-bar").appendChild(segmented([["3d", "3D"], ["2d", "2D отгоре"]], view, (v) => { view = v; draw(); }, "Изглед"));
    dragOrbit(svg, () => view === "3d", (dx, dy) => { orbit = (orbit + dx + 360) % 360; tilt = clamp(tilt + dy, 14, 88); draw(); }, () => { orbit = 35; tilt = 45; draw(); });
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

    // ---- 3D view ----
    const FVEC = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] };
    const qb = (p0, c, p1, n = 16) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]; });
    const MOVE_PTS = { straight: [[167, 214], [167, 70]], right: qb([167, 214], [167, 168], [230, 168]), left: qb([167, 214], [167, 132], [70, 132]) };
    function draw3d(rows) {
      const G = window.BG3D;
      box.querySelector(".drag-hint").hidden = false;
      const cam = G.camera({ eye: camEye(150, 150, 330, orbit, tilt), target: [150, 150, 14], f: 390, cx: 150, cy: 150 });
      let s = cam.poly([[-1500, -1500, 0], [1800, -1500, 0], [1800, 1800, 0], [-1500, 1800, 0]], `fill="#bcd5a9"`);
      s += cam.poly([[112, -1500, 0], [188, -1500, 0], [188, 1800, 0], [112, 1800, 0]], `fill="#4a4f57"`) + cam.poly([[-1500, 112, 0], [1800, 112, 0], [1800, 188, 0], [-1500, 188, 0]], `fill="#4a4f57"`);
      for (const d of DIRS) {
        for (let y = 196; y < 420; y += 18) s += cam.poly([[149, y], [151, y], [151, y + 10], [149, y + 10]].map(([x, yy]) => [...rotPt(x, yy, ROT[d]), 0]), `fill="#fff" opacity=".85"`);
        const st = rows.find((r) => r.d === d).st;
        st.moves.forEach((m) => {
          const pts = MOVE_PTS[m].map(([x, y]) => [...rotPt(x, y, ROT[d]), 0.5]);
          s += cam.line(pts, `stroke="#1aa64b" stroke-width="4" stroke-dasharray="7 5" stroke-linecap="round" marker-end="url(#mk-reg3)"`);
        });
      }
      const items = [];
      // cars
      rows.forEach(({ d, st }) => {
        const [x, y] = rotPt(167, 240, ROT[d]);
        items.push(G.car(cam, { x, y, yaw: -90 + ROT[d], col: st.ok ? "#1aa64b" : "#d13b2f" }));
      });
      // the traffic controller, chest towards `facing`
      const f = FVEC[facing], r = [-f[1], f[0]];
      const C0 = [150, 150];
      const K = 1.6; // figure scale – bigger than life so the arms read clearly
      const at = (fw, rt, z) => [C0[0] + (f[0] * fw + r[0] * rt) * K, C0[1] + (f[1] * fw + r[1] * rt) * K, z * K];
      const yawF = deg(Math.atan2(f[1], f[0]));
      const uni = "#2c3e5c", skin = "#f3c7a1";
      const part = (s2, p) => items.push({ d: cam.depth(...p), s: s2 });
      s += cam.poly(window.BG3D.circle(150, 150, 13 * K, 0.3, 20), `fill="rgba(0,0,0,.25)"`);
      part(cam.seg(at(0, 4, 24), at(0, 4, 0), 6 * K, "#1d2433"), at(0, 4, 12));
      part(cam.seg(at(0, -4, 24), at(0, -4, 0), 6 * K, "#1d2433"), at(0, -4, 12));
      const torso = G.box(cam, { x: 150, y: 150, z0: 22 * K, l: 9 * K, w: 17 * K, h: 19 * K, yaw: yawF, col: uni, faces: { front: "#d4ec3a" } });
      items.push(torso);
      // reflective strip on the back
      const sh = 39;
      const armSeg = (from, to, baton) => {
        const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
        let s2 = cam.seg(from, to, 5 * K, uni) + cam.ball(to, 3 * K, skin);
        if (baton) s2 += cam.seg(to, baton, 3 * K, "#fff") + cam.seg(to, baton, 3 * K, "#111", `stroke-dasharray="4 4"`);
        items.push({ d: cam.depth(...mid) - 0.5, s: s2 });
      };
      const RS = at(0, 10, sh), LS = at(0, -10, sh);
      if (pose === "up") { armSeg(RS, at(0, 11, 62), at(0, 11, 74)); armSeg(LS, at(1, -11, 22)); }
      if (pose === "side") { armSeg(RS, at(0, 30, sh), at(0, 42, sh)); armSeg(LS, at(0, -30, sh)); }
      if (pose === "forward") { armSeg(RS, at(22, 8, sh), at(34, 7, sh)); armSeg(LS, at(1, -11, 22)); }
      // head with a white cap; the peak shows where he looks
      part(cam.ball(at(0, 0, 47), 6.5 * K, skin) + cam.ball(at(0, 0, 52), 6.8 * K, "#fff") + cam.seg(at(3, 0, 51), at(10, 0, 51), 3.5 * K, "#1d2433"), at(0, 0, 47));
      s += G.paint(items);
      // labels: body sides on the ground, status above every car
      const tag = (p, text, bg, fg = "#fff", fs = 10) => {
        if (!p) return "";
        const w = text.length * fs * 0.62 + 12;
        return `<g><rect x="${(p[0] - w / 2).toFixed(1)}" y="${(p[1] - 10).toFixed(1)}" width="${w.toFixed(1)}" height="20" rx="10" fill="${bg}" opacity=".95"/><text x="${p[0].toFixed(1)}" y="${(p[1] + 0.5).toFixed(1)}" font-size="${fs}" font-weight="700" fill="${fg}" text-anchor="middle" dominant-baseline="central">${text}</text></g>`;
      };
      // body markers: "гърди"/"гръб" on whichever side faces the camera, Л/Д on the shoulders
      const chestSeen = f[0] * (cam.eye[0] - 150) + f[1] * (cam.eye[1] - 150) > 0;
      s += tag(cam.P(...at(chestSeen ? 5 : -5, 0, 31)), chestSeen ? "гърди" : "гръб", chestSeen ? "rgba(31,41,51,.85)" : "rgba(255,255,255,.92)", chestSeen ? "#fff" : "#1f2933", 9.5);
      const badge = (p, t) => p ? `<g><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="9" fill="#fff" stroke="#1f2933" stroke-width="1.5"/><text x="${p[0].toFixed(1)}" y="${(p[1] + 0.5).toFixed(1)}" font-size="10" font-weight="800" fill="#1f2933" text-anchor="middle" dominant-baseline="central">${t}</text></g>` : "";
      s += badge(cam.P(...at(0, 12, sh + 9)), "Д") + badge(cam.P(...at(0, -12, sh + 9)), "Л");
      rows.forEach(({ d, st }) => {
        const [x, y] = rotPt(167, 240, ROT[d]);
        s += tag(cam.P(x, y, 40), st.short, st.ok ? "#1aa64b" : "#d13b2f");
      });
      svg.innerHTML = `<defs><marker id="mk-reg3" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#1aa64b"/></marker></defs><rect x="-34" y="-34" width="368" height="368" fill="#cfe3f5"/>` + s;
    }

    function draw() {
      const rows = DIRS.map((d) => { const rel = relation(d); return { d, rel, st: status(rel) }; });
      if (view === "3d") draw3d(rows); else draw2d();
      readoutFor(rows);
    }
    function draw2d() {
      box.querySelector(".drag-hint").hidden = true;
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
      void ped;
    }
    function readoutFor(ped) {
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
      <div class="widget-head"><h3>Кой минава пръв – и защо</h3><p class="sc-count"></p></div>
      <div class="split">
        <div class="sc-anim"></div>
        <div class="readout" aria-live="polite"></div>
      </div>
      <div class="controls sc-nav"><button type="button" class="btn small sc-prev">← Предишна</button><button type="button" class="btn small sc-next">Следваща →</button></div>
    </div>`);
    const animEl = box.querySelector(".sc-anim"), readout = box.querySelector(".readout"), count = box.querySelector(".sc-count");
    function draw() {
      const api = window.BGAnim.mount(animEl, keys[idx], { base: "", playLabel: "▶ Покажи реда" });
      const sc = api.scenario;
      count.textContent = `Ситуация ${idx + 1} от ${keys.length}`;
      readout.innerHTML = `<h4>${sc.title}</h4><p>Редът е: <b>${sc.order.join(" → ")}</b></p><ol class="sc-order">${sc.steps.map((t) => `<li>${t}</li>`).join("")}</ol><span class="lawref">${sc.ref}</span>`;
    }
    box.querySelector(".sc-prev").addEventListener("click", () => { idx = (idx - 1 + keys.length) % keys.length; draw(); });
    box.querySelector(".sc-next").addEventListener("click", () => { idx = (idx + 1) % keys.length; draw(); });
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
    let view = "3d"; // "3d" (overview), "chase" (behind the car) or "2d"
    let orbit = 0;
    let lastI = 0;
    const box = h(`<div class="widget">
      <div class="widget-head"><h3>Път през кръговото</h3><p>Влизаш отдолу. Избери изход и лента, после „Пусни“. В 3D можеш да въртиш камерата или да караш „зад колата“.</p></div>
      <div class="view-bar"></div>
      <div class="split">
        <div class="stage-wrap"><svg class="stage" viewBox="0 0 340 340" aria-label="Кръгово кръстовище. Влачи, за да завъртиш изгледа."></svg>${dragHint}</div>
        <div class="readout" aria-live="polite"></div>
      </div>
      <div class="controls"></div>
    </div>`);
    const svg = box.querySelector("svg");
    const readout = box.querySelector(".readout");
    const controls = box.querySelector(".controls");
    let tilt = 43;
    box.querySelector(".view-bar").appendChild(segmented([["3d", "3D"], ["chase", "3D – зад колата"], ["2d", "2D отгоре"]], view, (v) => { view = v; render(lastI); }, "Изглед"));
    dragOrbit(svg, () => view === "3d", (dx, dy) => { orbit = (orbit + dx + 360) % 360; tilt = clamp(tilt + dy, 14, 88); render(lastI); }, () => { orbit = 0; tilt = 43; render(lastI); });
    const exitSeg = segmented([[1, "1-ви изход (надясно)"], [2, "2-ри (направо)"], [3, "3-ти (наляво)"], [4, "Обратно"]], exit, (v) => { exit = v; setLane(lane); reset(); }, "Изход");
    controls.appendChild(exitSeg);
    let laneSeg = segmented([["outer", "Външна лента"], ["inner", "Вътрешна лента"]], lane, (v) => { setLane(v); reset(); }, "Лента");
    controls.appendChild(laneSeg);
    const playBtn = h(`<button type="button" class="btn small primary">▶ Пусни</button>`);
    playBtn.addEventListener("click", play);
    controls.appendChild(playBtn);
    // step by step: drive to the next phase (enter, in the ring, lane change, indicator, exit) and stop
    const stepBtn = h(`<button type="button" class="btn small">⏭ Стъпка по стъпка</button>`);
    let stepK = 0;
    const phaseKeys = () => [0, ...pts.map((p, i) => (i && p.phase !== pts[i - 1].phase ? i : -1)).filter((i) => i > 0), pts.length - 1];
    stepBtn.addEventListener("click", () => {
      stopAnim();
      playBtn.textContent = "▶ Пусни";
      const keys = phaseKeys();
      if (stepK >= keys.length - 1) { stepK = 0; render(0); }
      const a = keys[stepK], last = stepK + 1 === keys.length - 1;
      // stop on the last point of this phase, so the text still describes it
      const b = last ? keys[stepK + 1] : keys[stepK + 1] - 1;
      stepK++;
      const n = keys.length - 1;
      stepBtn.textContent = stepK >= n ? "↺ Стъпките отначало" : `⏭ Стъпка ${stepK + 1} от ${n}`;
      if (reduceMotion()) { render(b); return; }
      const t0 = performance.now(), dur = 600 + (b - a) * 18;
      const tick = (t) => {
        const f = clamp((t - t0) / dur, 0, 1);
        render(Math.round(a + f * (b - a)));
        if (f < 1) raf = requestAnimationFrame(tick); else raf = null;
      };
      raf = requestAnimationFrame(tick);
    });
    controls.appendChild(stepBtn);

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
    function scene3d(p, heading, blinkOn) {
      const G = window.BG3D;
      let cam;
      if (view === "chase") {
        const hx = Math.cos(rad(heading)), hy = Math.sin(rad(heading));
        cam = G.camera({ eye: [p.x - hx * 92, p.y - hy * 92, 62], target: [p.x + hx * 70, p.y + hy * 70, 0], f: 300, cx: 170, cy: 160 });
      } else {
        cam = G.camera({ eye: camEye(C, C, 368, orbit, tilt), target: [C, C - 6, 0], f: 330, cx: 170, cy: 172 });
      }
      let s = `<rect width="340" height="340" fill="#cfe3f5"/>`;
      s += cam.poly([[-1500, -1500, 0], [1800, -1500, 0], [1800, 1800, 0], [-1500, 1800, 0]], `fill="#bcd5a9"`);
      s += cam.poly([[144, -1500, 0], [196, -1500, 0], [196, 1800, 0], [144, 1800, 0]], `fill="#4a4f57"`) + cam.poly([[-1500, 144, 0], [1800, 144, 0], [1800, 196, 0], [-1500, 196, 0]], `fill="#4a4f57"`);
      s += cam.poly(G.circle(C, C, 101, 0, 64), `fill="#4a4f57"`);
      s += cam.line([...G.circle(C, C, 75, 0.2, 64), [C + 75, C, 0.2]], `stroke="#fff" stroke-width="2" stroke-dasharray="8 7" opacity=".85"`);
      // arms: centre line, zebra, give-way line (in the frame of the bottom arm, rotated)
      const R = (x, y, a, z = 0.2) => [...rotPt(x, y, a, C, C), z];
      const signs = [];
      for (const a of [0, 90, 180, 270]) {
        s += cam.poly([R(168.5, 272, a), R(171.5, 272, a), R(171.5, 600, a), R(168.5, 600, a)], `fill="#fff" opacity=".9"`);
        for (let x = 148; x < 194; x += 8) s += cam.poly([R(x, 292, a), R(x + 5, 292, a), R(x + 5, 308, a), R(x, 308, a)], `fill="#fff"`);
        for (let x = 172; x < 194; x += 6) s += cam.poly([R(x, 270, a), R(x + 4, 270, a), R(x + 4, 273, a), R(x, 273, a)], `fill="#fff"`);
        signs.push({ pos: rotPt(207, 280, a, C, C), code: "B1" }, { pos: rotPt(207, 304, a, C, C), code: "G12" });
      }
      // route
      s += cam.line(pts.map((pt) => [pt.x, pt.y, 0.4]), `style="stroke:var(--accent)" stroke-width="3" stroke-dasharray="6 6" opacity=".9" stroke-linejoin="round"`);
      // raised central island
      const top = G.circle(C, C, 50, 4, 48);
      s += cam.poly(G.circle(C, C, 50, 0, 48), `fill="#9aa6b2"`) + cam.poly(top, `fill="#a6c48f" stroke="#fff" stroke-width="2"`);
      const items = [];
      // signs as upright billboards
      signs.forEach(({ pos, code }) => {
        const base = cam.P(pos[0], pos[1], 0), tp = cam.P(pos[0], pos[1], 30);
        if (!base || !tp) return;
        const sz = 13 * cam.scale(pos[0], pos[1], 30);
        items.push({ d: cam.depth(pos[0], pos[1], 15), s: `<line x1="${base[0].toFixed(1)}" y1="${base[1].toFixed(1)}" x2="${tp[0].toFixed(1)}" y2="${tp[1].toFixed(1)}" stroke="#8b939c" stroke-width="${Math.max(1, 1.6 * cam.scale(pos[0], pos[1], 15)).toFixed(1)}"/>${signAt(code, tp[0] - sz / 2, tp[1] - sz, sz)}` });
      });
      items.push(G.car(cam, { x: p.x, y: p.y, yaw: heading, col: "#2b6fe0", blink: blinkOn ? p.blink : null }));
      s += G.paint(items);
      // exit numbers
      [[1, 0], [2, -90], [3, -180]].forEach(([n, a]) => {
        const [x, y] = P(128, a);
        const q = cam.P(x + Math.cos(rad(a)) * 0, y, 0);
        if (q) s += `<g><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="11" style="fill:${n === exit ? "var(--accent)" : "rgba(0,0,0,.55)"}"/><text x="${q[0].toFixed(1)}" y="${(q[1] + 1).toFixed(1)}" font-size="11" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${n}</text></g>`;
      });
      return s;
    }
    function render(i) {
      lastI = i;
      box.querySelector(".drag-hint").hidden = view !== "3d";
      const p = pts[Math.min(i, pts.length - 1)];
      const q = pts[Math.min(i + 1, pts.length - 1)];
      const prev = pts[Math.max(i - 1, 0)];
      const ang = deg(Math.atan2(q.y - prev.y, q.x - prev.x)) + 90;
      const d = pts.map((pt, k) => `${k ? "L" : "M"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
      const blinkOn = p.blink && Math.floor(i / 6) % 2 === 0;
      if (view !== "2d") svg.innerHTML = scene3d(p, ang - 90, blinkOn);
      else svg.innerHTML =
        scene() +
        `<path d="${d}" fill="none" style="stroke:var(--accent)" stroke-width="3" stroke-dasharray="6 6" opacity=".9"/>` +
        `<g transform="translate(${p.x} ${p.y}) rotate(${ang})"><rect x="-9" y="-16" width="18" height="32" rx="4" fill="#2b6fe0" stroke="rgba(0,0,0,.4)"/><rect x="-7" y="-13" width="14" height="7" rx="2" fill="rgba(255,255,255,.8)"/>
          <rect x="-10" y="-17" width="5" height="4" rx="1" fill="${p.blink === "L" && blinkOn ? "#ffb21a" : "#555"}"/><rect x="5" y="-17" width="5" height="4" rx="1" fill="${p.blink === "R" && blinkOn ? "#ffb21a" : "#555"}"/>
          <rect x="-10" y="13" width="5" height="4" rx="1" fill="${p.blink === "L" && blinkOn ? "#ffb21a" : "#555"}"/><rect x="5" y="13" width="5" height="4" rx="1" fill="${p.blink === "R" && blinkOn ? "#ffb21a" : "#555"}"/></g>`;
      const ph = PHASE[p.phase];
      const blinkTxt = p.blink === "R" ? `<span class="pill wait">◀ ▶ Мигач надясно</span>` : p.blink === "L" ? `<span class="pill wait">Мигач наляво</span>` : `<span class="pill">Без мигач</span>`;
      readout.innerHTML = `${blinkTxt}<h4>${ph[0]}</h4><p>${ph[1]}</p><span class="lawref">ЗДвП чл. 25, 26, 35, 119; ППЗДвП чл. 46, 52</span>`;
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
      stepK = 0;
      stepBtn.textContent = "⏭ Стъпка по стъпка";
    }
    function play() {
      if (raf || tmo) { reset(); return; }
      stepK = 0;
      stepBtn.textContent = "⏭ Стъпка по стъпка";
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
      { from: 44, to: 56, name: "спирка", why: "На спирка паркирането е забранено. Престой – само за слизане на пътник и ако не пречиш на автобуса.", ref: "ЗДвП чл. 69; чл. 98, ал. 2, т. 3", kind: "park", stay: { pill: "Само за слизане на пътник", why: "На спирка може само за миг – пътникът слиза и тръгваш. Ако идва автобус, не спирай." } },
      { from: 61, to: 64, name: "вход на гараж", why: "Пред вход на гараж паркирането е забранено, когато пречи на влизането и излизането.", ref: "ЗДвП чл. 98, ал. 2, т. 1 и 2", kind: "park", stay: { pill: "Само ако не пречиш", why: "Престоят пред гараж не е изрично забранен – но само докато никой не иска да влезе или излезе. Щом блокираш някого, ставаш „пречка за движението“, а там престоят е забранен. Остани в колата и освободи веднага.", ref: "ЗДвП чл. 98, ал. 1, т. 1 и ал. 2, т. 2" } },
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
      const cond = hits.filter((z) => mode === "stay" && z.stay);
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
        readout.innerHTML = `<span class="pill wait">${cond[0].stay.pill}</span><p><b>${cond[0].name[0].toUpperCase() + cond[0].name.slice(1)}.</b> ${cond[0].stay.why}</p><span class="lawref">${cond[0].stay.ref || cond[0].ref}</span>`;
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
    // World in metres: x → right, y → backwards (the car drives towards -y), z → up.
    // Own car: 4.5 × 1.8 m, front bumper at y = 0, left-hand drive.
    const LANE = 3.5;
    const EYE = [-0.4, 1.9, 1.15];
    const M = { L: [-1.02, 1.3, 1.0], R: [1.02, 1.3, 1.0], I: [0, 1.45, 1.32] };
    const HALF = { L: 9.5, R: 10, I: 11 }; // half field of view of each mirror, degrees
    let phi = HALF.L / 2; // how far the side mirrors are turned outwards (0 = straight back along the car)
    let other = 6; // other car: distance of its front bumper behind your eyes, metres (negative = ahead)
    let side = "L";
    let view = "both";
    const box = h(`<div class="widget mirror-w">
      <div class="widget-head"><h3>Огледалата и мъртвата зона</h3><p>Нагласи страничните огледала и премести колата в съседната лента. Отгоре виждаш какво покрива всяко огледало, а от шофьорското място – какво точно показва.</p></div>
      <div class="view-bar"></div>
      <div class="mir-stages">
        <figure class="mir-top"><svg class="stage" viewBox="0 0 364 560" aria-label="Изглед отгоре"></svg><figcaption>Отгоре</figcaption></figure>
        <figure class="mir-cab"><svg class="stage" viewBox="0 0 520 330" aria-label="Изглед от шофьорското място"></svg><figcaption>От шофьорското място</figcaption></figure>
      </div>
      <div class="split" style="margin-top:12px">
        <div style="display:grid;gap:12px;min-width:0">
          <div class="controls"></div>
          <label class="range">Ъгъл на страничните огледала навън <input type="range" min="0" max="24" step="0.5" value="${phi}"><output></output></label>
          <label class="range">Другата кола: до теб ↔ назад <input type="range" min="-3" max="22" step="0.25" value="${other}"><output></output></label>
        </div>
        <div class="readout" aria-live="polite"></div>
      </div>
    </div>`);
    const [svgTop, svgCab] = box.querySelectorAll(".mir-stages svg");
    const [rAngle, rCar] = box.querySelectorAll("input");
    const [oAngle, oCar] = box.querySelectorAll("output");
    const readout = box.querySelector(".readout");
    const ctr = box.querySelector(".controls");
    box.querySelector(".view-bar").appendChild(segmented([["both", "Двата изгледа"], ["top", "Отгоре"], ["cab", "От шофьорското място"]], view, (v) => { view = v; draw(); }, "Изглед"));
    ctr.appendChild(segmented([["L", "Кола отляво"], ["R", "Кола отдясно"]], side, (v) => { side = v; draw(); }, "Лента на другата кола"));
    const presetClassic = h(`<button type="button" class="btn small">Класическа</button>`);
    const presetWide = h(`<button type="button" class="btn small">Разширена</button>`);
    presetClassic.addEventListener("click", () => { phi = HALF.L / 2; draw(); });
    presetWide.addEventListener("click", () => { phi = HALF.L + 2; draw(); });
    ctr.append(presetClassic, presetWide);

    // ---- geometry ----
    const otherRect = () => { const cx = side === "L" ? -LANE : LANE, front = EYE[1] + other; return { x1: cx - 0.9, x2: cx + 0.9, y1: front, y2: front + 4.5, cx }; };
    // angle of a point seen from a mirror, measured from "straight back", positive = outwards
    const outAng = (m, sgn, x, y) => deg(Math.atan2(sgn * (x - m[0]), y - m[1]));
    function seenIn(key, r) {
      const m = M[key], sgn = key === "L" ? -1 : key === "R" ? 1 : 1;
      const lo = key === "I" ? -HALF.I : phi - HALF[key], hi = key === "I" ? HALF.I : phi + HALF[key];
      const pts = [[r.x1, r.y1], [r.x2, r.y1], [r.x1, r.y2], [r.x2, r.y2]].filter((p) => p[1] > (key === "I" ? 4.6 : m[1] + 0.3));
      if (!pts.length) return false;
      const as = pts.map((p) => outAng(m, sgn, p[0], p[1]));
      return Math.max(...as) >= lo && Math.min(...as) <= hi;
    }
    const directly = (r) => r.y1 < EYE[1] - 0.3; // its front is ahead of your shoulder → peripheral vision
    const ownShare = () => clamp((HALF.L - phi) / (2 * HALF.L), 0, 1);

    // ---- top view ----
    const S = 25, X = (x) => 182 + x * S, Y = (y) => (y + 3.2) * S;
    const topCar = (cx, cy, col, own) => {
      const w = 1.8 * S, l = 4.5 * S, x = X(cx) - w / 2, y = Y(cy);
      return `<g><rect x="${x - 3}" y="${y + 0.12 * l}" width="5" height="${0.2 * l}" rx="2" fill="#1d2126"/><rect x="${x + w - 2}" y="${y + 0.12 * l}" width="5" height="${0.2 * l}" rx="2" fill="#1d2126"/><rect x="${x - 3}" y="${y + 0.68 * l}" width="5" height="${0.2 * l}" rx="2" fill="#1d2126"/><rect x="${x + w - 2}" y="${y + 0.68 * l}" width="5" height="${0.2 * l}" rx="2" fill="#1d2126"/>
        <rect x="${x}" y="${y}" width="${w}" height="${l}" rx="${w * 0.3}" fill="${col}" stroke="rgba(0,0,0,.35)"/>
        <rect x="${x + 5}" y="${y + 0.2 * l}" width="${w - 10}" height="${0.17 * l}" rx="5" fill="#cfe6fb"/><rect x="${x + 5}" y="${y + 0.4 * l}" width="${w - 10}" height="${0.3 * l}" rx="5" fill="rgba(0,0,0,.14)"/><rect x="${x + 6}" y="${y + 0.74 * l}" width="${w - 12}" height="${0.12 * l}" rx="4" fill="#cfe6fb"/>
        <rect x="${x + 4}" y="${y + 1}" width="8" height="4" rx="1.5" fill="#fff6c2"/><rect x="${x + w - 12}" y="${y + 1}" width="8" height="4" rx="1.5" fill="#fff6c2"/><rect x="${x + 4}" y="${y + l - 5}" width="8" height="4" rx="1.5" fill="#e0352b"/><rect x="${x + w - 12}" y="${y + l - 5}" width="8" height="4" rx="1.5" fill="#e0352b"/>
        ${own ? `<rect x="${X(M.L[0]) - 7}" y="${Y(M.L[1]) - 3}" width="8" height="6" rx="2" fill="#16181b"/><rect x="${X(M.R[0]) - 1}" y="${Y(M.R[1]) - 3}" width="8" height="6" rx="2" fill="#16181b"/><circle cx="${X(EYE[0])}" cy="${Y(EYE[1])}" r="7" fill="#f3c7a1" stroke="#16181b" stroke-width="1.5"/>` : ""}</g>`;
    };
    function cone(key, lo, hi, len = 40) {
      const m = M[key], sgn = key === "L" ? -1 : 1;
      const p = (a) => [m[0] + sgn * Math.sin(rad(a)) * len, m[1] + Math.cos(rad(a)) * len];
      const [a, b] = [p(lo), p(hi)];
      return `${X(m[0])},${Y(m[1])} ${X(a[0])},${Y(a[1])} ${X(b[0])},${Y(b[1])}`;
    }
    // where a whole car in the neighbouring lane can hide: behind your shoulder and before the side mirror's view
    // reaches the near side of that car (its inner edge runs 0.9 m from the lane centre)
    function blindZone(key) {
      const m = M[key], sgn = key === "L" ? -1 : 1, outer = rad(phi + HALF[key]);
      const yP = EYE[1] - 0.3;
      const inner = LANE - 0.9; // distance of the other car's inner edge from your car's centre line
      const yEnd = m[1] + (inner - Math.abs(m[0])) / Math.tan(outer);
      return { x1: sgn > 0 ? 1.75 : -1.75 - LANE, x2: sgn > 0 ? 1.75 + LANE : -1.75, y1: yP, y2: Math.max(yP, yEnd) };
    }
    function drawTop(r, vis) {
      let s = `<rect width="364" height="560" fill="#4a4f57"/><rect x="0" y="0" width="${X(-5.25 - LANE / 2) + 0}" height="560" fill="#bcd5a9"/>`;
      s += `<rect x="${X(-5.25)}" y="0" width="${10.5 * S}" height="560" fill="#4a4f57"/><rect x="0" y="0" width="${X(-5.25)}" height="560" fill="#bcd5a9"/><rect x="${X(5.25)}" y="0" width="${364 - X(5.25)}" height="560" fill="#bcd5a9"/>`;
      s += `<rect x="${X(-5.25) - 1}" y="0" width="3" height="560" fill="#fff"/><rect x="${X(5.25) - 2}" y="0" width="3" height="560" fill="#fff"/>`;
      for (const x of [-1.75, 1.75]) for (let y = -6; y < 24; y += 4.5) s += `<rect x="${X(x) - 1.5}" y="${Y(y)}" width="3" height="${2.5 * S}" fill="#fff" opacity=".85"/>`;
      s += `<defs><clipPath id="mir-clipI"><rect x="0" y="${Y(4.5)}" width="364" height="560"/></clipPath><pattern id="mir-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="8" fill="rgba(224,53,43,.55)"/></pattern></defs>`;
      // fields of view
      s += `<polygon points="${cone("L", phi - HALF.L, phi + HALF.L)}" fill="rgba(80,140,255,.26)" stroke="rgba(120,170,255,.95)" stroke-width="1.5"/>`;
      s += `<polygon points="${cone("R", phi - HALF.R, phi + HALF.R)}" fill="rgba(80,140,255,.26)" stroke="rgba(120,170,255,.95)" stroke-width="1.5"/>`;
      s += `<g clip-path="url(#mir-clipI)"><polygon points="${cone("I", -HALF.I, HALF.I)}" fill="rgba(62,224,122,.2)" stroke="rgba(62,224,122,.85)" stroke-width="1.5"/></g>`;
      // blind spots
      const lbl = (x, y, t, bg, fg = "#fff") => `<g><rect x="${x - t.length * 3.3 - 7}" y="${y - 10}" width="${t.length * 6.6 + 14}" height="20" rx="10" fill="${bg}"/><text x="${x}" y="${y + 0.5}" font-size="11" font-weight="700" fill="${fg}" text-anchor="middle" dominant-baseline="central">${t}</text></g>`;
      for (const k of ["L", "R"]) {
        const z = blindZone(k);
        if (z.y2 - z.y1 < 0.2) continue;
        s += `<rect x="${X(z.x1)}" y="${Y(z.y1)}" width="${(z.x2 - z.x1) * S}" height="${(z.y2 - z.y1) * S}" fill="url(#mir-hatch)" stroke="#e0352b" stroke-width="2"/>`;
        s += lbl(X((z.x1 + z.x2) / 2), Y(Math.min(z.y1 + 1.2, (z.y1 + z.y2) / 2)), "мъртва зона", "#e0352b");
      }
      s += topCar(0, 0, "#2b6fe0", true);
      s += topCar(r.cx, r.y1, vis.direct ? "#8b939c" : vis.any ? "#1aa64b" : "#e0352b", false);
      s += lbl(X(-3.5), Y(17.4), "ляво огледало", "rgba(40,90,200,.9)") + lbl(X(3.5), Y(17.4), "дясно огледало", "rgba(40,90,200,.9)") + lbl(X(0), Y(18.6), "вътрешно", "rgba(20,140,70,.9)");
      svgTop.innerHTML = s;
    }

    // ---- driver's view ----
    const G = () => window.BG3D;
    function world(cam, own) {
      let s = cam.poly([[-200, -400, 0], [200, -400, 0], [200, 400, 0], [-200, 400, 0]], `fill="#bcd5a9"`);
      s += cam.poly([[-5.25, -400, 0], [5.25, -400, 0], [5.25, 400, 0], [-5.25, 400, 0]], `fill="#4a4f57"`);
      for (const x of [-5.25, 5.25]) s += cam.poly([[x - 0.08, -400, 0.005], [x + 0.08, -400, 0.005], [x + 0.08, 400, 0.005], [x - 0.08, 400, 0.005]], `fill="#fff"`);
      for (const x of [-1.75, 1.75]) for (let y = -120; y < 120; y += 9) s += cam.poly([[x - 0.07, y, 0.01], [x + 0.07, y, 0.01], [x + 0.07, y + 3, 0.01], [x - 0.07, y + 3, 0.01]], `fill="#fff" opacity=".9"`);
      const items = [];
      const r = otherRect();
      items.push(G().car(cam, { x: r.cx, y: r.y1 + 2.25, yaw: -90, col: "#e8833a", scale: 4.5 / 40 }));
      // a car further back in your own lane – handy to see in the interior mirror
      items.push(G().car(cam, { x: 0, y: 17, yaw: -90, col: "#7d4fd6", scale: 4.5 / 40 }));
      if (own) items.push(G().box(cam, { x: 0, y: 2.6, z0: 0.3, l: 3.9, w: 1.8, h: 0.75, yaw: -90, col: "#2b6fe0" }));
      return s + G().paint(items);
    }
    function mirrorView(key, x, y, w, hgt, shape) {
      const m = M[key], sgn = key === "L" ? -1 : 1;
      const a = key === "I" ? 0 : phi;
      const dir = [sgn * Math.sin(rad(a)), Math.cos(rad(a)), key === "I" ? -0.05 : -0.035];
      const cam = G().camera({ eye: m, target: [m[0] + dir[0] * 10, m[1] + dir[1] * 10, m[2] + dir[2] * 10], f: w / 2 / Math.tan(rad(HALF[key])), cx: w / 2, cy: hgt * 0.42, near: 0.05, mirror: true });
      let inner = `<rect width="${w}" height="${hgt}" fill="#cfe3f5"/>` + world(cam, key !== "I");
      if (key === "I") inner += `<path d="M0 0 H${w} V${hgt} H0 Z M${w * 0.14} ${hgt * 0.16} H${w * 0.86} Q${w * 0.92} ${hgt * 0.16} ${w * 0.9} ${hgt * 0.3} L${w * 0.86} ${hgt * 0.84} H${w * 0.14} L${w * 0.1} ${hgt * 0.3} Q${w * 0.08} ${hgt * 0.16} ${w * 0.14} ${hgt * 0.16} Z" fill="#30353c" fill-rule="evenodd"/><rect x="${w * 0.2}" y="${hgt * 0.7}" width="${w * 0.18}" height="${hgt * 0.3}" rx="6" fill="#3d434b"/><rect x="${w * 0.62}" y="${hgt * 0.7}" width="${w * 0.18}" height="${hgt * 0.3}" rx="6" fill="#3d434b"/>`;
      const id = "mclip-" + key;
      return `<g transform="translate(${x} ${y})"><defs><clipPath id="${id}">${shape}</clipPath></defs><g clip-path="url(#${id})"><svg width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}" overflow="hidden">${inner}</svg></g><g fill="none" stroke="#16181b" stroke-width="6">${shape.replace(/<(\w+)/, '<$1 fill="none"')}</g></g>`;
    }
    function drawCab(r, vis) {
      const cam = G().camera({ eye: EYE, target: [EYE[0], -40, 0.75], f: 250, cx: 260, cy: 128, near: 0.05 });
      let s = `<rect width="520" height="330" fill="#cfe3f5"/>` + world(cam, false);
      // cabin: roof, pillars, dashboard, wheel
      s += `<path d="M0 0 H520 V26 Q260 10 0 26 Z" fill="#2b2f36"/>`;
      s += `<path d="M0 0 H70 L18 236 H0 Z" fill="#23272d"/><path d="M520 0 H470 L512 236 H520 Z" fill="#23272d"/>`;
      s += `<path d="M0 214 Q260 176 520 214 V330 H0 Z" fill="#2b2f36"/><path d="M0 214 Q260 176 520 214" fill="none" stroke="#3a3f46" stroke-width="4"/>`;
      s += `<g transform="translate(260 318)"><ellipse rx="96" ry="70" fill="none" stroke="#16181b" stroke-width="15"/><rect x="-26" y="-22" width="52" height="34" rx="12" fill="#16181b"/></g>`;
      s += `<rect x="352" y="0" width="8" height="30" fill="#16181b"/>`;
      // mirrors (left mirror is closer to the eye, so it looks bigger)
      s += mirrorView("L", 4, 186, 124, 78, `<rect x="0" y="0" width="124" height="78" rx="18"/>`);
      s += mirrorView("R", 418, 196, 98, 64, `<rect x="0" y="0" width="98" height="64" rx="16"/>`);
      s += mirrorView("I", 286, 24, 148, 48, `<rect x="0" y="0" width="148" height="48" rx="22"/>`);
      const tag = (x, y, t) => `<g><rect x="${x - t.length * 3 - 7}" y="${y - 9}" width="${t.length * 6 + 14}" height="18" rx="9" fill="rgba(0,0,0,.6)"/><text x="${x}" y="${y + 0.5}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${t}</text></g>`;
      s += tag(66, 276, "ляво") + tag(467, 272, "дясно") + tag(360, 84, "вътрешно");
      if (vis.direct) s += `<g><rect x="${side === "L" ? 8 : 352}" y="120" width="160" height="34" rx="10" fill="rgba(31,41,51,.85)"/><text x="${side === "L" ? 88 : 432}" y="137.5" font-size="11.5" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${side === "L" ? "◀ " : ""}до теб – погледни${side === "R" ? " ▶" : ""}</text></g>`;
      else if (!vis.any) s += `<g><rect x="${side === "L" ? 8 : 352}" y="120" width="160" height="34" rx="10" fill="rgba(224,53,43,.92)"/><text x="${side === "L" ? 88 : 432}" y="137.5" font-size="11.5" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${side === "L" ? "◀ " : ""}В мъртвата зона!${side === "R" ? " ▶" : ""}</text></g>`;
      svgCab.innerHTML = s;
    }

    function draw() {
      const r = otherRect();
      const sideKey = side;
      const vis = { side: seenIn(sideKey, r), inner: seenIn("I", r), direct: directly(r) };
      vis.any = vis.side || vis.inner;
      box.querySelector(".mir-top").hidden = view === "cab";
      box.querySelector(".mir-cab").hidden = view === "top";
      box.querySelector(".mir-stages").classList.toggle("one", view !== "both");
      if (view !== "cab") drawTop(r, vis);
      if (view !== "top") drawCab(r, vis);
      oAngle.textContent = `${phi.toFixed(1)}°`;
      rAngle.value = phi;
      oCar.textContent = other <= 0 ? "до теб / отпред" : `${other.toFixed(1)} м зад теб`;
      rCar.value = other;
      const share = ownShare();
      let quality;
      if (share > 0.4) quality = ["stop", "Твърде навътре", "Виждаш предимно собствената си кола. Съседната лента почти не е покрита."];
      else if (share >= 0.1) quality = ["go", "Класическа настройка", `Около ${Math.round(share * 100)}% от страничното огледало е твоята кола – добър ориентир. Мъртвата зона е по-голяма – без поглед през рамо не можеш да се убедиш, че е свободно.`];
      else if (phi <= 17) quality = ["info", "Разширена настройка", "Колата почти не се вижда, а огледалото поема там, където свършва вътрешното. Мъртвата зона е по-малка, но не изчезва."];
      else quality = ["wait", "Твърде навън", "Губиш връзка със собствената кола и се отваря празнина зад теб, която не покрива нито едно огледало."];
      const mirName = side === "L" ? "лявото" : "дясното";
      const where = vis.direct ? "Виждаш я директно, с периферното зрение – тя е до теб или отпред."
        : vis.side && vis.inner ? `Вижда се в ${mirName} и във вътрешното огледало.`
        : vis.side ? `Вижда се в ${mirName} огледало.`
        : vis.inner ? "Вижда се само във вътрешното огледало."
        : "<b>Не се вижда в нито едно огледало – тя е в мъртвата зона.</b> Само поглед през рамо ще я покаже.";
      readout.innerHTML = `<span class="pill ${quality[0]}">${quality[1]}</span><p>${quality[2]}</p><p><b>Колата ${side === "L" ? "отляво" : "отдясно"}:</b> ${where}</p><p class="mir-legend"><i style="background:rgba(80,140,255,.6)"></i>странични огледала <i style="background:rgba(62,224,122,.6)"></i>вътрешно <i style="background:#e0352b"></i>мъртва зона</p><span class="lawref">Поглед през рамо: добра практика; ЗДвП чл. 25, ал. 1 – „да се убеди“</span>`;
    }
    rAngle.addEventListener("input", () => { phi = parseFloat(rAngle.value); draw(); });
    rCar.addEventListener("input", () => { other = parseFloat(rCar.value); draw(); });
    draw();
    root.appendChild(box);
  }

  // ================= Everyday situations =================
  // one situation card (also used by other chapters through window.BGSitCard)
  function sitCard(x, cats = window.BGScenarioCats || {}) {
    let pic = "";
    try { pic = x.svg(); } catch (e) { pic = ""; }
    const stepper = x.marks ? `<div class="sit-stepbar"><button type="button" class="btn small sit-prev" aria-label="Предишна стъпка">◀</button><span class="sit-stepno">Стъпка по стъпка</span><button type="button" class="btn small sit-next" aria-label="Следваща стъпка">▶</button></div>` : "";
    const card = h(`<article class="rule has-il sit-card" id="sit-${x.id}"><figure class="rule-il"${x.marks ? " data-own-steps" : ""}>${pic}</figure><div class="rule-text"><span class="eyebrow">${cats[x.cat] || ""}</span><h4>${x.title}</h4><p class="sit-q">${x.q}</p><ol class="sit-steps${x.marks ? " stepable" : ""}">${x.steps.map((t, i) => `<li data-n="${i}">${t}</li>`).join("")}</ol>${stepper}<span class="lawref">${x.ref}</span></div></article>`);
    if (x.marks) stepThrough(card, x.marks);
    return card;
  }
  window.BGSitCard = sitCard;

  function situationsWidget(root) {
    const list = window.BGScenarios || [];
    const cats = window.BGScenarioCats || {};
    if (!list.length) return;
    let cat = "all";
    const used = Object.keys(cats).filter((k) => list.some((x) => x.cat === k));
    const box = h(`<div class="sit"><div class="sit-filter"></div><div class="sit-grid"></div></div>`);
    const grid = box.querySelector(".sit-grid");
    box.querySelector(".sit-filter").appendChild(segmented([["all", "Всички"], ...used.map((k) => [k, cats[k]])], cat, (v) => { cat = v; draw(); }, "Вид ситуация"));
    function draw() {
      grid.innerHTML = "";
      list.filter((x) => cat === "all" || x.cat === cat).forEach((x) => grid.appendChild(sitCard(x, cats)));
    }
    draw();
    root.appendChild(box);
  }
  // play one step of a situation: jump to where the step starts, play to where the next one starts, pause
  function stepThrough(card, marks) {
    const fig = card.querySelector("figure"), svg = fig.querySelector("svg");
    const lis = [...card.querySelectorAll(".sit-steps li")], no = card.querySelector(".sit-stepno");
    let cur = -1, timer = 0;
    const mark = (n) => lis.forEach((li, i) => li.classList.toggle("on", i === n));
    function show(n) {
      if (!svg || !svg.setCurrentTime) return;
      cur = Math.max(0, Math.min(lis.length - 1, n));
      clearTimeout(timer);
      mark(cur);
      no.textContent = `Стъпка ${cur + 1} от ${lis.length}`;
      card.querySelector(".sit-prev").disabled = cur === 0;
      card.querySelector(".sit-next").disabled = cur === lis.length - 1;
      const a = marks[cur], b = marks[cur + 1];
      svg.setCurrentTime(a);
      if (reduceMotion()) { svg.setCurrentTime(Math.max(a, b - 0.05)); svg.pauseAnimations(); }
      else {
        svg.unpauseAnimations();
        timer = setTimeout(() => { svg.pauseAnimations(); svg.setCurrentTime(Math.max(a, b - 0.05)); if (window.BGPlay) window.BGPlay.sync(svg); }, (b - a) * 1000);
      }
      if (window.BGPlay) window.BGPlay.sync(svg);
    }
    card.querySelector(".sit-prev").addEventListener("click", () => show(cur < 0 ? 0 : cur - 1));
    card.querySelector(".sit-next").addEventListener("click", () => show(cur + 1));
    lis.forEach((li, i) => li.addEventListener("click", () => show(i)));
    // the normal ▶ button plays the whole loop again
    fig.addEventListener("click", (e) => { if (e.target.closest(".play-btn")) { clearTimeout(timer); mark(-1); cur = -1; no.textContent = "Стъпка по стъпка"; } }, true);
  }

  // ================= Dashboard =================
  function dashboardWidget(root) {
    let filter = "all";
    let selected = "oil";
    const COLS = [["all", "Всички", ""], ["red", "Червени", "спри безопасно"], ["amber", "Жълти", "провери скоро"], ["green", "Зелени и сини", "само включено"]];
    const box = h(`<div class="widget dash-w">
      <div class="dash-top">
        <h3>Контролни лампи</h3>
        <p>Цветовете са като на светофара: <b class="c-red">червено</b> – спри веднага, <b class="c-amber">жълто</b> – внимание, <b class="c-green">зелено</b> – просто е включено. <b class="c-blue">Синьо</b> е само за дългите светлини.</p>
        <div class="dash-filter" role="group" aria-label="Цвят">${COLS.map(([k, t, sub]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${k === "all" ? "" : `<i class="dot ${k}"></i>`}<span>${t}</span>${sub ? `<small>${sub}</small>` : ""}</button>`).join("")}</div>
      </div>
      <div class="dash-body">
        <div class="dash-panel"><div class="dash-grid" role="listbox" aria-label="Символи"></div></div>
        <div class="dash-detail" aria-live="polite"></div>
      </div>
    </div>`);
    const grid = box.querySelector(".dash-grid");
    const detail = box.querySelector(".dash-detail");
    const word = { red: "Червен – спри безопасно", amber: "Жълт – провери скоро", green: "Зелен – включено", blue: "Син – дълги светлини" };
    box.querySelectorAll(".dash-filter button").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.f;
      box.querySelectorAll(".dash-filter button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    }));
    function showDetail() {
      const d = DASH.find((x) => x.id === selected);
      detail.innerHTML = `<div class="dd-head"><div class="lamp ${d.color}">${ICONS[d.id]}</div><div><span class="pill ${d.color === "red" ? "stop" : d.color === "amber" ? "wait" : d.color === "blue" ? "info" : "go"}">${word[d.color]}</span><h4>${d.name}</h4></div></div>
        <dl><dt>Какво значи</dt><dd>${d.what}</dd><dt>Какво правиш</dt><dd>${d.act}</dd></dl>
        ${d.tip ? `<div class="sx-mnem"><span>Как да запомниш</span><p>${d.tip}</p></div>` : ""}`;
    }
    function draw() {
      grid.innerHTML = "";
      const list = DASH.filter((d) => filter === "all" || d.color === filter || (filter === "green" && d.color === "blue"));
      if (!list.some((d) => d.id === selected)) selected = list[0].id;
      list.forEach((d) => {
        const b = h(`<button type="button" class="dash-btn ${d.color}" role="option" aria-selected="${d.id === selected}" aria-pressed="${d.id === selected}">${ICONS[d.id]}<span>${d.name}</span></button>`);
        b.addEventListener("click", () => {
          selected = d.id;
          grid.querySelectorAll(".dash-btn").forEach((x) => { x.setAttribute("aria-pressed", "false"); x.setAttribute("aria-selected", "false"); });
          b.setAttribute("aria-pressed", "true");
          b.setAttribute("aria-selected", "true");
          showDetail();
          if (window.matchMedia("(max-width: 899px)").matches) detail.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
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

  window.BGWidgets = Object.assign(window.BGWidgets || {}, {
    situacii: situationsWidget,
    znaci: signsWidget,
    markirovka: markingsWidget,
    svetofar: trafficLightWidget,
    regulirovchik: regulatorWidget,
    predimstvo: priorityWidget,
    krugovo: roundaboutWidget,
    parkirane: (root) => { parkingWidget(root); if (window.BGParking) window.BGParking(root); },
    ogledala: mirrorWidget,
    tablo: dashboardWidget,
    vreme: stoppingWidget,
  });
})();
