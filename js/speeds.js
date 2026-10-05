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
  const mod = (a, n) => ((a % n) + n) % n;
  const CAR_COLS = ["#e8833a", "#2ea44f", "#d9443a", "#f2f2f2", "#3c4654", "#7d4fd6", "#c9a227", "#5aa0e6", "#8b939c"];
  function sceneSVG(sc, t, vis, shown) {
    const G = window.BG3D;
    const night = sc.weather === "night";
    const P = night ? PAL.night : sc.weather === "snow" ? PAL.snow : PAL.day;
    const road = sc.road, living = road === "living", city = road === "city";
    // lane geometry (x in metres, you drive towards -y)
    const LW = 3.5;
    const lanes = road === "motorway" ? 3 : road === "express" ? 2 : 1;
    const median = road === "motorway" || road === "express" ? 3 : 0;
    const shoulder = road === "motorway" ? 3 : road === "express" ? 1.5 : 0;
    const park = city ? 2.3 : 0; // parking strip along the kerb in town
    const halfIn = median / 2;
    const laneEdge = halfIn + lanes * LW; // outer edge of the driving lanes
    const halfOut = living ? 3.2 : laneEdge + shoulder + park;
    const myLane = road === "motorway" ? 1 : lanes - 1; // 0 = next to the median / centre line
    const laneX = (k, dir = 1) => dir * (halfIn + (k + 0.5) * LW); // dir -1 = oncoming side
    const myX = living ? 1.2 : laneX(myLane);
    const vMe = (shown || sc.limit || 60) / 3.6;
    const off = reduce() ? 0 : t * vMe; // distance driven
    const eye = [myX - 0.35, 0, 1.2];
    const cam = G.camera({ eye, target: [myX - 0.35, -60, 0.75], f: 300, cx: 260, cy: 118, near: 0.1 });
    const rep = (y, span) => mod(y + off, span) - span + 8; // repeating roadside object
    const strip = (x, w, y0, y1, fill, z = 0.03) => cam.poly([[x - w / 2, y0, z], [x + w / 2, y0, z], [x + w / 2, y1, z], [x - w / 2, y1, z]], `fill="${fill}"`);
    const hz = cam.P(myX, -2000, 0)[1];

    // ---- sky, clouds, hills ----
    let s = `<rect width="520" height="292" fill="${P.sky}"/>`;
    if (night) for (let i = 0; i < 40; i++) s += `<circle cx="${(i * 97) % 520}" cy="${(i * 37) % Math.max(10, hz - 8)}" r="${i % 4 ? 0.7 : 1.2}" fill="#fff" opacity=".7"/>`;
    else for (let i = 0; i < 5; i++) { const cx = mod(i * 140 + t * 4, 640) - 60, cy = 18 + (i % 3) * 16; s += `<g fill="#fff" opacity="${sc.weather === "rain" ? 0.55 : 0.85}"><ellipse cx="${cx}" cy="${cy}" rx="34" ry="9"/><ellipse cx="${cx - 14}" cy="${cy - 6}" rx="16" ry="8"/><ellipse cx="${cx + 12}" cy="${cy - 7}" rx="18" ry="9"/></g>`; }
    if (sc.weather === "rain") s += `<rect width="520" height="${hz}" fill="#8796a5" opacity=".35"/>`;
    const hill = night ? "#1a2430" : sc.weather === "snow" ? "#dfe7ee" : "#a9c3a0";
    s += `<path d="M0 ${hz} L0 ${hz - 16} Q60 ${hz - 34} 120 ${hz - 18} T240 ${hz - 22} T360 ${hz - 12} T440 ${hz - 28} T520 ${hz - 14} L520 ${hz} Z" fill="${hill}"/>`;
    s += `<path d="M0 ${hz} L0 ${hz - 6} Q90 ${hz - 18} 170 ${hz - 8} T330 ${hz - 9} T520 ${hz - 6} L520 ${hz} Z" fill="${night ? "#16202a" : sc.weather === "snow" ? "#eef2f6" : "#9bbb8f"}"/>`;

    // ---- ground and fields ----
    s += cam.poly([[-600, -2000, 0], [600, -2000, 0], [600, 20, 0], [-600, 20, 0]], `fill="${P.grass}"`);
    if (!city && !living && sc.weather !== "snow") for (let k = 0; k < 8; k++) { const y0 = -2000 + k * 250; s += cam.poly([[-600, y0, 0], [-halfOut - 12, y0, 0], [-halfOut - 12, y0 + 125, 0], [-600, y0 + 125, 0]], `fill="${night ? "#202e25" : "#c9dbb0"}"`) + cam.poly([[halfOut + 12, y0 + 125, 0], [600, y0 + 125, 0], [600, y0 + 250, 0], [halfOut + 12, y0 + 250, 0]], `fill="${night ? "#1a271f" : "#b2cd98"}"`); }
    // ---- road surface ----
    const roadCol = sc.weather === "ice" ? "#5d6a78" : living ? "#8d8f93" : P.road;
    s += cam.poly([[-halfOut, -2000, 0.01], [halfOut, -2000, 0.01], [halfOut, 20, 0.01], [-halfOut, 20, 0.01]], `fill="${roadCol}"`);
    if (median) s += cam.poly([[-halfIn + 0.5, -2000, 0.02], [halfIn - 0.5, -2000, 0.02], [halfIn - 0.5, 20, 0.02], [-halfIn + 0.5, 20, 0.02]], `fill="${P.grass}"`);
    if (living) for (let y = 0; y < 220; y += 2.2) { const yy = rep(y, 220); s += strip(0, 6.4, yy, yy + 0.08, "rgba(0,0,0,.08)", 0.015); }
    if (city) { s += strip(-(halfOut + 2), 4, -2000, 20, P.walk, 0.14) + strip(halfOut + 2, 4, -2000, 20, P.walk, 0.14); s += strip(-halfOut - 0.05, 0.12, -2000, 20, "#9aa3ad", 0.16) + strip(halfOut + 0.05, 0.12, -2000, 20, "#9aa3ad", 0.16); }
    if (living) { s += strip(-5.2, 4, -2000, 20, "#b9a98f", 0.05) + strip(5.2, 4, -2000, 20, "#b9a98f", 0.05); }
    // wet / icy sheen
    if (sc.weather === "rain") for (let i = 0; i < 5; i++) { const p0 = cam.P(myX - 1 + (i % 2) * 1.5, -10 - i * 9, 0.02); if (p0) s += `<ellipse cx="${p0[0].toFixed(1)}" cy="${p0[1].toFixed(1)}" rx="${(30 - i * 4).toFixed(1)}" ry="1.8" fill="#b9cde0" opacity=".35"/>`; }
    // ---- markings ----
    if (!living) {
      for (const sgn of [-1, 1]) s += strip(sgn * (laneEdge + 0.1), 0.15, -2000, 20, P.paint);
      if (median) for (const sgn of [-1, 1]) s += strip(sgn * (halfIn + 0.1), 0.15, -2000, 20, P.paint);
      const dashX = [];
      if (!median) dashX.push(0);
      for (let k = 1; k < lanes; k++) dashX.push(halfIn + k * LW, -(halfIn + k * LW));
      for (const x of dashX) for (let y = 0; y < 360; y += 12) { const yy = rep(y, 360); s += strip(x, 0.15, yy, yy + 4, P.paint); }
      if (city) for (let y = 0; y < 360; y += 6) { const yy = rep(y, 360); for (const sgn of [-1, 1]) s += strip(sgn * (laneEdge + park), 0.1, yy, yy + 2.5, "rgba(255,255,255,.55)"); }
    }
    // ---- town junction: cross street, zebra, stop line, traffic lights ----
    const items = [];
    let junctionY = null;
    if (city) {
      junctionY = rep(-130, 220);
      const jy = junctionY;
      s += cam.poly([[-300, jy - 5, 0.025], [300, jy - 5, 0.025], [300, jy + 5, 0.025], [-300, jy + 5, 0.025]], `fill="${P.road}"`);
      for (let x = -3.2; x <= 3.2; x += 0.9) s += strip(x, 0.5, jy + 6, jy + 9, P.paint, 0.04);
      s += strip(1.75, 3.3, jy + 9.6, jy + 10.1, P.paint, 0.04);
      const light = (x, y) => ({ d: cam.depth(x, y, 2), s: cam.seg([x, y, 0], [x, y, 3.4], 0.14, "#3a3f45") + cam.seg([x, y, 3.4], [x, y, 4.5], 0.42, "#1b1e22") + cam.ball([x, y - 0.25, 4.3], 0.13, "#3a1414") + cam.ball([x, y - 0.25, 3.95], 0.13, "#3a3214") + cam.ball([x, y - 0.25, 3.6], 0.15, "#22d36b") });
      items.push(light(halfOut + 0.6, jy + 5.5), light(-halfOut - 0.6, jy - 5.5));
      // cross traffic waiting at red, one car turning
      items.push(vehicle("car", -12, jy + 2.4, 0, CAR_COLS[2]), vehicle("car", 14, jy - 2.4, 180, CAR_COLS[5]));
    }

    // ---- roadside scenery ----
    const sideObjects = (gap, span, fn) => { for (let y = 0; y < span; y += gap) fn(rep(y, span), Math.round(y / gap)); };
    if (city) {
      sideObjects(15, 240, (yy, n) => {
        if (junctionY !== null && Math.abs(yy - junctionY) < 10) return;
        for (const sgn of [-1, 1]) {
          const k = n * 2 + (sgn > 0 ? 1 : 0), hgt = 9 + (k * 37 % 5) * 3, x = sgn * (halfOut + 4.5 + 4.5);
          const col = P.bld[k % P.bld.length];
          const b = G.box(cam, { x, y: yy, z0: 0, l: 13.5, w: 9, h: hgt, yaw: 90, col, stroke: "rgba(0,0,0,.18)" });
          // windows and a shop awning on the facade that faces the road
          const fx = x - sgn * 4.52;
          let win = "";
          if (cam.depth(fx, yy, 3) < 140) {
            for (let z = 3.6; z < hgt - 1; z += 3) for (let dy = -5; dy <= 5; dy += 2.5) win += cam.poly([[fx, yy + dy - 0.6, z], [fx, yy + dy + 0.6, z], [fx, yy + dy + 0.6, z + 1.4], [fx, yy + dy - 0.6, z + 1.4]], `fill="${night ? (k + z) % 3 ? "#ffd97a" : "#2b3038" : "#8fb4d6"}"`);
            win += cam.poly([[fx - sgn * 0.02, yy - 6.4, 2.4], [fx - sgn * 0.02, yy + 6.4, 2.4], [fx - sgn * 1.2, yy + 6.4, 2.9], [fx - sgn * 1.2, yy - 6.4, 2.9]], `fill="${["#d9443a", "#2ea44f", "#2f6fdc", "#f08a24"][k % 4]}" opacity=".9"`);
            win += cam.poly([[fx, yy - 5.5, 0.2], [fx, yy + 5.5, 0.2], [fx, yy + 5.5, 2.3], [fx, yy - 5.5, 2.3]], `fill="${night ? "#f7e2a0" : "#bcd3e6"}"`);
          }
          items.push({ d: b.d, s: b.s + win });
        }
      });
      sideObjects(24, 240, (yy) => { for (const sgn of [-1, 1]) { const x = sgn * (halfOut + 0.6); items.push({ d: cam.depth(x, yy, 3), s: cam.seg([x, yy, 0], [x, yy, 6], 0.15, "#5b6168") + cam.seg([x, yy, 6], [x - sgn * 1.2, yy, 6.2], 0.12, "#5b6168") + cam.ball([x - sgn * 1.2, yy, 6.1], 0.28, night ? "#fff4b0" : "#e7ecf0") + (night ? cam.ball([x - sgn * 1.2, yy, 0.05], 2.2, "rgba(255,240,170,.14)") : "") }); } });
      sideObjects(12, 240, (yy, n) => { if (n % 2) return; for (const sgn of [-1, 1]) { const x = sgn * (halfOut + 2.6); items.push({ d: cam.depth(x, yy + 6, 2), s: cam.seg([x, yy + 6, 0], [x, yy + 6, 2.2], 0.22, P.trunk) + cam.ball([x, yy + 6, 3.1], 1.2, P.tree) }); } });
      // parked cars along both kerbs
      sideObjects(7, 252, (yy, n) => { if ((n * 7) % 5 === 0 || (junctionY !== null && Math.abs(yy - junctionY) < 12)) return; for (const sgn of [-1, 1]) if ((n + (sgn > 0 ? 1 : 0)) % 3) items.push(vehicle("car", sgn * (laneEdge + park / 2), yy, sgn > 0 ? -90 : 90, CAR_COLS[(n * 3 + (sgn > 0 ? 1 : 0)) % CAR_COLS.length], 0.92)); });
      // pedestrians on the pavement
      sideObjects(9, 243, (yy, n) => { const sgn = n % 2 ? 1 : -1; const walk = mod(t * 1.3 + n, 6); items.push(person(sgn * (halfOut + 1.8), yy - walk, ["#f08a24", "#2f6fdc", "#2ea44f", "#d9443a", "#7d4fd6"][n % 5])); });
    } else if (living) {
      sideObjects(13, 247, (yy, n) => { for (const sgn of [-1, 1]) { const k = n * 2 + (sgn > 0 ? 1 : 0); const x = sgn * 12; const b = G.box(cam, { x, y: yy, z0: 0, l: 9, w: 8, h: 4.2, yaw: 90, col: P.bld[k % P.bld.length], stroke: "rgba(0,0,0,.18)" }); const roof = cam.poly([[x - 4.2, yy - 4.7, 4.2], [x + 4.2, yy - 4.7, 4.2], [x + 4.2, yy + 4.7, 4.2], [x - 4.2, yy + 4.7, 4.2]], `fill="#b4553f"`) ; const fx = x - sgn * 4.02; const w = cam.depth(fx, yy, 2) < 90 ? cam.poly([[fx, yy - 2.5, 1.2], [fx, yy - 0.8, 1.2], [fx, yy - 0.8, 2.6], [fx, yy - 2.5, 2.6]], `fill="#8fb4d6"`) + cam.poly([[fx, yy + 1, 0], [fx, yy + 2.4, 0], [fx, yy + 2.4, 2.2], [fx, yy + 1, 2.2]], `fill="#6b4a33"`) : ""; items.push({ d: b.d, s: b.s + roof + w }); } });
      sideObjects(8, 248, (yy, n) => { for (const sgn of [-1, 1]) { const x = sgn * (6.6 + (n % 2) * 0.6); items.push({ d: cam.depth(x, yy + 3, 2), s: cam.seg([x, yy + 3, 0], [x, yy + 3, 1.7], 0.22, P.trunk) + cam.ball([x, yy + 3, 2.5], 1.2, P.tree) }); } });
      sideObjects(4, 248, (yy, n) => { for (const sgn of [-1, 1]) items.push({ d: cam.depth(sgn * 7.6, yy, 0.5), s: cam.seg([sgn * 7.6, yy, 0], [sgn * 7.6, yy, 1], 0.08, "#f1efe8") + cam.seg([sgn * 7.6, yy - 2, 0.85], [sgn * 7.6, yy + 2, 0.85], 0.06, "#f1efe8") }); });
      sideObjects(31, 248, (yy, n) => items.push(vehicle("car", (n % 2 ? 1 : -1) * 4.4, yy, n % 2 ? -90 : 90, CAR_COLS[n % CAR_COLS.length], 0.9)));
      // a ball rolling across and a cyclist
      const by = rep(-40, 120);
      items.push({ d: cam.depth(-2 + mod(t * 1.2, 5), by, 0.2), s: cam.ball([-2 + mod(t * 1.2, 5), by, 0.18], 0.18, "#e0352b") });
      items.push(person(-2.2, rep(-75, 160) - mod(t * 3, 30), "#2ea44f", true));
    } else {
      // trees, km posts, power line, crash barriers
      sideObjects(16, 256, (yy, n) => { for (const sgn of [-1, 1]) { if ((n + (sgn > 0 ? 0 : 1)) % 3 === 0) continue; const x = sgn * (halfOut + 6 + (n % 3) * 2.5); const c = sc.weather === "snow" ? "#e7eef3" : n % 2 ? P.tree : "#5f9a52"; items.push({ d: cam.depth(x, yy, 2), s: cam.seg([x, yy, 0], [x, yy, 2.6], 0.35, P.trunk) + cam.ball([x, yy, 3.8], 1.9 + (n % 3) * 0.3, c) + cam.ball([x - 0.7, yy, 4.6], 1.2, c) }); } });
      sideObjects(50, 250, (yy) => { const x = halfOut + 1; items.push({ d: cam.depth(x, yy, 0.5), s: cam.seg([x, yy, 0], [x, yy, 1.1], 0.14, "#f4f4f2") + cam.seg([x, yy, 0.8], [x, yy, 1.0], 0.15, "#1f2328") }); });
      sideObjects(40, 240, (yy) => { const x = -(halfOut + 14); items.push({ d: cam.depth(x, yy, 5), s: cam.seg([x, yy, 0], [x, yy, 9], 0.25, night ? "#2a2f36" : "#7b6a55") + cam.seg([x, yy - 0.01, 8.4], [x + 1.6, yy, 8.4], 0.12, "#7b6a55") }); });
      if (road !== "rural") {
        for (const sgn of [-1, 1]) s += cam.poly([[sgn * (halfOut + 0.3), -2000, 0.75], [sgn * (halfOut + 0.3), 20, 0.75], [sgn * (halfOut + 0.3), 20, 0.45], [sgn * (halfOut + 0.3), -2000, 0.45]], `fill="#b9c0c8"`);
        s += cam.poly([[-0.25, -2000, 0.9], [0.25, -2000, 0.9], [0.25, 20, 0.9], [-0.25, 20, 0.9]], `fill="#c6ccd3"`) + cam.poly([[-0.25, -2000, 0.4], [-0.25, 20, 0.4], [-0.25, 20, 0.9], [-0.25, -2000, 0.9]], `fill="#9aa2ab"`);
      }
      if (road === "motorway") {
        // overhead direction sign
        const gy = rep(-150, 400);
        items.push({ d: cam.depth(halfIn + 5, gy, 6), s: cam.seg([laneEdge + shoulder + 0.5, gy, 0], [laneEdge + shoulder + 0.5, gy, 7], 0.3, "#7d858e") + cam.seg([halfIn + 0.6, gy, 7], [laneEdge + shoulder + 0.5, gy, 7], 0.3, "#7d858e") + cam.poly([[halfIn + 1.4, gy, 5.2], [laneEdge - 0.4, gy, 5.2], [laneEdge - 0.4, gy, 7.6], [halfIn + 1.4, gy, 7.6]], `fill="#1f7a3a" stroke="#fff" stroke-width="1"`) });
        const tp = cam.P((halfIn + laneEdge) / 2, gy, 6.6);
        if (tp && cam.depth(0, gy, 6) > 4) items.push({ d: cam.depth(halfIn + 4, gy, 6) - 0.1, s: `<text x="${tp[0].toFixed(1)}" y="${tp[1].toFixed(1)}" font-size="${Math.max(4, cam.scale(0, gy, 6) * 0.9).toFixed(1)}" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">София ↑</text>` });
        // overpass
        const oy = rep(-260, 520);
        items.push({ d: cam.depth(0, oy, 6), s: cam.poly([[-60, oy - 4, 5.4], [60, oy - 4, 5.4], [60, oy - 4, 7.2], [-60, oy - 4, 7.2]], `fill="#a3abb4"`) + cam.poly([[-60, oy - 4, 7.2], [60, oy - 4, 7.2], [60, oy - 4, 8], [-60, oy - 4, 8]], `fill="#c6ccd3"`) + [-halfOut - 2, halfOut + 2].map((x) => cam.poly([[x - 0.6, oy - 4, 0], [x + 0.6, oy - 4, 0], [x + 0.6, oy - 4, 5.4], [x - 0.6, oy - 4, 5.4]], `fill="#8f979f"`)).join("") });
      }
    }
    // children in Zone 30 / living zone
    if (sc.kids) {
      const yy = rep(-55, 180);
      const kx = living ? -3.4 : -(halfOut + 1.2);
      items.push(person(kx, yy, "#f08a24", false, 0.7), person(kx - 0.7, yy - 1.1, "#2ea44f", false, 0.65));
    }
    // ---- road-side signs ----
    const signAt = (href, yy, w = 1.7, hgt = 1.7) => {
      const x = living ? 4.6 : city ? halfOut + 0.9 : halfOut + 1.3;
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
    if (sc.gantry) {
      const gy = rep(-120, 300);
      items.push({ d: cam.depth(0, gy, 6), s: cam.seg([-halfOut, gy, 0], [-halfOut, gy, 6.5], 0.3, "#7d858e") + cam.seg([halfOut, gy, 0], [halfOut, gy, 6.5], 0.3, "#7d858e") + cam.seg([-halfOut, gy, 6.5], [halfOut, gy, 6.5], 0.45, "#7d858e") + [-7, -3.5, 3.5, 7].map((x) => cam.ball([x, gy + 0.3, 6.1], 0.35, "#1f2328")).join("") });
    }

    // a pedestrian (bike = cyclist) as a small 3D figure
    function person(x, y, col, bike = false, k = 1) {
      if (y > 4 || y < -200) return null;
      let g = "";
      if (bike) g += cam.ball([x, y - 0.6, 0.35], 0.33, "none", 'stroke="#222" stroke-width="1.6"') + cam.ball([x, y + 0.6, 0.35], 0.33, "none", 'stroke="#222" stroke-width="1.6"') + cam.seg([x, y - 0.6, 0.35], [x, y, 0.75], 0.05, "#d9443a") + cam.seg([x, y, 0.75], [x, y + 0.6, 0.35], 0.05, "#d9443a");
      const z0 = bike ? 0.7 : 0;
      if (!bike) g += cam.seg([x - 0.1 * k, y, 0], [x - 0.1 * k, y, 0.85 * k], 0.14 * k, "#3b4250") + cam.seg([x + 0.1 * k, y, 0], [x + 0.1 * k, y, 0.85 * k], 0.14 * k, "#3b4250");
      g += cam.seg([x, y, z0 + 0.85 * k], [x, y, z0 + 1.45 * k], 0.42 * k, col) + cam.ball([x, y, z0 + 1.66 * k], 0.15 * k, "#f3c7a1");
      return { d: cam.depth(x, y, 1), s: g };
    }
    // ---- traffic ----
    function vehicle(kind, x, y, yaw, col, sc2 = 1) {
      if (y > 6 || y < -700) return null;
      const glowFront = night && Math.cos(rad(yaw)) * 0 + Math.sin(rad(yaw)) > 0.5; // heading towards you
      let out;
      if (kind === "car") out = G.car(cam, { x, y, yaw, col, scale: (4.4 / 40) * sc2 });
      else {
        const len = kind === "truck" ? 12 : kind === "bus" ? 11.5 : 5.2, w = kind === "van" ? 2 : 2.5;
        const a = rad(yaw), ux = Math.cos(a), uy = Math.sin(a);
        const parts = [];
        if (kind === "truck") {
          parts.push(G.box(cam, { x: x - ux * 1.6, y: y - uy * 1.6, z0: 1.0, l: 8.8, w, h: 2.9, yaw, col }));
          parts.push(G.box(cam, { x: x + ux * 4.5, y: y + uy * 4.5, z0: 0.6, l: 2.4, w, h: 2.6, yaw, col: "#e7ecf0", faces: {} }));
          parts.push(G.box(cam, { x: x + ux * 5.73, y: y + uy * 5.73, z0: 1.9, l: 0.02, w: w - 0.3, h: 1.0, yaw, col: "#7fa7c9" }));
        } else if (kind === "bus") {
          parts.push(G.box(cam, { x, y, z0: 0.35, l: len, w, h: 1.1, yaw, col }));
          parts.push(G.box(cam, { x, y, z0: 1.45, l: len, w: w - 0.02, h: 1.25, yaw, col: "#5f7d99", faces: { top: col } }));
          parts.push(G.box(cam, { x, y, z0: 2.7, l: len, w, h: 0.3, yaw, col }));
        } else {
          parts.push(G.box(cam, { x, y, z0: 0.35, l: len, w, h: 1.9, yaw, col }));
          parts.push(G.box(cam, { x: x + ux * (len / 2 - 0.4), y: y + uy * (len / 2 - 0.4), z0: 1.1, l: 0.8, w: w - 0.2, h: 0.9, yaw, col: "#7fa7c9" }));
        }
        for (const [s1, t1] of [[len / 2 - 1.6, -w / 2], [len / 2 - 1.6, w / 2], [-len / 2 + 1.8, -w / 2], [-len / 2 + 1.8, w / 2]]) parts.push(G.box(cam, { x: x + ux * s1 - uy * t1, y: y + uy * s1 + ux * t1, z0: 0, l: 1, w: 0.4, h: 0.9, yaw, col: "#202428", stroke: "none" }));
        const shadow = cam.poly([[x - 1.4, y - len / 2, 0.02], [x + 1.4, y - len / 2, 0.02], [x + 1.4, y + len / 2, 0.02], [x - 1.4, y + len / 2, 0.02]].map(([px, py, pz]) => (Math.abs(uy) > 0.5 ? [px, py, pz] : [x + (py - y), y + (px - x), pz])), `fill="rgba(0,0,0,.22)"`);
        const lamps = [-0.9, 0.9].map((tt) => cam.ball([x - ux * (len / 2) - uy * tt, y - uy * (len / 2) + ux * tt, 0.9], 0.13, "#e0352b")).join("") + [-0.9, 0.9].map((tt) => cam.ball([x + ux * (len / 2) - uy * tt, y + uy * (len / 2) + ux * tt, 0.8], 0.13, "#fff6c2")).join("");
        out = { d: cam.depth(x, y, 1.4), s: shadow + G.paint(parts) + lamps };
      }
      if (night) {
        const sgnF = glowFront ? 1 : -1, a = rad(yaw), ux = Math.cos(a), uy = Math.sin(a), half = kind === "car" ? 2.2 : 5.5;
        const col2 = glowFront ? "rgba(255,246,200,.55)" : "rgba(255,60,40,.5)";
        out.s += [-0.7, 0.7].map((tt) => cam.ball([x + sgnF * ux * half - uy * tt, y + sgnF * uy * half + ux * tt, 0.8], glowFront ? 0.6 : 0.35, col2)).join("");
      }
      if (sc.weather === "rain" && y < -3 && y > -60 && Math.sin(rad(yaw)) < -0.5) out.s += cam.ball([x, y + 3.2, 0.5], 1.4, "rgba(220,230,240,.35)");
      return out;
    }
    // vehicles in a lane, moving with speed v (m/s) in direction dir (-1 = same as you, +1 = towards you), wrapped in a window
    const flow = (x, dir, v, list, span, spread = 0) => list.forEach(([kind, y0, col], i) => {
      const rel = dir < 0 ? v - vMe : v + vMe; // positive = moves towards -y faster than you (same dir) / approaches (oncoming)
      const y = dir < 0 ? mod(y0 - rel * t, span) - span + 4 : mod(y0 + rel * t, span) - span + 6;
      items.push(vehicle(kind, x + (spread ? Math.sin(i * 7.1) * spread : 0), y, dir < 0 ? -90 : 90, col));
    });
    if (sc.tow) {
      items.push(G.car(cam, { x: myX, y: -9, yaw: -90, col: "#7d4fd6", scale: 4.4 / 40 }));
      const a = cam.P(myX, -6.7, 0.5), b = cam.P(myX, -1, 0.45);
      items.push({ d: 1, s: a && b ? `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#ffb21a" stroke-width="4" stroke-dasharray="10 6"/>` : "" });
      flow(laneX(0, -1), 1, 20, [["car", -40, CAR_COLS[1]], ["truck", -150, "#2f6fdc"], ["car", -230, CAR_COLS[3]]], 320);
    } else if (city) {
      // the car ahead keeps a 2-second gap; a bus and cars come towards you
      items.push(vehicle("car", myX, -28 + Math.sin(t * 0.5) * 1.5, -90, CAR_COLS[0]), vehicle("van", myX, -62 + Math.sin(t * 0.4) * 2, -90, "#f2f2f2"), vehicle("car", myX, -95, -90, CAR_COLS[6]));
      flow(laneX(0, -1), 1, 12, [["car", -20, CAR_COLS[5]], ["bus", -70, "#e6b400"], ["car", -120, CAR_COLS[2]], ["car", -160, CAR_COLS[7]], ["van", -210, "#f2f2f2"]], 260);
    } else if (living) {
      // nothing in your way – everyone shares the street
    } else if (road === "rural") {
      items.push(vehicle("car", myX, -45 + Math.sin(t * 0.6) * 4, -90, CAR_COLS[0]), vehicle("truck", myX, -110 + Math.sin(t * 0.3) * 5, -90, "#2f6fdc"));
      flow(laneX(0, -1), 1, 22, [["car", -30, CAR_COLS[1]], ["truck", -120, "#d9443a"], ["car", -190, CAR_COLS[3]], ["van", -260, "#f2f2f2"], ["car", -330, CAR_COLS[5]]], 400);
    } else {
      // dual carriageway: slower trucks on the right, faster cars on the left, traffic on the other side
      const vRight = Math.min(vMe - 6, 25);
      flow(laneX(lanes - 1), -1, vRight, [["truck", -60, "#2f6fdc"], ["truck", -200, "#e7ecf0"], ["van", -320, "#f2f2f2"]], 420);
      if (road === "motorway") items.push(vehicle("car", myX, -38 + Math.sin(t * 0.5) * 4, -90, CAR_COLS[0]));
      else items.push(vehicle("car", myX, -50 + Math.sin(t * 0.5) * 4, -90, CAR_COLS[0]));
      if (road === "motorway") flow(laneX(0), -1, vMe + 4, [["car", -20, CAR_COLS[3]], ["car", -140, CAR_COLS[5]], ["car", -260, CAR_COLS[2]]], 380);
      else flow(laneX(0), -1, vMe + 3, [["car", -90, CAR_COLS[3]], ["car", -230, CAR_COLS[2]]], 380);
      for (let k = 0; k < lanes; k++) flow(laneX(k, -1), 1, 30 - k * 4, [["car", -10 - k * 33, CAR_COLS[(k + 4) % 9]], [k === lanes - 1 ? "truck" : "car", -150 - k * 20, CAR_COLS[(k + 6) % 9]], ["car", -280 + k * 15, CAR_COLS[(k + 1) % 9]]], 420);
    }
    s += G.paint(items.filter(Boolean));

    // ---- light, weather ----
    if (night) {
      const beam = cam.polyPts([[myX - 1.6, -3, 0.02], [myX + 2.2, -3, 0.02], [myX + 3.2, -vis, 0.02], [myX - 3, -vis, 0.02]]);
      if (beam.length > 2) s += `<polygon points="${beam.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="#fff6b0" opacity=".26"/>`;
    }
    if (sc.weather === "fog") {
      const pv = cam.P(myX, -vis, 0);
      const yv = pv ? pv[1] : hz + 10;
      s += `<defs><linearGradient id="spd-fog" x1="0" y1="0" x2="0" y2="292" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e9edf0" stop-opacity="1"/><stop offset="${(yv / 292).toFixed(3)}" stop-color="#e9edf0" stop-opacity=".93"/><stop offset="${Math.min(1, (yv + 60) / 292).toFixed(3)}" stop-color="#e9edf0" stop-opacity=".35"/><stop offset="1" stop-color="#e9edf0" stop-opacity=".12"/></linearGradient></defs><rect width="520" height="292" fill="url(#spd-fog)"/>`;
    }
    if (sc.weather === "rain" || sc.weather === "snow") {
      const n = sc.weather === "rain" ? 90 : 110;
      for (let i = 0; i < n; i++) {
        const x0 = (i * 137.5) % 520, sp = sc.weather === "rain" ? 520 : 70, ph = (i * 53) % 292;
        const y = (ph + t * sp) % 292, x = sc.weather === "snow" ? x0 + Math.sin(t * 1.3 + i) * 8 : x0 - y * 0.12;
        s += sc.weather === "rain" ? `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 3).toFixed(1)}" y2="${(y + 16).toFixed(1)}" stroke="#a9c8e6" stroke-width="1.4" opacity=".8"/>` : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${1.4 + (i % 3) * 0.7}" fill="#fff" opacity=".95"/>`;
      }
    }
    if (sc.weather === "ice") for (let i = 0; i < 6; i++) { const p = cam.P(myX - 2 + i * 0.9, -14 - i * 7, 0.05); if (p) s += `<ellipse cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" rx="${(26 - i * 3).toFixed(1)}" ry="2.2" fill="#e8f4ff" opacity=".55"/>`; }

    // ---- inside the car: pillars, mirror, dashboard, wheel, speed readout ----
    const dash = night ? "#121418" : "#25292f";
    s += `<path d="M0 0 H34 L6 214 H0 Z M520 0 H486 L514 214 H520 Z" fill="${dash}"/><path d="M0 0 H520 V10 Q260 2 0 10 Z" fill="${dash}"/>`;
    s += `<rect x="296" y="8" width="5" height="14" fill="#16181b"/><rect x="250" y="20" width="98" height="26" rx="11" fill="#16181b"/><rect x="255" y="24" width="88" height="18" rx="8" fill="${night ? "#1d2633" : "#9fbfdc"}"/>`;
    s += `<path d="M0 292 V232 Q260 206 520 232 V292 Z" fill="${dash}"/><path d="M0 232 Q260 206 520 232" fill="none" stroke="#3a3f46" stroke-width="3"/>`;
    s += `<g transform="translate(200 300)"><ellipse rx="86" ry="56" fill="none" stroke="#16181b" stroke-width="13"/></g>`;
    s += `<g><rect x="168" y="244" width="64" height="30" rx="8" fill="#0d1014"/><text x="200" y="260" font-size="17" font-weight="800" fill="#e7ecf0" text-anchor="middle" dominant-baseline="central">${Math.round(shown || sc.limit || 0)}</text><text x="200" y="272" font-size="6.5" fill="#8b939c" text-anchor="middle">km/h</text></g>`;
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
    let shownV = 50;
    const draw = () => { svg.innerHTML = sceneSVG(cur, tNow, visNow(), shownV); };
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
        shownV = r.v;
      } else { setGauge(gEl, cur.limit); shownV = cur.limit; }
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
