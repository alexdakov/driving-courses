/* Everyday road situations for drivers who already have a licence (cat. B).
   Each scenario: a short question, 2–4 plain-language steps, a legal reference and an animated SVG.
   Law: ЗДвП with the amendments up to ДВ бр. 64/2025 (in force 7.09.2025). "Добра практика" = advice, not law.
   Scenes are drawn with the shared kit window.BGDraw (js/illustrations.js) on a 360×220 canvas.
   Animations are SMIL only; every scene shares one duration so the parts stay in sync, and the frame at
   t = 0 is a meaningful still picture (the site keeps SVGs paused until the user presses play). */
(function () {
  const D = window.BGDraw;
  const CW = 360, CH = 220;

  // ---------- small helpers (all lazy: they read D only when a scene is drawn) ----------
  const out = (body, aria) => D.svg(body, aria, CW, CH);
  const bg = (col) => `<rect width="${CW}" height="${CH}" fill="${col}"/>`;
  const rect = (x, y, w, h, col, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${col}"${extra}/>`;
  const fx = (n) => +n.toFixed(2);

  // a path you can drive along: straight lines, cubic curves, "turn via a corner" and circular arcs.
  // Keeps the cumulative length at every node, so stops can be timed exactly (keyPoints).
  const route = (x, y) => {
    let cx = x, cy = y, len = 0, d = `M${fx(x)} ${fx(y)}`;
    const nodes = [0];
    const api = {
      L(x1, y1) { len += Math.hypot(x1 - cx, y1 - cy); d += ` L${fx(x1)} ${fx(y1)}`; cx = x1; cy = y1; nodes.push(len); return api; },
      C(x1, y1, x2, y2, x3, y3) {
        let px = cx, py = cy;
        for (let i = 1; i <= 48; i++) {
          const t = i / 48, m = 1 - t;
          const qx = m * m * m * cx + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x3;
          const qy = m * m * m * cy + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y3;
          len += Math.hypot(qx - px, qy - py); px = qx; py = qy;
        }
        d += ` C${fx(x1)} ${fx(y1)} ${fx(x2)} ${fx(y2)} ${fx(x3)} ${fx(y3)}`;
        cx = x3; cy = y3; nodes.push(len); return api;
      },
      // smooth turn to (x, y); (kx, ky) is where the two straight directions would meet
      T(x, y, kx, ky, k = 0.55) { return api.C(cx + (kx - cx) * k, cy + (ky - cy) * k, x + (kx - x) * k, y + (ky - y) * k, x, y); },
      // circular arc around (ox, oy) from the current point to angle a1 (degrees, screen coordinates);
      // ccw = visually counter-clockwise (the way traffic flows in a roundabout)
      A(ox, oy, r, a1, ccw = true) {
        const a0 = (Math.atan2(cy - oy, cx - ox) * 180) / Math.PI;
        let da = a1 - a0;
        if (ccw) { while (da >= 0) da -= 360; while (da < -360) da += 360; } else { while (da <= 0) da += 360; while (da > 360) da -= 360; }
        const ex = ox + r * Math.cos((a1 * Math.PI) / 180), ey = oy + r * Math.sin((a1 * Math.PI) / 180);
        d += ` A${r} ${r} 0 ${Math.abs(da) > 180 ? 1 : 0} ${da > 0 ? 1 : 0} ${fx(ex)} ${fx(ey)}`;
        len += (Math.abs(da) * Math.PI * r) / 180; cx = ex; cy = ey; nodes.push(len); return api;
      },
      d: () => d,
      len: () => len,
      n: (i) => nodes[i],
    };
    return api;
  };
  // white letter badge that stays upright
  const badge = (s) => `<circle r="9" fill="#fff" stroke="${D.C.ink}" stroke-width="1.4"/><text y="0.5" font-size="${s.length > 1 ? 9.5 : 11}" font-weight="800" fill="${D.C.ink}" text-anchor="middle" dominant-baseline="central">${s}</text>`;
  // move `inner` (drawn at the origin, front along +x) along a route; sched = [[time 0..1, distance], ...]
  const drive = (rt, sched, dur, inner, o = {}) => {
    const L = rt.len();
    const kt = sched.map((s) => s[0]).join(";");
    const kp = sched.map((s) => Math.min(1, Math.max(0, s[1] / L)).toFixed(4)).join(";");
    const am = (rot) => `<animateMotion path="${rt.d()}" dur="${dur}s" repeatCount="indefinite"${rot ? ` rotate="${rot}"` : ""} keyPoints="${kp}" keyTimes="${kt}" calcMode="linear"/>`;
    let s = `<g>${am(o.rot || "auto")}${inner}</g>`;
    if (o.badge) s += `<g>${am("")}${badge(o.badge)}</g>`;
    return s;
  };
  // translate a group: values "x y;x y", keyTimes "0;..;1"
  const mv = (values, kt, dur, inner) => `<g>${D.loop(values, dur, `keyTimes="${kt}"`)}${inner}</g>`;
  const fade = (values, kt, dur) => `<animate attributeName="opacity" values="${values}" keyTimes="${kt}" dur="${dur}s" repeatCount="indefinite"/>`;
  const blink = (cx, cy, r = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${D.C.amber}"><animate attributeName="opacity" values="1;1;0;0" dur="0.9s" repeatCount="indefinite"/></circle>`;
  // car with all four indicators blinking (hazard lights)
  const hazCar = (x, y, a, col, L = 46, Wd = 22) =>
    `<g transform="translate(${x} ${y}) rotate(${a})">${D.car(0, 0, 0, col, L, Wd)}${blink(L / 2 - 4, Wd / 2 + 1)}${blink(L / 2 - 4, -Wd / 2 - 1)}${blink(-L / 2 + 4, Wd / 2 + 1)}${blink(-L / 2 + 4, -Wd / 2 - 1)}</g>`;
  // traffic light; state: r | y | g | fy (flashing yellow)
  const light = (x, y, state) => {
    const off = "#3a3f45";
    const lamp = (cy, col, on, flash) =>
      `<circle cx="${x + 8}" cy="${cy}" r="5.2" fill="${on ? col : off}">${flash ? `<animate attributeName="fill" values="${col};${col};${off};${off}" dur="1.2s" repeatCount="indefinite"/>` : ""}</circle>`;
    return `<rect x="${x + 6.5}" y="${y + 38}" width="3" height="10" fill="#6c737c"/><rect x="${x}" y="${y}" width="16" height="40" rx="4" fill="#15181b"/>` +
      lamp(y + 8, "#ff3b30", state === "r") + lamp(y + 20, "#ffb800", state === "y" || state === "fy", state === "fy") + lamp(y + 32, "#22d36b", state === "g");
  };
  const tree = (x, y, r = 12, col = "#7fae6a") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.55}" fill="#fff" opacity=".12"/>`;
  const houses = (y, h) => {
    let s = rect(0, y, CW, h, D.C.bld);
    for (let x = 14; x < CW; x += 58) s += `<rect x="${x}" y="${y + h * 0.22}" width="30" height="${h * 0.5}" rx="3" fill="#aebccb"/>`;
    return s;
  };
  const hRoad = (y, h, col) => rect(0, y, CW, h, col || D.C.road);
  const edgeH = (y, x0 = 0, x1 = CW) => rect(x0, y - 1, x1 - x0, 2, "#fff", ' opacity=".85"');
  // zebra across a vertical road (vertical stripes)
  const vzebra = (x, y, w, h, n = 6) => {
    let s = "";
    const step = w / n;
    for (let i = 0; i < n; i++) s += rect(fx(x + i * step + step * 0.18), y, fx(step * 0.64), h, D.C.paint);
    return s;
  };
  // top-down cyclist, front along +x
  const cyclist = (x, y, a = 0, shirt = D.C.green) => `<g transform="translate(${x} ${y}) rotate(${a})">
    <rect x="-16" y="-1.6" width="11" height="3.2" rx="1.6" fill="${D.C.ink}"/><rect x="6" y="-1.6" width="11" height="3.2" rx="1.6" fill="${D.C.ink}"/><rect x="-6" y="-1" width="13" height="2" fill="#6c737c"/>
    <path d="M9 -7 V7" stroke="${D.C.ink}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M-1 -6 L9 -6 M-1 6 L9 6" stroke="${shirt}" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="-3" cy="0" rx="5.5" ry="8" fill="${shirt}"/><circle cx="-0.5" cy="0" r="4.4" fill="${D.C.orange}" stroke="rgba(0,0,0,.25)"/></g>`;
  // top-down bus / van, front along +x
  const bus = (x, y, a, col, L = 104, Wd = 30, txt = "") => `<g transform="translate(${x} ${y}) rotate(${a})">
    <rect x="${-L / 2}" y="${-Wd / 2}" width="${L}" height="${Wd}" rx="5" fill="${col}" stroke="rgba(0,0,0,.3)"/>
    <rect x="${L / 2 - 9}" y="${-Wd / 2 + 3}" width="6" height="${Wd - 6}" rx="2" fill="${D.C.glass}"/>
    <rect x="${-L / 2 + 6}" y="${-Wd / 2 + 5}" width="${L - 20}" height="${Wd - 10}" rx="3" fill="rgba(255,255,255,.22)"/>
    ${txt ? `<g transform="rotate(${-a})">${D.T(0, 0.5, txt, 10, { w: 800 })}</g>` : ""}</g>`;
  const amb = (x, y, a = 0) => D.car(x, y, a, "#fff", 54, 24, { siren: true });
  // side-view deer, feet at (x, y), facing right
  const deer = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#b97a3f" stroke="#b97a3f">
    <path d="M-13 -20 L-14 0 M-7 -20 L-6 0 M9 -20 L8 0 M14 -20 L15 0" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <ellipse cx="0" cy="-26" rx="19" ry="9" stroke="none"/><path d="M12 -30 L19 -46 L24 -44 L18 -27 Z" stroke="none"/>
    <ellipse cx="24" cy="-48" rx="7" ry="4.2" stroke="none"/><path d="M-19 -29 L-23 -33" stroke-width="3" stroke-linecap="round"/>
    <path d="M20 -51 L17 -62 M17 -58 L12 -63 M23 -51 L26 -62 M25 -58 L31 -62" stroke="#5b3a1e" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="27" cy="-49" r="1.2" fill="#1f2933" stroke="none"/></g>`;
  // walker with one hand raised (pedestrian signalling)
  const walkerHand = (x, y, s, shirt) => `<g>${D.walker(x, y, s, shirt)}<path d="M${x} ${y - 40 * s} L${x + 9 * s} ${y - 60 * s}" stroke="${D.C.skin}" stroke-width="${4 * s}" stroke-linecap="round"/></g>`;
  // standard crossroads: horizontal road y=hy..hy+hh, vertical road x=vx..vx+vw
  const cross = (o = {}) => {
    const C = D.C, hy = o.hy ?? 80, hh = o.hh ?? 70, vx = o.vx ?? 150, vw = o.vw ?? 70;
    let s = bg(o.ground || C.grass);
    s += rect(0, hy, CW, hh, C.road) + rect(vx, 0, vw, CH, C.road);
    s += D.dashes(hy + hh / 2, 0, vx - 6) + D.dashes(hy + hh / 2, vx + vw + 6, CW);
    s += D.vdashes(vx + vw / 2, 0, hy - 6) + D.vdashes(vx + vw / 2, hy + hh + 6, CH);
    return s;
  };
  const stopV = (x, y0, y1) => rect(x - 2.5, y0, 5, y1 - y0, "#fff"); // stop line across a horizontal lane
  const stopH = (y, x0, x1) => rect(x0, y - 2.5, x1 - x0, 5, "#fff"); // stop line across a vertical lane

  // ======================================================================
  const SCENARIOS = [
    // ------------------------------ КРЪСТОВИЩА ------------------------------
    {
      id: "stop-sign",
      cat: "krastovishta",
      title: "Знак „Стоп“ на Т-образно кръстовище",
      q: "Излизаш от второстепенен път със знак Б2, а главният път изглежда почти празен. Какво правиш?",
      steps: [
        "Спираш напълно на стоп-линията – дори пътят да е празен.",
        "Ако няма стоп-линия, спираш на линията, на която е поставен знакът.",
        "Пропускаш всички по главния път и тръгваш, когато е свободно.",
      ],
      ref: "ППЗДвП чл. 46, ал. 2; ЗДвП чл. 50",
      svg: () => {
        const C = D.C, dur = 8;
        let b = bg(C.grass) + tree(24, 34, 13) + tree(330, 30, 12) + tree(40, 160, 12) + tree(320, 175, 14);
        b += rect(0, 50, CW, 70, C.road) + D.dashes(85, 0, CW) + edgeH(54) + edgeH(116, 0, 148) + edgeH(116, 222, CW);
        b += rect(150, 118, 70, 102, C.road) + D.vdashes(185, 134, CH) + stopH(124.5, 186, 220);
        b += D.S("Б2", 228, 132, 32);
        b += mv("0 0;360 0;360 0", "0;.45;1", dur, D.car(60, 102.5, 0, C.orange));
        b += mv("0 0;-400 0;-400 0", "0;.5;1", dur, D.car(330, 67.5, 180, C.purple));
        const r = route(202.5, 190).L(202.5, 151).T(250, 102.5, 202.5, 102.5).L(430, 102.5);
        b += drive(r, [[0, 0], [0.18, r.n(1)], [0.56, r.n(1)], [0.95, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { badge: "Ти" });
        b += `<g opacity="0">${fade("0;0;1;1;0;0", "0;.18;.2;.54;.56;1", dur)}${D.label(110, 150, "пълно спиране", { size: 11, bg: "#ffe1de" })}</g>`;
        b += D.label(180, 22, "Б2: спираш напълно, дори пътят да е празен", { size: 11 });
        b += D.label(4, 198, "После пропускаш всички", { size: 10.5, a: "start" });
        return out(b, "Знак Стоп: пълно спиране на стоп-линията");
      },
    },
    {
      id: "left-turn-green",
      cat: "krastovishta",
      title: "Завой наляво на зелено",
      q: "Светофарът свети зелено, завиваш наляво, а насреща идват коли. Какво правиш?",
      steps: [
        "Влизаш в кръстовището с ляв мигач и чакаш близо до средата му.",
        "Пропускаш насрещните, които карат направо или завиват надясно.",
        "Завиваш при пролука и пропускаш пешеходците на улицата, в която влизаш.",
        "Ако светне червено, докато чакаш вътре, освобождаваш кръстовището внимателно.",
      ],
      ref: "ЗДвП чл. 37, ал. 1",
      svg: () => {
        const C = D.C, dur = 8;
        let b = cross() + tree(30, 40, 13) + tree(320, 186, 13);
        b += stopH(155, 186, 220) + light(228, 158, "g");
        b += mv("0 0;0 230;0 230", "0;.5;1", dur, D.car(167.5, 60, 90, C.orange, 46, 22, { label: "Б" }));
        const r = route(202.5, 195).L(202.5, 122).T(140, 97.5, 202.5, 97.5).L(-40, 97.5);
        b += drive(r, [[0, 0], [0.25, r.n(1)], [0.58, r.n(1)], [0.95, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkL: true }), { badge: "Ти" });
        b += D.label(8, 20, "Чакаш в кръстовището с ляв мигач", { size: 11, a: "start" });
        b += D.label(4, 194, "Насрещната Б е първа", { size: 10.5, a: "start" });
        return out(b, "Завой наляво на зелено: насрещните минават първи");
      },
    },
    {
      id: "flashing-yellow",
      cat: "krastovishta",
      title: "Мигащ жълт светофар",
      q: "Светофарът мига жълто, а отдясно към кръстовището идва кола. Кой минава пръв?",
      steps: [
        "Мигащото жълто значи „внимание“ – светофарът не решава кой е пръв.",
        "Предимството определят знаците: Б1, Б2, Б3.",
        "Ако няма знаци, пропускаш идващите отдясно.",
      ],
      ref: "ППЗДвП чл. 37; ЗДвП чл. 48, 50",
      svg: () => {
        const C = D.C, dur = 8;
        let b = cross() + tree(30, 186, 12) + tree(330, 30, 13);
        b += light(228, 158, "fy") + light(232, 30, "fy");
        b += mv("0 0;-400 0;-400 0", "0;.45;1", dur, D.car(320, 97.5, 180, C.orange, 46, 22, { label: "Б" }));
        b += mv("0 0;0 -18;0 -18;0 -240;0 -240", "0;.15;.5;.9;1", dur, D.car(202.5, 195, -90, C.blue, 46, 22, { label: "Ти" }));
        b += D.label(8, 20, "Мига жълто → важат знаците", { size: 11, a: "start" });
        b += D.label(4, 194, "Без знаци → пропусни десния", { size: 10, a: "start" });
        return out(b, "Мигащ жълт светофар: важат знаците или правилото на дясното");
      },
    },
    {
      id: "main-road-bends",
      cat: "krastovishta",
      title: "Главният път завива (табела Т13)",
      q: "Караш по главния път, който завива надясно (Б3 с табела Т13), и продължаваш направо. Кой е пръв?",
      steps: [
        "Дебелата линия на Т13 показва накъде продължава главният път.",
        "Колата отдясно също е на главния път – между вас важи правилото на дясното, тя е първа.",
        "Колата от второстепенния път (знак Б1) чака и двама ви.",
      ],
      ref: "ЗДвП чл. 50, ал. 2",
      svg: () => {
        const C = D.C, dur = 10;
        let b = cross() + tree(330, 30, 12) + tree(330, 190, 12) + tree(26, 120, 11);
        b += `<path d="M185 230 V140 Q185 115 210 115 H370" stroke="${C.yellow}" stroke-opacity=".75" stroke-width="9" fill="none" stroke-linecap="round"/>`;
        b += stopH(155, 186, 220) + stopH(75, 150, 184);
        b += D.S("Б3", 226, 154, 30) + D.S("Т13", 226, 186, 30) + D.S("Б1", 118, 40, 28);
        const r = route(318, 97.5).L(230, 97.5).T(167.5, 150, 167.5, 97.5).L(167.5, 270);
        b += drive(r, [[0, 0], [0.4, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.orange, 46, 22, { blinkL: true }), { badge: "Б" });
        b += mv("0 0;0 -18;0 -18;0 -250;0 -250", "0;.12;.42;.72;1", dur, D.car(202.5, 195, -90, C.blue, 46, 22, { label: "Ти" }));
        b += mv("0 0;0 22;0 22;0 240;0 240", "0;.15;.62;.95;1", dur, D.car(167.5, 30, 90, C.purple, 46, 22, { label: "В" }));
        b += D.label(8, 20, "Ред: Б → Ти → В", { size: 11.5, a: "start" });
        b += D.label(4, 198, "Дебелата линия = главен път", { size: 10, a: "start" });
        return out(b, "Главният път променя посоката си – табела Т13");
      },
    },
    {
      id: "regulator",
      cat: "krastovishta",
      title: "Регулировчик срещу светофар",
      q: "Светофарът е зелен, но регулировчикът е с гърди към теб и с ръце встрани. Минаваш ли?",
      steps: [
        "Не. Регулировчикът е над светофара, знаците и маркировката.",
        "Гърди или гръб към теб означава „стоп“.",
        "Минават колите откъм ръцете му – направо и надясно.",
      ],
      ref: "ЗДвП чл. 7, ал. 1; чл. 10",
      svg: () => {
        const C = D.C, dur = 8, uni = "#3e5573";
        let b = cross({ hy: 100, hh: 70, vx: 190, vw: 70 });
        b += stopH(174.5, 226, 260) + light(266, 177, "g");
        // inset: the regulator seen from the front
        b += `<rect x="8" y="8" width="176" height="86" rx="12" fill="#fff" stroke="rgba(0,0,0,.1)"/>`;
        b += `<g>${D.person(48, 88, 1.08, uni, { l: [-32, -42], r: [32, -42] })}<rect x="${48 - 8.6}" y="${88 - 67.5}" width="17.2" height="6" rx="2" fill="#fff" stroke="${uni}"/></g>`;
        b += D.T(138, 30, "Гърди или", 11.5, { w: 700 }) + D.T(138, 45, "гръб към теб", 11.5, { w: 700 }) + D.T(138, 70, "= СТОП", 17, { w: 800, c: C.red });
        // top-down regulator in the middle, chest towards you (south)
        b += `<g transform="translate(225 135)"><circle r="19" fill="#fff" opacity=".28"/><line x1="-27" y1="0" x2="27" y2="0" stroke="${uni}" stroke-width="4.5" stroke-linecap="round"/><circle cx="-27" cy="0" r="2.6" fill="#fff"/><circle cx="27" cy="0" r="2.6" fill="#fff"/><ellipse rx="10" ry="6" fill="${uni}"/><circle r="5" fill="#fff" stroke="${uni}" stroke-width="1.6"/></g>`;
        b += D.car(207.5, 74, 90, C.grey);
        b += mv("0 0;380 0;380 0", "0;.55;1", dur, D.car(40, 152.5, 0, C.orange));
        b += mv("0 0;-400 0;-400 0", "0;.6;1", dur, D.car(330, 117.5, 180, C.purple));
        b += D.car(242.5, 197, -90, C.blue, 46, 22, { label: "Ти" });
        b += D.label(4, 198, "Регулировчикът е над светофара", { size: 10.5, a: "start" });
        return out(b, "Регулировчикът отменя сигнала на светофара");
      },
    },
    {
      id: "roundabout-exit",
      cat: "krastovishta",
      title: "Кръгово: влизане и излизане",
      q: "Влизаш в кръгово със знак Б1 и ще излезеш на първия изход. Какво правиш?",
      steps: [
        "На входа с Б1 пропускаш колите, които вече са в кръга.",
        "Преди своя изход включваш десен мигач.",
        "На изхода пропускаш пешеходците на пътеката.",
      ],
      ref: "ЗДвП чл. 26, 50; чл. 119, ал. 4",
      svg: () => {
        const C = D.C, dur = 10, cx = 180, cy = 100;
        let b = bg(C.grass) + tree(40, 140, 13) + tree(320, 30, 12) + tree(326, 180, 13);
        b += rect(152, 0, 56, CH, C.road) + rect(0, 72, CW, 56, C.road);
        b += `<circle cx="${cx}" cy="${cy}" r="70" fill="${C.road}"/>`;
        b += D.dashes(100, 0, 100) + D.dashes(100, 262, CW) + D.vdashes(180, 0, 22) + D.vdashes(180, 178, CH);
        b += `<circle cx="${cx}" cy="${cy}" r="28" fill="${C.grassD}" stroke="#fff" stroke-width="2.5"/>`;
        b += D.zebra(264, 74, 22, 52, 5);
        b += D.S("Б1", 214, 180, 24) + D.S("Г12", 240, 180, 24);
        const o = route(cx + 49 * Math.cos((200 * Math.PI) / 180), cy + 49 * Math.sin((200 * Math.PI) / 180)).A(cx, cy, 49, 0).C(229, 80, 194, 70, 194, 48).L(194, -40);
        b += drive(o, [[0, 0], [0.55, o.len()], [1, o.len()]], dur, D.car(0, 0, 0, C.orange));
        b += mv("0 0;0 0;0 88;0 88", "0;.3;.72;1", dur, D.walker(275, 62, 0.75, C.purple));
        const r = route(194, 193).L(194, 166).C(194, 138, 214, 114, 237, 114).L(430, 114);
        b += drive(r, [[0, 0], [0.33, 0], [0.48, r.n(2)], [0.75, r.n(2)], [0.96, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { badge: "Ти" });
        b += D.label(8, 16, "Десен мигач преди изхода", { size: 11, a: "start" });
        b += D.label(4, 200, "На изхода – пешеходците", { size: 10.5, a: "start" });
        return out(b, "Кръгово движение: пропускаш колите в кръга и пешеходците на изхода");
      },
    },
    {
      id: "rail-crossing",
      cat: "krastovishta",
      title: "Мигаща червена на прелеза",
      q: "Светлините на прелеза мигат червено, но бариерата е вдигната. Минаваш ли?",
      steps: [
        "Не. Мигащата червена светлина забранява преминаването, каквото и да е положението на бариерата.",
        "Спираш преди прелеза и изчакваш светлините да угаснат.",
        "Тръгваш само ако след прелеза има място за цялата ти кола.",
      ],
      ref: "ЗДвП чл. 52, т. 2; чл. 53",
      svg: () => {
        const C = D.C, dur = 10;
        let b = bg(C.grass) + tree(150, 70, 12) + tree(330, 70, 12) + tree(150, 196, 12);
        b += rect(240, 0, 60, CH, "#c9b79a");
        for (let y = 4; y < CH; y += 14) b += rect(250, y, 40, 7, "#7b6a55");
        b += rect(0, 100, CW, 70, C.road) + D.dashes(135, 0, 236) + D.dashes(135, 304, CW);
        b += rect(261, 0, 3, CH, "#8a929c") + rect(276, 0, 3, CH, "#8a929c");
        b += stopV(214, 136, 170);
        // lights next to the road (flash until the train has gone, then go dark)
        const lamps = (x, y, r) => `<rect x="${x - 2 * r - 6}" y="${y - r - 5}" width="${4 * r + 12}" height="${2 * r + 10}" rx="${r + 5}" fill="#15181b"/><circle cx="${x - r - 1}" cy="${y}" r="${r}" fill="#4a2a2a"/><circle cx="${x + r + 1}" cy="${y}" r="${r}" fill="#4a2a2a"/>` +
          `<g>${fade("1;1;0;0", "0;.82;.83;1", dur)}<circle cx="${x - r - 1}" cy="${y}" r="${r}" fill="#ff3b30"><animate attributeName="opacity" values="1;.1;1" dur="1s" repeatCount="indefinite"/></circle><circle cx="${x + r + 1}" cy="${y}" r="${r}" fill="#ff3b30"><animate attributeName="opacity" values=".1;1;.1" dur="1s" repeatCount="indefinite"/></circle></g>`;
        b += rect(221, 180, 3, 30, "#6c737c") + lamps(222.5, 186, 5);
        // inset: side view with the barrier up
        b += `<rect x="8" y="34" width="150" height="62" rx="10" fill="#fff" stroke="rgba(0,0,0,.1)"/><rect x="26" y="50" width="4" height="40" fill="#6c737c"/>` + lamps(28, 50, 5.5);
        b += `<rect x="54" y="78" width="6" height="12" rx="1" fill="#6c737c"/><g transform="translate(57 80) rotate(-80)"><rect x="0" y="-3" width="40" height="6" fill="#fff" stroke="${C.red}"/>${[6, 22].map((x) => rect(x, -3, 8, 6, C.red)).join("")}</g>`;
        b += D.T(112, 52, "бариерата", 10.5, { w: 600 }) + D.T(112, 66, "е вдигната,", 10.5, { w: 600 }) + D.T(112, 81, "но мига!", 11, { w: 800, c: C.red });
        // train comes from the bottom and runs north
        let train = "";
        for (let i = 0; i < 3; i++) train += `<rect x="253" y="${184 + i * 77}" width="34" height="74" rx="${i ? 4 : 10}" fill="${i ? "#3c6e47" : "#2f5c3a"}" stroke="rgba(0,0,0,.3)"/><rect x="258" y="${192 + i * 77}" width="24" height="58" rx="3" fill="rgba(255,255,255,.18)"/>`;
        train += `<rect x="258" y="187" width="24" height="7" rx="2" fill="${C.glass}"/>`;
        b += mv("0 0;0 0;0 -470;0 -470", "0;.2;.8;1", dur, train);
        b += mv("0 0;125 0;125 0;390 0", "0;.25;.88;1", dur, D.car(64, 152.5, 0, C.blue, 46, 22, { label: "Ти" }));
        b += D.label(180, 16, "Мигаща червена = стоп, дори бариерата да е вдигната", { size: 10.5 });
        b += D.label(4, 200, "Тръгваш, щом угаснат", { size: 10.5, a: "start" });
        return out(b, "Жп прелез с мигаща червена светлина и вдигната бариера");
      },
    },

    // ------------------------------ ПЕШЕХОДЦИ И ДЕЦА ------------------------------
    {
      id: "right-turn-pedestrians",
      cat: "pesehodci",
      title: "Завой надясно и пешеходци на зелено",
      q: "Завиваш надясно на зелено, а по пресечката пресичат пешеходци – и те имат зелено. Кой е пръв?",
      steps: [
        "Пешеходците минават първи – при завой винаги ги пропускаш.",
        "Спираш преди пътеката и чакаш да се освободи пред колата.",
        "Преди завоя гледай в дясното огледало за велосипедист – не го засичай.",
      ],
      ref: "ЗДвП чл. 119, ал. 4; чл. 25",
      svg: () => {
        const C = D.C, dur = 9;
        let b = cross() + tree(30, 40, 13) + tree(30, 186, 12) + tree(330, 30, 12);
        b += D.zebra(264, 82, 26, 66, 6) + stopH(155, 186, 220) + light(226, 158, "g");
        b += `<g transform="translate(300 156)"><rect width="18" height="26" rx="3" fill="#15181b"/><circle cx="9" cy="8" r="2.6" fill="#22d36b"/><path d="M9 11 V17 M9 17 L6 22 M9 17 L12 22 M5 13 L13 13" stroke="#22d36b" stroke-width="2" stroke-linecap="round"/></g>`;
        b += mv("0 0;0 0;0 -108;0 -108", "0;.05;.66;1", dur, D.walker(277, 170, 0.75, C.orange));
        const r = route(202.5, 195).L(202.5, 172).T(238, 132.5, 202.5, 132.5).L(430, 132.5);
        b += drive(r, [[0, 0], [0.28, r.n(2)], [0.68, r.n(2)], [0.96, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { badge: "Ти" });
        b += D.label(180, 20, "Завиваш надясно → пешеходците минават първи", { size: 11 });
        b += D.label(4, 194, "И те имат зелено", { size: 10.5, a: "start" });
        return out(b, "Завой надясно: пропускаш пешеходците на пресечката");
      },
    },
    {
      id: "zebra-step",
      cat: "pesehodci",
      title: "Пешеходец стъпва на зебрата",
      q: "Пешеходец стъпва на пешеходна пътека без светофар. Какво правиш?",
      steps: [
        "Намаляваш и спираш преди пътеката.",
        "Същото правиш, ако пешеходецът само покаже с ръка, че ще пресича.",
        "Тръгваш, когато е минал пред теб и не го притесняваш.",
      ],
      ref: "ЗДвП чл. 119, ал. 1",
      svg: () => {
        const C = D.C, dur = 9;
        let b = houses(0, 38) + rect(0, 38, CW, 22, C.walk) + rect(0, 58, CW, 3, C.kerb);
        b += hRoad(60, 100) + D.dashes(110, 0, 214) + D.dashes(110, 262, CW);
        b += rect(0, 160, CW, 3, C.kerb) + rect(0, 163, CW, 25, C.walk) + rect(0, 188, CW, 32, C.grass);
        b += D.zebra(222, 62, 32, 96, 8) + D.S("Д17", 264, 163, 24);
        b += mv("0 0;0 0;0 -124;0 -124", "0;.22;.76;1", dur, walkerHand(238, 182, 0.8, C.orange));
        b += mv("0 0;142 0;142 0;380 0", "0;.3;.8;1", dur, D.car(50, 135, 0, C.blue, 46, 22, { label: "Ти" }));
        b += mv("0 0;-44 0;-44 0;-400 0", "0;.3;.82;1", dur, D.car(330, 85, 180, C.purple));
        b += D.label(180, 19, "Пешеходец стъпва на пътеката → спираш", { size: 11 });
        b += D.label(4, 204, "Тръгваш, щом е минал пред теб", { size: 10.5, a: "start" });
        return out(b, "Пешеходна пътека без светофар: спираш за пешеходеца");
      },
    },
    {
      id: "zebra-hidden",
      cat: "pesehodci",
      title: "Кола спря пред пешеходна пътека",
      q: "В съседната лента кола спря точно пред пешеходната пътека. Продължаваш ли?",
      steps: [
        "Вероятно пропуска пешеходец, когото ти не виждаш.",
        "Намаляваш така, че да можеш да спреш, и спираш, ако някой пресича.",
        "Изпреварването пред и върху пешеходна пътека е забранено.",
      ],
      ref: "ЗДвП чл. 119, ал. 2; чл. 43",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + tree(330, 46, 12);
        b += hRoad(68, 102) + edgeH(71) + D.dashes(119, 0, 232) + D.dashes(119, 276, CW);
        b += rect(0, 170, CW, 3, C.kerb) + rect(0, 173, CW, 25, C.walk) + houses(198, 22);
        b += D.zebra(238, 70, 32, 100, 8) + D.S("Д17", 280, 172, 24);
        b += mv("0 0;0 0;0 -128;0 -128", "0;.15;.78;1", dur, D.walker(254, 194, 0.72, C.orange));
        b += mv("0 0;0 0;290 0", "0;.82;1", dur, bus(196, 145, 0, "#9aa3ad", 72, 28));
        b += mv("0 0;166 0;166 0;390 0", "0;.4;.84;1", dur, D.car(40, 94, 0, C.blue, 46, 22, { label: "Ти" }));
        b += D.label(180, 16, "Спряла кола пред пътеката = може да има пешеходец", { size: 10.5 });
        b += D.label(8, 42, "Не я подминавай – намали и спри", { size: 11, a: "start" });
        return out(b, "Кола е спряла пред пешеходна пътека в съседната лента");
      },
    },
    {
      id: "school-bus",
      cat: "pesehodci",
      title: "Спрял автобус с деца",
      q: "Насреща е спрял автобус с табела „Деца“ и аварийни светлини. Какво правиш?",
      steps: [
        "Намаляваш и при нужда спираш – законът го изисква при автобус с табела „Деца“, който спира, стои или потегля.",
        "Децата могат да изтичат иззад автобуса – и отпред, и отзад.",
        "Продължаваш бавно, едва когато си сигурен, че децата са в безопасност.",
      ],
      ref: "ЗДвП чл. 117, 122",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + tree(330, 40, 12) + tree(100, 40, 11);
        b += hRoad(60, 90) + edgeH(63) + edgeH(147) + D.dashes(105, 0, CW);
        b += rect(0, 150, CW, 3, C.kerb) + rect(0, 153, CW, 24, C.walk);
        b += D.S("А19", 8, 10, 34);
        let hz = "";
        [[-55, -16], [-55, 16], [55, -16], [55, 16]].forEach(([x, y]) => (hz += blink(x, y, 3.4)));
        b += `<g transform="translate(158 127)">${bus(0, 0, 0, C.yellow, 110, 32, "ДЕЦА")}${hz}</g>`;
        b += D.person(122, 176, 0.5, C.red) + D.person(140, 176, 0.5, C.green);
        b += mv("0 0;0 0;0 -110;0 -110", "0;.3;.6;1", dur, D.walker(232, 172, 0.58, C.purple));
        b += mv("0 0;-58 0;-58 0;-400 0", "0;.3;.76;1", dur, D.car(330, 82.5, 180, C.blue, 46, 22, { label: "Ти" }));
        b += D.label(200, 19, "Автобус „Деца“ → намали, при нужда спри", { size: 11 });
        b += D.label(260, 200, "Децата изтичат иззад автобуса", { size: 11 });
        return out(b, "Спрял автобус с деца и аварийни светлини");
      },
    },

    // ------------------------------ МАГИСТРАЛА И ИЗВЪН ГРАДА ------------------------------
    {
      id: "motorway-merge",
      cat: "magistrala",
      title: "Вливане в магистрала",
      q: "Влизаш в магистралата по лентата за ускоряване. Как се вливаш?",
      steps: [
        "Включваш ляв мигач и ускоряваш до скоростта на колоната.",
        "Колите на магистралата имат предимство – търсиш пролука.",
        "Вливаш се плавно, без да караш някого да спира или да рязко сменя лентата.",
      ],
      ref: "ЗДвП чл. 56; чл. 25, ал. 2",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + rect(0, 42, CW, 6, "#9aa1a9");
        b += rect(0, 50, CW, 72, C.road) + edgeH(53) + D.dashes(87, 0, CW, 26, 16);
        b += `<path d="M-20 205 C40 205 85 137 140 137 L250 137" stroke="${C.road}" stroke-width="30" fill="none"/><polygon points="250,122 250,152 320,122" fill="${C.road}"/>`;
        b += D.dashes(122, 0, 250, 10, 6, 3) + edgeH(122, 320, CW) + `<line x1="250" y1="151" x2="320" y2="122.5" stroke="#fff" stroke-width="2" opacity=".85"/>`;
        b += D.S("Д5", 8, 4, 34);
        b += mv("0 0;180 0;180 0", "0;.3;1", dur, D.car(240, 69.5, 0, C.purple));
        b += mv("0 0;300 0;300 0", "0;.6;1", dur, D.car(120, 104.5, 0, C.orange));
        b += mv("0 0;180 0", "0;1", dur, D.car(20, 104.5, 0, C.grey));
        const r = route(26, 205).C(70, 205, 88, 137, 140, 137).L(240, 137).C(270, 137, 285, 104.5, 320, 104.5).L(440, 104.5);
        b += drive(r, [[0, 0], [0.55, r.n(2)], [0.76, r.n(3)], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkL: true }), { badge: "Ти" });
        b += D.label(200, 22, "Пропускаш колите на магистралата", { size: 11 });
        b += D.label(250, 200, "Мигач, ускори и влез в пролука", { size: 11 });
        return out(b, "Вливане в автомагистрала от лентата за ускоряване");
      },
    },
    {
      id: "motorway-exit",
      cat: "magistrala",
      title: "Излизане от магистрала",
      q: "Наближава изходът ти от магистралата. Как излизаш?",
      steps: [
        "Отрано заемаш дясната лента и включваш десен мигач.",
        "Минаваш в лентата за излизане и чак там намаляваш.",
        "Изпуснеш ли изхода, караш до следващия – назад и обратен завой са забранени.",
      ],
      ref: "ЗДвП чл. 56, 58",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + rect(0, 42, CW, 6, "#9aa1a9");
        b += rect(0, 50, CW, 72, C.road) + edgeH(53) + D.dashes(87, 0, CW, 26, 16);
        b += `<polygon points="95,122 150,152 262,152 262,122" fill="${C.road}"/><path d="M250 137 C292 137 322 165 385 218" stroke="${C.road}" stroke-width="30" fill="none"/>`;
        b += edgeH(122, 0, 150) + D.dashes(122, 150, 255, 10, 6, 3) + edgeH(122, 262, CW);
        b += mv("0 0;380 0;380 0", "0;.45;1", dur, D.car(40, 69.5, 0, C.orange));
        b += mv("0 0;230 0;230 0", "0;.35;1", dur, D.car(200, 104.5, 0, C.purple));
        const r = route(30, 104.5).L(110, 104.5).C(140, 104.5, 150, 137, 185, 137).L(250, 137).C(292, 137, 322, 165, 378, 212);
        b += drive(r, [[0, 0], [0.18, r.n(1)], [0.36, r.n(2)], [0.56, r.n(3)], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { badge: "Ти" });
        b += D.label(200, 22, "Мигач и в лентата за изход – отрано", { size: 11 });
        b += D.label(4, 200, "Изпусна изхода? Карай до следващия", { size: 10.5, a: "start" });
        return out(b, "Излизане от автомагистрала");
      },
    },
    {
      id: "motorway-breakdown",
      cat: "magistrala",
      title: "Повреда на магистралата",
      q: "Колата ти се поврежда на магистралата. Какво правиш?",
      steps: [
        "Отбиваш в лентата за принудително спиране и пускаш аварийните светлини.",
        "Обличаш светлоотразителната жилетка, преди да слезеш.",
        "Поставяш триъгълника на поне 100 м зад колата.",
        "Всички излизат зад мантинелата; звъниш на пътна помощ или 112.",
      ],
      ref: "ЗДвП чл. 59, 97, 101",
      svg: () => {
        const C = D.C, dur = 10, vest = "#c6e000";
        let b = bg(C.grass) + rect(0, 38, CW, 6, "#9aa1a9");
        b += rect(0, 46, CW, 96, C.road) + edgeH(49) + D.dashes(81, 0, CW, 26, 16) + edgeH(116) + rect(0, 117, CW, 25, C.roadD);
        b += rect(0, 147, CW, 4, "#9aa1a9");
        for (let x = 10; x < CW; x += 40) b += rect(x, 145, 3, 8, "#6c737c");
        b += mv("0 0;360 0;-120 0;0 0", "0;.45;.451;1", dur, D.car(60, 98.5, 0, C.orange));
        b += mv("0 0;200 0;-260 0;0 0", "0;.25;.251;1", dur, D.car(200, 63.5, 0, C.purple));
        b += hazCar(290, 129, 0, C.blue, 44, 20) + `<g transform="translate(290 129)">${badge("Ти")}</g>`;
        b += D.dim(112, 164, 266, 164, "поне 100 м", { dy: 12, size: 11 });
        const tri = (x, y, s) => `<polygon points="${x},${y - 9 * s} ${x + 9 * s},${y + 7 * s} ${x - 9 * s},${y + 7 * s}" fill="#fff" stroke="${C.red}" stroke-width="${3 * s}" stroke-linejoin="round"/>`;
        b += `<g opacity="0">${fade("0;0;1;1", "0;.4;.42;1", dur)}${tri(112, 129, 1.1)}</g>`;
        b += mv("0 0;-148 0;-148 0;13 56;13 56", "0;.4;.45;.68;1", dur,
          `${D.walker(262, 140, 0.6, vest)}<g>${fade("1;1;0;0", "0;.4;.42;1", dur)}${tri(270, 122, 0.7)}</g>`);
        b += D.person(298, 198, 0.55, C.red) + D.person(318, 198, 0.55, C.green);
        b += D.label(180, 18, "Аварийни, жилетка, триъгълник на 100 м", { size: 11 });
        b += D.label(4, 204, "Всички – зад мантинелата", { size: 10.5, a: "start" });
        return out(b, "Повреда на автомагистрала: аварийни светлини, жилетка и триъгълник");
      },
    },
    {
      id: "cyclist-overtake",
      cat: "magistrala",
      title: "Изпреварване на велосипедист",
      q: "Извън града пред теб кара велосипедист. Как го изпреварваш?",
      steps: [
        "Изпреварваш само ако насрещната лента е свободна и виждаш достатъчно напред.",
        "Оставяш достатъчно странично разстояние – добре е поне 1,5 м.",
        "При непрекъсната линия не изпреварваш, а изчакваш.",
        "Връщаш се в лентата си, без да го засичаш.",
      ],
      ref: "ЗДвП чл. 42, ал. 2",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + tree(60, 44, 12) + tree(250, 46, 13) + tree(120, 182, 12) + tree(320, 186, 13);
        b += hRoad(70, 80) + edgeH(73) + edgeH(147) + D.dashes(110, 0, CW);
        b += D.S("А20", 8, 6, 32);
        b += mv("0 0;110 0", "0;1", dur,
          `${cyclist(140, 140, 0, C.green)}<g opacity="0">${fade("0;0;1;1;0;0", "0;.3;.32;.43;.45;1", dur)}<line x1="150" y1="113" x2="150" y2="131" stroke="${C.ink}" stroke-width="1.6" marker-start="url(#il-ahw)" marker-end="url(#il-ahw)"/>${D.label(178, 122, "1,5 м", { size: 10, cw: CW })}</g>`);
        const r = route(30, 130).L(90, 130).C(125, 130, 135, 100, 170, 100).L(240, 100).C(275, 100, 285, 130, 320, 130).L(440, 130);
        b += drive(r, [[0, 0], [0.85, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.blue), { badge: "Ти" });
        b += D.label(200, 22, "Изпреварваш само при свободна насрещна лента", { size: 10.5 });
        b += D.label(180, 204, "Странично разстояние – добре е поне 1,5 м", { size: 11 });
        return out(b, "Изпреварване на велосипедист с достатъчно странично разстояние");
      },
    },
    {
      id: "tailgater",
      cat: "magistrala",
      title: "Някой кара плътно зад теб",
      q: "Кола кара плътно зад теб и явно бърза. Какво правиш?",
      steps: [
        "Не ускоряваш и не натискаш спирачката, за да го „наказваш“.",
        "Увеличаваш разстоянието до колата пред теб – ако тя спре, имаш повече време.",
        "Когато те изпреварва, не му пречиш и не ускоряваш.",
      ],
      ref: "ЗДвП чл. 23; чл. 42, ал. 3",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass);
        let trees = "";
        for (let k = 0; k < 4; k++) trees += tree(40 + k * 288, 44, 12) + tree(190 + k * 288, 40, 14) + tree(110 + k * 288, 188, 13) + tree(250 + k * 288, 184, 12);
        b += mv("0 0;-576 0", "0;1", dur, trees);
        b += hRoad(80, 80) + edgeH(83) + edgeH(157);
        b += mv("0 0;-576 0", "0;1", dur, D.dashes(120, 0, CW + 600));
        b += D.car(300, 140, 0, C.orange);
        b += mv("0 0;-40 0;-40 0", "0;.3;1", dur, D.car(210, 140, 0, C.blue, 46, 22, { label: "Ти" }));
        const r = route(162, 140).C(186, 140, 190, 100, 226, 100).L(380, 100).C(412, 100, 418, 140, 452, 140).L(520, 140);
        b += mv("0 0;-56 0;-56 0", "0;.3;1", dur, drive(r, [[0, 0], [0.42, 0], [0.95, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.red)));
        b += D.label(180, 22, "Не ускорявай и не спирай рязко", { size: 11 });
        b += D.label(180, 204, "Увеличи дистанцията до колата пред теб", { size: 11 });
        return out(b, "Кола следва плътно зад теб");
      },
    },

    // ------------------------------ В ГРАДА ------------------------------
    {
      id: "tram-stop",
      cat: "grad",
      title: "Трамвай на спирка без остров",
      q: "Трамвай спира на спирка, а ти караш между него и тротоара. Какво правиш?",
      steps: [
        "Спираш на 1 м зад трамвая.",
        "Изчакваш хората да слязат и да се качат.",
        "Тръгваш бавно, когато платното между трамвая и тротоара е свободно.",
      ],
      ref: "ЗДвП чл. 66, ал. 1",
      svg: () => {
        const C = D.C, dur = 9;
        let b = houses(0, 30) + rect(0, 30, CW, 14, C.walk);
        b += hRoad(44, 126) + D.dashes(77, 0, CW) + rect(0, 86, CW, 2.5, "#9aa1a9") + rect(0, 102, CW, 2.5, "#9aa1a9");
        b += rect(0, 170, CW, 3, C.kerb) + rect(0, 173, CW, 22, C.walk) + houses(195, 25);
        b += D.S("Д22", 300, 172, 24);
        b += mv("0 0;-400 0;-400 0", "0;.55;1", dur, D.car(330, 59, 180, C.purple));
        b += `<g><rect x="170" y="79" width="140" height="32" rx="8" fill="${C.amber}" stroke="rgba(0,0,0,.3)"/><rect x="178" y="85" width="124" height="20" rx="3" fill="rgba(255,255,255,.3)"/>${[205, 245, 285].map((x) => rect(x - 7, 108, 14, 4, C.ink)).join("")}${D.T(240, 96, "ТРАМВАЙ", 10, { w: 800 })}</g>`;
        b += mv("0 0;0 0;0 62;0 62", "0;.1;.5;1", dur, D.walker(205, 126, 0.62, C.orange));
        b += `<g>${fade("1;1;0;0;1", "0;.58;.62;.97;1", dur)}${mv("0 0;0 0;0 -66;0 -66;0 0", "0;.18;.58;.97;1", dur, D.walker(285, 190, 0.62, C.green))}</g>`;
        b += mv("0 0;98 0;98 0;380 0", "0;.25;.78;1", dur, D.car(40, 142, 0, C.blue, 46, 22, { label: "Ти" }));
        b += D.label(180, 15, "Трамвай на спирка без остров → спираш", { size: 11 });
        b += D.label(110, 207, "на 1 м зад него, докато хората минат", { size: 10.5 });
        return out(b, "Трамвай на спирка без остров – спираш зад него");
      },
    },
    {
      id: "zipper-merge",
      cat: "grad",
      title: "Лентата свършва – по един",
      q: "Лявата лента свършва и колите от двете ленти трябва да се съберат в една. Как?",
      steps: [
        "Който сменя лентата, пропуска колите в съседната.",
        "Караш в своята лента до стеснението и чак там се престрояваш.",
        "Добра практика: колите се редуват – една оттук, една оттам.",
        "Ако си в продължаващата лента, пусни една кола пред себе си.",
      ],
      ref: "ЗДвП чл. 25, ал. 2",
      svg: () => {
        const C = D.C, dur = 10;
        let b = bg(C.grass) + tree(330, 186, 13) + tree(30, 186, 12);
        b += `<defs><pattern id="sc-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${C.road}"/><rect width="4" height="10" fill="#fff" opacity=".8"/></pattern></defs>`;
        b += hRoad(64, 80) + edgeH(67) + edgeH(141) + D.dashes(104, 0, 196);
        b += `<polygon points="200,66 290,104 ${CW},104 ${CW},66" fill="url(#sc-hatch)"/><line x1="200" y1="66" x2="290" y2="104" stroke="#fff" stroke-width="2.5"/>`;
        b += D.S("А9", 8, 8, 34);
        const lane = (x0) => route(x0, 84).L(195, 84).C(225, 84, 235, 124, 270, 124).L(440, 124);
        const l1 = lane(190), l2 = lane(100);
        b += mv("0 0;0 0;290 0;290 0", "0;.08;.45;1", dur, D.car(150, 124, 0, C.purple, 46, 22, { label: "2" }));
        b += mv("0 0;80 0;80 0;380 0;380 0", "0;.25;.4;.85;1", dur, D.car(60, 124, 0, C.green, 46, 22, { label: "4" }));
        b += drive(l2, [[0, 0], [0.25, l2.n(1)], [0.33, l2.n(1)], [0.7, l2.len()], [1, l2.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { badge: "3" });
        b += drive(l1, [[0, 0], [0.35, l1.len()], [1, l1.len()]], dur, D.car(0, 0, 0, C.orange, 46, 22, { blinkR: true }), { badge: "1" });
        b += D.label(200, 24, "Редувате се: една кола оттук, една оттам", { size: 11 });
        b += D.label(180, 194, "Който сменя лентата, пропуска другите", { size: 11 });
        return out(b, "Лентата свършва – престрояване една по една");
      },
    },
    {
      id: "narrow-parked",
      cat: "grad",
      title: "Паркирани коли в твоята лента",
      q: "Паркирани коли заемат твоята лента, а насреща идва кола. Кой минава пръв?",
      steps: [
        "Препятствието е в твоята лента – ти пропускаш насрещните.",
        "Спираш преди паркираните коли, без да навлизаш в насрещната лента.",
        "Заобикаляш с ляв мигач, когато насрещната лента е свободна.",
      ],
      ref: "ЗДвП чл. 44, ал. 2",
      svg: () => {
        const C = D.C, dur = 9;
        let b = houses(0, 30) + rect(0, 30, CW, 16, C.walk);
        b += hRoad(46, 120) + D.dashes(106, 0, CW) + rect(0, 166, CW, 3, C.kerb) + rect(0, 169, CW, 19, C.walk) + houses(188, 32);
        b += D.car(178, 152, 0, C.grey) + D.car(234, 152, 0, C.green) + D.car(290, 152, 0, C.red);
        b += mv("0 0;-400 0;-400 0", "0;.5;1", dur, D.car(330, 76, 180, C.purple));
        const r = route(40, 136).L(110, 136).C(138, 136, 142, 96, 172, 96).L(310, 96).C(338, 96, 345, 136, 375, 136).L(440, 136);
        b += drive(r, [[0, 0], [0.2, r.n(1)], [0.52, r.n(1)], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkL: true }), { badge: "Ти" });
        b += D.label(180, 15, "Препятствието е в твоята лента → пропускаш", { size: 10.5 });
        b += D.label(180, 204, "Заобикаляш, когато насрещната е свободна", { size: 10.5 });
        return out(b, "Паркирани коли заемат твоята лента");
      },
    },

    // ------------------------------ ПАРКИРАНЕ И МАНЕВРИ ------------------------------
    {
      id: "parallel-park",
      cat: "parkirane",
      title: "Успоредно паркиране",
      q: "Намери място между две коли на оживена улица. Как паркираш?",
      steps: [
        "Десен мигач отрано, за да разберат колите зад теб, че ще спираш.",
        "Спираш успоредно на колата пред мястото, на около половин метър от нея.",
        "Назад бавно: волан надясно, после наляво; гледаш огледалата и зад колата.",
        "При заден ход пропускаш всички – пешеходци, коли, велосипедисти.",
      ],
      ref: "ЗДвП чл. 25, 26, 40",
      svg: () => {
        const C = D.C, dur = 10;
        let b = rect(0, 0, CW, 36, C.walk) + rect(0, 34, CW, 3, C.kerb);
        b += hRoad(37, 129) + D.dashes(80, 0, CW) + rect(0, 166, CW, 3, C.kerb) + rect(0, 169, CW, 51, C.walk);
        b += D.car(100, 144, 0, C.grey) + D.car(300, 144, 0, C.grey);
        b += `<path d="M300 101 C255 101 250 144 200 144" stroke="${C.blue}" stroke-width="2.5" stroke-dasharray="6 5" fill="none" opacity=".55"/>`;
        const r = route(300, 101).C(255, 101, 250, 144, 200, 144);
        b += mv("-160 0;0 0;0 0", "0;.3;1", dur,
          drive(r, [[0, 0], [0.38, 0], [0.82, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { rot: "auto-reverse", badge: "Ти" }));
        b += D.label(180, 18, "Мигач, спри до колата отпред, после назад", { size: 11 });
        b += D.label(180, 196, "Назад: волан надясно, после наляво", { size: 11 });
        return out(b, "Успоредно паркиране на заден ход");
      },
    },
    {
      id: "exit-property",
      cat: "parkirane",
      title: "Излизане от паркинг или двор",
      q: "Излизаш от паркинг на улицата. Кого пропускаш?",
      steps: [
        "Първо пешеходците по тротоара.",
        "После всички коли по пътя – и от двете посоки.",
        "Мигач, бавно напред и тръгваш, когато е свободно.",
      ],
      ref: "ЗДвП чл. 37, ал. 3",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + tree(30, 22, 12) + tree(330, 22, 12);
        b += hRoad(40, 70) + D.dashes(75, 0, CW) + rect(0, 110, CW, 22, C.walk) + rect(0, 108, CW, 3, C.kerb);
        b += rect(0, 132, CW, 88, "#c9ced6");
        for (let x = 20; x < CW; x += 52) if (x < 140 || x > 230) b += rect(x, 150, 2, 66, "#fff");
        b += D.car(98, 182, -90, C.grey) + D.car(282, 182, -90, C.green);
        b += mv("0 0;220 0;220 0", "0;.55;1", dur, D.walker(70, 130, 0.62, C.purple));
        b += mv("0 0;380 0;380 0", "0;.45;1", dur, D.car(40, 92.5, 0, C.orange));
        b += mv("0 0;-400 0;-400 0", "0;.55;1", dur, D.car(330, 57.5, 180, C.red));
        const r = route(180, 178).L(180, 157).T(235, 92.5, 180, 92.5).L(440, 92.5);
        b += drive(r, [[0, 0], [0.12, r.n(1)], [0.6, r.n(1)], [0.95, r.len()], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { badge: "Ти" });
        b += D.label(180, 20, "Излизаш от имот → пропускаш всички", { size: 11 });
        return out(b, "Излизане от паркинг или двор на пътя");
      },
    },
    {
      id: "door-open",
      cat: "parkirane",
      title: "Отваряне на вратата",
      q: "Паркирал си на улицата и ще слизаш. Какво правиш, преди да отвориш вратата?",
      steps: [
        "Поглеждаш в огледалото и през рамо за коли и велосипедисти.",
        "Отваряш с дясната ръка – тялото се завърта и виждаш назад (добра практика).",
        "Отваряш бавно и слизаш бързо; децата слизат откъм тротоара.",
      ],
      ref: "ЗДвП чл. 95",
      svg: () => {
        const C = D.C, dur = 9;
        let b = houses(0, 30) + rect(0, 30, CW, 10, C.walk);
        b += hRoad(40, 112) + D.dashes(82, 0, CW) + rect(0, 152, CW, 3, C.kerb) + rect(0, 155, CW, 65, C.walk);
        b += `<polygon points="214,121 30,92 30,124" fill="${C.blue}" opacity=".12"/><line x1="214" y1="121" x2="30" y2="108" stroke="${C.blue}" stroke-width="2" stroke-dasharray="5 5" opacity=".6"/>`;
        b += D.car(110, 138, 0, C.grey) + D.car(200, 138, 0, C.blue, 60, 28, { label: "Ти" });
        b += `<g><animateTransform attributeName="transform" type="rotate" values="0 213 124;0 213 124;55 213 124;55 213 124;0 213 124;0 213 124" keyTimes="0;.55;.62;.82;.9;1" dur="${dur}s" repeatCount="indefinite"/><rect x="190" y="120" width="23" height="6" rx="2.5" fill="#2659b8" stroke="rgba(0,0,0,.35)"/></g>`;
        b += mv("0 0;380 0;380 0", "0;.5;1", dur, cyclist(40, 104, 0, C.green));
        b += mv("0 0;-400 0;-400 0", "0;.6;1", dur, D.car(330, 60, 180, C.orange));
        b += D.label(180, 15, "Огледало и поглед през рамо, после вратата", { size: 11 });
        b += D.label(180, 196, "Отваряй с дясната ръка – виждаш назад", { size: 11 });
        return out(b, "Отваряне на вратата към платното");
      },
    },

    // ------------------------------ СПЕЦИАЛНИ АВТОМОБИЛИ ------------------------------
    {
      id: "emergency-corridor",
      cat: "specialni",
      title: "Коридор за линейка в задръстване",
      q: "Магистралата е задръстена, а отзад се чува сирена. Какво правиш?",
      steps: [
        "Лявата лента се изтегля наляво, всички останали – надясно.",
        "Така между лентите се отваря коридор за линейката и пожарната.",
        "Най-добре е да направиш място, щом колоната спре – не чакай сирената.",
        "Законът изисква да освободиш място; коридорът е утвърдената добра практика.",
      ],
      ref: "ЗДвП чл. 104, ал. 1",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + rect(0, 38, CW, 6, "#9aa1a9");
        b += rect(0, 44, CW, 107, C.road) + edgeH(47) + D.dashes(81, 0, CW, 26, 16) + D.dashes(116, 0, CW, 26, 16) + edgeH(151);
        b += rect(0, 152, CW, 18, C.roadD) + rect(0, 172, CW, 4, "#9aa1a9");
        const cols = [C.orange, C.purple, C.grey, C.green, C.red, "#5b6673"];
        const laneCars = (y, x0, k) => [0, 1, 2, 3].map((i) => D.car(x0 + i * 70, y, 0, cols[(i + k) % cols.length])).join("");
        b += mv("0 0;0 -9;0 -9", "0;.25;1", dur, laneCars(63.5, 104, 0));
        b += mv("0 0;0 9;0 9", "0;.25;1", dur, laneCars(98.5, 92, 2) + laneCars(133.5, 112, 4));
        b += mv("0 0;0 0;400 0;400 0", "0;.25;.9;1", dur, amb(30, 81));
        b += D.label(180, 20, "Лявата лента – наляво, останалите – надясно", { size: 11 });
        b += D.label(180, 198, "Коридорът се прави, щом колоната спре", { size: 11 });
        return out(b, "Аварийен коридор в задръстване");
      },
    },
    {
      id: "ambulance-behind",
      cat: "specialni",
      title: "Линейка със сирена зад теб",
      q: "Извън града зад теб се приближава линейка със сирена и сини светлини. Какво правиш?",
      steps: [
        "Включваш десен мигач, намаляваш и се изтегляш вдясно.",
        "При нужда спираш, за да мине свободно.",
        "Не спирай рязко точно пред нея.",
        "Когато мине, не я следвай плътно.",
      ],
      ref: "ЗДвП чл. 104",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + tree(60, 30, 12) + tree(250, 34, 13) + tree(110, 196, 12) + tree(320, 196, 12);
        b += rect(0, 54, CW, 112, "#cbbd9d") + hRoad(70, 80) + edgeH(73) + edgeH(147) + D.dashes(110, 0, CW);
        const r = route(120, 130).L(170, 130).C(195, 130, 200, 156, 225, 156).L(240, 156).C(265, 156, 270, 130, 295, 130).L(440, 130);
        b += drive(r, [[0, 0], [0.3, r.n(3)], [0.7, r.n(3)], [1, r.len()]], dur, D.car(0, 0, 0, C.blue, 46, 22, { blinkR: true }), { badge: "Ти" });
        b += mv("0 0;-30 -10;-30 -10;-400 0", "0;.3;.7;1", dur, D.car(330, 90, 180, C.purple));
        b += mv("0 0;50 0;400 0;400 0", "0;.3;.66;1", dur, amb(20, 128));
        b += D.label(180, 22, "Сирена отзад → вдясно и спри при нужда", { size: 11 });
        b += D.label(180, 204, "Не спирай рязко пред нея и не я следвай", { size: 11 });
        return out(b, "Линейка със специален режим зад теб");
      },
    },
    {
      id: "ambulance-red",
      cat: "specialni",
      title: "Линейка зад теб на червено",
      q: "Чакаш на червено, а отзад идва линейка със сирена. Какво правиш?",
      steps: [
        "Не минаваш на червено, за да ѝ направиш място – линейката може, ти не.",
        "Ако има място, се отместваш леко встрани, за да мине между колите.",
        "Линейката минава кръстовището бавно; ти тръгваш на зелено.",
      ],
      ref: "ЗДвП чл. 92, 104",
      svg: () => {
        const C = D.C, dur = 9;
        let b = bg(C.grass) + tree(330, 30, 12);
        b += rect(0, 60, CW, 120, C.road) + rect(240, 0, 60, CH, C.road);
        b += rect(0, 99, 234, 2.5, "#fff") + rect(306, 99, 54, 2.5, "#fff") + D.dashes(140, 0, 232) + D.dashes(140, 306, CW);
        b += D.vdashes(270, 0, 54) + D.vdashes(270, 186, CH) + stopV(233, 102, 180);
        b += light(310, 184, "r");
        b += mv("0 0;0 -9;0 -9", "0;.25;1", dur, D.car(130, 120, 0, C.grey) + D.car(205, 120, 0, C.blue, 46, 22, { label: "Ти" }));
        b += mv("0 0;0 10;0 10", "0;.25;1", dur, D.car(130, 160, 0, C.green) + D.car(205, 160, 0, C.orange));
        b += mv("0 0;0 15;0 15;0 260", "0;.3;.85;1", dur, D.car(255, 20, 90, C.purple));
        b += mv("0 0;0 0;210 0;400 0;400 0", "0;.28;.56;.85;1", dur, amb(40, 140));
        b += D.label(6, 20, "Червено: не влизаш в кръстовището", { size: 10.5, a: "start" });
        b += D.label(4, 200, "Направи място, само ако е безопасно", { size: 10.5, a: "start" });
        return out(b, "Линейка зад теб, докато чакаш на червено");
      },
    },

    // ------------------------------ НЕОЧАКВАНИ СИТУАЦИИ ------------------------------
    {
      id: "deer",
      cat: "neochakvano",
      title: "Животно на пътя",
      q: "Вечер извън града на пътя изскача сърна. Какво правиш?",
      steps: [
        "Натискаш спирачката докрай и държиш волана право.",
        "Не завиваш рязко – удар в дърво или в насрещна кола е по-опасен.",
        "След едно животно често идва второ – изчакай.",
        "При знак А22 намаляваш, особено по здрач и през нощта.",
      ],
      ref: "Добра практика",
      svg: () => {
        const C = D.C, dur = 9, dark = "#5f7d55";
        let b = bg(dark);
        for (let x = 0; x < CW; x += 34) b += tree(x + 10, 66, 13, "#3f5b3a") + (x > 190 && x < 300 ? "" : tree(x + 24, 172, 13, "#3f5b3a"));
        b += rect(0, 80, CW, 70, "#3d424a") + edgeH(83) + edgeH(147) + D.dashes(115, 0, CW);
        b += D.S("А22", 8, 8, 34);
        const beam = `<polygon points="23,-8 140,-30 140,30 23,8" fill="#fff6b0" opacity=".32"/>`;
        b += mv("0 0;135 0;135 0;390 0", "0;.35;.85;1", dur, `<g transform="translate(30 132.5)">${beam}${D.car(0, 0, 0, C.blue, 46, 22, { label: "Ти" })}</g>`);
        b += `<g>${fade("1;1;0;0;1", "0;.5;.55;.97;1", dur)}${mv("0 0;0 0;0 -122;0 -122;0 0", "0;.15;.5;.97;1", dur, deer(240, 196, 0.62))}</g>`;
        b += `<g>${fade("1;1;0;0;1", "0;.8;.85;.97;1", dur)}${mv("0 0;0 0;0 -136;0 -136;0 0", "0;.45;.8;.97;1", dur, deer(286, 210, 0.62))}</g>`;
        b += D.label(200, 20, "Спирачка докрай, воланът – право", { size: 11 });
        b += D.label(200, 46, "След едно животно често идва второ", { size: 11 });
        return out(b, "Диво животно на пътя по здрач");
      },
    },
    {
      id: "skid-ice",
      cat: "neochakvano",
      title: "Поднасяне на заледен път",
      q: "В завой на заледен път задницата на колата поднася. Какво правиш?",
      steps: [
        "Пускаш газта и не натискаш рязко спирачката.",
        "Гледаш и завиваш натам, накъдето искаш да отидеш.",
        "Ако трябва да спреш, с ABS натискаш спирачката силно и я задържаш.",
        "Най-сигурно: по-ниска скорост още преди завоя.",
      ],
      ref: "Добра практика",
      svg: () => {
        const C = D.C, dur = 8;
        const road = "M-30 180 C120 180 200 60 390 60";
        let b = bg("#eef3f8") + tree(300, 170, 13, "#9bbf8a") + tree(60, 60, 12, "#9bbf8a");
        b += `<path d="${road}" stroke="${C.road}" stroke-width="80" fill="none"/><path d="${road}" stroke="#cfe6fb" stroke-width="80" fill="none" opacity=".28"/>`;
        b += `<path d="${road}" stroke="#fff" stroke-width="3" stroke-dasharray="18 14" fill="none"/>`;
        b += `<g fill="none" stroke="#7fb8ec" stroke-width="2"><path d="M330 120 V144 M320 126 L340 138 M320 138 L340 126"/></g>`;
        b += `<path d="M150 150 C200 120 240 96 300 84" stroke="${C.green}" stroke-width="3" stroke-dasharray="6 5" fill="none" marker-end="url(#il-ah)" opacity=".85"/>`;
        const r = route(20, 198).C(130, 198, 205, 78, 380, 78);
        b += drive(r, [[0, 0], [0.95, r.len()], [1, r.len()]], dur,
          `<g><animateTransform attributeName="transform" type="rotate" values="0;0;-28;10;0;0" keyTimes="0;.3;.45;.6;.72;1" dur="${dur}s" repeatCount="indefinite"/>${D.car(0, 0, 0, C.blue)}</g>`, { badge: "Ти" });
        b += D.label(8, 20, "Пусни газта, гледай накъдето искаш", { size: 11, a: "start" });
        b += D.label(262, 204, "С ABS – натисни силно и задръж", { size: 10.5 });
        return out(b, "Поднасяне на заледен път");
      },
    },
  ];

  window.BGScenarios = SCENARIOS;
  window.BGScenarioCats = {
    krastovishta: "Кръстовища",
    pesehodci: "Пешеходци и деца",
    magistrala: "Магистрала и извън града",
    grad: "В града",
    parkirane: "Паркиране и маневри",
    specialni: "Специални автомобили",
    neochakvano: "Неочаквани ситуации",
  };
})();
