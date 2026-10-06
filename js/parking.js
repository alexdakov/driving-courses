/* „Видове паркиране“: one animated top-down manoeuvre per kind of parking, with the steps,
   the rules (with the article they come from), tips and fines.
   The car moves with a simple bicycle model (rear axle = origin, wheelbase L), so the paths
   are the real ones a car makes with the wheel at full lock. 1 m = 10 SVG units. */
(function () {
  const h = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const M = 10, L = 2.65, LOCK = 33, RAD = Math.PI / 180;
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // while a scene is drawn, REC collects what the 3D driver's view needs: ground, lines, cars, trees, signs
  let REC = null;
  const rec = (o) => { if (REC) REC.push(o); };
  const sign = (code, x, y, s) => { rec({ k: "sign", code, x: x + s / 2, y: y + s / 2 }); return window.BGSigns ? window.BGSigns.signImage(code, x * M, y * M, s * M) : ""; };
  const FINE = { 50: "50 лв (25,56 €)", 100: "100 лв (51,13 €)", 200: "200 лв (102,26 €)" };

  // ---------- drawing helpers (metres in, SVG units out) ----------
  const rect = (x, y, w, hh, cls, extra = "") => (rec({ k: "rect", x, y, w, h: hh, cls }), `<rect x="${f1(x * M)}" y="${f1(y * M)}" width="${f1(w * M)}" height="${f1(hh * M)}" class="${cls}" ${extra}/>`);
  const line = (x1, y1, x2, y2, extra) => `<line x1="${f1(x1 * M)}" y1="${f1(y1 * M)}" x2="${f1(x2 * M)}" y2="${f1(y2 * M)}" ${extra}/>`;
  const text = (x, y, t, extra = "") => `<text x="${f1(x * M)}" y="${f1(y * M)}" font-size="10.5" font-weight="700" text-anchor="middle" dominant-baseline="central" class="pk-t" ${extra}>${t}</text>`;
  const paint = (x1, y1, x2, y2, w = 0.12) => (rec({ k: "line", x1, y1, x2, y2, w, c: "#f1f1ec" }), line(x1, y1, x2, y2, `class="pk-line" stroke-width="${w * M}"`));
  const mline = (x1, y1, x2, y2, c, w) => (rec({ k: "line", x1, y1, x2, y2, w, c }), line(x1, y1, x2, y2, `stroke="${c}" stroke-width="${w * M}"`));
  // ground patch with an SVG fill (pattern or colour) and its 3D colour key
  const gfill = (x, y, w, hh, key, fill, extra = "") => (rec({ k: "rect", x, y, w, h: hh, cls: key }), `<rect x="${f1(x * M)}" y="${f1(y * M)}" width="${f1(w * M)}" height="${f1(hh * M)}" fill="${fill}" ${extra}/>`);
  const gpoly = (pts, cls) => (rec({ k: "poly", pts, cls }), `<polygon points="${pts.map(([x, y]) => `${f1(x * M)},${f1(y * M)}`).join(" ")}" class="${cls}"/>`);
  const tree = (x, y, r) => (rec({ k: "tree", x, y, r }), `<circle cx="${f1(x * M)}" cy="${f1(y * M)}" r="${f1(r * M)}" class="pk-tree"/>`);
  const dashes = (y, x1, x2) => { let s = ""; for (let x = x1; x < x2; x += 4) s += paint(x, y, x + 2.2, y, 0.14); return s; };
  // dimension arrow with a label in the middle
  const dim = (x1, y1, x2, y2, t) => line(x1, y1, x2, y2, `class="pk-dim" marker-start="url(#pk-ah)" marker-end="url(#pk-ah)"`) + `<g class="pk-tag">${text((x1 + x2) / 2, (y1 + y2) / 2, t)}</g>`;

  // car body in its own frame: rear axle at 0, heading +x, body −0.95…3.45 m long, 1.8 m wide
  function carBody(col, live) {
    const wheel = (x, y, cls) => `<g class="${cls}" transform="translate(${x} ${y})"><rect x="-3.3" y="-1.3" width="6.6" height="2.6" rx="1" fill="#1d2126"/></g>`;
    let s = "";
    s += `<rect x="-10" y="-9.6" width="45" height="19.2" rx="4" fill="rgba(0,0,0,.22)" transform="translate(1.2 1.4)"/>`;
    s += wheel(0, -8.4, "") + wheel(0, 8.4, "") + wheel(26.5, -8.4, live ? "pk-fw" : "") + wheel(26.5, 8.4, live ? "pk-fw" : "");
    s += `<rect x="-9.5" y="-9" width="44" height="18" rx="4" fill="${col}"/>`;
    s += `<rect x="-6.5" y="-7.2" width="7" height="14.4" rx="2" fill="rgba(20,32,48,.6)"/>`;
    s += `<rect x="2" y="-7.6" width="15" height="15.2" rx="2.5" fill="rgba(255,255,255,.16)"/>`;
    s += `<path d="M18 -7.6 L23.5 -6.4 V6.4 L18 7.6 Z" fill="rgba(20,32,48,.6)"/>`;
    s += `<rect x="21" y="-10.6" width="2.4" height="1.6" rx=".6" fill="${col}"/><rect x="21" y="9" width="2.4" height="1.6" rx=".6" fill="${col}"/>`;
    // head lights, tail lights (class so reverse/brake can recolour them), blinkers
    s += `<rect x="33" y="-7.6" width="1.6" height="3.4" rx=".8" fill="#fff6c8"/><rect x="33" y="4.2" width="1.6" height="3.4" rx=".8" fill="#fff6c8"/>`;
    s += `<rect class="pk-tail" x="-9.7" y="-7.6" width="1.6" height="3.4" rx=".8" fill="#b3261e"/><rect class="pk-tail" x="-9.7" y="4.2" width="1.6" height="3.4" rx=".8" fill="#b3261e"/>`;
    if (live) {
      s += `<g class="pk-bl pk-bl-L" opacity="0"><circle cx="33.6" cy="-8.4" r="2" fill="#ffb21a"/><circle cx="-9" cy="-8.4" r="2" fill="#ffb21a"/></g>`;
      s += `<g class="pk-bl pk-bl-R" opacity="0"><circle cx="33.6" cy="8.4" r="2" fill="#ffb21a"/><circle cx="-9" cy="8.4" r="2" fill="#ffb21a"/></g>`;
      s += `<g class="pk-park" opacity="0"><circle cx="35" cy="-6" r="3.2" fill="#ffe9a8" opacity=".55"/><circle cx="35" cy="6" r="3.2" fill="#ffe9a8" opacity=".55"/><circle cx="-11" cy="-6" r="3.2" fill="#ff5a4e" opacity=".5"/><circle cx="-11" cy="6" r="3.2" fill="#ff5a4e" opacity=".5"/></g>`;
    }
    return s;
  }
  // parked car given by its centre (metres) and heading
  const parked = (cx, cy, th, col) => {
    rec({ k: "car", cx, cy, th, col });
    const ax = cx - 1.25 * Math.cos(th * RAD), ay = cy - 1.25 * Math.sin(th * RAD);
    return `<g transform="translate(${f1(ax * M)} ${f1(ay * M)}) rotate(${th})">${carBody(col)}</g>`;
  };
  const COLS = ["#8a929c", "#c8ccd2", "#5d6670", "#b23a30", "#2f4d6e", "#d9a441", "#6b7f4f", "#e6e8eb"];
  const col = (i) => COLS[i % COLS.length];
  const bigX = (x, y) => `<g transform="translate(${x * M} ${y * M})" class="pk-pop"><circle r="15" fill="#d13b2f"/><path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></g>`;
  const okMark = (x, y) => `<g transform="translate(${x * M} ${y * M})" class="pk-pop"><circle r="15" fill="#1aa64b"/><path d="M-6.5 0.5 L-2 5 L7 -5" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  const bubble = (x, y, t, fill = "#1f2933") => { const w = t.length * 5.6 + 18; return `<g transform="translate(${x * M} ${y * M})" class="pk-pop"><rect x="${-w / 2}" y="-12" width="${w}" height="24" rx="12" fill="${fill}"/><text y="0.5" font-size="11" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${t}</text></g>`; };
  const DEFS = `<defs><marker id="pk-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="pk-ahead"/></marker>
    <pattern id="pk-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(209,59,47,.18)"/><rect width="3" height="8" fill="rgba(209,59,47,.45)"/></pattern>
    <pattern id="pk-gravel" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" class="pk-gravel"/><circle cx="2" cy="2" r=".9" fill="rgba(0,0,0,.18)"/><circle cx="5" cy="4.5" r=".7" fill="rgba(0,0,0,.14)"/></pattern></defs>`;

  // ---------- scenes ----------
  // town street: buildings / sidewalk on top, two-way road, curb at y = 20, sidewalk below
  function street({ curb = true, blue = false } = {}) {
    let s = rect(0, 0, 40, 24, "r-grass");
    s += rect(0, 0, 40, 4.6, "pk-house") + rect(0, 4.6, 40, 3.4, "r-walk") + rect(0, 7.9, 40, 0.2, "r-curb");
    s += rect(0, 8, 40, 12, "r-road") + dashes(13.5, 0, 40);
    if (curb) s += rect(0, 20, 40, 4, "r-walk") + rect(0, 19.9, 40, 0.25, "r-curb");
    else s += gfill(0, 20, 40, 1.6, "gravel", "url(#pk-gravel)");
    for (let x = 1; x < 40; x += 8) s += tree(x + 3, 22.6, 0.9);
    if (blue) for (let x = 3; x <= 37.3; x += 5.7) s += mline(x, 18, x, 19.9, "#2f6fdc", 0.16) + (x < 37 ? mline(x, 18, Math.min(x + 5.7, 37.2), 18, "#2f6fdc", 0.16) : "");
    return s;
  }
  // parking lot with a row of 90° bays on top (y 3–8) and at the bottom (y 14–19)
  function lot(bays, { bottom = true } = {}) {
    let s = rect(0, 0, 40, 24, "r-road") + rect(0, 0, 40, 2.4, "pk-house") + rect(0, 21.6, 40, 2.4, "r-grass");
    bays.forEach(([a, b]) => { s += paint(a, 3, a, 8) + paint(b, 3, b, 8); });
    if (bottom) for (let x = 0.5; x < 40; x += 2.5) s += paint(x, 14, x, 19);
    s += paint(0, 3, 40, 3, 0.1);
    for (let x = 6; x < 40; x += 12) s += `<path d="M${x * M} ${11 * M} h18 v-3 l7 5 l-7 5 v-3 h-18 z" class="pk-arrow"/>`;
    return s;
  }

  // ---------- simulation ----------
  // seg: {g:'D'|'R', s: steer° (+ right), d: metres | th: target heading°, v: m/s, n: step index, bl: 'L'|'R'|'H'}
  //      or {pause: seconds, g, s, n, bl, park: true}
  function simulate(start, segs) {
    let x = start.x, y = start.y, th = start.th * RAD, steer = 0, g = "D";
    const fr = [];
    let t = 0;
    segs.forEach((sg, si) => {
      const bl = sg.bl || null;
      if (sg.pause !== undefined) {
        if (sg.s !== undefined) steer = sg.s;
        if (sg.g) g = sg.g;
        const n = Math.max(1, Math.round(sg.pause * 30));
        for (let i = 0; i < n; i++) { fr.push({ t, x, y, th, steer, g, si, n: sg.n, bl, park: sg.park, v: 0 }); t += sg.pause / n; }
        return;
      }
      g = sg.g; steer = sg.s || 0;
      const dir = g === "R" ? -1 : 1, k = Math.tan(steer * RAD) / L, ds = 0.04;
      // dry run for the length, so the speed can ramp up and down
      let len = sg.d;
      if (sg.th !== undefined) len = Math.abs((sg.th * RAD - th) / k);
      const vmax = sg.v || (g === "R" ? 1.1 : 1.6);
      for (let d = 0; d < len - 1e-6; d += ds) {
        const step = Math.min(ds, len - d);
        const v = Math.max(0.35, vmax * Math.min(1, (d + 0.2) / 1.2, (len - d + 0.2) / 1.2));
        x += dir * Math.cos(th) * step; y += dir * Math.sin(th) * step; th += dir * step * k;
        fr.push({ t, x, y, th, steer, g, si, n: sg.n, bl, v });
        t += step / v;
      }
      if (sg.th !== undefined) th = sg.th * RAD;
    });
    return fr;
  }

  // ---------- the kinds of parking ----------
  const T = [
    {
      id: "par", t: "Успоредно", ic: "par",
      lead: "Най-честото паркиране в града – между две коли до бордюра, на заден ход.",
      steps: ["Мигач надясно. Спри успоредно на колата пред мястото, на около 0,5–1 м от нея, задните брони на една линия.", "Задна предавка R. Пусни леко спирачката и завърти волана докрай надясно.", "Когато колата е под около 45° (в лявото огледало виждаш цялата кола зад теб), изправи волана.", "Когато предната ти броня мине задната броня на колата отпред – волана докрай наляво.", "Изправи се, изправи колелата и се центрирай напред. P и ръчна."],
      law: [["В населено място спираш възможно най-вдясно и успоредно на оста на пътя.", "ЗДвП чл. 94, ал. 3"], ["Преди маневрата подаваш мигач и се убеждаваш, че не създаваш опасност.", "ЗДвП чл. 25, ал. 1; чл. 26"], ["На заден ход първо се убеждаваш, че зад колата е свободно, и гледаш назад през цялото време.", "ЗДвП чл. 40"], ["На еднопосочна улица отляво е разрешен само престой, не паркиране.", "ЗДвП чл. 94, ал. 4"], ["Маркираното успоредно място е 5,70 × 2,50 м.", "Наредба № 2/2001, прил. 24"]],
      tips: ["Мястото трябва да е поне с 1–1,5 м по-дълго от колата.", "Оставяй 20–30 см до бордюра – да не ожулиш джантите.", "С автоматик само пълзиш на спирачката – без газ.", "Камерата и сензорите помагат, но поглеждай и през рамо."],
      fines: [["Паркиране далеч от бордюра или неуспоредно", 50, "ЗДвП чл. 183, ал. 2, т. 1–2"]],
      scene: () => {
        let s = street();
        s += parked(4.4, 19, 0, col(0)) + parked(11.8, 19, 0, col(1)) + parked(22.8, 19, 0, col(2)) + parked(30.4, 19, 0, col(3));
        s += parked(33, 10.8, 180, col(4));
        s += `<g class="pk-tag">${text(17.3, 21.9, "място ≈ 6,6 м")}</g>`;
        return s;
      },
      start: { x: 2, y: 16.7, th: 0 },
      segs: [{ g: "D", d: 19.4, v: 3, n: 0, bl: "R" }, { pause: 0.8, g: "R", n: 1, bl: "R" }, { g: "R", s: LOCK, th: -40, n: 1, bl: "R" }, { g: "R", d: 0.65, n: 2, bl: "R" }, { g: "R", s: -LOCK, th: 0, n: 3, bl: "R" }, { pause: 0.5, g: "D", s: 0, n: 4 }, { g: "D", d: 0.2, v: 0.5, n: 4 }, { pause: 2.5, g: "P", n: 4, park: true }],
      over: (si) => (si >= 7 ? okMark(17.3, 15.6) : ""),
    },
    {
      id: "perp", t: "Напречно", ic: "perp",
      lead: "Клетки под прав ъгъл – на паркинги и на някои улици. По-добре на заден ход: излизаш напред и виждаш движението.",
      vars: [["back", "На заден ход"], ["fwd", "Напред"]],
      steps: { back: ["Мигач към мястото. Подмини клетката, докато тя остане до задната ти врата.", "Задна предавка R, волана докрай към мястото.", "Колата се завърта – гледай в двете огледала разстоянието до съседите.", "Когато колата е изправена в клетката – изправи волана и влез докрай назад.", "P и ръчна. При излизане ще тръгнеш напред и ще виждаш."], fwd: ["Мигач. Отдалечи се малко от реда, за да имаш място за завоя.", "Когато предната ти броня стигне средата на съседната клетка – волана докрай към мястото.", "Влизаш напред; гледай задния ъгъл да не закачи съседа.", "Изправи колелата и спри преди края на клетката.", "При излизане назад гледай и през двете рамена – не виждаш колите, които минават."] },
      law: [["Напречно или косо паркираш само където маркировката (М13) или табелата под знака Д19 го показват. Иначе – успоредно.", "ЗДвП чл. 94, ал. 3; ППЗДвП чл. 55, ал. 9; Наредба № 2/2001, чл. 32"], ["Колата е изцяло в своята клетка.", "Наредба № 2/2001, чл. 32"], ["На заден ход се убеждаваш, че е свободно, и гледаш назад непрекъснато.", "ЗДвП чл. 40"], ["Клетката е 5,0 × 2,4 м, а лентата за маневри – 6 м.", "Наредба № 2/2001, прил. 24"]],
      tips: ["На заден ход влизаш, напред излизаш – така виждаш колите и пешеходците.", "Центрирай се – съседът трябва да може да отвори вратата си.", "При завъртане предната част излиза встрани – внимавай за колата отсреща.", "Не заемай две клетки."],
      fines: [["Колата е извън клетката или заема две", 50, "ЗДвП чл. 183, ал. 2, т. 1"]],
      scene: () => {
        const bays = []; for (let x = 0.5; x < 39; x += 2.5) bays.push([x, x + 2.5]);
        let s = lot(bays);
        bays.forEach(([a], i) => { if (a !== 18 && i % 5 !== 3) s += parked(a + 1.25, 5.55, i % 2 ? 90 : -90, col(i)); });
        [1, 2, 4, 6, 9, 11, 12, 14].forEach((i) => { s += parked(0.5 + i * 2.5 + 1.25, 16.45, i % 2 ? 90 : -90, col(i + 3)); });
        s += `<rect x="${18 * M + 3}" y="${3 * M + 3}" width="${2.5 * M - 6}" height="${5 * M - 6}" rx="3" class="pk-target"/>`;
        s += dim(18, 1.6, 20.5, 1.6, "2,4 м") + dim(38.6, 8, 38.6, 14, "6 м");
        return s;
      },
      start: { x: 3, y: 11.8, th: 0 },
      segsBy: {
        back: [{ g: "D", d: 20.33, v: 2.2, n: 0, bl: "L" }, { pause: 0.8, g: "R", n: 1, bl: "L" }, { g: "R", s: -LOCK, th: 90, n: 2, bl: "L" }, { g: "R", d: 3.47, n: 3 }, { pause: 2.5, g: "P", n: 4, park: true }],
        fwd: [{ g: "D", d: 12.17, v: 2.2, n: 0, bl: "L" }, { g: "D", s: -LOCK, th: -90, v: 1.3, n: 1, bl: "L" }, { g: "D", d: 0.5, n: 2 }, { g: "D", d: 0.47, v: 0.5, n: 3 }, { pause: 2.5, g: "P", n: 4, park: true }],
      },
      over: (si, v) => (si === 4 ? okMark(19.25, 12) : ""),
    },
    {
      id: "angle", t: "Под ъгъл", ic: "angle",
      lead: "„Елха“ – клетки под 45° или 60°, наклонени по посоката на движението. Влизаш напред с лек завой.",
      steps: ["Карай по посоката, в която са наклонени клетките. Мигач.", "Когато клетката е точно до теб – волана към нея.", "Колата влиза под ъгъла на клетката – изправи волана.", "Спри преди края на клетката. P и ръчна.", "Излизаш на заден ход бавно – отзад идват коли, които не виждаш добре."],
      law: [["Косо паркираш само където маркировката или табелата под Д19 го показват.", "ЗДвП чл. 94, ал. 3; ППЗДвП чл. 55, ал. 9; Наредба № 2/2001, чл. 32"], ["При излизане на заден ход пропускаш движещите се и гледаш назад.", "ЗДвП чл. 25, ал. 1; чл. 40"], ["Лентата за маневри е 4,5 м при 60° и 3,8 м при 45°.", "Наредба № 2/2001, прил. 24"]],
      tips: ["Влизаш само от посоката, накъдето „сочат“ клетките – иначе не можеш да завиеш.", "При излизане: бавно, с поглед през рамо – и сензорите често закъсняват.", "Ако някой чака да излезеш – дай мигач, за да знае."],
      fines: [["Паркиране извън клетката", 50, "ЗДвП чл. 183, ал. 2, т. 1"]],
      scene: () => {
        let s = rect(0, 0, 40, 24, "r-grass") + rect(0, 1.4, 40, 2.4, "r-walk") + rect(0, 3.8, 40, 6.8, "r-road") + gpoly([[0, 10.5], [40, 10.5], [40, 16.4], [0, 16.4]], "r-road") + rect(0, 16.4, 40, 2.6, "r-walk");
        const ux = 0.5, uy = 0.866;
        for (let k = -7; k <= 7; k++) { const xe = 22 - 1.385 + 2.77 * k; s += paint(xe, 10.5, xe + 5 * ux, 10.5 + 5 * uy); }
        s += paint(0, 10.5, 40, 10.5, 0.1);
        for (let k = -6; k <= 5; k++) { if (k === 0 || k === 1 || k === -3) continue; const xb = 22 + 2.77 * k; s += parked(xb + 2.5 * ux, 10.5 + 2.5 * uy, 60, col(k + 7)); }
        const pt = (x, y) => `${f1(x * M)},${f1(y * M)}`;
        s += `<polygon points="${pt(20.75, 10.6)} ${pt(23.25, 10.6)} ${pt(25.7, 14.75)} ${pt(23.2, 14.75)}" class="pk-target"/>`;
        for (let x = 4; x < 40; x += 12) s += `<path d="M${x * M} ${7.2 * M} h18 v-3 l7 5 l-7 5 v-3 h-18 z" class="pk-arrow"/>`;
        s += `<g class="pk-tag">${text(8, 20.6, "60° · лента 4,5 м")}</g>`;
        return s;
      },
      start: { x: 2, y: 7, th: 0 },
      segs: [{ g: "D", d: 15.63, v: 2.2, n: 0, bl: "R" }, { g: "D", s: LOCK, th: 60, v: 1.2, n: 1, bl: "R" }, { g: "D", d: 2.6, n: 2 }, { g: "D", d: 0.44, v: 0.5, n: 3 }, { pause: 2.5, g: "P", n: 3, park: true }],
      over: (si) => (si === 4 ? okMark(30, 6.4) : ""),
    },
    {
      id: "walk", t: "На тротоара", ic: "walk",
      lead: "Само на определените места – с маркировка или знак Д19 с табела, която показва колата върху тротоара.",
      steps: ["Видя знак или маркировка за паркиране на тротоара – мигач надясно.", "Качи се бавно и под ъгъл – гумата минава бордюра по-меко.", "Изправи колата успоредно на бордюра в маркираното място.", "Провери: остават ли поне 2 м за пешеходците откъм сградите?", "P и ръчна. Слизаш внимателно – по тротоара минават хора."],
      law: [["Само за коли до 2,5 т, само на определените места, успоредно на оста на пътя.", "ЗДвП чл. 94, ал. 3"], ["Откъм сградите остават поне 2 м за пешеходците.", "ЗДвП чл. 94, ал. 3"], ["На тротоар, в парк, градина и детска площадка извън разрешените места – глоба.", "ЗДвП чл. 15, ал. 7; чл. 178е"], ["Ако пречиш, колата може да бъде вдигната от „паяк“.", "ЗДвП чл. 171, т. 5, б. „б“"]],
      tips: ["Не спирай пред рампа за колички или вход – пречиш, дори да е „само за минута“.", "Отваряй вратата към тротоара бавно – там минават хора и тротинетки.", "Ниски бордюри: качвай се под ъгъл, с минимална скорост."],
      fines: [["Паркиране на тротоар извън разрешените места", 100, "ЗДвП чл. 178е"]],
      scene: () => {
        let s = rect(0, 0, 40, 24, "r-grass") + rect(0, 0, 40, 1, "pk-house") + rect(0, 1, 40, 3, "r-walk") + rect(0, 4, 40, 13, "r-road") + dashes(10.5, 0, 40);
        s += rect(0, 17, 40, 4.6, "r-walk") + rect(0, 16.9, 40, 0.25, "r-curb") + rect(0, 21.6, 40, 2.4, "pk-house");
        const bl = (x1, y1, x2, y2) => mline(x1, y1, x2, y2, "#5d6670", 0.16);
        for (const x of [12, 17.7, 23.4, 29.1]) s += bl(x, 17.15, x, 19.35);
        s += bl(12, 19.35, 29.1, 19.35);
        s += parked(26.25, 18.25, 0, col(1)) + parked(30, 7.3, 180, col(3));
        s += `<g class="pk-ped" transform="translate(${8 * M} ${20.5 * M})"><circle r="5.5" fill="#f08a24"/><circle cx="2" r="3" fill="#f3c7a1"/></g>`;
        s += dim(33.5, 19.4, 33.5, 21.55, "≥ 2 м");
        s += sign("D19", 36.4, 16.2, 2.6) + `<g transform="translate(${36.4 * M} ${18.9 * M})"><rect width="26" height="13" rx="2" fill="#fff" stroke="#1f2933" stroke-width=".8"/><rect x="4" y="3.5" width="18" height="6" rx="2" fill="#1d5fb4"/><path d="M2 11 H24" stroke="#1f2933" stroke-width="1.4"/><path d="M13 3 V11" stroke="#1f2933" stroke-width=".8" stroke-dasharray="1.5 1"/></g>`;
        return s;
      },
      start: { x: 1, y: 14.9, th: 0 },
      segs: [{ g: "D", d: 7.89, v: 2.4, n: 0, bl: "R" }, { g: "D", s: 20, th: 25, v: 0.9, n: 1, bl: "R" }, { g: "D", d: 4.7, v: 0.9, n: 1, bl: "R" }, { g: "D", s: -20, th: 0, v: 0.9, n: 2 }, { pause: 1.6, g: "D", n: 3 }, { pause: 2.2, g: "P", n: 4, park: true }],
      over: (si) => (si === 4 ? `<rect x="${12 * M}" y="${19.4 * M}" width="${17 * M}" height="${2.15 * M}" fill="rgba(26,166,75,.25)"/>` : si === 5 ? okMark(20.5, 14.6) : ""),
    },
    {
      id: "slope", t: "На наклон", ic: "slope",
      lead: "Колата не трябва да може да тръгне сама. Колелата се обръщат така, че ако тръгне, да спре в бордюра или извън пътя.",
      vars: [["down", "Надолу"], ["up", "Нагоре с бордюр"], ["none", "Без бордюр"]],
      steps: ["Спри до бордюра, задръж спирачката.", "Завърти колелата според наклона (виж предните колела).", "Пусни леко спирачката – колата се опира с гумата в бордюра.", "Дръпни ръчната, после P. Чак тогава пусни спирачката.", "Изключи двигателя."],
      law: [["Длъжен си да вземеш мерки колата да не тръгне сама.", "ЗДвП чл. 96"], ["Двигателят се изключва при престой и паркиране.", "ЗДвП чл. 181, т. 5"]],
      tipsBy: {
        down: ["Колата гледа надолу → колелата към бордюра (надясно). Ако тръгне, бордюрът я спира.", "Ръчната преди P – така скоростната кутия не държи цялата тежест."],
        up: ["Колата гледа нагоре и има бордюр → колелата навън (наляво). Ако тръгне назад, гумата опира в бордюра.", "Ръчната преди P – така скоростната кутия не държи цялата тежест."],
        none: ["Няма бордюр → колелата към края на пътя (надясно) и нагоре, и надолу. Ако тръгне, ще излезе от платното, а не към движението.", "Ръчната преди P."],
      },
      fines: [["Ако колата тръгне сама, отговаряш за всичко, което удари.", "Щетите", "ЗДвП чл. 96"]],
      scene: (v) => {
        let s = street({ curb: v !== "none" });
        s += `<rect x="0" y="${8 * M}" width="${40 * M}" height="${12 * M}" fill="url(#pk-slope-${v === "up" ? "up" : "down"})" opacity=".35"/>`;
        s += `<defs><linearGradient id="pk-slope-down"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><linearGradient id="pk-slope-up"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>`;
        s += parked(10, 19, 0, col(2)) + parked(33.5, 19, 0, col(4));
        s += `<g class="pk-tag">${text(20, 3.4, v === "up" ? "↗ нагоре" : "↘ надолу", 'font-size="12"')}</g>`;
        return s;
      },
      start: { x: 1, y: 16.7, th: 0 },
      segsBy: {
        down: [{ g: "D", d: 12.54, v: 2.4, n: 0, bl: "R" }, { g: "D", s: 20, th: 25, v: 1, n: 0, bl: "R" }, { g: "D", d: 2.215, v: 1, n: 0, bl: "R" }, { g: "D", s: -20, th: 0, v: 1, n: 0 }, { pause: 1.2, s: LOCK, n: 1 }, { g: "D", s: LOCK, d: 0.12, v: 0.15, n: 2 }, { pause: 1.2, g: "P", n: 3 }, { pause: 2, g: "P", n: 4, park: true }],
        up: [{ g: "D", d: 12.54, v: 2.4, n: 0, bl: "R" }, { g: "D", s: 20, th: 25, v: 1, n: 0, bl: "R" }, { g: "D", d: 2.215, v: 1, n: 0, bl: "R" }, { g: "D", s: -20, th: 0, v: 1, n: 0 }, { pause: 1.2, s: -LOCK, n: 1 }, { g: "R", s: -LOCK, d: 0.12, v: 0.15, n: 2 }, { pause: 1.2, g: "P", n: 3 }, { pause: 2, g: "P", n: 4, park: true }],
        none: [{ g: "D", d: 12.54, v: 2.4, n: 0, bl: "R" }, { g: "D", s: 20, th: 25, v: 1, n: 0, bl: "R" }, { g: "D", d: 2.215, v: 1, n: 0, bl: "R" }, { g: "D", s: -20, th: 0, v: 1, n: 0 }, { pause: 1.2, s: LOCK, n: 1 }, { pause: 1, n: 2 }, { pause: 1.2, g: "P", n: 3 }, { pause: 2, g: "P", n: 4, park: true }],
      },
      over: (si, v) => (si >= 4 ? bubble(25.5, 14.4, v === "up" ? "колелата навън" : v === "none" ? "колелата към края" : "колелата към бордюра") : "") + (si >= 6 ? bubble(25.5, 11.2, "ръчна + P", "#1aa64b") : ""),
    },
    {
      id: "zone", t: "Платена зона", ic: "zone",
      lead: "Общината определя платени зони, часове и цена. Всичко е на знаците и маркировката – често синя.",
      steps: ["Влизаш в зоната – знак със „зона“ и „P“. Виж часовете на табелата.", "Паркирай в маркираното място.", "Плати веднага – SMS, приложение или паркомат.", "Следи времето – след изтичането му трябва да платиш пак или да преместиш колата.", "Неплатено или изтекло време → скоба или „паяк“."],
      law: [["Общината определя платените зони, часовете и цената. Условията са на знаците, маркировката и надписите.", "ЗДвП чл. 99"], ["Без платена цена колата може да бъде блокирана със скоба до плащане или преместена.", "ЗДвП чл. 167, ал. 2, т. 2; чл. 171, т. 5, б. „г“"], ["Начало и край на зоната – знаци Д13 и Д14 (вариант за платен паркинг).", "ППЗДвП чл. 55, ал. 6"]],
      tips: ["Пример за София: синя зона – до 2 часа, зелена – до 4 часа; SMS към 1302 (синя) или 1303 (зелена). Часовете и цената са на табелите и се променят.", "Пазиш SMS потвърждението, докато си на мястото.", "Хората с карта за увреждания паркират на своите места с Д21."],
      fines: [["Колата стои блокирана, докато не платиш паркирането и таксата за скобата – или я вдига „паяк“ и плащаш преместване и пазене.", "Скоба или „паяк“", "ЗДвП чл. 167, ал. 2, т. 2; чл. 171, т. 5, б. „г“"]],
      scene: () => {
        let s = street({ blue: true });
        s += parked(5.85, 19, 0, col(0)) + parked(11.55, 19, 0, col(5)) + parked(28.65, 19, 0, col(3)) + parked(34.35, 19, 0, col(1));
        s += sign("D13.2", 36.2, 4.7, 3.2) + `<g class="pk-tag">${text(20, 10.4, "синя маркировка = платено")}</g>`;
        return s;
      },
      start: { x: 1, y: 16.7, th: 0 },
      segs: [{ g: "D", d: 12.54, v: 2.4, n: 0, bl: "R" }, { g: "D", s: 20, th: 25, v: 1, n: 1, bl: "R" }, { g: "D", d: 2.215, v: 1, n: 1, bl: "R" }, { g: "D", s: -20, th: 0, v: 1, n: 1 }, { pause: 2.2, g: "P", n: 2, park: true }, { pause: 3, g: "P", n: 3, park: true }, { pause: 2.6, g: "P", n: 4, park: true }],
      over: (si, v, tin) => {
        if (si === 4) return bubble(22.9, 13.6, "SMS → 1302 ✓", "#2f6fdc");
        if (si === 5) { const left = Math.max(0, 120 - Math.round((tin / 3) * 120)); return bubble(22.9, 13.6, `остават ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} ч`, left < 20 ? "#d13b2f" : "#1f2933"); }
        if (si === 6) return bubble(22.9, 13.6, "времето изтече – скоба", "#d13b2f") + `<g transform="translate(${24.5 * M} ${20.4 * M})" class="pk-pop"><rect x="-6" y="-4" width="12" height="8" rx="2" fill="#ffd400" stroke="#1f2933" stroke-width="1.2"/><circle r="2" fill="#1f2933"/></g>`;
        return "";
      },
    },
    {
      id: "garage", t: "Паркинг-гараж", ic: "garage",
      lead: "Подземен или многоетажен паркинг: бариера, тесни рампи, колони и пешеходци между колите.",
      steps: ["Провери знака за височина (В16) на входа – особено с багажник на покрива.", "Спри до бариерата, вземи билет – или камерата разпознава номера.", "Карай бавно, с къси светлини, по стрелките.", "Влез в свободна клетка – колоните са най-близо до вратите.", "Запиши етажа и мястото. Плати на автомата, преди да се върнеш при колата."],
      law: [["Знаците и маркировката важат и тук – посока, скорост, височина.", "ЗДвП чл. 6"], ["Знак В16 забранява влизането с височина (с товара) над означената.", "ППЗДвП чл. 47"], ["Престой и паркиране само в клетките, не в лентата за движение.", "ЗДвП чл. 98, ал. 1, т. 1"]],
      tips: ["На рампа нагоре с автоматик – леко газ, колата не се връща назад; надолу – на спирачката.", "Колите на газ (LPG/CNG) често нямат право в подземни паркинги – виж знака на входа.", "Сензорите пищят край колоните – вярвай им, но и гледай.", "Снимай номера на етажа и мястото."],
      fines: [["Блокираш лентата или чужди коли", 50, "ЗДвП чл. 183, ал. 2, т. 1"]],
      scene: () => {
        const bays = []; for (let x = 11.5; x < 39; x += 2.5) bays.push([x, x + 2.5]);
        let s = lot(bays, { bottom: false }) + rect(0, 14, 40, 7.6, "pk-house") + rect(0, 0, 11, 8, "pk-house");
        bays.forEach(([a], i) => { if (a !== 26 && i !== 7 && i !== 2) s += parked(a + 1.25, 5.55, -90, col(i)); });
        for (let x = 11.5; x < 40; x += 7.5) s += rect(x - 0.4, 2.4, 0.8, 0.8, "pk-pillar");
        s += rect(8.6, 14.1, 1, 1.1, "pk-pillar");
        s += sign("V16", 1, 15.2, 3.6) + `<g class="pk-tag">${text(2.8, 19.8, "2,1 м")}</g>`;
        s += `<rect x="${26 * M + 3}" y="${3 * M + 3}" width="${2.5 * M - 6}" height="${5 * M - 6}" rx="3" class="pk-target"/>`;
        return s;
      },
      start: { x: 1, y: 11.8, th: 0 },
      segs: [{ g: "D", d: 3.6, v: 1.6, n: 0 }, { pause: 1.8, g: "D", n: 1 }, { g: "D", d: 18.57, v: 1.8, n: 2, bl: "L" }, { g: "D", s: -LOCK, th: -90, v: 1.1, n: 3, bl: "L" }, { g: "D", d: 0.97, v: 0.5, n: 3 }, { pause: 2.5, g: "P", n: 4, park: true }],
      over: (si, v, tin) => {
        const up = si === 0 ? 0 : si === 1 ? Math.min(1, tin / 1.2) : 1;
        const len = 62 * (1 - 0.88 * up);
        return `<g transform="translate(${9.1 * M} ${14 * M})"><rect x="-0.6" y="${-len}" width="5" height="${len}" rx="2" fill="#e8ecef" stroke="#d13b2f" stroke-width="1.5" stroke-dasharray="6 6"/><rect x="-3" y="-3" width="10" height="10" rx="2" fill="#5d6670"/></g>` + (si === 1 ? bubble(9.5, 17.8, "билет", "#1f2933") : "");
      },
    },
    {
      id: "dis", t: "За хора с увреждания", ic: "dis",
      lead: "Синьо място със символ и знак Д21 – само за коли с карта за паркиране на хора с увреждания.",
      steps: ["Синя клетка, символ и знак Д21 – мястото е запазено.", "Нямаш карта → не влизаш дори „за минута“.", "Излез и потърси обикновено място.", "Паркирай в свободна клетка.", "Ако караш човек с увреждания – картата се слага видимо зад предното стъкло."],
      law: [["Паркирането на място за хора с увреждания е забранено за всички без карта.", "ЗДвП чл. 98, ал. 2, т. 4"], ["Глоба за паркиране без право.", "ЗДвП чл. 178д"], ["Картата се издава от кмета и важи в цялата страна; важат и картите от ЕС.", "ЗДвП чл. 99а"], ["Мястото е по-широко – 3,6 м, за да се отвори вратата докрай.", "Наредба № 2/2001, прил. 24"]],
      tips: ["Не спирай и пред рампите на тротоара – за колички са.", "Картата е лична – важи само когато човекът е в колата или я ползва.", "Колата може да бъде вдигната от „паяк“."],
      fines: [["Паркиране без право на място за хора с увреждания", 200, "ЗДвП чл. 178д"]],
      scene: () => {
        const bays = [[3.4, 5.9], [5.9, 8.4], [8.4, 10.9], [10.9, 13.4], [13.4, 15.9], [15.9, 19.5], [19.5, 22], [22, 24.5], [24.5, 27], [27, 29.5], [29.5, 32], [32, 34.5], [34.5, 37]];
        let s = lot(bays);
        s += gfill(15.9, 3, 3.6, 5, "blue", "#1d5fb4", 'opacity=".85"');
        s += `<g transform="translate(${17.7 * M} ${5.2 * M})" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><circle cy="-11" r="2.4" fill="#fff" stroke="none"/><path d="M0 -8 V2 H7 L10 9"/><path d="M-4 -2 A8 8 0 1 0 6 9"/></g>`;
        bays.forEach(([a, b], i) => { if (i !== 5 && i !== 9) s += parked((a + b) / 2, 5.55, i % 2 ? 90 : -90, col(i)); });
        [0, 1, 3, 5, 7, 8, 10, 12, 13].forEach((i) => { s += parked(0.5 + i * 2.5 + 1.25, 16.45, i % 2 ? 90 : -90, col(i + 2)); });
        s += sign("D21", 16.4, 0, 2.4);
        return s;
      },
      start: { x: 1, y: 11.8, th: 0 },
      segs: [{ g: "D", d: 12.62, v: 2, n: 0, bl: "L" }, { g: "D", s: -LOCK, th: -60, v: 1, n: 0, bl: "L" }, { pause: 2.2, g: "D", s: -LOCK, n: 1 }, { g: "R", s: -LOCK, th: 0, v: 0.9, n: 2 }, { g: "D", d: 10.55, v: 2, n: 3, bl: "L" }, { g: "D", s: -LOCK, th: -90, v: 1.1, n: 3, bl: "L" }, { g: "D", d: 0.97, v: 0.5, n: 3 }, { pause: 2.5, g: "P", n: 4, park: true }],
      over: (si) => (si === 2 ? bigX(17.7, 12.5) + bubble(17.7, 16.6, `без карта – ${FINE[200]}`, "#d13b2f") : si === 7 ? okMark(28.25, 12) : ""),
    },
    {
      id: "out", t: "Извън населено място", ic: "out",
      lead: "Извън града паркираш само извън платното – на джоб, паркинг или банкет.",
      steps: ["Мигач надясно отрано – отзад идват бързо.", "Намали още на пътя, но не спирай рязко.", "Излез изцяло от платното – на джоба или паркинга.", "Нощем или в мъгла, ако все пак си на платното – габаритни светлини.", "P и ръчна, двигателят изключен."],
      law: [["Паркирането на платното извън населено място е забранено – само извън него.", "ЗДвП чл. 94, ал. 2"], ["Престой – също извън платното; ако е невъзможно, най-вдясно и успоредно.", "ЗДвП чл. 94, ал. 1"], ["Спряна на платното кола през нощта или при намалена видимост – с габаритни светлини.", "ЗДвП чл. 73"], ["На магистрала – само на обозначените места.", "ЗДвП чл. 58, т. 1"], ["Забранено: в тунел, на мост, в стеснение и при ограничена видимост.", "ЗДвП чл. 98, ал. 1, т. 3"]],
      tips: ["Не спирай върху суха трева – горещият ауспух може да я запали.", "Слизаш откъм банкета, не към движението.", "На завой или зад хълм не спирай – не те виждат навреме."],
      fines: [["Неправилно паркиране на платното", 50, "ЗДвП чл. 183, ал. 2, т. 1"]],
      scene: () => {
        let s = rect(0, 0, 40, 24, "r-grass") + rect(0, 6, 40, 7, "r-road") + dashes(9.5, 0, 40) + paint(0, 6.3, 40, 6.3, 0.15) + paint(0, 12.7, 12, 12.7, 0.15) + paint(34.5, 12.7, 40, 12.7, 0.15);
        s += gfill(0, 13, 40, 1.2, "gravel", "url(#pk-gravel)");
        s += gpoly([[11, 13], [17, 14.2], [17, 17.4], [31, 17.4], [31, 14.2], [36, 13]], "r-road");
        for (let x = 1; x < 40; x += 6) s += tree(x + 1, 2.6, 1.4);
        s += parked(30, 7.9, 180, col(3)) + parked(7, 11.15, 0, col(6));
        s += sign("D19", 31.6, 18, 2.4);
        return s;
      },
      start: { x: 1, y: 11.15, th: 0 },
      segs: [{ g: "D", d: 11.23, v: 3.2, n: 0, bl: "R" }, { g: "D", s: 20, th: 25, v: 1.6, n: 1, bl: "R" }, { g: "D", d: 7.3, v: 1.4, n: 2, bl: "R" }, { g: "D", s: -20, th: 0, v: 1, n: 2 }, { pause: 2.2, g: "D", n: 3, park: true }, { pause: 2.2, g: "P", n: 4, park: true }],
      over: (si) => (si === 4 ? bubble(26, 20.4, "нощем на платното → габарити", "#1f2933") : si === 5 ? okMark(26, 20.4) : ""),
    },
    {
      id: "bad", t: "Забранени места", ic: "bad",
      lead: "Втори ред, пред гараж, до пешеходна пътека. Аварийните светлини не правят спирането законно.",
      steps: ["Няма място – не спирай до паркираните коли в лентата (втори ред).", "Аварийните не помагат – пак е нарушение и пречиш.", "Не спирай пред гараж или вход, когато пречиш.", "На пешеходна пътека и на по-малко от 5 м преди нея – забранено.", "Карай нататък и потърси разрешено място."],
      law: [["До спряла кола откъм движението – забранени и престой, и паркиране.", "ЗДвП чл. 98, ал. 1, т. 2"], ["На пешеходна пътека и на по-малко от 5 м преди нея; на кръстовище и на по-малко от 5 м от него.", "ЗДвП чл. 98, ал. 1, т. 5–6"], ["Пред входове на гаражи и сгради, когато пречиш; пред училища и детски градини; на спирка; на място за такси.", "ЗДвП чл. 98, ал. 2, т. 1–3, 6, 7"], ["„Паяк“ – при знак за принудително преместване или ако пречиш.", "ЗДвП чл. 171, т. 5, б. „б“"]],
      tips: ["„Само за минута“ на втори ред спира целия поток зад теб.", "Ако трябва само някой да слезе – намери място, където е разрешен престой."],
      fines: [["Втори ред в активна лента", 100, "ЗДвП чл. 183, ал. 4, т. 9"], ["На пешеходна пътека, спирка или кръстовище", 100, "ЗДвП чл. 183, ал. 4, т. 8"], ["На място за такси", 100, "ЗДвП чл. 183, ал. 4, т. 13"], ["Друго неправилно паркиране", 50, "ЗДвП чл. 183, ал. 2, т. 1"]],
      scene: () => {
        let s = street();
        s += rect(4, 20, 3, 4, "pk-drive") + gfill(4, 17.8, 3, 2.1, "hatch", "url(#pk-hatch)") + `<g class="pk-tag">${text(5.5, 23, "гараж")}</g>`;
        for (let y = 8.4; y < 20; y += 1.6) s += rect(31, y, 3, 0.9, "r-paint");
        s += gfill(26, 17.8, 5, 2.1, "hatch", "url(#pk-hatch)") + dim(26, 21.5, 31, 21.5, "5 м");
        s += parked(10.4, 19, 0, col(1)) + parked(15.6, 19, 0, col(2)) + parked(20.8, 19, 0, col(4)) + parked(37.5, 19, 0, col(0));
        return s;
      },
      start: { x: 1, y: 16.7, th: 0 },
      segs: [{ g: "D", d: 13.5, v: 2.2, n: 0 }, { pause: 2.6, g: "P", n: 1, bl: "H" }, { pause: 1.6, g: "D", n: 2 }, { g: "D", d: 10, v: 1.5, n: 3 }, { g: "D", d: 18, v: 3, n: 4 }],
      over: (si) => (si === 1 ? bigX(16.4, 12.4) + bubble(16.4, 9.2, `втори ред – ${FINE[100]}`, "#d13b2f") : si === 2 ? bigX(5.5, 16.2) : si === 3 ? bigX(28.5, 16) : ""),
    },
  ];

  // icons for the picker (24×24, stroked)
  const IC = {
    par: '<rect x="2" y="15" width="7" height="5" rx="1.5"/><rect x="15" y="15" width="7" height="5" rx="1.5"/><path d="M2 21.5h20"/><path d="M12 4v8m0 0l-3-3m3 3l3-3"/>',
    perp: '<path d="M4 3v10M10 3v10M16 3v10M22 3v10"/><rect x="11.5" y="5" width="3" height="6" rx="1"/><path d="M3 18h18"/>',
    angle: '<path d="M3 20l5-9M9 20l5-9M15 20l5-9"/><path d="M3 6h18"/>',
    walk: '<path d="M2 14h20"/><rect x="5" y="15.5" width="11" height="5" rx="1.5"/><circle cx="19.5" cy="6" r="1.6"/><path d="M19.5 8v4"/>',
    slope: '<path d="M2 20L22 8"/><rect x="8" y="9" width="8" height="4.5" rx="1.2" transform="rotate(-31 12 11)"/>',
    zone: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    garage: '<path d="M3 21V9l9-6 9 6v12"/><path d="M7 21v-8h10v8M7 17h10"/>',
    dis: '<circle cx="11" cy="4.5" r="1.6"/><path d="M11 7v6h5l2 5"/><path d="M8 10a6 6 0 1 0 7 8"/>',
    out: '<path d="M4 21L9 3M20 21L15 3M12 6v2M12 11v2M12 16v2"/>',
    bad: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
  const wheelSVG = `<svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="16" fill="none" stroke="currentColor" stroke-width="4"/><circle r="4.5" fill="currentColor"/><path d="M-15 1 H-4 M4 1 H15 M0 5 V15" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cy="-16" r="2.6" fill="#ff9f0a"/></svg>`;

  const EVERY = [["Включи P и дръпни ръчната.", "ЗДвП чл. 96"], ["Изключи двигателя – иначе глоба " + FINE[100] + ".", "ЗДвП чл. 181, т. 5"], ["Преди да отвориш вратата – огледало и поглед назад.", "ЗДвП чл. 95, ал. 1"], ["Децата до 12 г. слизат откъм тротоара или банкета.", "ЗДвП чл. 95, ал. 2"], ["При излизане от паркиране – мигач и пропускаш движещите се.", "ЗДвП чл. 25, ал. 1; чл. 26"], ["В жилищна зона – само на обозначените места.", "ЗДвП чл. 62, т. 3"]];

  // ---------- driver's view (3D, from the driver's seat) ----------
  // colours of the recorded ground in 3D, and the height of raised surfaces
  const C3 = { "r-grass": "#a9c79a", "r-road": "#4a4f57", "r-walk": "#d3d6dc", "r-curb": "#9aa0a8", "r-paint": "#f1f1ec", "pk-drive": "#bfc3c9", gravel: "#c9b99a", blue: "#1d5fb4", hatch: "rgba(209,59,47,.4)" };
  const Z3 = { "r-walk": 0.12, "r-curb": 0.14, "pk-drive": 0.12, hatch: 0.13 };
  const SIGNCOL = { D: "#1d5fb4", V: "#f4f4f4" };
  // local car frame (rear axle origin, x forward, y right, z up) → world
  const toWorld = (f, lx, ly, lz) => { const c = Math.cos(f.th), s = Math.sin(f.th); return [f.x + c * lx - s * ly, f.y + s * lx + c * ly, lz]; };
  function world3d(cam, recs, own) {
    const G = window.BG3D;
    let s = "";
    const items = [];
    const near = (x, y, r) => { const d = cam.depth(x, y, 0.6); return d > -r && d < 60; };
    for (const o of recs) {
      if (o.k === "rect") {
        if (o.cls === "pk-house" || o.cls === "pk-pillar") {
          const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
          if (near(cx, cy, Math.max(o.w, o.h))) items.push(G.box(cam, { x: cx, y: cy, l: o.w, w: o.h, h: o.cls === "pk-house" ? 5 : 2.7, col: o.cls === "pk-house" ? "#cfc8bb" : "#8d939b" }));
          continue;
        }
        const c = C3[o.cls];
        if (!c) continue;
        const z = Z3[o.cls] || 0;
        s += cam.poly([[o.x, o.y, z], [o.x + o.w, o.y, z], [o.x + o.w, o.y + o.h, z], [o.x, o.y + o.h, z]], `fill="${c}"`);
      } else if (o.k === "poly") {
        s += cam.poly(o.pts.map(([x, y]) => [x, y, 0]), `fill="${C3[o.cls] || "#4a4f57"}"`);
      } else if (o.k === "line") {
        const dx = o.x2 - o.x1, dy = o.y2 - o.y1, l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * o.w / 2, ny = (dx / l) * o.w / 2;
        const z = o.y1 > 17 && o.y1 < 21.7 && o.c === "#5d6670" ? 0.13 : 0.01;
        s += cam.poly([[o.x1 + nx, o.y1 + ny, z], [o.x2 + nx, o.y2 + ny, z], [o.x2 - nx, o.y2 - ny, z], [o.x1 - nx, o.y1 - ny, z]], `fill="${o.c}"`);
      } else if (o.k === "car") {
        if (near(o.cx, o.cy, 4)) items.push(G.car(cam, { x: o.cx, y: o.cy, yaw: o.th, col: o.col, scale: 0.1 }));
      } else if (o.k === "tree") {
        if (!near(o.x, o.y, 3)) continue;
        const trunk = G.box(cam, { x: o.x, y: o.y, l: 0.3, w: 0.3, h: 2, col: "#6b4a33", stroke: "none" });
        items.push({ d: trunk.d, s: trunk.s + cam.ball([o.x, o.y, 2.2 + o.r], o.r + 0.6, "#5a9a52") });
      } else if (o.k === "sign") {
        if (!near(o.x, o.y, 2)) continue;
        const pole = G.box(cam, { x: o.x, y: o.y, l: 0.08, w: 0.08, h: 2.2, col: "#9aa1a9", stroke: "none" });
        const c = SIGNCOL[o.code[0]] || "#f4f4f4";
        const panel = G.box(cam, { x: o.x, y: o.y, z0: 2, l: 0.06, w: 0.7, h: 0.7, yaw: 0, col: c, faces: { front: c, back: c } });
        items.push({ d: pole.d, s: pole.s + panel.s });
      }
    }
    if (own) items.push(G.box(cam, { x: own.cx, y: own.cy, z0: 0.3, l: 4.4, w: 1.8, h: 0.8, yaw: own.th / RAD, col: "#2f6fdc" }));
    return s + G.paint(items);
  }
  const SKY = `<defs><linearGradient id="pk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc6ee"/><stop offset="1" stop-color="#e3eef8"/></linearGradient></defs>`;
  // a camera at a point of the car, looking along a local yaw (deg, 0 = forward, + = right) and pitch (rad, + = down)
  function carCam(f, lx, ly, lz, yaw, pitch, w, hh, hfov, cy, mirror) {
    const eye = toWorld(f, lx, ly, lz), a = f.th + yaw * RAD;
    const target = [eye[0] + Math.cos(a) * 10, eye[1] + Math.sin(a) * 10, eye[2] - Math.tan(pitch) * 10];
    return window.BG3D.camera({ eye, target, f: w / 2 / Math.tan(hfov * RAD), cx: w / 2, cy, near: 0.05, mirror });
  }
  // a small picture (mirror or screen) at (x, y) with rounded corners
  function inset(id, x, y, w, hh, r, inner, frame = "#16181b", glow = "") {
    return `<g transform="translate(${x} ${y})"><defs><clipPath id="${id}"><rect width="${w}" height="${hh}" rx="${r}"/></clipPath></defs><g clip-path="url(#${id})"><svg width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" overflow="hidden">${inner}</svg></g>${glow ? `<rect x="-3" y="-3" width="${w + 6}" height="${hh + 6}" rx="${r + 3}" fill="none" stroke="${glow}" stroke-width="4" class="pk-glow"/>` : ""}<rect width="${w}" height="${hh}" rx="${r}" fill="none" stroke="${frame}" stroke-width="5"/></g>`;
  }
  const ownOf = (f) => ({ cx: f.x + 1.25 * Math.cos(f.th), cy: f.y + 1.25 * Math.sin(f.th), th: f.th });
  function sideMirror(f, recs, key, w, hh, rev) {
    const sgn = key === "L" ? -1 : 1;
    // in reverse the right mirror tips down to show the kerb – many cars do this on their own
    const cam = carCam(f, 2.05, sgn * 1.02, 1.0, sgn * 166, key === "R" && rev ? 0.2 : 0.05, w, hh, 21, hh * 0.42, true);
    return `<rect width="${w}" height="${hh}" fill="url(#pk-sky)"/>` + world3d(cam, recs, ownOf(f));
  }
  function innerMirror(f, recs, w, hh) {
    const cam = carCam(f, 1.6, 0, 1.25, 180, 0.04, w, hh, 24, hh * 0.45, true);
    return `<rect width="${w}" height="${hh}" fill="url(#pk-sky)"/>` + world3d(cam, recs, null) +
      `<path d="M0 0 H${w} V${hh} H0 Z M${w * 0.16} ${hh * 0.18} H${w * 0.84} L${w * 0.88} ${hh * 0.86} H${w * 0.12} Z" fill="#30353c" fill-rule="evenodd"/><rect x="${w * 0.22}" y="${hh * 0.68}" width="${w * 0.16}" height="${hh * 0.32}" rx="5" fill="#3d434b"/><rect x="${w * 0.62}" y="${hh * 0.68}" width="${w * 0.16}" height="${hh * 0.32}" rx="5" fill="#3d434b"/>`;
  }
  // reversing camera with distance lines and the path the rear corners will take with this steering
  function rearCam(f, recs, w, hh) {
    const cam = carCam(f, -0.95, 0, 0.95, 180, 0.62, w, hh, 62, hh * 0.32, true);
    let s = `<rect width="${w}" height="${hh}" fill="url(#pk-sky)"/>` + world3d(cam, recs, null);
    const k = Math.tan(f.steer * RAD) / L;
    for (const side of [-0.9, 0.9]) {
      let x = f.x, y = f.y, th = f.th;
      const pts = [];
      for (let d = 0; d <= 3; d += 0.15) {
        const c = Math.cos(th), sn = Math.sin(th);
        pts.push([x + c * -0.95 - sn * side, y + sn * -0.95 + c * side, 0.02]);
        x -= c * 0.15; y -= sn * 0.15; th -= 0.15 * k;
      }
      s += cam.line(pts, `stroke="#ffd60a" stroke-width="2.4"`);
    }
    [[0.5, "#ff3b30"], [1, "#ffd60a"], [2, "#34c759"]].forEach(([d, c]) => {
      const a = toWorld(f, -0.95 - d, -0.9, 0.02), b = toWorld(f, -0.95 - d, 0.9, 0.02);
      s += cam.line([a, b], `stroke="${c}" stroke-width="2.2"`);
    });
    s += `<path d="M0 ${hh} Q${w / 2} ${hh - 16} ${w} ${hh} Z" fill="#2f6fdc"/>`;
    return s;
  }
  function wheelArt(cx, cy, rx, ry, ang) {
    // hands slide round the rim when the wheel turns a lot (hand over hand), so they stay near "10 and 2"
    const hand = (base) => { const a = ((((ang + base + 45) % 90) + 90) % 90) - 45 + (base < 0 ? -55 : 55); const r = a * RAD; return `<g transform="translate(${f1(cx + Math.sin(r) * rx)} ${f1(cy - Math.cos(r) * ry)}) rotate(${f1(a)})"><rect x="-13" y="-9" width="26" height="22" rx="10" fill="#f3c7a1" stroke="#c99b78" stroke-width="1.5"/><rect x="-11" y="10" width="22" height="30" rx="6" fill="#3a5a8c"/></g>`; };
    return `<g transform="rotate(${f1(ang)} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#16181b" stroke-width="${rx * 0.15}"/><path d="M${cx - rx} ${cy} H${cx + rx} M${cx} ${cy} V${cy + ry}" stroke="#16181b" stroke-width="${rx * 0.13}"/><circle cx="${cx}" cy="${cy}" r="${rx * 0.26}" fill="#16181b"/><circle cx="${cx}" cy="${cy - ry}" r="${rx * 0.06}" fill="#ff9f0a"/></g>` + hand(-1) + hand(1);
  }
  function pedals(x, y, f) {
    const gas = f.g !== "R" && f.v > 1.4, brake = !gas;
    const hard = f.v === 0 || f.v === undefined;
    const pedal = (px, w, on, lbl) => `<g transform="translate(${px} 0)"><rect width="${w}" height="34" rx="5" fill="${on ? "#ff9f0a" : "#4b5159"}" ${on ? `transform="translate(0 4)"` : ""}/><text x="${w / 2}" y="48" font-size="9" font-weight="700" fill="#fff" text-anchor="middle">${lbl}</text></g>`;
    return `<g transform="translate(${x} ${y})"><rect x="-6" y="-6" width="86" height="62" rx="10" fill="rgba(0,0,0,.55)"/>${pedal(0, 42, brake, hard ? "спирачка" : "леко")}${pedal(52, 22, gas, "газ")}</g>`;
  }
  function gearBox(x, y, g) {
    return `<g transform="translate(${x} ${y})"><rect width="30" height="78" rx="8" fill="rgba(0,0,0,.55)"/>${["P", "R", "N", "D"].map((k, i) => `<text x="15" y="${15 + i * 17}" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="${k === g ? "#ff9f0a" : "#8b9199"}">${k}</text>`).join("")}</g>`;
  }
  const pill = (x, y, t, bg = "rgba(0,0,0,.66)") => { const w = t.length * 6.3 + 20; return `<g><rect x="${x - w / 2}" y="${y - 11}" width="${w}" height="22" rx="11" fill="${bg}"/><text x="${x}" y="${y + 0.5}" font-size="11.5" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${t}</text></g>`; };

  // the whole cabin picture for one frame; head = how far the driver has turned (deg, + = right)
  function cabinSVG(f, recs, head, side, steerShown) {
    const W = 520, H = 300, back = Math.abs(head) > 90;
    const cam = carCam(f, 1.05, -0.38, 1.2, head, back ? 0.16 : 0.07, W, H, 52, back ? 120 : 112, false);
    let s = SKY + `<rect width="${W}" height="${H}" fill="url(#pk-sky)"/>` + world3d(cam, recs, null);
    const blinkOn = f.bl && Math.floor(performance.now() / 380) % 2 === 0;
    if (!back) {
      s += `<path d="M0 0 H${W} V24 Q${W / 2} 8 0 24 Z" fill="#2b2f36"/><path d="M0 0 H64 L16 212 H0 Z" fill="#23272d"/><path d="M${W} 0 H${W - 64} L${W - 16} 212 H${W} Z" fill="#23272d"/>`;
      s += `<path d="M40 214 Q${W / 2} 186 ${W - 40} 214 Z" fill="#2f6fdc"/><path d="M0 214 Q${W / 2} 194 ${W} 214 V${H} H0 Z" fill="#2b2f36"/><path d="M0 214 Q${W / 2} 194 ${W} 214" fill="none" stroke="#3a3f46" stroke-width="4"/>`;
      s += `<ellipse cx="${W / 2}" cy="246" rx="70" ry="22" fill="#1f2328"/>`;
      if (blinkOn) s += `<path d="M${W / 2 - 52} 246 l-10 -7 v14 z" fill="${f.bl !== "R" ? "#34c759" : "#2f3439"}"/><path d="M${W / 2 + 52} 246 l10 -7 v14 z" fill="${f.bl !== "L" ? "#34c759" : "#2f3439"}"/>`;
      s += wheelArt(W / 2, 318, 104, 76, steerShown * 13);
      const lookL = f.bl === "L" || f.bl === "H", lookR = f.bl === "R" || f.bl === "H";
      s += inset("pk-mL", 6, 150, 112, 68, 16, sideMirror(f, recs, "L", 112, 68, false), "#16181b", lookL && f.g !== "P" ? "#ffd60a" : "");
      s += inset("pk-mR", 422, 158, 92, 58, 14, sideMirror(f, recs, "R", 92, 58, false), "#16181b", lookR && f.g !== "P" ? "#ffd60a" : "");
      s += `<rect x="352" y="0" width="7" height="28" fill="#16181b"/>` + inset("pk-mI", 290, 24, 140, 44, 20, innerMirror(f, recs, 140, 44));
      s += pedals(18, 236, f) + gearBox(476, 220, f.g);
    } else {
      // looking back over the shoulder: rear window, headrests, rear seat
      s += `<path fill-rule="evenodd" d="M0 0 H${W} V${H} H0 Z M84 44 Q${W / 2} 26 ${W - 84} 44 L${W - 52} 192 Q${W / 2} 206 52 192 Z" fill="#2b2f36"/>`;
      s += `<rect x="150" y="164" width="76" height="52" rx="18" fill="#3a3f47"/><rect x="294" y="164" width="76" height="52" rx="18" fill="#3a3f47"/><path d="M0 206 Q${W / 2} 192 ${W} 206 V${H} H0 Z" fill="#3a3f47"/><path d="M${W / 2} 200 V${H}" stroke="#2b2f36" stroke-width="3"/>`;
      s += `<g opacity=".95">${inset("pk-rc", 318, 200, 190, 92, 10, rearCam(f, recs, 190, 92), "#0d0f12")}</g>` + pill(413, 196, "камера");
      s += `<g transform="translate(0 0)"><rect x="8" y="208" width="128" height="86" rx="12" fill="rgba(0,0,0,.55)"/>${wheelArt(72, 262, 44, 32, steerShown * 13)}</g>`;
      s += pedals(146, 236, f) + gearBox(244, 214, f.g);
    }
    const look = f.g === "R" ? `Гледаш назад през ${side > 0 ? "дясното" : "лявото"} рамо` : f.park ? "Паркиран: P, ръчна, двигателят – изключен" : f.v === 0 ? "Спрял – кракът е на спирачката" : f.bl === "R" || f.bl === "L" ? `Напред + ${f.bl === "R" ? "дясното" : "лявото"} огледало` : "Гледаш напред";
    s += pill(back ? W / 2 : 168, back ? 16 : 42, look, f.g === "R" ? "rgba(255,159,10,.92)" : "rgba(0,0,0,.66)");
    return s;
  }

  function parkingTypes(root) {
    let cur = T[0], vr = null, frames = [], t0 = 0, playing = false, raf = 0, shownSteer = 0, lastKey = "";
    const box = h(`<div class="widget pk">
      <div class="widget-head"><h3>Как се паркира – по видове</h3><p>Избери вид паркиране. Колата прави истинската маневра – виж волана, предавката и стъпките.</p></div>
      <div class="pk-pick" role="group" aria-label="Вид паркиране">${T.map((x) => `<button type="button" data-id="${x.id}" aria-pressed="${x === cur}">${icon(x.ic)}<span>${x.t}</span></button>`).join("")}</div>
      <div class="pk-main">
        <div class="pk-stages">
          <div class="pk-bar"><div class="seg pk-mode" role="group" aria-label="Пускане"><button type="button" data-mode="all" aria-pressed="true">Непрекъснато</button><button type="button" data-mode="step" aria-pressed="false">Стъпка по стъпка</button></div>
          <div class="seg pk-view" role="group" aria-label="Изглед"><button type="button" data-view="both" aria-pressed="true">Двете</button><button type="button" data-view="top" aria-pressed="false">Отгоре</button><button type="button" data-view="cab" aria-pressed="false">От шофьорското място</button></div></div>
          <div class="pk-figs">
            <figure class="pk-stage" data-no-play>
              <svg viewBox="0 0 400 240" role="img"></svg>
              <div class="pk-hud" aria-hidden="true"><div class="pk-gear">${["P", "R", "N", "D"].map((g) => `<b data-g="${g}">${g}</b>`).join("")}</div><div class="pk-wheel">${wheelSVG}</div></div>
            </figure>
            <figure class="pk-cab" data-no-play><svg viewBox="0 0 520 300" role="img" aria-label="Изглед от шофьорското място: накъде гледаш, огледалата, воланът, педалите и предавката"></svg><figcaption class="visually-hidden">От шофьорското място</figcaption></figure>
            <div class="pk-ctl"><button type="button" class="pk-play" aria-label="Пусни">▶</button><button type="button" class="pk-again" aria-label="Отначало">↺</button></div>
          </div>
          <div class="pk-stepbar" hidden><button type="button" class="btn small pk-prev">◀ Назад</button><span class="pk-stepno" aria-live="polite"></span><button type="button" class="btn small pk-rep" aria-label="Покажи стъпката пак">↺</button><button type="button" class="btn small pk-next">Напред ▶</button></div>
        </div>
        <div class="pk-side"><p class="pk-lead"></p><div class="pk-vars"></div><ol class="pk-steps"></ol></div>
      </div>
      <div class="pk-cards"></div>
      <details class="pk-every"><summary>Важи за всяко паркиране</summary><ul>${EVERY.map(([t, r]) => `<li>${t} <span class="lawref">${r}</span></li>`).join("")}</ul></details>
    </div>`);
    const svg = box.querySelector(".pk-stage > svg"), stage = box.querySelector(".pk-stage");
    const stepsEl = box.querySelector(".pk-steps"), cards = box.querySelector(".pk-cards"), varsEl = box.querySelector(".pk-vars");
    const playBtn = box.querySelector(".pk-play"), wheel = box.querySelector(".pk-wheel svg");
    const gears = [...box.querySelectorAll(".pk-gear b")];
    let carG, overG, fw, blL, blR, tails, parkG;
    const cabSvg = box.querySelector(".pk-cab svg"), cabFig = box.querySelector(".pk-cab"), figs = box.querySelector(".pk-figs");
    let recs = [], view = "both", head = 0, side = 1, lastCab = 0;
    box.querySelectorAll(".pk-view button").forEach((b) => b.addEventListener("click", () => {
      view = b.dataset.view;
      box.querySelectorAll(".pk-view button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      stage.hidden = view === "cab"; cabFig.hidden = view === "top";
      if (!playing) render(frameAt(Math.min(pos, frames[frames.length - 1].t)), true);
    }));

    function setup() {
      const v = vr;
      const steps = Array.isArray(cur.steps) ? cur.steps : cur.steps[v];
      const segs = cur.segs || cur.segsBy[v];
      frames = simulate(cur.start, segs);
      svg.setAttribute("aria-label", `${cur.t}: ${steps.join(" ")}`);
      REC = [];
      const sceneSVG = cur.scene(v);
      recs = REC; REC = null;
      const firstR = segs.find((x) => x.g === "R" && x.s);
      // the driver looks back over the shoulder on the side the car is parking to
      side = firstR ? (firstR.bl ? (firstR.bl === "L" ? -1 : 1) : Math.sign(firstR.s)) : 1;
      svg.innerHTML = DEFS + sceneSVG + `<g class="pk-car">${carBody("#2f6fdc", true)}</g><g class="pk-over"></g>`;
      carG = svg.querySelector(".pk-car"); overG = svg.querySelector(".pk-over");
      fw = [...svg.querySelectorAll(".pk-fw")]; blL = svg.querySelector(".pk-bl-L"); blR = svg.querySelector(".pk-bl-R");
      tails = [...svg.querySelectorAll(".pk-car .pk-tail")]; parkG = svg.querySelector(".pk-park");
      box.querySelector(".pk-lead").textContent = cur.lead;
      varsEl.innerHTML = "";
      if (cur.vars) {
        const seg = h(`<div class="seg" role="group" aria-label="Вариант">${cur.vars.map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${k === v}">${t}</button>`).join("")}</div>`);
        seg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { vr = b.dataset.v; setup(); start(); }));
        varsEl.appendChild(seg);
      }
      stepsEl.innerHTML = steps.map((s, i) => `<li data-n="${i}"><span>${i + 1}</span><p>${s}</p></li>`).join("");
      const tips = cur.tips || cur.tipsBy[v];
      const fines = cur.fines.map(([t, a, r]) => `<li><b>${FINE[a] || a}</b><span>${t}</span><span class="lawref">${r}</span></li>`).join("");
      cards.innerHTML = `<section class="pk-card law"><h5>Законът</h5><ul>${cur.law.map(([t, r]) => `<li>${t} <span class="lawref">${r}</span></li>`).join("")}</ul></section>
        <section class="pk-card tip"><h5>Добра практика</h5><ul>${tips.map((t) => `<li>${t}</li>`).join("")}</ul></section>
        <section class="pk-card fine"><h5>Ако сгрешиш</h5><ul class="pk-fines">${fines}</ul></section>`;
      // time range of each step on the timeline (a step that is only advice has no frames)
      ranges = [];
      frames.forEach((f) => { const n = f.n || 0; if (!ranges[n]) ranges[n] = [f.t, f.t]; ranges[n][1] = f.t; });
      stepsEl.querySelectorAll("li").forEach((li) => li.addEventListener("click", () => { setMode("step"); playStep(+li.dataset.n); }));
      lastKey = ""; pos = 0; stopAt = null;
      render(reduceMotion() ? frames[frames.length - 1] : frames[0], true);
    }

    function frameAt(t) {
      let lo = 0, hi = frames.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (frames[m].t <= t) lo = m; else hi = m - 1; }
      return frames[lo];
    }
    // on a narrow screen the camera shows a 24 m square and follows the car
    const VIEW = 240;
    let camX = 0;
    function camera(f, snap) {
      if ((stage.clientWidth || window.innerWidth) >= 480) { svg.setAttribute("viewBox", "0 0 400 240"); return; }
      const cx = (f.x + 1.25 * Math.cos(f.th)) * M;
      const target = Math.max(0, Math.min(400 - VIEW, cx - VIEW * 0.4));
      camX = snap ? target : camX + (target - camX) * 0.08;
      svg.setAttribute("viewBox", `${f1(camX)} 0 ${VIEW} 240`);
    }
    function render(f, snap) {
      camera(f, snap);
      carG.setAttribute("transform", `translate(${f1(f.x * M)} ${f1(f.y * M)}) rotate(${f1(f.th / RAD)})`);
      shownSteer = snap ? f.steer : shownSteer + (f.steer - shownSteer) * 0.18;
      fw.forEach((w) => w.setAttribute("transform", `${w.getAttribute("transform").replace(/ rotate\([^)]*\)/, "")} rotate(${f1(shownSteer)})`));
      wheel.style.transform = `rotate(${shownSteer * 13}deg)`;
      const on = Math.floor((performance.now() / 380)) % 2 === 0;
      blL.setAttribute("opacity", (f.bl === "L" || f.bl === "H") && on ? 1 : 0);
      blR.setAttribute("opacity", (f.bl === "R" || f.bl === "H") && on ? 1 : 0);
      tails.forEach((x) => x.setAttribute("fill", f.g === "R" ? "#fffbe6" : f.v === 0 || f.v < 0.4 ? "#ff3b30" : "#b3261e"));
      parkG.setAttribute("opacity", cur.id === "out" && f.si === 4 ? 1 : 0);
      gears.forEach((b) => b.classList.toggle("on", b.dataset.g === f.g));
      const segStart = frames.find((x) => x.si === f.si).t;
      const key = `${f.si}|${Math.floor((f.t - segStart) * 6)}`;
      // the cabin is heavier to draw, so ~15 times a second is enough
      const now = performance.now();
      if (!cabFig.hidden && window.BG3D && (snap || now - lastCab > 66)) {
        lastCab = now;
        const target = f.g === "R" ? side * 150 : 0;
        head = snap ? target : head + (target - head) * 0.28;
        cabSvg.innerHTML = cabinSVG(f, recs, head, side, shownSteer);
      }
      if (key !== lastKey) {
        lastKey = key;
        overG.innerHTML = cur.over ? cur.over(f.si, vr, f.t - segStart) : "";
        stepsEl.querySelectorAll("li").forEach((li) => li.classList.toggle("on", +li.dataset.n === f.n));
      }
    }
    let pos = 0; // seconds into the timeline
    function tick(now) {
      const end = frames[frames.length - 1].t;
      pos = (now - t0) / 1000;
      // step by step: stop at the end of the current step
      if (stopAt !== null && pos >= stopAt) { pos = stopAt; render(frameAt(pos)); stop(); return; }
      if (pos > end + 1.2) { t0 = now; pos = 0; }
      render(frameAt(Math.min(pos, end)));
      if (playing) raf = requestAnimationFrame(tick);
    }
    function play(from) {
      playing = true; playBtn.textContent = "⏸"; playBtn.setAttribute("aria-label", "Пауза");
      cancelAnimationFrame(raf); t0 = performance.now() - from * 1000; raf = requestAnimationFrame(tick);
    }
    function stop() { playing = false; cancelAnimationFrame(raf); playBtn.textContent = "▶"; playBtn.setAttribute("aria-label", "Пусни"); }
    // with reduced motion the final position is shown and nothing moves until ▶ is pressed
    function start() { if (stepMode) playStep(0); else if (reduceMotion()) stop(); else { stopAt = null; play(0); } }
    // ---- step by step ----
    let stepMode = false, curStep = 0, stopAt = null, ranges = [];
    const stepBar = box.querySelector(".pk-stepbar"), stepNo = box.querySelector(".pk-stepno"), ctl = box.querySelector(".pk-ctl");
    function stepCount() { return stepsEl.querySelectorAll("li").length; }
    function playStep(n) {
      const total = stepCount();
      curStep = Math.max(0, Math.min(total - 1, n));
      stepNo.textContent = `Стъпка ${curStep + 1} от ${total}`;
      box.querySelector(".pk-prev").disabled = curStep === 0;
      box.querySelector(".pk-next").disabled = curStep === total - 1;
      const r = ranges[curStep];
      if (!r) {
        // advice only – show where the car ended up
        stop(); stopAt = null; pos = frames[frames.length - 1].t;
        render(frames[frames.length - 1], true); lastKey = "";
        stepsEl.querySelectorAll("li").forEach((li) => li.classList.toggle("on", +li.dataset.n === curStep));
        return;
      }
      stopAt = r[1];
      render(frameAt(r[0]), true);
      if (reduceMotion()) { stop(); pos = r[1]; render(frameAt(r[1]), true); return; }
      play(r[0]);
    }
    function setMode(m) {
      stepMode = m === "step";
      box.querySelectorAll(".pk-mode button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mode === m)));
      stepBar.hidden = !stepMode; ctl.hidden = stepMode;
    }
    box.querySelectorAll(".pk-mode button").forEach((b) => b.addEventListener("click", () => {
      setMode(b.dataset.mode);
      if (stepMode) playStep(0); else { stopAt = null; play(0); }
    }));
    box.querySelector(".pk-prev").addEventListener("click", () => playStep(curStep - 1));
    box.querySelector(".pk-next").addEventListener("click", () => playStep(curStep + 1));
    box.querySelector(".pk-rep").addEventListener("click", () => playStep(curStep));
    playBtn.addEventListener("click", () => (playing ? stop() : play(pos > frames[frames.length - 1].t ? 0 : pos)));
    box.querySelector(".pk-again").addEventListener("click", () => { stopAt = null; play(0); });
    box.querySelectorAll(".pk-pick button").forEach((b) => b.addEventListener("click", () => {
      cur = T.find((x) => x.id === b.dataset.id); vr = cur.vars ? cur.vars[0][0] : null;
      box.querySelectorAll(".pk-pick button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      setup(); start();
    }));
    window.addEventListener("resize", () => { if (!playing) render(frameAt(Math.min(pos, frames[frames.length - 1].t)), true); });
    // pause while off screen
    if ("IntersectionObserver" in window) {
      let resume = false;
      new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting && playing) { resume = true; stop(); }
        else if (e.isIntersecting && resume) { resume = false; play(pos); }
      })).observe(figs);
    }
    root.appendChild(h(`<h2 class="section-title">Видове паркиране</h2>`));
    root.appendChild(box);
    setup();
    start();
  }

  window.BGParking = parkingTypes;
})();
