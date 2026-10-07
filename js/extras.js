/* Visuals for the chapters in js/more/*.js: the automatic gearbox simulator and its illustrations,
   „Какво ново“ cards, fines with a points meter, quick facts with related situations, first aid steps
   with a CPR rhythm trainer, and the country comparison for driving abroad. */
(function () {
  const D = window.BGDraw;
  const { C, W, H } = D;
  const MORE = (window.BGData && window.BGData.MORE) || {};
  const h = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  // a group that moves along translate values at keyTimes (nested so it never fights a transform attribute)
  const mv = (values, kt, dur, inner, extra = "") => `<g><animateTransform attributeName="transform" type="translate" values="${values}" keyTimes="${kt}" dur="${dur}s" repeatCount="indefinite" ${extra}/>${inner}</g>`;
  const show = (values, kt, dur, inner) => `<g opacity="${values.split(";")[0]}"><animate attributeName="opacity" values="${values}" keyTimes="${kt}" dur="${dur}s" repeatCount="indefinite"/>${inner}</g>`;

  // ================= illustrations for „Автоматична кутия и асистенти“ =================
  const IL = window.BGIllustrations || (window.BGIllustrations = {});
  const pedal = (x, y, w, hh, col, txt) => `<g><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6" fill="${col}"/><rect x="${x + 4}" y="${y + 6}" width="${w - 8}" height="3" rx="1.5" fill="rgba(255,255,255,.35)"/><rect x="${x + 4}" y="${y + 13}" width="${w - 8}" height="3" rx="1.5" fill="rgba(255,255,255,.35)"/><text x="${x + w / 2}" y="${y + hh + 14}" font-size="11" font-weight="700" fill="${C.ink}" text-anchor="middle">${txt}</text></g>`;
  const shoe = (fill) => `<path d="M-13 -30 Q-15 -6 -9 4 Q0 12 9 4 Q15 -6 13 -30 Z" fill="${fill}" stroke="rgba(0,0,0,.25)"/>`;
  IL.atFeet = () => {
    let b = `<rect width="${W}" height="${H}" fill="#2b2f36"/><rect x="0" y="150" width="${W}" height="50" fill="#22252a"/>`;
    b += `<rect x="40" y="112" width="44" height="58" rx="8" fill="#3d434b"/><text x="62" y="186" font-size="10.5" font-weight="700" fill="#cfd5dc" text-anchor="middle">опора</text>`;
    b += pedal(150, 92, 64, 62, "#5d646d", "спирачка") + pedal(256, 84, 32, 72, "#5d646d", "газ");
    b += `<g transform="translate(62 120)">${shoe("#7b8794")}</g>`;
    // the right foot moves brake → gas → brake
    b += `<g transform="translate(0 0)">${mv("182 118;182 118;272 112;272 112;182 118", "0;.3;.45;.75;1", 6, shoe("#2f6fdc"))}</g>`;
    b += `<text x="62" y="30" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">ляв крак – почива</text><text x="230" y="30" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">десен крак – газ и спирачка</text>`;
    return D.svg(b, "Само десният крак натиска газта и спирачката, левият почива на опората");
  };
  // side scene on a slope: rotate the road and the car together
  const slopeScene = (deg, inner) => `<rect width="${W}" height="${H}" fill="${C.sky}"/><g transform="rotate(${deg} 180 150)"><rect x="-80" y="150" width="520" height="160" fill="${C.grass}"/><rect x="-80" y="146" width="520" height="12" fill="${C.road}"/>${inner}</g>`;
  IL.atCreep = () => {
    let b = slopeScene(0, mv("0 0;0 0;150 0;150 0", "0;.2;.8;1", 8, D.sideCar(70, 146, 0.8, C.blue)));
    b += show("1;1;0;0;1", "0;.2;.21;.99;1", 8, D.label(180, 40, "D + крак на спирачката – стои"));
    b += show("0;0;1;1;0", "0;.2;.21;.8;.81", 8, D.label(180, 40, "Пуснеш спирачката – пълзи сам, без газ"));
    b += show("0;0;1;1", "0;.8;.81;1", 8, D.label(180, 40, "Спирачка – и спира"));
    b += D.label(300, 186, "≈ 5–8 km/h", { size: 10.5, bg: "#fff" });
    return D.svg(b, "Пълзене: в D колата тръгва бавно без газ");
  };
  IL.atHill = () => {
    const pie = `<g transform="translate(64 50)"><circle r="16" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/><circle r="10" fill="none" stroke="${C.amber}" stroke-width="20" stroke-dasharray="0 63"><animate attributeName="stroke-dasharray" values="0 63;0 63;63 63;63 63" keyTimes="0;.25;.55;1" dur="8s" repeatCount="indefinite"/></circle><text y="1" font-size="10" font-weight="800" fill="${C.ink}" text-anchor="middle" dominant-baseline="central">2 с</text></g>`;
    let b = slopeScene(-9, mv("0 0;0 0;0 0;130 0;130 0", "0;.25;.55;.9;1", 8, D.sideCar(110, 146, 0.8, C.blue)));
    b += show("0;0;1;1;0", "0;.25;.26;.55;.56", 8, pie + D.label(200, 50, "Пусна спирачката – колата се държи"));
    b += show("1;1;0;0;1", "0;.25;.26;.99;1", 8, D.label(200, 50, "Спрял нагоре, кракът на спирачката"));
    b += show("0;0;1;1", "0;.55;.56;1", 8, D.label(200, 50, "Газ – тръгваш, без да се върнеш"));
    return D.svg(b, "Асистент за тръгване по наклон: държи колата около 2 секунди");
  };
  IL.atAbs = () => {
    let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/>` + D.roadH(24, 152, { center: false, edges: true }) + D.dashes(100, 0, W);
    // obstacle in both lanes
    b += `<g transform="translate(262 62)"><rect x="-12" y="-14" width="24" height="28" rx="4" fill="${C.orange}"/><path d="M-12 -6 h24 M-12 6 h24" stroke="#fff" stroke-width="3"/></g>`;
    b += `<g transform="translate(262 138)"><rect x="-12" y="-14" width="24" height="28" rx="4" fill="${C.orange}"/><path d="M-12 -6 h24 M-12 6 h24" stroke="#fff" stroke-width="3"/></g>`;
    // without ABS: wheels lock, the car slides straight on
    b += `<path d="M120 55 H226 M120 69 H226" stroke="#1f2329" stroke-width="3" opacity="0"><animate attributeName="opacity" values="0;0;.7;.7;0" keyTimes="0;.3;.45;.95;1" dur="7s" repeatCount="indefinite"/></path>`;
    b += mv("0 0;80 0;160 0;180 0;180 0", "0;.3;.55;.62;1", 7, D.car(40, 62, 0, C.grey, 46, 22));
    b += show("0;0;1;1;0", "0;.6;.62;.98;1", 7, `<g transform="translate(240 40)"><circle r="10" fill="${C.red}"/><path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>`);
    // with ABS: keeps steering and goes round
    b += `<g>${`<animateMotion dur="7s" repeatCount="indefinite" rotate="auto" keyPoints="0;0.42;1;1" keyTimes="0;.3;.8;1" calcMode="linear" path="M40 138 L160 138 C210 138 220 112 262 112 C300 112 310 138 340 138"/>`}${D.car(0, 0, 0, C.blue, 46, 22)}</g>`;
    b += D.label(70, 14, "без ABS – блокира, не завива", { size: 10.5 }) + D.label(80, 188, "с ABS – спираш и завиваш", { size: 10.5, bg: "#e6f4ea" });
    return D.svg(b, "Аварийно спиране: без ABS колата се плъзга право, с ABS можеш да завиеш");
  };
  IL.atAcc = () => {
    let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/>` + D.roadH(70, 64, { center: false, edges: true });
    // the car in front slows down and speeds up; yours keeps the gap
    const lead = mv("0 0;0 0;-60 0;-60 0;0 0", "0;.25;.5;.75;1", 8, D.car(250, 102, 0, C.orange, 46, 22));
    const own = mv("0 0;0 0;-60 0;-60 0;0 0", "0;.3;.55;.8;1", 8, D.car(120, 102, 0, C.blue, 46, 22) + `<path d="M146 102 H224" stroke="${C.green}" stroke-width="2.4" stroke-dasharray="5 4"/><circle cx="185" cy="88" r="11" fill="#fff" stroke="${C.green}" stroke-width="2"/><path d="M179 88 h12 M181 84 h8" stroke="${C.green}" stroke-width="2"/>`);
    b += lead + own;
    b += D.label(180, 30, "Отпред намалява – темпоматът намалява и пази дистанцията");
    b += D.label(180, 170, "Ти отговаряш: в дъжд и в града по-добре изключи", { size: 10.5 });
    return D.svg(b, "Адаптивен темпомат пази разстоянието до колата отпред");
  };
  IL.atAeb = () => {
    let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect x="0" y="40" width="${W}" height="18" fill="${C.walk}"/>` + D.roadH(58, 96, { center: true });
    b += `<g>${mv("0 0;0 0;0 52;0 52", "0;.25;.5;1", 7, D.walker(250, 58, 0.62, C.orange))}</g>`;
    b += mv("0 0;130 0;150 0;150 0", "0;.4;.55;1", 7, D.car(60, 132, 0, C.blue, 46, 22));
    b += show("0;0;1;1;0", "0;.38;.4;.95;1", 7, `<g transform="translate(205 98)"><path d="M0 -14 L13 9 H-13 Z" fill="${C.red}"/><text y="3" font-size="13" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">!</text></g>` + D.label(205, 180, "Колата спира сама", { bg: "#ffe1de" }));
    return D.svg(b, "Автоматично аварийно спиране пред пешеходец");
  };
  IL.atBlind = () => {
    let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/>` + D.roadH(40, 120, { center: false, edges: true }) + D.dashes(100, 0, W);
    b += D.car(200, 130, 0, C.blue, 46, 22);
    // a car passes on the left: lit in the blind spot
    b += `<g>${`<animateTransform attributeName="transform" type="translate" values="-120 0;0 0;40 0;160 0" keyTimes="0;.35;.65;1" dur="7s" repeatCount="indefinite"/>`}${D.car(150, 70, 0, C.purple, 46, 22)}</g>`;
    b += `<path d="M200 118 L120 86 L200 86 Z" fill="${C.red}" opacity="0"><animate attributeName="opacity" values="0;0;.28;.28;0;0" keyTimes="0;.3;.35;.65;.7;1" dur="7s" repeatCount="indefinite"/></path>`;
    b += `<g transform="translate(212 116)"><rect x="-6" y="-5" width="12" height="9" rx="3" fill="#16181b"/><path d="M-2 -1 L2 -1 L0 -4 Z" fill="${C.amber}" opacity=".25"><animate attributeName="opacity" values=".25;.25;1;1;.25;.25" keyTimes="0;.3;.35;.65;.7;1" dur="7s" repeatCount="indefinite"/></path></g>`;
    b += D.label(180, 20, "Лампичката в огледалото светва, когато някой е в мъртвата зона", { size: 10.5 });
    b += D.label(180, 182, "Пак погледни през рамо, преди да смениш лентата", { size: 10.5 });
    return D.svg(b, "Предупреждение за мъртва зона");
  };

  // ================= gearbox simulator =================
  function avtomatWidget(root) {
    const SLOPES = { flat: 0, up: 7, down: -7 };
    const st = { gear: "P", slope: "flat", brake: true, gas: false, v: 0, x: 0, hold: 0, msg: "" };
    const box = h(`<div class="widget at-w">
      <div class="widget-head"><h3>Селекторът на автоматика</h3><p>Смени позицията, пусни спирачката или дай газ. Опитай и нагоре, и надолу.</p></div>
      <div class="at-grid">
        <figure class="at-stage" data-no-play><svg viewBox="0 0 360 200" role="img" aria-label="Колата отстрани на пътя"></svg><div class="at-speed"><b>0</b><span>km/h</span></div></figure>
        <div class="at-ctl">
          <div class="at-sel" role="group" aria-label="Селектор">${["P", "R", "N", "D", "L"].map((g) => `<button type="button" data-g="${g}">${g}</button>`).join("")}</div>
          <div class="at-ped"><button type="button" class="at-brake" aria-pressed="true">Спирачка</button><button type="button" class="at-gas" aria-pressed="false">Газ<small>задръж</small></button></div>
        </div>
      </div>
      <div class="controls at-slope"></div>
      <div class="readout at-msg" aria-live="polite"></div>
    </div>`);
    const svg = box.querySelector("svg"), msgEl = box.querySelector(".at-msg"), spEl = box.querySelector(".at-speed b");
    const slopeSeg = h(`<div class="seg" role="group" aria-label="Наклон">${[["flat", "Равно"], ["up", "Нагоре"], ["down", "Надолу"]].map(([k, t]) => `<button type="button" data-s="${k}" aria-pressed="${k === st.slope}">${t}</button>`).join("")}</div>`);
    box.querySelector(".at-slope").appendChild(slopeSeg);
    slopeSeg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      st.slope = b.dataset.s; slopeSeg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); kick();
    }));
    const selBtns = [...box.querySelectorAll(".at-sel button")];
    const brakeBtn = box.querySelector(".at-brake"), gasBtn = box.querySelector(".at-gas");
    let warn = "";
    selBtns.forEach((b) => b.addEventListener("click", () => {
      const g = b.dataset.g, moving = Math.abs(st.v) > 0.3;
      warn = "";
      if (st.gear === "P" && g !== "P" && !st.brake) warn = "За да излезеш от P, натисни спирачката – колата не позволява иначе.";
      else if ((g === "P" || g === "R") && moving) warn = `Не! ${g} се слага само при спряла кола – иначе кутията може да се повреди.`;
      else if (g === "D" && st.v < -0.3) warn = "Първо спри напълно – после D.";
      if (!warn) st.gear = g;
      kick();
    }));
    brakeBtn.addEventListener("click", () => { st.brake = !st.brake; if (st.brake) st.hold = 0; else if (st.gear !== "N" && st.gear !== "P" && st.slope !== "flat" && Math.abs(st.v) < 0.2) st.hold = 2; kick(); });
    const gasOn = (on) => (e) => { e.preventDefault(); st.gas = on; if (on) { st.brake = false; st.hold = 0; } kick(); };
    gasBtn.addEventListener("pointerdown", gasOn(true));
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => gasBtn.addEventListener(ev, gasOn(false)));
    gasBtn.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") gasOn(true)(e); });
    gasBtn.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") gasOn(false)(e); });

    function step(dt) {
      const ang = (SLOPES[st.slope] * Math.PI) / 180;
      let a = -9.81 * Math.sin(ang) - 0.04 * st.v;
      const g = st.gear;
      if (g === "D" || g === "L") {
        const target = st.gas ? (g === "L" ? 8 : 16) : 2;
        if (st.v < target) a += st.gas ? 2.6 : 1.8;
        else if (g === "L") a -= 2.4; // engine braking in a low gear
      } else if (g === "R") {
        const target = st.gas ? -4 : -1.6;
        if (st.v > target) a -= st.gas ? 1.8 : 1.6;
      }
      if (st.hold > 0) { st.hold -= dt; st.v = 0; return; }
      if (g === "P") { st.v = 0; return; }
      if (st.brake) {
        const dv = 7 * dt;
        st.v = Math.abs(st.v) <= dv ? 0 : st.v - Math.sign(st.v) * dv;
        return;
      }
      st.v += a * dt;
      if (g === "D" && st.slope === "up" && !st.gas && st.v < 0) st.v = Math.max(st.v, -0.3);
    }
    function message() {
      if (warn) return `<span class="pill stop">Грешка</span><p>${warn}</p>`;
      const kmh = Math.round(Math.abs(st.v) * 3.6);
      const g = st.gear, s = st.slope;
      if (g === "P") return `<span class="pill go">P – паркирана</span><p>Кутията е заключена и колата не мърда. Така се оставя колата – заедно с ръчната спирачка и изключен двигател.</p><span class="lawref">ЗДвП чл. 96</span>`;
      if (st.hold > 0) return `<span class="pill wait">Асистент за наклон</span><p>Пусна спирачката – колата се държи още ${st.hold.toFixed(1)} с. Дай газ, преди да тръгне.</p>`;
      if (g === "N") return s === "flat" || st.brake
        ? `<span class="pill wait">N – неутрална</span><p>Колата не е свързана с двигателя. На равно стои, но на наклон ще тръгне сама. N е за автомивка и теглене – не за каране.</p>`
        : `<span class="pill stop">N – търкаля се сама</span><p>${kmh} km/h и расте – двигателят не помага да спреш. Сложи D или L и спирай.</p>`;
      if (st.brake) return st.v === 0 ? `<span class="pill go">${g} + спирачка</span><p>Колата стои, готова за тръгване. Пуснеш ли спирачката, ще ${g === "R" ? "запълзи назад" : "запълзи напред"}.</p>` : `<span class="pill wait">Спираш</span><p>${kmh} km/h.</p>`;
      if (st.gas) return `<span class="pill go">Газ</span><p>Ускоряваш – ${kmh} km/h.${g === "L" ? " В L кутията не вдига високи предавки." : ""}</p>`;
      if (g === "R") return `<span class="pill wait">R – пълзи назад</span><p>${kmh} km/h без газ. Гледай назад през цялото време.</p><span class="lawref">ЗДвП чл. 40</span>`;
      if (s === "down" && g === "D" && st.v > 2.2) return `<span class="pill stop">Надолу в D</span><p>${kmh} km/h – колата ускорява сама. Спирай или сложи L: двигателят ще задържа.</p>`;
      if (s === "down" && g === "L") return `<span class="pill go">L надолу</span><p>${kmh} km/h – ниската предавка задържа колата и пази спирачките.</p>`;
      if (s === "up" && Math.abs(st.v) < 0.5) return `<span class="pill wait">Нагоре без газ</span><p>Пълзенето почти не стига – дай газ.</p>`;
      return `<span class="pill go">${g} – пълзи</span><p>${kmh} km/h без газ. Удобно за паркиране и задръстване.</p>`;
    }
    function draw() {
      const ang = -SLOPES[st.slope];
      const off = ((st.x * 22) % 60 + 60) % 60;
      let road = "";
      for (let x = -120 - off; x < 480; x += 60) road += `<rect x="${x.toFixed(1)}" y="150.5" width="30" height="3" fill="#fff" opacity=".8"/>`;
      let trees = "";
      for (let x = -120 - ((st.x * 22 * 0.5) % 140 + 140) % 140; x < 480; x += 140) trees += `<g transform="translate(${x.toFixed(1)} 146)"><rect x="-3" y="-34" width="6" height="34" fill="#6b4a33"/><circle cy="-42" r="16" fill="#5a9a52"/></g>`;
      svg.innerHTML = `<rect width="360" height="200" fill="${C.sky}"/><g transform="rotate(${ang} 180 150)"><rect x="-120" y="150" width="600" height="160" fill="${C.grass}"/>${trees}<rect x="-120" y="144" width="600" height="14" fill="${C.road}"/>${road}${D.sideCar(180, 146, 0.95, C.blue)}</g>`
        + `<g transform="translate(12 12)"><rect width="56" height="20" rx="10" fill="rgba(0,0,0,.6)"/><text x="28" y="10.5" font-size="9.5" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${st.slope === "up" ? "↗ нагоре" : st.slope === "down" ? "↘ надолу" : "равно"}</text></g>`;
      spEl.textContent = Math.round(Math.abs(st.v) * 3.6);
      selBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.g === st.gear)));
      brakeBtn.setAttribute("aria-pressed", String(st.brake));
      gasBtn.setAttribute("aria-pressed", String(st.gas));
      msgEl.innerHTML = message();
    }
    let raf = 0, last = 0;
    function loop(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      step(dt);
      st.x += st.v * dt;
      if (Math.abs(st.v) > 22) st.v = Math.sign(st.v) * 22;
      draw();
      // keep running while something moves or the hill hold counts down
      if (Math.abs(st.v) > 0.01 || st.hold > 0 || st.gas || (!st.brake && st.gear !== "P" && (st.gear !== "N" || st.slope !== "flat"))) raf = requestAnimationFrame(loop);
      else raf = 0;
    }
    function kick() {
      if (reduceMotion()) { for (let i = 0; i < 90; i++) step(1 / 30); draw(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      draw();
    }
    draw();
    root.appendChild(box);
  }

  // ================= small shared pieces =================
  const facts = (list) => `<div class="mx-facts">${list.map((f) => `<div class="mx-fact"><b>${f.n}</b><span>${f.t}</span>${f.ref ? `<span class="lawref">${f.ref}</span>` : ""}</div>`).join("")}</div>`;
  function related(root, ids, title = "Свързани ситуации") {
    const all = window.BGScenarios || [];
    const list = ids.map((id) => all.find((x) => x.id === id)).filter(Boolean);
    if (!list.length || !window.BGSitCard) return;
    root.appendChild(h(`<h2 class="section-title">${title}</h2>`));
    const grid = h(`<div class="sit-grid"></div>`);
    list.forEach((x) => grid.appendChild(window.BGSitCard(x)));
    root.appendChild(grid);
  }
  function chips(items, cur, onPick, label) {
    const el = h(`<div class="mx-chips" role="group" aria-label="${label}">${items.map(([k, t]) => `<button type="button" data-k="${esc(k)}" aria-pressed="${k === cur}">${t}</button>`).join("")}</div>`);
    el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); onPick(b.dataset.k); }));
    return el;
  }

  // ================= Какво ново =================
  function novoWidget(root) {
    const list = (MORE.novo && MORE.novo.changes) || [];
    if (!list.length) return;
    const areas = [...new Set(list.map((x) => x.area))];
    let area = "all";
    const box = h(`<div class="widget mx-novo"><div class="widget-head"><h3>Преди → сега</h3><p>${list.length} промени, които засягат шофьора. Избери тема.</p></div><div class="mx-list"></div></div>`);
    const out = box.querySelector(".mx-list");
    box.insertBefore(chips([["all", "Всички"], ...areas.map((a) => [a, a])], area, (k) => { area = k; draw(); }, "Тема"), out);
    function draw() {
      out.innerHTML = list.filter((x) => area === "all" || x.area === area).map((x) => `<article class="nv-card"><div class="nv-top"><span class="nv-area">${x.area}</span>${x.since ? `<span class="nv-since">от ${x.since}</span>` : ""}</div><h4>${x.t}</h4><div class="nv-cmp"><div class="nv-before"><span>Преди</span><p>${x.before}</p></div><div class="nv-arrow" aria-hidden="true">→</div><div class="nv-now"><span>Сега</span><p>${x.now}</p></div></div><span class="lawref">${x.ref}</span></article>`).join("");
    }
    draw();
    root.appendChild(box);
  }

  // ================= Глоби и точки =================
  function globiWidget(root) {
    const data = MORE.globi || {};
    const fines = data.fines || [];
    if (!fines.length) return;
    const start = (data.points && data.points.start) || 39;
    let cat = "all", q = "", lost = 0, picked = [];
    const cats = [...new Set(fines.map((x) => x.cat))];
    const box = h(`<div class="widget mx-fines">
      <div class="widget-head"><h3>Колко струва?</h3><p>Намери нарушението. Натисни „− точки“, за да видиш колко ти остават.</p></div>
      <div class="pt-meter" aria-live="polite"></div>
      <label class="mx-search"><span class="visually-hidden">Търси нарушение</span><input type="search" placeholder="Търси: телефон, колан, червено…"></label>
      <div class="mx-table" role="list"></div>
    </div>`);
    const meter = box.querySelector(".pt-meter"), table = box.querySelector(".mx-table");
    box.insertBefore(chips([["all", "Всички"], ...cats.map((c) => [c, c])], cat, (k) => { cat = k; draw(); }, "Вид"), box.querySelector(".mx-search"));
    box.querySelector("input").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
    function drawMeter() {
      const left = Math.max(0, start - lost);
      meter.innerHTML = `<div class="pt-dots">${Array.from({ length: start }, (_, i) => `<i class="${i < left ? "on" : ""}"></i>`).join("")}</div><div class="pt-txt"><b>${left}</b> от ${start} точки${lost ? ` · отнети: ${picked.map((p) => p).join(" + ")}` : ""}${left === 0 ? ` – <span class="c-red">книжката се отнема</span>` : ""}</div>${lost ? `<button type="button" class="btn small pt-reset">Върни точките</button>` : ""}`;
      const r = meter.querySelector(".pt-reset");
      if (r) r.addEventListener("click", () => { lost = 0; picked = []; drawMeter(); });
    }
    function draw() {
      const list = fines.filter((x) => (cat === "all" || x.cat === cat) && (!q || (x.t + " " + x.cat).toLowerCase().includes(q)));
      table.innerHTML = list.length ? list.map((x, i) => `<div class="fn-row" role="listitem"><div class="fn-what"><b>${x.t}</b><span class="lawref">${x.ref}</span></div><div class="fn-fine">${x.fine}${x.extra ? `<small>${x.extra}</small>` : ""}</div><div class="fn-pts">${x.points ? `<button type="button" class="pt-btn" data-p="${x.points}" aria-label="Отнеми ${x.points} точки">−${x.points}<small>точки</small></button>` : `<span class="pt-none">без точки</span>`}</div></div>`).join("") : `<p class="mx-empty">Няма такова нарушение в списъка.</p>`;
      table.querySelectorAll(".pt-btn").forEach((b) => b.addEventListener("click", () => { lost += +b.dataset.p; picked.push(b.dataset.p); drawMeter(); }));
    }
    drawMeter();
    draw();
    root.appendChild(box);
    if (data.howto && data.howto.length) {
      root.appendChild(h(`<h2 class="section-title">Провери и плати</h2>`));
      root.appendChild(h(`<div class="mx-links">${data.howto.map((x) => `<a class="mx-link" href="${x.url}" target="_blank" rel="noopener"><b>${x.t}</b><span>${x.b}</span><small>${x.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗</small></a>`).join("")}</div>`));
    }
  }

  // ================= Колоездачи / Магистрала =================
  const factsWidget = (id, rel) => (root) => {
    const d = MORE[id] || {};
    if (d.facts && d.facts.length) {
      const box = h(`<div class="widget"><div class="widget-head"><h3>Числата</h3><p>Най-важното на един поглед.</p></div>${facts(d.facts)}</div>`);
      root.appendChild(box);
    }
    related(root, rel);
  };

  // ================= Първа помощ =================
  const PIC = {
    hazard: `<path d="M12 3 22 20H2z"/><path d="M12 9v5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>`,
    phone: `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>`,
    eye: `<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>`,
    hands: `<path d="M7 13V7.5a1.5 1.5 0 0 1 3 0V12M10 11V5.5a1.5 1.5 0 0 1 3 0V11M13 11V6.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6 7-2.5 0-4-1.5-5-3.5l-1.5-3a1.5 1.5 0 0 1 2.6-1.5L7 13"/>`,
    heart: `<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/><path d="M6 12h3l1.5-2.5L13 15l1.5-3H18"/>`,
    bleed: `<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>`,
    side: `<circle cx="6" cy="9" r="2.4"/><path d="M8.5 11.5 20 14.5M10 12.5 7 18M14 13.5l3 5"/>`,
    warm: `<path d="M3 15c3-2 6 2 9 0s6-2 9 0M3 19c3-2 6 2 9 0s6-2 9 0"/><path d="M8 4c-1 2 1 3 0 5M12 4c-1 2 1 3 0 5M16 4c-1 2 1 3 0 5"/>`,
    wait: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  };
  const pic = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PIC[k] || PIC.wait}</svg>`;
  function pomoshtWidget(root) {
    const steps = (MORE.pomosht && MORE.pomosht.steps) || [];
    if (steps.length) {
      let i = 0;
      const box = h(`<div class="widget fa-w"><div class="widget-head"><h3>Какво правиш – стъпка по стъпка</h3><p>Минавай напред, както би го направил на място.</p></div><div class="fa-track">${steps.map((s, k) => `<button type="button" class="fa-dot" data-i="${k}" aria-label="Стъпка ${k + 1}"><span>${k + 1}</span></button>`).join("")}</div><div class="fa-card" aria-live="polite"></div><div class="fa-nav"><button type="button" class="btn small fa-prev">◀ Назад</button><button type="button" class="btn small primary fa-next">Напред ▶</button></div></div>`);
      const card = box.querySelector(".fa-card");
      const go = (n) => {
        i = Math.max(0, Math.min(steps.length - 1, n));
        const s = steps[i];
        card.innerHTML = `<div class="fa-ic">${pic(s.ic)}</div><div><span class="eyebrow">Стъпка ${i + 1} от ${steps.length}</span><h4>${s.t}</h4><p>${s.b}</p></div>`;
        box.querySelectorAll(".fa-dot").forEach((d, k) => { d.classList.toggle("on", k === i); d.classList.toggle("done", k < i); });
        box.querySelector(".fa-prev").disabled = i === 0;
        box.querySelector(".fa-next").disabled = i === steps.length - 1;
      };
      box.querySelectorAll(".fa-dot").forEach((d) => d.addEventListener("click", () => go(+d.dataset.i)));
      box.querySelector(".fa-prev").addEventListener("click", () => go(i - 1));
      box.querySelector(".fa-next").addEventListener("click", () => go(i + 1));
      go(0);
      root.appendChild(box);
    }
    // CPR rhythm trainer: 110 compressions a minute, 30 compressions then 2 breaths
    const cpr = h(`<div class="widget cpr-w"><div class="widget-head"><h3>Ритъмът на сърдечния масаж</h3><p>110 натискания в минута, 5–6 см дълбоко, в средата на гърдите. 30 натискания, после 2 вдишвания – или само натискания, ако не можеш да вдишваш.</p></div>
      <div class="cpr-grid"><figure class="cpr-fig" data-no-play><svg viewBox="0 0 240 170" aria-hidden="true"></svg></figure><div class="cpr-side"><div class="cpr-count"><b>0</b><span>от 30</span></div><div class="cpr-phase">Натисни „Старт“</div><div class="cpr-btns"><button type="button" class="btn small primary cpr-go">▶ Старт</button><label class="cpr-snd"><input type="checkbox"> звук</label></div></div></div>
      <span class="lawref">ERC 2025 – основно поддържане на живота</span></div>`);
    const fig = cpr.querySelector("svg"), cnt = cpr.querySelector(".cpr-count b"), phase = cpr.querySelector(".cpr-phase"), go = cpr.querySelector(".cpr-go"), snd = cpr.querySelector(".cpr-snd input");
    // side view: the casualty lies on the back, the rescuer kneels beside with straight arms on the middle of the chest
    const scene = (down) => {
      const d = down ? 7 : 0;
      return `<rect width="240" height="170" fill="#eef2f6"/><rect x="10" y="132" width="220" height="8" rx="4" fill="#c9d1db"/>
      <g><rect x="40" y="${118 + d * 0.4}" width="150" height="${16 - d * 0.4}" rx="8" fill="#7d8b99"/><circle cx="30" cy="124" r="11" fill="${C.skin}"/><rect x="186" y="122" width="40" height="10" rx="5" fill="#5d6670"/></g>
      <g transform="translate(0 ${d})"><path d="M120 60 L118 112" stroke="${C.blue}" stroke-width="9" stroke-linecap="round"/><path d="M131 60 L122 112" stroke="#2557b8" stroke-width="9" stroke-linecap="round"/>
        <path d="M128 54 C150 54 160 70 160 92 L162 128" stroke="${C.blue}" stroke-width="20" stroke-linecap="round" fill="none"/><path d="M162 128 L196 130" stroke="#3b4250" stroke-width="13" stroke-linecap="round"/>
        <circle cx="126" cy="38" r="12" fill="${C.skin}"/><rect x="110" y="108" width="20" height="8" rx="4" fill="${C.skin}"/></g>
      <path d="M96 ${102 + d} h10" stroke="${C.red}" stroke-width="2"/><text x="86" y="${100 + d}" font-size="11" font-weight="800" fill="${C.red}" text-anchor="end">${down ? "↓ 5–6 см" : ""}</text>
      <text x="120" y="160" font-size="10.5" font-weight="700" fill="${C.ink}" text-anchor="middle">прави ръце, рамене над гърдите</text>`;
    };
    fig.innerHTML = scene(false);
    let timer = 0, n = 0, breaths = 0, actx = null;
    const beep = (f) => {
      if (!snd.checked) return;
      try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; g.gain.value = 0.08; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.06); } catch (e) { /* no sound */ }
    };
    function tick() {
      if (breaths > 0) { breaths--; phase.textContent = breaths ? "2 вдишвания" : "Пак 30 натискания"; if (!breaths) n = 0; return; }
      n++;
      cnt.textContent = n;
      fig.innerHTML = scene(true);
      setTimeout(() => (fig.innerHTML = scene(false)), 230);
      beep(n === 30 ? 880 : 520);
      phase.textContent = "Натискай – силно и бързо";
      if (n === 30) { breaths = 4; phase.textContent = "2 вдишвания"; }
    }
    go.addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = 0; go.textContent = "▶ Старт"; phase.textContent = "Пауза"; return; }
      n = 0; breaths = 0; cnt.textContent = "0";
      timer = setInterval(tick, 60000 / 110);
      go.textContent = "⏸ Стоп";
    });
    root.appendChild(cpr);
  }

  // ================= Шофиране в чужбина =================
  function chuzhbinaWidget(root) {
    const list = (MORE.chuzhbina && MORE.chuzhbina.countries) || [];
    if (!list.length) return;
    const BG = { c: "България", code: "BG", town: "50", out: "90", expr: "120", mw: "140", alc: "0,5 ‰" };
    let cur = list[0].code, mode = "card";
    const box = h(`<div class="widget mx-abroad"><div class="widget-head"><h3>Сравни със страната</h3><p>Избери държава. Числата са за лека кола – провери и преди пътуване.</p></div><div class="mx-ab-ctl"></div><div class="mx-ab-out"></div></div>`);
    const out = box.querySelector(".mx-ab-out"), ctl = box.querySelector(".mx-ab-ctl");
    ctl.appendChild(chips(list.map((x) => [x.code, `<b>${x.code}</b> ${x.c}`]), cur, (k) => { cur = k; mode = "card"; draw(); }, "Държава"));
    const tableBtn = h(`<button type="button" class="btn small">Всички в таблица</button>`);
    tableBtn.addEventListener("click", () => { mode = mode === "table" ? "card" : "table"; draw(); });
    ctl.appendChild(tableBtn);
    // the number goes in the sign, anything after it under the sign
    const speedTile = (v, bg, t) => {
      const m = String(v).match(/^(\d+)\s*(.*)$/);
      const num = m ? m[1] : v, more = m ? m[2].replace(/^[(–-]\s*|\)$/g, "") : "";
      return `<div class="ab-spw"><div class="ab-sp"><span class="ab-v">${num}</span><small>${t}</small>${bg && m && bg !== num ? `<em>у нас ${bg}</em>` : ""}</div>${more ? `<p class="ab-more">${more}</p>` : ""}</div>`;
    };
    function draw() {
      tableBtn.textContent = mode === "table" ? "Обратно към държава" : "Всички в таблица";
      if (mode === "table") {
        out.innerHTML = `<div class="mx-tablewrap"><table class="mx-tbl"><thead><tr><th>Държава</th><th>Град</th><th>Извън</th><th>Скоростен</th><th>Магистрала</th><th>Алкохол</th></tr></thead><tbody>${[BG, ...list].map((x) => `<tr${x.code === "BG" ? ' class="bg"' : ""}><th>${x.c}</th><td>${x.town}</td><td>${x.out}</td><td>${x.expr}</td><td>${x.mw}</td><td>${x.alc}</td></tr>`).join("")}</tbody></table></div>`;
        return;
      }
      const x = list.find((y) => y.code === cur);
      const row = (t, v) => (v && v !== "—" ? `<div class="ab-row"><span>${t}</span><p>${v}</p></div>` : "");
      out.innerHTML = `<div class="ab-card"><h4><span class="ab-code">${x.code}</span>${x.c}</h4>
        <div class="ab-speeds">${speedTile(x.town, BG.town, "в град")}${speedTile(x.out, BG.out, "извън града")}${speedTile(x.expr, BG.expr, "скоростен път")}${speedTile(x.mw, BG.mw, "магистрала")}</div>
        ${row("Алкохол", x.alc)}${row("Задължително в колата", x.eq)}${row("Светлини", x.lights)}${row("Пътни такси", x.toll)}${row("Зимни гуми", x.winter)}${row("Да знаеш", x.note)}
        ${x.src ? `<a class="ab-src" href="${x.src}" target="_blank" rel="noopener">Източник ↗</a>` : ""}</div>`;
    }
    draw();
    root.appendChild(box);
  }


  // ================= Подобни знаци =================
  function podobniWidget(root) {
    const d = MORE.podobni || {};
    const sign = (c) => (window.BGSigns ? window.BGSigns.signSVG(c, "pd-img") : "");
    if (d.shapes) {
      root.appendChild(h(`<div class="widget"><div class="widget-head"><h3>Формата и цветът казват вида</h3><p>Преди да гледаш символа, виж формата.</p></div><div class="pd-shapes">${d.shapes.map((x) => `<div class="pd-shape">${sign(x.c)}<b>${x.t}</b><span>${x.s}</span></div>`).join("")}</div></div>`));
    }
    (d.groups || []).forEach((g, gi) => {
      const box = h(`<section class="widget pd-group"><div class="widget-head"><h3>${g.t}</h3></div>
        <div class="pd-items">${g.items.map((x) => `<div class="pd-item">${sign(x.c)}<span class="pd-code">${x.c}</span><p>${x.s}</p></div>`).join("")}</div>
        <div class="pd-mem"><span>Как да запомниш</span><p>${g.mem}</p></div>
        ${g.ref ? `<span class="lawref">${g.ref}</span>` : ""}
        <div class="pd-quiz"><button type="button" class="btn small pd-q">Провери се</button></div></section>`);
      const quiz = box.querySelector(".pd-quiz");
      const ask = () => {
        const x = g.items[Math.floor(Math.random() * g.items.length)];
        const opts = g.items.map((y) => y.c).sort(() => Math.random() - 0.5);
        quiz.innerHTML = `<div class="pd-ask">${sign(x.c)}<p>Кой е този знак? Избери описанието.</p></div><div class="pd-opts">${opts.map((c) => `<button type="button" class="opt" data-c="${c}">${g.items.find((y) => y.c === c).s.replace(/<[^>]+>/g, "")}</button>`).join("")}</div>`;
        quiz.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
          const ok = b.dataset.c === x.c;
          quiz.querySelectorAll(".opt").forEach((o) => { o.disabled = true; if (o.dataset.c === x.c) o.classList.add("right"); });
          if (!ok) b.classList.add("wrong");
          const again = h(`<button type="button" class="btn small">${ok ? "Вярно – още един" : "Опитай пак"}</button>`);
          again.addEventListener("click", ask);
          quiz.appendChild(again);
        }));
      };
      box.querySelector(".pd-q").addEventListener("click", ask);
      root.appendChild(box);
      void gi;
    });
  }

  const Wd = window.BGWidgets || (window.BGWidgets = {});
  Object.assign(Wd, {
    avtomat: avtomatWidget,
    podobni: podobniWidget,
    novo: novoWidget,
    globi: globiWidget,
    kolela: factsWidget("kolela", ["cyclist-overtake", "door-open", "right-turn-pedestrians"]),
    magistrala: factsWidget("magistrala", ["motorway-merge", "motorway-exit", "motorway-breakdown", "zipper-merge", "emergency-corridor", "tailgater"]),
    pomosht: pomoshtWidget,
    chuzhbina: chuzhbinaWidget,
  });
})();
