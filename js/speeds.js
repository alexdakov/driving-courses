/* "Скорости": the speed limit for every everyday situation, with an animated driver's view,
   a speedometer and – for weather and night – a stopping-distance calculator. Category B. */
(function () {
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const rad = (d) => (d * Math.PI) / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // round red speed-limit disc (design of sign В26) with any number
  const disc = (v, size = 40) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="#fff" stroke="#c1121f" stroke-width="10"/><text x="50" y="53" font-family="Arial, sans-serif" font-weight="700" font-size="${String(v).length > 2 ? 38 : 46}" text-anchor="middle" dominant-baseline="central" fill="#111">${v}</text></svg>`;
  const discImg = (v) => `data:image/svg+xml;utf8,${encodeURIComponent(disc(v, 100).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '))}`;
  const zoneImg = (v) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><rect x="3" y="3" width="94" height="114" rx="8" fill="#fff" stroke="#111" stroke-width="4"/><text x="50" y="24" font-family="Arial" font-weight="700" font-size="17" text-anchor="middle" fill="#111">ЗОНА</text><circle cx="50" cy="72" r="32" fill="#fff" stroke="#c1121f" stroke-width="8"/><text x="50" y="74" font-family="Arial" font-weight="700" font-size="32" text-anchor="middle" dominant-baseline="central" fill="#111">${v}</text></svg>`)}`;
  const WICON = {
    rain: `<path d="M7 14a5 5 0 1 1 9.6-2H17a3 3 0 0 1 0 6H8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 20l-1 2M13 20l-1 2M17 20l-1 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    fog: `<path d="M4 9h16M2 13h20M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
    snow: `<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    ice: `<path d="M3 17h18M6 13l3-3 3 3 3-3 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 21l2-2M12 21l2-2M17 21l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    night: `<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/>`,
  };
  const wicon = (k) => `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">${WICON[k]}</svg>`;
  const signFile = (code) => (window.BGSigns && window.BGSigns.byCode(code) ? window.BGSigns.byCode(code).f : "");

  // Stopping distance: 1 s reaction + braking with deceleration a (m/s²)
  const SURF = { dry: { t: "Сух", a: 7 }, wet: { t: "Мокър", a: 5 }, snow: { t: "Сняг", a: 2.5 }, ice: { t: "Лед", a: 1 } };
  const stopDist = (kmh, a) => { const v = kmh / 3.6; return v * 1 + (v * v) / (2 * a); };
  const safeSpeed = (vis, a) => Math.floor((a * (-1 + Math.sqrt(1 + (2 * vis) / a)) * 3.6) / 5) * 5;
  const ROADS = { grad: ["В населено място", 50], izvan: ["Извън населено място", 90], skorosten: ["Скоростен път", 120], magistrala: ["Автомагистрала", 140] };

  const SCEN = [
    { id: "grad", title: "В населено място", limit: 50, road: "city", sign: "Д11", tip: "Табела с името на града = 50. Зачертаната табела (Д12) = край.",
      text: "Важи от табелата с името на населеното място (Д11) до табелата, с която то свършва (Д12) – по всички улици, освен ако знак не казва друго. Знак В26 до Д11 сменя числото за цялото населено място.", ref: "ЗДвП чл. 21, ал. 1" },
    { id: "zona30", title: "„Зона 30“", limit: 30, road: "city", zone: 30, kids: true, tip: "Видиш ли „ЗОНА“ и 30 – до края на зоната не надвишаваш 30.",
      text: "Нов вид зона от 7.09.2025 г. Общината я обособява в населено място – най-често около училища, детски градини и в центъра. Отбелязва се със знак за зона на входа и изхода.", ref: "ЗДвП чл. 62а" },
    { id: "zhilishtna", title: "Жилищна зона", limit: 20, road: "living", sign: "Д15", kids: true, tip: "Къщичка и деца на синия знак = скорост като на пешеходец с колело – 20.",
      text: "Пешеходците могат да вървят по цялата улица, децата – да играят. Не ги притесняваш и не им пречиш. Паркираш само на обозначените места, а при излизане от зоната пропускаш всички.", ref: "ЗДвП чл. 62" },
    { id: "izvan", title: "Извън населено място", limit: 90, road: "rural", tip: "Извън града = 90, ако знак не казва друго.",
      text: "Всички пътища извън населените места, които не са скоростен път или магистрала. Изпреварвай само където виждаш достатъчно далеч напред.", ref: "ЗДвП чл. 21, ал. 1" },
    { id: "skorosten", title: "Скоростен път", limit: 120, road: "express", sign: "Д7а", tip: "Зеленият знак с кола = скоростен път = 120.",
      text: "Път с разделени посоки, но не е автомагистрала. Обозначава се със зелен знак Д7а. Обратният завой и спирането са забранени.", ref: "ЗДвП чл. 21, ал. 1; чл. 55" },
    { id: "magistrala", title: "Магистрала", limit: 140, road: "motorway", sign: "Д5", tip: "Зеленият знак с надлез = магистрала = 140.",
      text: "Само за моторни превозни средства. Лентата за принудително спиране е само за повреда. Не караш излишно бавно и не спираш без нужда.", ref: "ЗДвП чл. 21, ал. 1; чл. 22; чл. 55" },
    { id: "znak", title: "Знак В26", limit: 70, road: "rural", disc: 70, tip: "Числото в червения кръг е таван. Знакът е по-силен от общото правило.",
      text: "Знакът е над общото правило – и надолу, и нагоре. Важи до следващото кръстовище, до знак за край (В33 или нов В26) или до разстоянието на табела Т2. Заедно с Д11 – за цялото населено място.", ref: "ЗДвП чл. 21, ал. 2; ППЗДвП чл. 50" },
    { id: "sredna", title: "Средна скорост в участък", limit: 140, road: "motorway", gantry: true, tip: "Камерите на входа и изхода смятат средната скорост – „спирачка пред камерата“ не помага.",
      text: "От 7.09.2025 г. ограничението важи и за средната скорост в участък между две точки за контрол. Ако караш 160 и после 120, средното пак е над 140.", ref: "ЗДвП чл. 21, ал. 3" },
    { id: "teglene", title: "Теглене на кола", limit: 40, road: "rural", tow: true, tip: "Теглиш ли – 40. С твърда връзка по магистрала или скоростен път – до 70.",
      text: "При теглене най-много 40 km/h. С твърда връзка по автомагистрала или скоростен път – до 70 km/h. Договорете сигналите си предварително.", ref: "ЗДвП чл. 84" },
    { id: "dazhd", title: "Дъжд", calc: { vis: 120, surf: "wet", road: "izvan" }, road: "rural", weather: "rain", tip: "Мокър път ≈ спирачният път става около 1,5 пъти по-дълъг.",
      text: "Законът не дава отделно число за дъжд. Общото ограничение остава таван, но си длъжен да избереш скорост, с която да спреш пред всяко предвидимо препятствие. Пази по-голяма дистанция – поне 4 секунди.", ref: "ЗДвП чл. 20, ал. 2" },
    { id: "magla", title: "Мъгла", calc: { vis: 50, surf: "wet", road: "izvan" }, road: "rural", weather: "fog", tip: "Виждаш 50 м → трябва да спреш в 50 м. Задна светлина за мъгла – само под 50 м видимост.",
      text: "Няма отделно число – скоростта се определя от видимостта: трябва да спреш в разстоянието, което виждаш. Включи късите и светлините за мъгла; задната – само при видимост под 50 м.", ref: "ЗДвП чл. 20, ал. 2; чл. 74" },
    { id: "snyag", title: "Сняг", calc: { vis: 120, surf: "snow", road: "izvan" }, road: "rural", weather: "snow", tip: "На сняг спирачният път е около 3 пъти по-дълъг от сухо.",
      text: "Няма отделно число, освен ако знак В26 с табела Т14 (снежинка) не казва друго. Зимни гуми или протектор поне 4 мм от 15 ноември до 1 март.", ref: "ЗДвП чл. 20, ал. 2; чл. 139" },
    { id: "led", title: "Лед и поледица", calc: { vis: 150, surf: "ice", road: "izvan" }, road: "rural", weather: "ice", tip: "Лед ≈ 7 пъти по-дълъг спирачен път. Мостовете замръзват първи.",
      text: "На лед спирачният път е многократно по-дълъг. Карай плавно – без рязко спиране, ускоряване и завиване. Мостове, надлези и сенчести участъци замръзват първи.", ref: "ЗДвП чл. 20, ал. 2" },
    { id: "nosht", title: "Нощ с къси светлини", calc: { vis: 60, surf: "dry", road: "izvan" }, road: "rural", weather: "night", tip: "Късите светят ~60 м. Кара ли се по-бързо, спираш извън осветеното.",
      text: "Късите светлини осветяват около 50–70 м напред. Ако спирачният път е по-дълъг, препятствие ще видиш твърде късно. Дълги – когато няма насрещни и коли пред теб.", ref: "ЗДвП чл. 20, ал. 2; чл. 70" },
  ];

  // ---------------- animated driver's view ----------------
  const PAL = {
    day: { sky: "#cfe3f5", grass: "#bcd5a9", road: "#4a4f57", walk: "#cfd5dc", paint: "#ffffff", bld: ["#e8d5b7", "#c9d6e3", "#f1c9a5", "#d6e0c5", "#e3c7d6"], tree: "#4f8a4a", trunk: "#7a5a3c" },
    night: { sky: "#0f1726", grass: "#1d2a22", road: "#23272d", walk: "#30353c", paint: "#9aa0a6", bld: ["#2a2f38", "#262b33", "#2d323a"], tree: "#1b2e1d", trunk: "#2a221b" },
    snow: { sky: "#dfe6ee", grass: "#f4f7fa", road: "#6b7179", walk: "#eef2f6", paint: "#f4f7fa", bld: ["#e8d5b7", "#c9d6e3"], tree: "#5b7f5a", trunk: "#6b5440" },
  };
  function sceneSVG(sc, t, vis) {
    const G = window.BG3D;
    const P = sc.weather === "night" ? PAL.night : sc.weather === "snow" ? PAL.snow : PAL.day;
    const road = sc.road;
    // lane geometry (x in metres, driving direction -y). You drive in the right-most normal lane.
    const lanes = road === "motorway" ? 3 : road === "express" ? 2 : 1;
    const LW = 3.5;
    const median = road === "motorway" || road === "express" ? 3 : 0;
    const halfIn = median / 2, halfOut = halfIn + lanes * LW + (road === "motorway" ? 3 : 0);
    const living = road === "living";
    const myX = living ? 1.2 : halfIn + (lanes - 0.5) * LW;
    const speed = (sc.limit || 60) / 3.6;
    const off = reduce() ? 0 : (t * speed) % 600; // distance driven
    const eye = [myX - 0.35, 0, 1.2];
    const cam = G.camera({ eye, target: [myX - 0.35, -60, 0.7], f: 300, cx: 260, cy: 120, near: 0.1 });
    // repeating objects: every `span` metres, shifted by the distance driven, kept between -span+8 and +8 m
    const rep = (y, span) => ((((y + off) % span) + span) % span) - span + 8;
    let s = `<rect width="520" height="292" fill="${P.sky}"/>`;
    s += cam.poly([[-400, -900, 0], [400, -900, 0], [400, 20, 0], [-400, 20, 0]], `fill="${P.grass}"`);
    const roadW = living ? 5.5 : halfOut;
    if (living) s += cam.poly([[-roadW, -900, 0.01], [roadW, -900, 0.01], [roadW, 20, 0.01], [-roadW, 20, 0.01]], `fill="#8d8f93"`);
    else {
      s += cam.poly([[-halfOut, -900, 0.01], [halfOut, -900, 0.01], [halfOut, 20, 0.01], [-halfOut, 20, 0.01]], `fill="${sc.weather === "ice" ? "#5d6a78" : P.road}"`);
      if (median) s += cam.poly([[-halfIn + 0.6, -900, 0.02], [halfIn - 0.6, -900, 0.02], [halfIn - 0.6, 20, 0.02], [-halfIn + 0.6, 20, 0.02]], `fill="${P.grass}"`);
    }
    const strip = (x, w, y0, y1, fill, z = 0.03) => cam.poly([[x - w / 2, y0, z], [x + w / 2, y0, z], [x + w / 2, y1, z], [x - w / 2, y1, z]], `fill="${fill}"`);
    if (road === "city") { s += strip(-5.5, 4, -900, 20, P.walk, 0.12) + strip(5.5, 4, -900, 20, P.walk, 0.12); }
    // lane markings
    if (!living) {
      for (const sgn of [-1, 1]) s += strip(sgn * (halfOut - (road === "motorway" ? 3 : 0) - 0.1), 0.15, -900, 20, P.paint);
      if (median) for (const sgn of [-1, 1]) s += strip(sgn * (halfIn + 0.1), 0.15, -900, 20, P.paint);
      const dashX = [];
      if (!median) dashX.push(0);
      for (let k = 1; k < lanes; k++) { dashX.push(halfIn + k * LW); dashX.push(-(halfIn + k * LW)); }
      for (const x of dashX) for (let y = 0; y < 300; y += 12) { const yy = rep(y, 300); s += strip(x, 0.15, yy, yy + 4, P.paint); }
    }
    // zebra in town
    if (road === "city") { const yy = rep(-90, 240); for (let x = -3.2; x < 3.4; x += 0.9) s += strip(x, 0.5, yy, yy + 3.2, P.paint, 0.04); }
    const items = [];
    const sideObjects = (gap, fn) => { const span = Math.ceil(250 / gap) * gap; for (let y = 0; y < span; y += gap) fn(rep(y, span)); };
    // buildings / houses / trees / lamps
    if (road === "city") {
      let n = 0;
      sideObjects(16, (yy) => { for (const sgn of [-1, 1]) { const hgt = 7 + ((n * 37) % 5) * 3; items.push(G.box(cam, { x: sgn * 13, y: yy, z0: 0, l: 13, w: 9, h: hgt, yaw: 90, col: P.bld[n % P.bld.length], stroke: "rgba(0,0,0,.18)" })); n++; } });
      sideObjects(24, (yy) => { for (const sgn of [-1, 1]) items.push({ d: cam.depth(sgn * 7.6, yy, 3), s: cam.seg([sgn * 7.6, yy, 0], [sgn * 7.6, yy, 5.5], 0.15, "#5b6168") + cam.ball([sgn * 7.2, yy, 5.5], 0.3, sc.weather === "night" ? "#fff4b0" : "#e7ecf0") }); });
    } else if (living) {
      let n = 0;
      sideObjects(14, (yy) => { for (const sgn of [-1, 1]) { items.push(G.box(cam, { x: sgn * 11, y: yy, z0: 0, l: 9, w: 8, h: 5.5, yaw: 90, col: P.bld[n % P.bld.length], stroke: "rgba(0,0,0,.18)" })); n++; } });
      sideObjects(10, (yy) => { for (const sgn of [-1, 1]) items.push({ d: cam.depth(sgn * 6.4, yy + 5, 2), s: cam.seg([sgn * 6.4, yy + 5, 0], [sgn * 6.4, yy + 5, 1.8], 0.25, P.trunk) + cam.ball([sgn * 6.4, yy + 5, 2.6], 1.3, P.tree) }); });
    } else {
      sideObjects(18, (yy) => { for (const sgn of [-1, 1]) { const x = sgn * (halfOut + 5); items.push({ d: cam.depth(x, yy, 2), s: cam.seg([x, yy, 0], [x, yy, 2.4], 0.35, P.trunk) + cam.ball([x, yy, 3.6], 1.9, sc.weather === "snow" ? "#e7eef3" : P.tree) }); } });
      if (road === "motorway") items.push({ d: cam.depth(0, -50, 0.5), s: cam.poly([[-0.3, -900, 0.8], [0.3, -900, 0.8], [0.3, 20, 0.8], [-0.3, 20, 0.8]], `fill="#b9c0c8"`) });
    }
    // children on the pavement in Zone 30 / living zone
    if (sc.kids) {
      const yy = rep(-60, 200);
      const kid = (x, y, col) => ({ d: cam.depth(x, y, 0.6), s: cam.seg([x, y, 0], [x, y, 0.75], 0.3, "#3b4250") + cam.seg([x, y, 0.75], [x, y, 1.15], 0.42, col) + cam.ball([x, y, 1.35], 0.18, "#f3c7a1") });
      items.push(kid(living ? -3.6 : -4.6, yy, "#f08a24"), kid(living ? -4.2 : -5.2, yy - 1.2, "#2ea44f"));
    }
    // road-side signs (billboards that come towards you)
    const signAt = (href, yy, w = 1.7, hgt = 1.7) => {
      const x = living ? 5.2 : road === "city" ? 4.3 : halfOut + 1.3;
      const b = cam.P(x, yy, 0), top = cam.P(x, yy, 3.2);
      if (!b || !top) return null;
      const k = cam.scale(x, yy, 2.4);
      const sw = w * k, sh = hgt * k;
      return { d: cam.depth(x, yy, 2), s: `<line x1="${b[0].toFixed(1)}" y1="${b[1].toFixed(1)}" x2="${top[0].toFixed(1)}" y2="${top[1].toFixed(1)}" stroke="#8b939c" stroke-width="${Math.max(1, 0.09 * k).toFixed(1)}"/><image href="${href}" x="${(top[0] - sw / 2).toFixed(1)}" y="${(top[1] - sh).toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}"/>` };
    };
    const signY = rep(-24, 140);
    if (sc.zone) items.push(signAt(zoneImg(sc.zone), signY, 1.5, 1.8));
    else if (sc.sign) items.push(signAt(signFile(sc.sign), signY));
    if (sc.disc || (!sc.sign && !sc.zone && sc.limit)) items.push(signAt(discImg(sc.disc || sc.limit), signY - 0.01));
    // section control gantry
    if (sc.gantry) {
      const gy = rep(-120, 300);
      items.push({ d: cam.depth(0, gy, 6), s: cam.seg([-halfOut, gy, 0], [-halfOut, gy, 6.5], 0.3, "#7d858e") + cam.seg([halfOut, gy, 0], [halfOut, gy, 6.5], 0.3, "#7d858e") + cam.seg([-halfOut, gy, 6.5], [halfOut, gy, 6.5], 0.45, "#7d858e") + [-7, -3.5, 3.5, 7].map((x) => cam.ball([x, gy + 0.3, 6.1], 0.35, "#1f2328")).join("") });
    }
    // car ahead: towing car with a rope, or ordinary traffic
    if (sc.tow) {
      items.push(G.car(cam, { x: myX, y: -9, yaw: -90, col: "#7d4fd6", scale: 4.5 / 40 }));
      const a = cam.P(myX, -6.7, 0.5), b = cam.P(myX, -1, 0.45);
      if (a && b) s += "";
      items.push({ d: 1, s: a && b ? `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#ffb21a" stroke-width="4" stroke-dasharray="10 6"/>` : "" });
    } else if (!living) {
      items.push(G.car(cam, { x: myX, y: -42 + Math.sin(t * 0.6) * 4, yaw: -90, col: "#e8833a", scale: 4.5 / 40 }));
      if (!median) items.push(G.car(cam, { x: -1.75, y: ((-200 + off * 2.2) % 220) - 10, yaw: 90, col: "#2ea44f", scale: 4.5 / 40 }));
    }
    s += G.paint(items.filter(Boolean));
    // headlight beam at night
    if (sc.weather === "night") {
      const beam = cam.polyPts([[myX - 1.6, -3, 0.02], [myX + 2.2, -3, 0.02], [myX + 3.2, -vis, 0.02], [myX - 3, -vis, 0.02]]);
      if (beam.length > 2) s += `<polygon points="${beam.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="#fff6b0" opacity=".28"/>`;
    }
    // fog: everything beyond the visibility disappears into white
    if (sc.weather === "fog") {
      const hz = cam.P(myX, -900, 0)[1], pv = cam.P(myX, -vis, 0);
      const yv = pv ? pv[1] : hz + 10;
      s += `<defs><linearGradient id="spd-fog" x1="0" y1="0" x2="0" y2="292" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e9edf0" stop-opacity="1"/><stop offset="${(yv / 292).toFixed(3)}" stop-color="#e9edf0" stop-opacity=".93"/><stop offset="${Math.min(1, (yv + 60) / 292).toFixed(3)}" stop-color="#e9edf0" stop-opacity=".35"/><stop offset="1" stop-color="#e9edf0" stop-opacity=".15"/></linearGradient></defs><rect width="520" height="292" fill="url(#spd-fog)"/>`;
    }
    // falling rain / snow (screen space, driven by time)
    if (sc.weather === "rain" || sc.weather === "snow") {
      const n = sc.weather === "rain" ? 70 : 90;
      for (let i = 0; i < n; i++) {
        const x0 = (i * 137.5) % 520, sp = sc.weather === "rain" ? 520 : 70, ph = (i * 53) % 292;
        const y = (ph + t * sp) % 292, x = sc.weather === "snow" ? x0 + Math.sin(t * 1.3 + i) * 8 : x0 - (y * 0.12);
        s += sc.weather === "rain" ? `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 3).toFixed(1)}" y2="${(y + 16).toFixed(1)}" stroke="#a9c8e6" stroke-width="1.4" opacity=".8"/>` : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${1.4 + (i % 3) * 0.7}" fill="#fff" opacity=".95"/>`;
      }
    }
    if (sc.weather === "ice") for (let i = 0; i < 6; i++) { const p = cam.P(myX - 2 + i * 0.9, -14 - i * 7, 0.05); if (p) s += `<ellipse cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" rx="${(26 - i * 3).toFixed(1)}" ry="2.2" fill="#e8f4ff" opacity=".55"/>`; }
    // bonnet
    s += `<path d="M0 292 L0 262 Q260 228 520 262 L520 292 Z" fill="#2b6fe0"/><path d="M60 270 Q260 244 460 270" stroke="rgba(255,255,255,.25)" stroke-width="3" fill="none"/>`;
    return s;
  }

  // ---------------- speedometer ----------------
  const MAXV = 160, A0 = -120, A1 = 120;
  const ang = (v) => A0 + ((A1 - A0) * clamp(v, 0, MAXV)) / MAXV;
  const polar = (r, a) => [100 + r * Math.sin(rad(a)), 100 - r * Math.cos(rad(a))];
  const arc = (r, a, b) => { const [x0, y0] = polar(r, a), [x1, y1] = polar(r, b); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  function gauge() {
    let s = `<circle cx="100" cy="100" r="96" fill="#14171b"/><path d="${arc(80, A0, A1)}" stroke="#2c3138" stroke-width="10" fill="none"/>`;
    s += `<path class="g-ok" stroke="#2ea44f" stroke-width="10" fill="none"/><path class="g-over" stroke="#e0352b" stroke-width="10" fill="none"/>`;
    for (let v = 0; v <= MAXV; v += 10) {
      const [x0, y0] = polar(v % 20 ? 70 : 66, ang(v)), [x1, y1] = polar(74, ang(v));
      s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#cfd5dc" stroke-width="${v % 20 ? 1.5 : 2.5}"/>`;
      if (v % 20 === 0) { const [tx, ty] = polar(55, ang(v)); s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="10" fill="#cfd5dc" text-anchor="middle" dominant-baseline="central" font-weight="600">${v}</text>`; }
    }
    s += `<g class="g-needle" style="transform-origin:100px 100px;transition:transform .9s cubic-bezier(.3,1.4,.5,1)"><path d="M97 104 L100 30 L103 104 Z" fill="#ff5a3c"/></g><circle cx="100" cy="100" r="7" fill="#e7ecf0"/>`;
    s += `<text class="g-val" x="100" y="146" font-size="30" font-weight="800" fill="#fff" text-anchor="middle">0</text><text x="100" y="166" font-size="10" fill="#9aa0a6" text-anchor="middle">km/h</text>`;
    return `<svg class="spd-gauge" viewBox="0 0 200 200" role="img" aria-label="Скоростомер">${s}</svg>`;
  }
  function setGauge(el, v, color) {
    el.querySelector(".g-needle").style.transform = `rotate(${ang(v)}deg)`;
    el.querySelector(".g-ok").setAttribute("d", v > 0 ? arc(80, A0, ang(v)) : "");
    el.querySelector(".g-ok").setAttribute("stroke", color || "#2ea44f");
    el.querySelector(".g-over").setAttribute("d", arc(80, ang(v), A1));
    const val = el.querySelector(".g-val");
    val.textContent = color ? `≈${v}` : v;
  }

  // ---------------- page ----------------
  function page(themeToggle) {
    let cur = SCEN[0];
    let playing = false, raf = null, t0 = 0, tNow = 0;
    const calcState = { vis: 50, surf: "wet", road: "izvan" };
    const el = h(`<div class="spd">
      <header class="large">${themeToggle}<span class="eyebrow">Категория B · ЗДвП 2025</span><h1>Скорости</h1><p class="lede">Колко бързо може – в града, в зона, извън града, на магистрала, в дъжд, мъгла, сняг и нощем. Избери ситуация.</p></header>
      <div class="spd-pick" role="group" aria-label="Ситуация">${SCEN.map((x) => `<button type="button" data-id="${x.id}" aria-pressed="false"><span class="spd-ic">${x.calc ? `<span class="spd-w">${wicon(x.weather)}</span>` : x.zone ? `<img src="${zoneImg(x.zone)}" alt="">` : x.sign ? `<img src="${signFile(x.sign)}" alt="">` : disc(x.disc || x.limit, 34)}</span><span class="spd-t">${x.title}</span><b>${x.calc ? "по условията" : x.limit}</b></button>`).join("")}</div>
      <div class="spd-main">
        <figure class="spd-scene"><svg viewBox="0 0 520 292" role="img" aria-label="Изглед от шофьорското място"></svg><button type="button" class="play-btn spd-play" aria-label="Пусни анимацията"></button></figure>
        <div class="spd-info">
          <div class="spd-g"></div>
          <div class="spd-text"></div>
        </div>
      </div>
      <div class="spd-calc card" hidden></div>
      <h2 class="section-title">Всички на един поглед</h2>
      <div class="list facts spd-sum"></div>
    </div>`);
    const svg = el.querySelector(".spd-scene svg");
    const gEl = el.querySelector(".spd-g");
    gEl.innerHTML = gauge();
    const text = el.querySelector(".spd-text");
    const calc = el.querySelector(".spd-calc");
    const playBtn = el.querySelector(".spd-play");
    const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>`;
    const PAUSE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>`;

    const visNow = () => (cur.calc ? calcState.vis : 80);
    const draw = () => { svg.innerHTML = sceneSVG(cur, tNow, visNow()); };
    let lastFrame = 0;
    function loop(ts) {
      if (!playing) return;
      if (!el.isConnected) { playing = false; return; }
      if (ts - lastFrame > 33) { tNow = (ts - t0) / 1000; draw(); lastFrame = ts; }
      raf = requestAnimationFrame(loop);
    }
    function setPlay(on) {
      playing = on;
      playBtn.innerHTML = on ? PAUSE : PLAY;
      playBtn.setAttribute("aria-label", on ? "Пауза" : "Пусни анимацията");
      el.querySelector(".spd-scene").classList.toggle("is-playing", on);
      if (on) { t0 = performance.now() - tNow * 1000; raf = requestAnimationFrame(loop); } else if (raf) cancelAnimationFrame(raf);
    }
    playBtn.addEventListener("click", () => setPlay(!playing));
    setPlay(false);

    function calcHTML() {
      const a = SURF[calcState.surf].a;
      const safe = safeSpeed(calcState.vis, a);
      const cap = ROADS[calcState.road][1];
      const v = Math.min(safe, cap);
      const d = stopDist(v, a), react = v / 3.6;
      const scale = (m) => clamp((m / Math.max(calcState.vis, d) ) * 100, 0, 100);
      return { v, safe, cap, html: `<h3>Сметни безопасната скорост</h3>
        <p class="spd-note">Сметка, не закон: 1 секунда реакция + спиране. Законът казва само „да спреш пред всяко предвидимо препятствие“ (ЗДвП чл. 20, ал. 2).</p>
        <label class="range">Видимост напред <input type="range" min="20" max="300" step="5" value="${calcState.vis}" data-k="vis"><output>${calcState.vis} м</output></label>
        <div class="spd-row"><span>Настилка</span><div class="seg" role="group" aria-label="Настилка">${Object.entries(SURF).map(([k, x]) => `<button type="button" data-surf="${k}" aria-pressed="${k === calcState.surf}">${x.t}</button>`).join("")}</div></div>
        <div class="spd-row"><span>Път</span><div class="seg" role="group" aria-label="Път">${Object.entries(ROADS).map(([k, x]) => `<button type="button" data-road="${k}" aria-pressed="${k === calcState.road}">${x[0]} (${x[1]})</button>`).join("")}</div></div>
        <div class="spd-bar" aria-hidden="true"><span class="r" style="width:${scale(react)}%"></span><span class="b" style="width:${scale(d - react)}%"></span><i style="left:${scale(calcState.vis)}%"></i></div>
        <p class="spd-legend"><span class="r"></span>реакция ${react.toFixed(0)} м <span class="b"></span>спиране ${(d - react).toFixed(0)} м <span class="v"></span>видимост ${calcState.vis} м</p>
        <p class="spd-result">Най-много <b>≈ ${v} km/h</b>${safe > cap ? ` – тук таванът е ограничението на пътя (${cap}).` : ` – по-бързо от това няма да спреш в разстоянието, което виждаш.`}</p>` };
    }
    function renderCalc() {
      if (!cur.calc) { calc.hidden = true; return null; }
      calc.hidden = false;
      const r = calcHTML();
      calc.innerHTML = r.html;
      calc.querySelector("input").addEventListener("input", (e) => { calcState.vis = +e.target.value; update(); });
      calc.querySelectorAll("[data-surf]").forEach((b) => b.addEventListener("click", () => { calcState.surf = b.dataset.surf; update(); }));
      calc.querySelectorAll("[data-road]").forEach((b) => b.addEventListener("click", () => { calcState.road = b.dataset.road; update(); }));
      return r;
    }
    function update() {
      const r = renderCalc();
      if (r) {
        const ae = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null;
        if (ae === "vis") calc.querySelector("input").focus();
        setGauge(gEl, r.v, "#f5b301");
      } else setGauge(gEl, cur.limit);
      draw();
    }
    function select(id) {
      cur = SCEN.find((x) => x.id === id) || SCEN[0];
      el.querySelectorAll(".spd-pick button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === cur.id)));
      if (cur.calc) Object.assign(calcState, cur.calc);
      text.innerHTML = `<h3>${cur.title}</h3>${cur.calc ? `<span class="pill wait">Няма отделно число – по видимостта</span>` : `<span class="pill info">До ${cur.limit} km/h</span>`}<p>${cur.text}</p><div class="sx-mnem"><span>Как да запомниш</span><p>${cur.tip}</p></div><span class="lawref">${cur.ref}</span>`;
      update();
    }
    el.querySelectorAll(".spd-pick button").forEach((b) => b.addEventListener("click", () => select(b.dataset.id)));
    el.querySelector(".spd-sum").innerHTML = SCEN.map((x) => `<button type="button" class="fact spd-sum-row" data-id="${x.id}"><span class="fv">${x.calc ? "≈" : x.limit}</span><div><span class="ft">${x.title}</span><span class="fr">${x.ref}</span></div></button>`).join("");
    el.querySelectorAll(".spd-sum-row").forEach((b) => b.addEventListener("click", () => { select(b.dataset.id); el.querySelector(".spd-main").scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "center" }); }));
    select(cur.id);
    return el;
  }

  window.BGSpeeds = { page, SCEN, safeSpeed, stopDist };
})();
