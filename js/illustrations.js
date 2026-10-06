/* Illustrations for rule cards. Each returns an SVG string drawn on a fixed light "paper" palette,
   so a picture looks the same in light and dark mode. Many scenes are animated with SVG <animate>
   (paused for people who prefer reduced motion – see app.js). Official signs come from BGSigns. */
(function () {
  const C = {
    sky: "#e4f0fb", grass: "#bcd5a9", grassD: "#a6c48f", road: "#4a4f57", roadD: "#3f444b", paint: "#ffffff", yellow: "#f5c400",
    walk: "#e2e6eb", kerb: "#aeb6c0", bld: "#cfd7e0", ink: "#1f2933", muted: "#5b6673", blue: "#2f6fdc", orange: "#f08a24",
    red: "#e0352b", green: "#2ea44f", amber: "#f5b301", skin: "#f3c7a1", hair: "#4a3326", glass: "#cfe6fb", tyre: "#24282d", rim: "#d5dae0",
    purple: "#7d4fd6", grey: "#8b939c", water: "#7fb8ec",
  };
  const S = (code, x, y, size) => window.BGSigns.signImage(code, x, y, size);
  const W = 360, H = 200;
  const svg = (body, label, w = W, h = H) => `<svg viewBox="0 0 ${w} ${h}" class="il" role="img" aria-label="${label}" font-family="'Golos Text', system-ui, sans-serif">${defs}${body}</svg>`;
  const defs = `<defs><marker id="il-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" fill="${C.ink}"/></marker><marker id="il-ahw" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" fill="#fff"/></marker></defs>`;
  const T = (x, y, s, size = 12, o = {}) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${o.w || 600}" fill="${o.c || C.ink}" text-anchor="${o.a || "middle"}" dominant-baseline="central"${o.extra || ""}>${s}</text>`;
  // pill label; stays inside the canvas and shrinks long text to fit
  const label = (x, y, s, o = {}) => {
    let size = o.size || 11.5;
    let w = s.length * size * 0.64 + 14;
    const max = (o.cw || W) - 8;
    if (w > max) { size = Math.max(8.5, (size * (max - 14)) / (w - 14)); w = s.length * size * 0.64 + 14; }
    let left = o.a === "start" ? x : x - w / 2;
    left = Math.max(4, Math.min((o.cw || W) - 4 - w, left));
    return `<g class="il-label"><rect x="${left.toFixed(1)}" y="${y - 11}" width="${w.toFixed(1)}" height="22" rx="11" fill="${o.bg || "#fff"}" stroke="rgba(0,0,0,.08)"/>${T(left + w / 2, y + 0.5, s, size, { c: o.c || C.ink })}</g>`;
  };
  const dim = (x1, y1, x2, y2, s, o = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || C.ink}" stroke-width="1.6" marker-start="url(#${o.w ? "il-ahw" : "il-ah"})" marker-end="url(#${o.w ? "il-ahw" : "il-ah"})"/>` +
    (s ? T((x1 + x2) / 2 + (o.dx || 0), (y1 + y2) / 2 + (o.dy ?? -10), s, o.size || 12, { c: o.c || C.ink, w: 700 }) : "");
  const dashes = (y, x0, x1, len = 18, gap = 14, th = 3, col = C.paint) => {
    let s = "";
    for (let x = x0; x < x1; x += len + gap) s += `<rect x="${x}" y="${y - th / 2}" width="${Math.min(len, x1 - x)}" height="${th}" fill="${col}"/>`;
    return s;
  };
  const vdashes = (x, y0, y1, len = 18, gap = 14, th = 3) => {
    let s = "";
    for (let y = y0; y < y1; y += len + gap) s += `<rect x="${x - th / 2}" y="${y}" width="${th}" height="${Math.min(len, y1 - y)}" fill="${C.paint}"/>`;
    return s;
  };
  const zebra = (x, y, w, h, n = 6) => {
    let s = "";
    const step = h / n;
    for (let i = 0; i < n; i++) s += `<rect x="${x}" y="${y + i * step + step * 0.18}" width="${w}" height="${step * 0.64}" fill="${C.paint}"/>`;
    return s;
  };

  // top-down car; front points along +x before rotation
  const car = (x, y, a = 0, col = C.blue, L = 46, Wd = 22, o = {}) => `<g transform="translate(${x} ${y}) rotate(${a})">
    <rect x="${-L / 2 + 3}" y="${-Wd / 2 - 1.5}" width="${L * 0.16}" height="${Wd + 3}" rx="2" fill="${C.tyre}"/><rect x="${L / 2 - 3 - L * 0.16}" y="${-Wd / 2 - 1.5}" width="${L * 0.16}" height="${Wd + 3}" rx="2" fill="${C.tyre}"/>
    <rect x="${-L / 2}" y="${-Wd / 2}" width="${L}" height="${Wd}" rx="${Wd * 0.34}" fill="${col}" stroke="rgba(0,0,0,.28)"/>
    <rect x="${L * 0.06}" y="${-Wd / 2 + 2.8}" width="${L * 0.2}" height="${Wd - 5.6}" rx="3" fill="${C.glass}"/>
    <rect x="${-L * 0.15}" y="${-Wd / 2 + 2.6}" width="${L * 0.21}" height="${Wd - 5.2}" rx="3" fill="rgba(0,0,0,.14)"/>
    <rect x="${-L * 0.36}" y="${-Wd / 2 + 3.4}" width="${L * 0.12}" height="${Wd - 6.8}" rx="2.4" fill="${C.glass}" opacity=".9"/>
    <rect x="${L * 0.1}" y="${-Wd / 2 - 3}" width="4" height="3" rx="1" fill="${col}"/><rect x="${L * 0.1}" y="${Wd / 2}" width="4" height="3" rx="1" fill="${col}"/>
    <rect x="${L / 2 - 3}" y="${-Wd / 2 + 2}" width="3" height="4" rx="1" fill="#fff6c2"/><rect x="${L / 2 - 3}" y="${Wd / 2 - 6}" width="3" height="4" rx="1" fill="#fff6c2"/>
    <rect x="${-L / 2}" y="${-Wd / 2 + 2}" width="2.5" height="4" rx="1" fill="${C.red}"/><rect x="${-L / 2}" y="${Wd / 2 - 6}" width="2.5" height="4" rx="1" fill="${C.red}"/>
    ${o.blinkR ? `<circle cx="${L / 2 - 4}" cy="${Wd / 2 + 1}" r="3" fill="${C.amber}"><animate attributeName="opacity" values="1;1;0;0" dur="0.9s" repeatCount="indefinite"/></circle>` : ""}
    ${o.blinkL ? `<circle cx="${L / 2 - 4}" cy="${-Wd / 2 - 1}" r="3" fill="${C.amber}"><animate attributeName="opacity" values="1;1;0;0" dur="0.9s" repeatCount="indefinite"/></circle>` : ""}
    ${o.siren ? `<rect x="-3" y="${-Wd / 2 + 2}" width="6" height="${Wd - 4}" rx="2" fill="${C.blue}"><animate attributeName="fill" values="${C.blue};${C.red};${C.blue}" dur="0.6s" repeatCount="indefinite"/></rect>` : ""}
    ${o.label ? `<g transform="rotate(${-a})"><circle r="9" fill="#fff" stroke="${C.ink}" stroke-width="1.4"/><text y="0.5" font-size="11" font-weight="800" fill="${C.ink}" text-anchor="middle" dominant-baseline="central">${o.label}</text></g>` : ""}
  </g>`;

  // side-view sedan, (x, ground y) is the centre of the car on the ground; s = scale
  const sideCar = (x, y, s = 1, col = C.blue, flip = false) => `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s}) translate(-65 -50)">
    <path d="M6 36 C4 30 8 26 16 25 L34 22 C42 12 50 9 60 9 L84 9 C94 9 101 14 108 22 L118 25 C123 26 125 29 125 33 L125 37 C125 39 124 40 122 40 L8 40 C6 40 6 38 6 36 Z" fill="${col}" stroke="rgba(0,0,0,.3)"/>
    <path d="M40 23 C46 15 52 13 60 13 L70 13 L70 23 Z M74 13 L84 13 C91 13 96 16 101 23 L74 23 Z" fill="${C.glass}"/>
    <path d="M72 24 V39 M38 24 V39" stroke="rgba(0,0,0,.22)" stroke-width="1.2"/>
    <path d="M118 27 L124 28.5 L124 31.5 L118 31 Z" fill="#fff4b0"/><rect x="6" y="28" width="4" height="5" rx="1" fill="${C.red}"/>
    <circle cx="30" cy="40" r="10" fill="${C.tyre}"/><circle cx="30" cy="40" r="4.6" fill="${C.rim}"/>
    <circle cx="100" cy="40" r="10" fill="${C.tyre}"/><circle cx="100" cy="40" r="4.6" fill="${C.rim}"/>
  </g>`;

  // standing person seen from the front; (x, y) = between the feet
  const person = (x, y, s = 1, shirt = C.blue, arms = {}) => {
    const L = arms.l || [-15, -24], R = arms.r || [15, -24];
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <rect x="-7" y="-24" width="6" height="24" rx="3" fill="#3b4250"/><rect x="1" y="-24" width="6" height="24" rx="3" fill="#3b4250"/>
      <path d="M-9 -44 Q0 -48 9 -44 L9 -22 L-9 -22 Z" fill="${shirt}"/>
      <path d="M-8 -42 L${L[0]} ${L[1]} M8 -42 L${R[0]} ${R[1]}" stroke="${shirt}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle cx="${L[0]}" cy="${L[1]}" r="2.6" fill="${C.skin}"/><circle cx="${R[0]}" cy="${R[1]}" r="2.6" fill="${C.skin}"/>
      <circle cx="0" cy="-53" r="7" fill="${C.skin}"/><path d="M-7 -55 Q0 -63 7 -55 Q4 -58 0 -58 Q-4 -58 -7 -55 Z" fill="${C.hair}"/>
    </g>`;
  };
  // walking person seen from the side
  const walker = (x, y, s = 1, shirt = C.orange, anim = true) => `<g transform="translate(${x} ${y}) scale(${s})">
    <g><path d="M0 -22 L-6 0" stroke="#3b4250" stroke-width="5" stroke-linecap="round">${anim ? `<animate attributeName="d" values="M0 -22 L-6 0;M0 -22 L6 0;M0 -22 L-6 0" dur="0.8s" repeatCount="indefinite"/>` : ""}</path>
    <path d="M0 -22 L6 0" stroke="#3b4250" stroke-width="5" stroke-linecap="round">${anim ? `<animate attributeName="d" values="M0 -22 L6 0;M0 -22 L-6 0;M0 -22 L6 0" dur="0.8s" repeatCount="indefinite"/>` : ""}</path></g>
    <rect x="-5" y="-44" width="10" height="24" rx="4" fill="${shirt}"/>
    <circle cx="0" cy="-52" r="6.5" fill="${C.skin}"/><path d="M-6.5 -54 Q0 -61 6.5 -54 Z" fill="${C.hair}"/>
  </g>`;
  const ground = (y = 150, col = C.grass) => `<rect width="${W}" height="${H}" fill="${C.sky}"/><rect y="${y}" width="${W}" height="${H - y}" fill="${col}"/>`;
  const roadH = (y, h, o = {}) => `<rect x="0" y="${y}" width="${W}" height="${h}" fill="${C.road}"/>${o.center !== false ? dashes(y + h / 2, 0, W) : ""}${o.edges ? `<rect y="${y + 3}" width="${W}" height="2.5" fill="${C.paint}"/><rect y="${y + h - 5.5}" width="${W}" height="2.5" fill="${C.paint}"/>` : ""}`;
  // drive along +x (or -x with dir=-1) at constant speed and wrap around the canvas; t=0 = where the thing is drawn
  const cruise = (x0, dur, dir = 1, span = W + 120) => {
    const d1 = dir > 0 ? W + 60 - x0 : x0 + 60;
    const k = (d1 / span).toFixed(3);
    return `<animateTransform attributeName="transform" type="translate" values="0 0;${dir * d1} 0;${dir * (d1 - span)} 0;0 0" keyTimes="0;${k};${k};1" dur="${dur}s" repeatCount="indefinite"/>`;
  };
  const loop = (values, dur, extra = "") => `<animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;

  const IL = {
    // ================= basics =================
    speeds() {
      const cols = [["Д15", "20", "Жилищна зона"], ["Д11", "50", "Населено място"], ["", "90", "Извън населено"], ["Д7а", "120", "Скоростен път"], ["Д5", "140", "Магистрала"]];
      let b = `<rect width="${W}" height="${H}" fill="#eef2f6"/>`;
      cols.forEach(([code, v, name], i) => {
        const x = 10 + i * 69;
        const a = (i / 5).toFixed(2), a2 = ((i + 1) / 5).toFixed(2);
        b += `<rect x="${x}" y="10" width="63" height="180" rx="12" fill="#fff"/><rect x="${x + 1.5}" y="11.5" width="60" height="177" rx="11" fill="none" stroke="${C.blue}" stroke-width="3" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${a};${(+a + 0.02).toFixed(2)};${(+a2 - 0.02).toFixed(2)};${a2};1" dur="7.5s" repeatCount="indefinite"/></rect>`;
        b += code ? S(code, x + 9, 20, 45) : `<g transform="translate(${x + 9} 20)"><rect width="45" height="45" rx="7" fill="${C.grass}"/><rect x="16" width="13" height="45" fill="${C.road}"/>${[3, 18, 33].map((yy) => `<rect x="21.5" y="${yy}" width="2" height="8" fill="#fff"/>`).join("")}</g>`;
        b += T(x + 31.5, 100, v, 27, { w: 800 }) + T(x + 31.5, 124, "km/h", 10.5, { c: C.muted, w: 500 });
        name.split(" ").forEach((wd, k) => (b += T(x + 31.5, 150 + k * 14, wd, 10.5, { w: 500 })));
      });
      return svg(b, "Ограничения на скоростта за категория B");
    },
    distance() {
      let b = ground(40) + roadH(70, 80, { edges: true });
      b += `<g><rect x="230" y="40" width="4" height="30" fill="${C.grey}"/><rect x="224" y="34" width="16" height="9" rx="2" fill="${C.amber}"/></g>`;
      b += `<g>${cruise(250, 6)}${car(250, 128, 0, C.orange)}</g>`;
      b += `<g>${cruise(150, 6)}${car(150, 128, 0, C.blue)}</g>`;
      b += label(180, 164, "Колата пред теб мине стълба → броиш", { size: 10.5 }) + label(180, 188, "„двадесет и едно, двадесет и две“", { size: 10.5 });
      b += label(120, 22, "Добра практика: сух път – 2 с · мокър – 4 с · сняг – повече", { size: 10.5, a: "start" });
      return svg(b, "Добра практика: 2 секунди дистанция");
    },
    alcohol() {
      let b = `<rect width="${W}" height="${H}" fill="#eef2f6"/>`;
      b += `<g transform="translate(30 30)"><path d="M10 0 H60 L54 70 Q35 84 16 70 Z" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/><path d="M15 34 H55 L52 66 Q35 77 18 66 Z" fill="${C.amber}" opacity=".85"/><rect x="33" y="80" width="4" height="40" fill="${C.ink}"/><rect x="18" y="118" width="34" height="5" rx="2.5" fill="${C.ink}"/></g>`;
      const cx = 235, cy = 140, r = 90;
      const arc = (a0, a1, col) => {
        const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
        const [x0, y0] = p(a0), [x1, y1] = p(a1);
        return `<path d="M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}" stroke="${col}" stroke-width="18" fill="none"/>`;
      };
      b += arc(180, 120, C.green) + arc(120, 75, C.amber) + arc(75, 0, C.red);
      b += T(cx - 92, 32, "0,5 ‰", 12, { w: 800 }) + T(cx + 30, 26, "1,2 ‰", 12, { w: 800 });
      b += T(cx - 70, 172, "разрешено", 11, { c: C.green, w: 700 }) + T(cx + 5, 172, "нарушение", 11, { c: "#a36a00", w: 700 }) + T(cx + 78, 172, "престъпление", 11, { c: C.red, w: 700 });
      b += `<g transform="translate(${cx} ${cy})"><g><animateTransform attributeName="transform" type="rotate" values="-80;-20;45;80;-80" keyTimes="0;.3;.6;.8;1" dur="7s" repeatCount="indefinite"/><path d="M-3 0 L0 -78 L3 0 Z" fill="${C.ink}"/></g><circle r="8" fill="${C.ink}"/></g>`;
      b += T(105, 190, "Най-сигурно: 0,0 ‰", 12, { w: 800 });
      return svg(b, "Граници на алкохола в кръвта");
    },
    phone() {
      let b = `<rect width="${W}" height="${H}" fill="#eef2f6"/><rect x="180" y="12" width="2" height="176" fill="#d5dbe2"/>`;
      const ph = (x, y) => `<rect x="${x}" y="${y}" width="40" height="70" rx="8" fill="${C.ink}"/><rect x="${x + 4}" y="${y + 8}" width="32" height="52" rx="3" fill="#8fc0f5"/><circle cx="${x + 20}" cy="${y + 65}" r="2" fill="#555"/>`;
      b += `<g><animateTransform attributeName="transform" type="rotate" values="0 90 90;-5 90 90;5 90 90;0 90 90" dur="0.8s" repeatCount="indefinite"/>${ph(70, 40)}<path d="M58 140 Q62 92 72 86 L84 96 Q80 120 96 150 Z" fill="${C.skin}" stroke="#c49a76"/></g><g><animate attributeName="opacity" values="1;.55;1" dur="1.6s" repeatCount="indefinite"/><circle cx="90" cy="75" r="56" fill="none" stroke="${C.red}" stroke-width="7"/><line x1="51" y1="36" x2="129" y2="114" stroke="${C.red}" stroke-width="7"/></g>`;
      b += T(90, 170, "В ръка – забранено", 13, { w: 700 });
      b += `<g transform="translate(200 20)"><path d="M10 120 Q80 70 150 120" stroke="${C.grey}" stroke-width="6" fill="none"/><rect x="70" y="92" width="16" height="22" rx="3" fill="${C.grey}"/>${ph(58, 26)}${[0, 1, 2].map((k) => `<path d="M${108 + k * 9} ${46 - k * 4} q${6 + k * 2} ${15 + k * 4} 0 ${30 + k * 8}" stroke="${C.blue}" stroke-width="3" fill="none" stroke-linecap="round"><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="${k * 0.25}s" repeatCount="indefinite"/></path>`).join("")}<circle cx="78" cy="14" r="12" fill="${C.green}"/><path d="M72 14 l4 4 l8 -9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
      b += T(272, 170, "Hands-free или", 11.5, { w: 700 }) + T(272, 186, "системата на колата – може", 11.5, { w: 700 });
      return svg(b, "Телефон по време на шофиране");
    },
    childSeat() {
      let b = `<rect width="${W}" height="${H}" fill="#eef2f6"/>`;
      // height ruler with a child under 150 cm
      b += `<g transform="translate(20 20)"><rect x="0" y="0" width="16" height="160" rx="3" fill="${C.amber}"/>`;
      for (let i = 0; i <= 8; i++) b += `<rect x="${i % 2 ? 9 : 4}" y="${i * 20}" width="${i % 2 ? 7 : 12}" height="2" fill="${C.ink}"/>`;
      b += `<rect x="16" y="20" width="70" height="2.5" fill="${C.red}"><animate attributeName="opacity" values="1;.3;1" dur="1.4s" repeatCount="indefinite"/></rect><path d="M60 34 V22" stroke="${C.red}" stroke-width="2" marker-end="url(#il-ah)"><animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite"/></path>${T(56, 10, "150 см", 12, { w: 800, c: C.red })}</g>`;
      b += person(80, 180, 2.1, C.green);
      // car rear seat with booster
      b += `<g transform="translate(150 22)">
        <rect x="0" y="0" width="200" height="160" rx="16" fill="#dfe5ec"/>
        <path d="M120 150 L120 40 Q120 24 136 24 L160 24 Q176 24 176 40 L176 150 Z" fill="#59616c"/>
        <path d="M40 150 L40 118 Q40 108 50 108 L176 108 L176 150 Z" fill="#6b737e"/>
        <path d="M60 108 L60 70 Q60 52 78 50 L104 50 Q118 52 118 66 L118 108 Z" fill="${C.orange}"/>
        <rect x="56" y="100" width="66" height="14" rx="5" fill="#d26f12"/>
        <circle cx="92" cy="40" r="15" fill="${C.skin}"/><path d="M77 36 Q92 18 107 36 Q100 28 92 28 Q84 28 77 36 Z" fill="${C.hair}"/>
        <rect x="76" y="56" width="32" height="44" rx="10" fill="${C.blue}"/>
        <path d="M112 54 L76 102" stroke="#2b2f36" stroke-width="6" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"><animate attributeName="stroke-dashoffset" values="0;1;1;0;0" keyTimes="0;.05;.2;.55;1" dur="5s" repeatCount="indefinite"/></path><path d="M60 98 H122" stroke="#2b2f36" stroke-width="6" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"><animate attributeName="stroke-dashoffset" values="0;1;1;0;0" keyTimes="0;.05;.2;.55;1" dur="5s" repeatCount="indefinite"/></path>
        <rect x="70" y="100" width="18" height="40" rx="6" fill="#3b4250"/><rect x="92" y="100" width="18" height="40" rx="6" fill="#3b4250"/>
      </g>`;
      b += label(250, 188, "Под 150 см – седалка, подходяща за теглото", { size: 10.5 });
      return svg(b, "Дете под 150 см пътува в система за обезопасяване");
    },
    triangle() {
      let b = ground(52) + roadH(70, 80, { edges: true });
      b += car(300, 128, 0, C.grey) + `<circle cx="322" cy="118" r="3.5" fill="${C.amber}"><animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/></circle><circle cx="322" cy="138" r="3.5" fill="${C.amber}"><animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/></circle>`;
      b += `<g><animateTransform attributeName="transform" type="translate" values="0 0; -150 0; -150 0; 0 0" keyTimes="0;.45;.6;1" dur="7s" repeatCount="indefinite"/>${walker(270, 115, 0.8, C.amber)}</g>`;
      b += `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.45;.5;1" dur="7s" repeatCount="indefinite"/><polygon points="110,110 124,136 96,136" fill="#fff" stroke="${C.red}" stroke-width="4" stroke-linejoin="round"/></g>`;
      b += dim(110, 162, 278, 162, "", { w: true }) + label(194, 182, "поне 30 м · магистрала и над 90 km/h – поне 100 м", { size: 10.5 });
      b += label(70, 30, "Аварийни светлини + жилетка", { size: 10.5, a: "start" });
      return svg(b, "Поставяне на авариен триъгълник");
    },
    motorway() {
      let b = ground(20) + `<rect y="38" width="${W}" height="124" fill="${C.road}"/><rect y="42" width="${W}" height="2.5" fill="#fff"/>${dashes(78, 0, W, 26, 16)}${dashes(112, 0, W, 26, 16)}<rect y="140" width="${W}" height="2.5" fill="#fff"/>`;
      b += `<rect y="142.5" width="${W}" height="19.5" fill="${C.roadD}"/>`;
      b += `<g>${cruise(90, 5)}${car(90, 60, 0, C.blue)}</g><g>${cruise(200, 4)}${car(200, 95, 0, C.orange)}</g><g>${cruise(40, 7)}${car(40, 127, 0, C.purple)}</g>`;
      b += car(250, 152, 0, C.grey, 40, 18) + `<circle cx="270" cy="143" r="3" fill="${C.amber}"><animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite"/></circle>`;
      b += label(120, 182, "Лента за принудително спиране – повреда или неразположение", { size: 10.5 });
      return svg(b, "Автомагистрала и лентата за принудително спиране");
    },
    overtaking() {
      let b = ground(30) + roadH(60, 90, { edges: true }) + zebra(250, 62, 34, 86, 7);
      b += `<g>${loop("0 0; 0 0; 0 86; 0 86", 8, 'keyTimes="0;.3;.75;1"')}<g transform="translate(267 66)"><circle r="7" fill="${C.green}"/><circle r="4" fill="${C.skin}"/></g></g>`;
      b += `<g>${loop("0 0; 110 0; 110 0; 240 0", 8, 'keyTimes="0;.3;.8;1"')}${car(110, 128, 0, C.orange)}</g>`;
      b += `<g>${loop("0 0; 70 0; 70 0; 190 0", 8, 'keyTimes="0;.34;.85;1"')}${car(60, 128, 0, C.blue)}</g>`;
      b += `<path d="M84 128 C120 128 120 92 170 92 L215 92" stroke="${C.red}" stroke-width="4" stroke-dasharray="7 6" fill="none"/><g><animate attributeName="opacity" values="1;.25;1" dur="1s" repeatCount="indefinite"/><line x1="185" y1="78" x2="215" y2="106" stroke="${C.red}" stroke-width="5"/><line x1="215" y1="78" x2="185" y2="106" stroke="${C.red}" stroke-width="5"/></g>`;
      b += label(180, 164, "Не изпреварвай пред пешеходна пътека,", { size: 10.5 }) + label(180, 188, "на равнозначно кръстовище и на прелез без бариери", { size: 10.5 });
      b += S("В24", 300, 4, 30);
      return svg(b, "Къде изпреварването е забранено");
    },
    emergency() {
      let b = ground(30) + roadH(50, 110, { edges: true });
      b += `<g>${loop("0 0; 0 22; 0 22; 0 0", 6, 'keyTimes="0;.25;.85;1"')}${car(200, 86, 0, C.blue)}</g>`;
      b += `<g>${loop("0 0; 0 -22; 0 -22; 0 0", 6, 'keyTimes="0;.25;.85;1"')}${car(200, 126, 0, C.orange)}</g>`;
      b += `<g>${loop("-80 0; -80 0; 440 0", 6, 'keyTimes="0;.3;1"')}${car(0, 106, 0, "#fff", 54, 24, { siren: true })}</g>`;
      b += label(180, 180, "Освободи място, при нужда спри. Не карай веднага след нея", { size: 10.5 });
      return svg(b, "Линейка със специален режим");
    },

    // ================= priority =================
    rightRule() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="70" width="${W}" height="60" fill="${C.road}"/><rect x="150" width="60" height="${H}" fill="${C.road}"/>`;
      b += `<g>${loop("0 0; 0 0; -420 0", 6, 'keyTimes="0;.15;1"')}${car(290, 85, 180, C.orange, 46, 22, { label: "Б" })}</g>`;
      b += `<g>${loop("0 0; 0 0; 0 -260", 6, 'keyTimes="0;.55;1"')}${car(195, 175, -90, C.blue, 46, 22, { label: "А" })}</g>`;
      b += label(270, 40, "Б идва отдясно на А → минава първа", { size: 11 }) + label(84, 178, "Без знаци: гледай надясно", { size: 11 });
      return svg(b, "Правило на дясното");
    },
    leftTurn() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="70" width="${W}" height="60" fill="${C.road}"/><rect x="150" width="60" height="${H}" fill="${C.road}"/>`;
      b += `<g>${loop("0 0; 0 240; 0 240", 5.5, 'keyTimes="0;.5;1"')}${car(165, 26, 90, C.orange, 46, 22, { label: "Б" })}</g>`;
      b += `<g>${loop("0 0; 0 0; 0 -70; -230 -70", 5.5, 'keyTimes="0;.5;.7;1"')}${car(195, 175, -90, C.blue, 46, 22, { label: "А", blinkL: true })}</g>`;
      b += label(84, 30, "А завива наляво → чака насрещната Б", { size: 11 });
      return svg(b, "Завой наляво – пропусни насрещните");
    },
    merge() {
      let b = ground(30) + `<rect y="60" width="${W}" height="90" fill="${C.road}"/>${dashes(105, 0, 170)}<polygon points="200,150 300,105 ${W},105 ${W},150" fill="${C.grass}"/><rect y="62" width="${W}" height="2.5" fill="#fff"/>`;
      b += `<g>${loop("0 0; 120 0; 330 0", 6, 'keyTimes="0;.45;1"')}${car(40, 127, 0, C.blue, 46, 22, { label: "Д" })}</g>`;
      b += `<g>${loop("0 0; 70 0; 140 0; 300 0", 6, 'keyTimes="0;.35;.6;1"')}${car(40, 83, 0, C.orange, 46, 22, { label: "Л" })}</g>`;
      b += label(180, 178, "Две коли влизат в една лента едновременно → дясната (Д) минава първа", { size: 10 });
      return svg(b, "Две коли се престрояват в една лента");
    },
    pedestrianSignal() {
      let b = `<rect width="${W}" height="${H}" fill="${C.walk}"/><rect y="40" width="${W}" height="110" fill="${C.road}"/>${zebra(190, 42, 46, 106, 7)}`;
      b += `<g>${loop("0 0; 80 0; 80 0", 6, 'keyTimes="0;.3;1"')}${car(60, 120, 0, C.blue)}</g>`;
      b += `<g>${loop("0 0; 0 0; 0 -130", 6, 'keyTimes="0;.35;1"')}${walker(213, 186, 0.85, C.orange)}<path d="M216 140 L226 124" stroke="${C.skin}" stroke-width="4" stroke-linecap="round"/></g>`;
      b += S("Д17", 250, 2, 34) + label(90, 22, "Пешеходец с вдигната ръка → спираш", { size: 11 });
      return svg(b, "Пешеходец сигнализира, че ще пресича");
    },
    exitProperty() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="40" width="${W}" height="66" fill="${C.road}"/>${dashes(73, 0, W)}<rect y="106" width="${W}" height="22" fill="${C.walk}"/><rect x="140" y="106" width="70" height="94" fill="#c9ced6"/>`;
      b += T(175, 186, "паркинг", 11, { c: C.muted });
      b += `<g>${cruise(120, 4.5)}${car(120, 90, 0, C.orange)}</g>`;
      b += `<g>${cruise(260, 6, -1)}${car(260, 56, 180, C.purple)}</g>`;
      b += `<g transform="translate(40 0)"><g>${loop("0 0; 0 0; 250 0; 250 0", 6, 'keyTimes="0;.15;.85;1"')}${walker(0, 126, 0.7, C.green)}</g></g>`;
      b += car(175, 150, -90, C.blue, 46, 22, { blinkR: true });
      b += label(180, 20, "Излизаш от имот или паркинг → пропускаш всички", { size: 11 });
      return svg(b, "Излизане от паркинг или имот");
    },
    tram() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="70" width="${W}" height="60" fill="${C.road}"/><rect x="150" width="60" height="${H}" fill="${C.road}"/><line x1="0" y1="92" x2="${W}" y2="92" stroke="#9aa1a9" stroke-width="2"/><line x1="0" y1="108" x2="${W}" y2="108" stroke="#9aa1a9" stroke-width="2"/>`;
      b += `<g>${loop("0 0; 420 0; 420 0", 6, 'keyTimes="0;.55;1"')}<rect x="0" y="86" width="110" height="28" rx="6" fill="${C.amber}" stroke="rgba(0,0,0,.3)"/><rect x="8" y="91" width="94" height="8" rx="2" fill="${C.glass}"/>${T(55, 107, "ТРАМВАЙ", 9, { w: 800 })}</g>`;
      b += `<g>${loop("0 0; 0 0; 0 -260", 6, 'keyTimes="0;.55;1"')}${car(195, 175, -90, C.blue)}</g>`;
      b += label(250, 40, "Трамваят минава пръв, дори да идва отляво", { size: 10.5 });
      return svg(b, "Трамвай на кръстовище");
    },
    narrowing() {
      let b = `<defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="#e5c07b"/></pattern></defs>`;
      b += `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="50" width="${W}" height="100" fill="${C.road}"/>${dashes(100, 0, 150)}${dashes(100, 222, W)}`;
      b += `<rect x="150" y="104" width="72" height="46" fill="#d6a85e"/><rect x="150" y="104" width="72" height="46" fill="url(#hatch)"/><g fill="${C.orange}"><rect x="146" y="102" width="5" height="50"/><rect x="221" y="102" width="5" height="50"/></g>`;
      // oncoming car has priority and goes first, then you go around the obstacle
      b += `<g>${loop("0 0; -420 0; -420 0", 8, 'keyTimes="0;.45;1"')}${car(330, 74, 180, C.orange)}</g>`;
      b += `<g><animateMotion dur="8s" repeatCount="indefinite" calcMode="linear" keyPoints="0;.16;.16;1;1" keyTimes="0;.18;.42;.9;1" rotate="auto" path="M40 126 L100 126 C128 126 128 76 156 76 L216 76 C244 76 244 126 272 126 L420 126"/>${car(0, 0, 0, C.blue, 46, 22, { label: "Ти" })}</g>`;
      b += S("Б5", 8, 156, 36) + label(52, 174, "Б5 – препятствието е при теб: пропускаш насрещния", { size: 10, a: "start" });
      b += S("Б6", 316, 6, 36) + label(310, 24, "Б6 – насрещните те пропускат", { size: 10, a: "end" }).replace(/x="([\d.]+)"/, (m, v) => m);
      return svg(b, "Стеснение – знаци Б5 и Б6");
    },

    // ================= traffic lights =================
    blockBox() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="70" width="${W}" height="60" fill="${C.road}"/><rect x="140" width="60" height="${H}" fill="${C.road}"/>`;
      b += car(240, 112, 0, C.grey) + car(292, 112, 0, C.grey) + car(344, 112, 0, C.grey);
      b += `<g>${loop("0 0; 0 0; 160 0; 160 0", 7, 'keyTimes="0;.6;.85;1"')}${car(100, 112, 0, C.blue)}</g>`;
      b += `<g transform="translate(112 30)"><rect width="14" height="36" rx="4" fill="#15181b"/><circle cx="7" cy="8" r="4" fill="#3a3f45"/><circle cx="7" cy="18" r="4" fill="#3a3f45"/><circle cx="7" cy="28" r="4" fill="#22d36b"/></g>`;
      b += label(180, 172, "Зелено, но след кръстовището няма място → изчакай", { size: 10.5 });
      b += label(250, 40, "Колоната тръгва – чак тогава", { size: 10.5 });
      return svg(b, "Не влизай в кръстовището, ако няма къде да излезеш");
    },
    greenArrow() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="70" width="${W}" height="60" fill="${C.road}"/><rect x="150" width="60" height="${H}" fill="${C.road}"/>${zebra(212, 72, 30, 56, 5)}`;
      b += `<g transform="translate(108 140)"><rect width="16" height="44" rx="4" fill="#15181b"/><circle cx="8" cy="9" r="5" fill="#ff3b30"/><circle cx="8" cy="22" r="5" fill="#3a3f45"/><circle cx="8" cy="35" r="5" fill="#3a3f45"/><rect x="18" y="28" width="16" height="16" rx="4" fill="#15181b"/><path d="M21 36 H29 M26 32 L30 36 L26 40" stroke="#22d36b" stroke-width="2.6" fill="none"><animate attributeName="opacity" values="1;.35;1" dur="1.2s" repeatCount="indefinite"/></path></g>`;
      b += `<g>${loop("0 0; 0 0; 0 -50; 190 -50", 7, 'keyTimes="0;.35;.6;1"')}${car(195, 175, -90, C.blue, 46, 22, { blinkR: true })}</g>`;
      b += `<g>${loop("0 0; 0 -110; 0 -110", 7, 'keyTimes="0;.35;1"')}${walker(228, 175, 0.75, C.orange)}</g>`;
      b += label(270, 30, "Стрелка: завиваш, като пропуснеш пешеходците и колите", { size: 10.5 });
      return svg(b, "Зелена стрелка в допълнителната секция");
    },
    railCrossing() {
      let b = ground(110) + `<rect y="130" width="${W}" height="40" fill="${C.road}"/><rect x="200" y="110" width="160" height="90" fill="#c9b79a"/>`;
      for (let x = 206; x < W; x += 16) b += `<rect x="${x}" y="112" width="8" height="86" fill="#7b6a55"/>`;
      b += `<rect x="190" y="110" width="170" height="5" fill="#8a929c"/><rect x="190" y="190" width="170" height="5" fill="#8a929c"/>`;
      b = b.replace(`<rect y="130" width="${W}" height="40" fill="${C.road}"/>`, "") + `<rect y="130" width="200" height="40" fill="${C.road}"/>`;
      b += `<g transform="translate(176 52)"><rect x="-2" y="0" width="4" height="78" fill="#6c737c"/><rect x="-22" y="8" width="44" height="16" rx="8" fill="#15181b"/><circle cx="-11" cy="16" r="6" fill="#ff3b30"><animate attributeName="opacity" values="1;.15;1;.15" dur="1s" repeatCount="indefinite"/></circle><circle cx="11" cy="16" r="6" fill="#ff3b30"><animate attributeName="opacity" values=".15;1;.15;1" dur="1s" repeatCount="indefinite"/></circle></g>`;
      b += `<g transform="translate(176 92)"><g><animateTransform attributeName="transform" type="rotate" values="-80;-80;0;0;-80" keyTimes="0;.2;.35;.85;1" dur="8s" repeatCount="indefinite"/><rect x="0" y="-3" width="110" height="6" fill="#fff" stroke="${C.red}"/>${[10, 34, 58, 82].map((xx) => `<rect x="${xx}" y="-3" width="12" height="6" fill="${C.red}"/>`).join("")}</g></g>`;
      b += sideCar(100, 165, 0.6, C.blue);
      b += label(90, 30, "Мигаща червена = стоп, дори бариерата да е вдигната", { size: 10.5 }) + label(100, 188, "Без бариери: спри поне на 2 м пред релсата", { size: 10.5 });
      return svg(b, "Железопътен прелез");
    },
    laneLights() {
      let b = `<rect width="${W}" height="${H}" fill="#eef2f6"/><rect x="20" y="70" width="320" height="120" fill="${C.road}"/>${vdashes(126, 70, 190)}${vdashes(234, 70, 190)}`;
      b += `<rect x="20" y="30" width="320" height="16" fill="#8a929c"/>`;
      const box = (x, ok) => `<g transform="translate(${x} 42)"><rect x="-18" y="0" width="36" height="30" rx="5" fill="#15181b"/>${ok ? `<path d="M0 6 V22 M-7 15 L0 23 L7 15" stroke="#22d36b" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : `<path d="M-8 7 L8 23 M8 7 L-8 23" stroke="#ff3b30" stroke-width="3.5" stroke-linecap="round"/>`}</g>`;
      b += box(73, true) + box(180, false) + box(287, true);
      b += `<g>${loop("0 0; 0 -130", 4)}${car(73, 160, -90, C.blue)}</g><g><animateMotion dur="5s" repeatCount="indefinite" rotate="auto" path="M180 186 L180 170 C180 140 287 150 287 120 L287 60"/>${car(0, 0, 0, C.orange, 46, 22, { blinkR: true })}</g>`;
      b += T(180, 130, "забранено", 12, { c: "#fff", w: 700 });
      return svg(b, "Светофар над лентата");
    },

    // ================= traffic controller =================
    regPoses() {
      const hh = 220;
      let b = `<rect width="${W}" height="${hh}" fill="#eef2f6"/>`;
      const uniform = "#3e5573";
      // baton: white with black stripes; drawn in the figure's own (unscaled) coordinates
      const baton = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="3.6" stroke-dasharray="3 3"/>`;
      const pose = (x, k, arms, extra, lines) => {
        const at = k / 3, at2 = (k + 1) / 3;
        let g = `<rect x="${x - 57}" y="4" width="114" height="212" rx="12" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${at.toFixed(2)};${(at + 0.02).toFixed(2)};${(at2 - 0.02).toFixed(2)};${at2.toFixed(2)};1" dur="9s" repeatCount="indefinite"/></rect>`;
        g += `<g transform="translate(${x} 150) scale(1.3)">${person(0, 0, 1, uniform, arms)}${extra}<rect x="-7.5" y="-63" width="15" height="5" rx="1.5" fill="#fff"/><rect x="-8" y="-59" width="16" height="2" fill="${C.ink}"/></g>`;
        lines.forEach((l, n) => (g += T(x, 168 + n * 15, l, n ? 10.5 : 12, { w: n ? 500 : 800, c: n ? C.muted : C.ink })));
        return g;
      };
      b += pose(62, 0, { l: [-14, -22], r: [9, -72] }, baton(9, -72, 9, -92), ["Ръка нагоре", "внимание –", "стоп за всички"]);
      b += pose(180, 1, { l: [-34, -44], r: [34, -44] }, baton(34, -44, 50, -44), ["Ръце встрани", "отстрани: направо", "и надясно"]);
      b += pose(298, 2, { l: [-14, -22], r: [-2, -40] }, baton(-2, -40, -14, -34), ["Ръка напред", "срещу лявото рамо –", "минаваш"]);
      return svg(b, "Трите основни сигнала на регулировчика", W, hh);
    },

    // ================= roundabout =================
    roundaboutLanes() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect x="155" width="50" height="${H}" fill="${C.road}"/><rect y="75" width="${W}" height="50" fill="${C.road}"/><circle cx="180" cy="100" r="88" fill="${C.road}"/><circle cx="180" cy="100" r="60" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="8 7"/><circle cx="180" cy="100" r="34" fill="${C.grassD}" stroke="#fff" stroke-width="2.5"/>`;
      b += `<path d="M192 210 V176 A74 74 0 0 0 254 112 H380" stroke="${C.green}" stroke-width="4" fill="none" stroke-dasharray="7 6"/>${T(300, 140, "1-ви изход", 11, { w: 700, c: "#1f6b34" })}`;
      b += `<path d="M196 210 V180 A47 47 0 0 0 180 53 A47 47 0 0 0 134 112 A74 74 0 0 0 106 112 H-20" stroke="${C.orange}" stroke-width="4" fill="none" stroke-dasharray="7 6"/>`;
      b += `<g><animateMotion dur="7s" repeatCount="indefinite" rotate="auto" keyPoints="0.07;1" keyTimes="0;1" calcMode="linear" path="M196 210 V180 A47 47 0 0 0 180 53 A47 47 0 0 0 134 100 A74 74 0 0 0 106 112 H-20"/>${car(0, 0, 0, C.blue, 30, 15)}</g>`;
      b += label(70, 30, "Добра практика: далечен изход – вътрешна лента,", { size: 10 }) + label(70, 52, "но излизаш от външната", { size: 10 });
      b += S("Б1", 214, 170, 24);
      return svg(b, "Ленти в кръговото движение");
    },
    roundaboutSignal() {
      let b = `<rect width="${W}" height="${H}" fill="${C.grass}"/><rect y="75" width="${W}" height="50" fill="${C.road}"/><rect x="155" width="50" height="${H}" fill="${C.road}"/><circle cx="180" cy="100" r="80" fill="${C.road}"/><circle cx="180" cy="100" r="40" fill="${C.grassD}" stroke="#fff" stroke-width="2.5"/>`;
      b += `<g><animateMotion dur="6s" repeatCount="indefinite" rotate="auto" keyPoints="0.1;1" keyTimes="0;1" calcMode="linear" path="M192 210 V168 A62 62 0 0 0 180 38 A62 62 0 0 0 128 112 H-30"/>${car(0, 0, 0, C.blue, 30, 15, { blinkR: true })}</g>`;
      b += label(290, 30, "Десен мигач преди своя изход", { size: 10.5 }) + label(290, 180, "Пропусни пешеходците на изхода", { size: 10.5 });
      return svg(b, "Мигач при излизане от кръговото");
    },

    // ================= parking =================
    parkDistances() {
      let b = `<rect width="${W}" height="${H}" fill="${C.walk}"/><rect y="20" width="${W}" height="130" fill="${C.road}"/><rect x="0" y="0" width="60" height="${H}" fill="${C.road}"/>${dashes(70, 60, W)}${zebra(220, 22, 40, 126, 8)}`;
      b += `<rect x="60" y="104" width="44" height="44" fill="rgba(224,53,43,.55)"/><rect x="176" y="104" width="44" height="44" fill="rgba(224,53,43,.55)"/>`;
      b += `<g fill="${C.red}" opacity="0"><animate attributeName="opacity" values="0;.5;0" dur="1.6s" repeatCount="indefinite"/><rect x="60" y="104" width="44" height="44"/><rect x="176" y="104" width="44" height="44"/></g>`;
      b += `<g><animateMotion dur="7s" repeatCount="indefinite" rotate="auto" calcMode="linear" keyPoints="1;1;0;1;1" keyTimes="0;.15;.15;.75;1" path="M-30 92 L50 92 C100 92 96 126 140 126"/>${car(0, 0, 0, C.green)}</g>` + car(310, 126, 0, C.green);
      b += dim(60, 166, 104, 166, "5 м", { dy: 14 }) + dim(176, 166, 220, 166, "5 м", { dy: 14 });
      b += T(82, 92, "✕", 18, { c: "#fff", w: 800 }) + T(198, 92, "✕", 18, { c: "#fff", w: 800 }) + T(140, 92, "✓", 18, { c: "#fff", w: 800 });
      b += label(110, 10 + 0, "кръстовище", { size: 10 }) + label(240, 10, "пешеходна пътека", { size: 10 });
      return svg(b, "5 метра от кръстовище и преди пешеходна пътека");
    },
    parkLine() {
      let b = `<rect width="${W}" height="${H}" fill="${C.walk}"/><rect y="20" width="${W}" height="140" fill="${C.road}"/><rect y="78" width="${W}" height="3.5" fill="#fff"/>`;
      b += car(200, 130, 0, C.red) + car(90, 48, 180, C.grey);
      b += dim(250, 84, 250, 117, "под 3 м", { w: true, c: "#fff", dx: 34, dy: 0 });
      b += `<g>${cruise(40, 5)}${car(40, 104, 0, C.blue, 40, 18)}</g>`;
      b += label(180, 182, "Иначе минаващите трябва да пресекат непрекъснатата линия", { size: 10 });
      return svg(b, "Спиране до непрекъсната линия");
    },
    sidewalk() {
      let b = `<rect width="${W}" height="${H}" fill="${C.bld}"/><rect y="56" width="${W}" height="80" fill="${C.walk}"/><rect y="136" width="${W}" height="64" fill="${C.road}"/><rect y="134" width="${W}" height="4" fill="${C.kerb}"/>`;
      for (let x = 20; x < W; x += 70) b += `<rect x="${x}" y="14" width="34" height="30" rx="3" fill="#aebccb"/>`;
      b += car(180, 112, 0, C.blue, 60, 28);
      b += dim(290, 60, 290, 96, "поне 2 м", { dx: 38, dy: 0 });
      b += `<g>${loop("0 0; 300 0", 7)}${walker(20, 92, 0.6, C.orange)}</g>`;
      b += label(180, 172, "Само на определени места · до 2,5 т · успоредно", { size: 10.5 });
      return svg(b, "Паркиране на тротоар");
    },
    busStop() {
      let b = `<rect width="${W}" height="${H}" fill="${C.walk}"/><rect y="20" width="${W}" height="120" fill="${C.road}"/>${dashes(68, 0, W)}`;
      let zz = ""; for (let i = 0, x = 90; x <= 280; x += 12, i++) zz += `${x},${i % 2 ? 122 : 136} `;
      b += `<polyline points="${zz}" fill="none" stroke="${C.yellow}" stroke-width="3.5"/>` + S("Д24", 176, 148, 36);
      b += `<g>${loop("0 0; 0 0; 300 0; -300 0; 0 0", 9, 'keyTimes="0;.45;.7;.7;1"')}<rect x="120" y="96" width="110" height="34" rx="6" fill="${C.green}" stroke="rgba(0,0,0,.3)"/><rect x="128" y="102" width="94" height="10" rx="2" fill="${C.glass}"/>${T(175, 122, "BUS", 11, { c: "#fff", w: 800 })}</g>`;
      b += label(90, 172, "Тук не се паркира", { size: 10.5 }) + label(290, 172, "Само за слизане на пътник", { size: 10.5 });
      return svg(b, "Спирка на градския транспорт");
    },
    parallel() {
      let b = `<rect width="${W}" height="${H}" fill="${C.road}"/><rect y="152" width="${W}" height="48" fill="${C.walk}"/><rect y="148" width="${W}" height="4" fill="${C.kerb}"/>${dashes(62, 0, W)}`;
      b += car(70, 128, 0, C.grey) + car(292, 128, 0, C.grey);
      b += `<path d="M236 94 C200 94 196 128 160 128" stroke="${C.blue}" stroke-width="2.5" stroke-dasharray="6 5" fill="none" opacity=".75" marker-end="url(#il-ah)"/>`;
      // drives up beside the front car, then reverses in (auto-reverse keeps the nose pointing forwards)
      b += `<g><animateMotion dur="9s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;.25;.75;1" calcMode="linear" rotate="auto-reverse" path="M246 94 C206 94 200 128 156 128"/>${car(0, 0, 0, C.blue, 46, 22, { label: "Ти" })}<circle cx="-23" cy="-8" r="3" fill="#fff"/><circle cx="-23" cy="8" r="3" fill="#fff"/></g>`;
      ["Спри до колата отпред", "Назад, волан надясно", "Под 45° – волан наляво", "Изправи и центрирай"].forEach((t, k) => {
        const x = 6 + (k % 2) * 176, y = 4 + Math.floor(k / 2) * 22, a = 0.15 + k * 0.15;
        b += `<g><rect x="${x}" y="${y}" width="172" height="19" rx="9.5" fill="#fff"/><circle cx="${x + 10}" cy="${y + 9.5}" r="7" fill="${C.blue}"/>${T(x + 10, y + 10, k + 1, 9.5, { c: "#fff", w: 800 })}${T(x + 22, y + 10, t, 10, { a: "start" })}<animate attributeName="opacity" values="1;.4;.4;1;1;.4;.4" keyTimes="0;.02;${a.toFixed(2)};${(a + 0.02).toFixed(2)};${(a + 0.15).toFixed(2)};${(a + 0.17).toFixed(2)};1" dur="9s" repeatCount="indefinite"/></g>`;
      });
      b += label(180, 178, "Автоматикът пълзи сам – контролираш само със спирачката", { size: 10.5 });
      return svg(b, "Успоредно паркиране на заден ход");
    },
    slope() {
      const hh = 220;
      // side view of the slope + a small top view of the front wheels against the kerb
      const panel = (x, down) => {
        const y0 = down ? 70 : 150, y1 = down ? 150 : 70;
        const ang = (Math.atan2(y1 - y0, 168) * 180) / Math.PI;
        const wheel = down ? 28 : -28; // down: towards the kerb (right), up: away from it
        let g = `<g transform="translate(${x} 0)"><rect width="172" height="${hh}" rx="12" fill="${C.sky}"/>`;
        g += `<path d="M0 ${y0} L172 ${y1} L172 ${hh} L0 ${hh} Z" fill="${C.road}"/><path d="M0 ${y0} L172 ${y1}" stroke="${C.kerb}" stroke-width="5"/>`;
        g += `<g transform="translate(86 ${(y0 + y1) / 2 - 3}) rotate(${ang})"><g>${loop("0 0; 0 0; " + (down ? 6 : -6) + " 0; 0 0; 0 0", 4, 'keyTimes="0;.4;.5;.6;1"')}${sideCar(0, 0, 0.72, C.blue, !down)}</g></g>`;
        g += T(86, 14, down ? "Надолу" : "Нагоре", 12.5, { w: 800 });
        // top view inset: kerb on the right, car nose pointing up the screen
        g += `<g transform="translate(${down ? 104 : 6} 26)"><rect width="62" height="72" rx="8" fill="#fff"/><rect x="50" y="4" width="8" height="50" fill="${C.kerb}"/>
          <rect x="16" y="10" width="26" height="42" rx="7" fill="${C.blue}"/>
          <g transform="translate(15 20)"><rect x="-3" y="-7" width="6" height="14" rx="2" fill="${C.tyre}"><animateTransform attributeName="transform" type="rotate" values="0;0;${wheel};${wheel}" keyTimes="0;.15;.35;1" dur="4s" repeatCount="indefinite"/></rect></g>
          <g transform="translate(43 20)"><rect x="-3" y="-7" width="6" height="14" rx="2" fill="${C.tyre}"><animateTransform attributeName="transform" type="rotate" values="0;0;${wheel};${wheel}" keyTimes="0;.15;.35;1" dur="4s" repeatCount="indefinite"/></rect></g>
          ${T(31, 64, "поглед", 9, { c: C.muted, w: 600 })}${T(31, 74, "отгоре", 9, { c: C.muted, w: 600 })}</g>`;
        g += T(86, 186, "колелата", 11, { c: "#fff", w: 600 }) + T(86, 202, down ? "към бордюра" : "навън от бордюра", 11.5, { c: "#fff", w: 800 });
        return g + "</g>";
      };
      return svg(`<rect width="${W}" height="${hh}" fill="#eef2f6"/>` + panel(6, true) + panel(182, false), "Паркиране на наклон: накъде се завиват колелата", W, hh);
    },
    childExit() {
      let b = `<rect width="${W}" height="${H}" fill="${C.walk}"/><rect y="0" width="${W}" height="120" fill="${C.road}"/><rect y="118" width="${W}" height="4" fill="${C.kerb}"/>`;
      b += car(180, 92, 0, C.blue, 90, 40) + `<path d="M170 112 L156 140" stroke="${C.blue}" stroke-width="6" stroke-linecap="round"/>`;
      b += `<g>${loop("0 0; 0 30; 0 30", 5, 'keyTimes="0;.4;1"')}${walker(150, 150, 0.6, C.green)}</g>`;
      b += `<path d="M196 72 L210 44" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/><path d="M200 40 L222 58 M222 40 L200 58" stroke="${C.red}" stroke-width="4"/>`;
      b += label(260, 172, "Децата слизат откъм тротоара", { size: 11 }) + label(280, 30, "не към платното", { size: 11 });
      return svg(b, "Деца слизат откъм тротоара");
    },

    // ================= seat & mirrors =================
    seat() {
      const w = 360, hh = 220;
      // numbered callout that appears in turn (visible at t=0, then re-revealed step by step)
      const note = (n, bx, by, lines, tx, ty, anchor, at) => {
        const kt = `0;0.02;${at};${at + 0.03};1`;
        return `<g opacity="1"><animate attributeName="opacity" values="1;0;0;1;1" keyTimes="${kt}" dur="10s" repeatCount="indefinite"/>
          <circle cx="${bx}" cy="${by}" r="9" fill="${C.green}" stroke="#fff" stroke-width="2"/>${T(bx, by + 0.5, n, 11, { c: "#fff", w: 800 })}
          ${lines.map((l, k) => T(tx, ty + k * 14, l, 11, { a: anchor, w: k ? 500 : 700, c: C.ink })).join("")}
          <circle cx="${bx}" cy="${by}" r="9" fill="none" stroke="${C.green}" stroke-width="2"><animate attributeName="r" values="9;18;9" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0;.8" dur="1.6s" repeatCount="indefinite"/></circle></g>`;
      };
      let b = `<rect width="${w}" height="${hh}" fill="#eef2f6"/><rect y="200" width="${w}" height="20" fill="#c9d0d8"/>`;
      // car interior: windscreen, dashboard, pedal
      b += `<path d="M300 0 L346 104 L360 104 L360 0 Z" fill="#cfe3f5"/><path d="M296 0 L344 106" stroke="#59616c" stroke-width="7"/>`;
      b += `<path d="M292 104 Q300 96 320 96 L360 96 L360 140 L310 132 Q296 128 292 118 Z" fill="#4b525c"/>`;
      b += `<g transform="rotate(-18 312 196)"><rect x="306" y="168" width="9" height="30" rx="3" fill="#2b2f36"/></g><path d="M318 140 L314 170" stroke="#2b2f36" stroke-width="4"/>`;
      // seat
      b += `<rect x="128" y="182" width="78" height="18" rx="3" fill="#3d434b"/>`;
      b += `<path d="M112 176 Q108 160 124 158 L214 152 Q226 152 226 164 L226 172 Q226 180 214 180 Z" fill="#59616c"/>`;
      b += `<path d="M116 170 L134 82 Q137 70 150 72 L154 73 Q164 76 161 88 L142 170 Z" fill="#59616c"/>`;
      b += `<path d="M146 72 L150 60" stroke="#3d434b" stroke-width="4"/><rect x="134" y="38" width="26" height="28" rx="9" fill="#4b525c" transform="rotate(12 147 52)"/>`;
      // steering column + wheel (side view, top tilted towards the driver)
      b += `<path d="M268 112 L304 126" stroke="#2b2f36" stroke-width="8" stroke-linecap="round"/>`;
      b += `<g transform="rotate(-22 262 100)"><ellipse cx="262" cy="100" rx="7" ry="30" fill="none" stroke="#2b2f36" stroke-width="7"/></g>`;
      // driver
      const shirt = "#3b82f6", pants = "#34405a";
      b += `<path d="M160 160 L232 150" stroke="${pants}" stroke-width="22" stroke-linecap="round"/>`;
      b += `<path d="M232 150 L270 190" stroke="${pants}" stroke-width="17" stroke-linecap="round"/>`;
      b += `<path d="M266 192 L290 186" stroke="#1f2328" stroke-width="10" stroke-linecap="round"/>`;
      b += `<path d="M156 156 L168 96" stroke="${shirt}" stroke-width="30" stroke-linecap="round"/>`;
      b += `<rect x="166" y="70" width="10" height="14" rx="4" fill="${C.skin}"/>`;
      b += `<circle cx="174" cy="58" r="15" fill="${C.skin}"/><path d="M159 56 Q160 40 176 41 Q190 42 189 54 Q182 47 172 49 Q164 50 159 56 Z" fill="${C.hair}"/><circle cx="183" cy="58" r="1.8" fill="${C.ink}"/>`;
      // ghost arm: straight arm, wrist reaches the top of the rim
      b += `<g opacity=".0"><animate attributeName="opacity" values="0;0;.9;.9;0;0" keyTimes="0;.42;.46;.62;.66;1" dur="10s" repeatCount="indefinite"/><path d="M172 94 L251 74" stroke="${C.green}" stroke-width="10" stroke-linecap="round" stroke-dasharray="3 5"/><circle cx="252" cy="73" r="6" fill="none" stroke="${C.green}" stroke-width="3"/></g>`;
      // real arm: elbows slightly bent, hands at 9 and 3
      b += `<path d="M172 96 L214 120 L258 100" stroke="#2f6fdc" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="259" cy="99" r="6" fill="${C.skin}"/>`;
      // dashed level line: top of the head = top of the headrest
      b += `<path d="M120 40 H196" stroke="${C.green}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      b += note("1", 232, 150, ["Спирачка докрай –", "коляното леко свито"], 8, 190, "start", 0.08);
      b += note("2", 140, 126, ["Гърбът –", "изцяло", "на облегалката"], 8, 108, "start", 0.28);
      b += note("3", 252, 73, ["Китката стига", "горния ръб на волана"], 196, 18, "start", 0.48);
      b += note("4", 147, 40, ["Облегалка за глава:", "ръбът ≈ темето"], 8, 20, "start", 0.68);
      return svg(b, "Правилна позиция зад волана: седалка, облегалка, волан и облегалка за глава", w, hh);
    },
    belt() {
      const w = 360, hh = 230;
      // seated person seen from the front; o.belt = "ok" | "neck" | "arm"
      const sitter = (cx, cy, s, kind) => {
        const shirt = "#8fb8f0", pants = "#34405a", st = "#2b2f36";
        let g = `<g transform="translate(${cx} ${cy}) scale(${s})">`;
        g += `<path d="M-6 -14 V-8 M6 -14 V-8" stroke="#3d434b" stroke-width="3"/><rect x="-26" y="-36" width="52" height="26" rx="10" fill="#4b525c"/>`;
        g += `<rect x="-48" y="-2" width="96" height="128" rx="20" fill="#59616c"/>`;
        g += `<rect x="-6" y="0" width="12" height="16" fill="${C.skin}"/>`;
        g += `<circle cx="0" cy="-18" r="17" fill="${C.skin}"/><path d="M-17 -20 Q-16 -38 0 -37 Q16 -38 17 -20 Q10 -30 0 -29 Q-10 -30 -17 -20 Z" fill="${C.hair}"/><circle cx="-6" cy="-17" r="1.8" fill="${C.ink}"/><circle cx="6" cy="-17" r="1.8" fill="${C.ink}"/><path d="M-5 -8 Q0 -5 5 -8" stroke="${C.ink}" stroke-width="1.4" fill="none"/>`;
        g += `<path d="M-38 30 Q-38 13 -20 12 L20 12 Q38 13 38 30 L34 100 L-34 100 Z" fill="${shirt}"/>`;
        g += `<path d="M-38 26 L-44 74 L-26 100 M38 26 L44 74 L26 100" stroke="${shirt}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
        g += `<rect x="-36" y="94" width="72" height="26" rx="10" fill="${pants}"/><ellipse cx="-17" cy="124" rx="16" ry="9" fill="${pants}"/><ellipse cx="17" cy="124" rx="16" ry="9" fill="${pants}"/>`;
        g += `<circle cx="-25" cy="102" r="5" fill="${C.skin}"/><circle cx="25" cy="102" r="5" fill="${C.skin}"/>`;
        const lapY = kind === "arm" ? 74 : 100;
        const shoulder = kind === "neck" ? "M34 -6 L6 6 L-34 " + lapY : kind === "arm" ? "M44 24 L38 46 L-34 " + lapY : "M34 -6 L20 13 L-34 " + lapY;
        const anim = kind === "ok" ? `<animate attributeName="stroke-dashoffset" values="0;1;1;0;0" keyTimes="0;.06;.2;.5;1" dur="6s" repeatCount="indefinite"/>` : "";
        g += `<path d="${shoulder}" stroke="${st}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none" pathLength="1" stroke-dasharray="1 1">${anim}</path>`;
        g += `<path d="M-38 ${lapY} H38" stroke="${st}" stroke-width="9" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1">${anim}</path>`;
        g += `<rect x="-44" y="${lapY - 8}" width="16" height="16" rx="3" fill="#c3c9d1" stroke="${st}" stroke-width="2">${kind === "ok" ? `<animate attributeName="fill" values="#c3c9d1;#c3c9d1;${C.green};#c3c9d1;#c3c9d1" keyTimes="0;.49;.53;.62;1" dur="6s" repeatCount="indefinite"/>` : ""}</rect>`;
        return g + `</g>`;
      };
      const badge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.green}" stroke="#fff" stroke-width="2"/>${T(x, y + 0.5, n, 11, { c: "#fff", w: 800 })}`;
      let b = `<rect width="${w}" height="${hh}" fill="#eef2f6"/>`;
      b += `<rect x="6" y="6" width="178" height="190" rx="14" fill="#fff"/>`;
      b += sitter(84, 64, 0.92, "ok");
      b += `<path d="M40 30 H128" stroke="${C.green}" stroke-width="1.8" stroke-dasharray="4 3"/>`;
      b += badge(122, 20, "1") + badge(103, 76, "2") + badge(50, 156, "3");
      b += `<g transform="translate(150 30)"><circle r="14" fill="${C.green}"/><path d="M-6 0 l4 4 l8 -9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
      b += T(150, 56, "Правилно", 11, { w: 800, c: C.green });
      // wrong ways
      [[230, "neck", "през врата"], [316, "arm", "под мишницата"]].forEach(([x, k, t]) => {
        b += `<rect x="${x - 40}" y="6" width="80" height="190" rx="14" fill="#fff"/>` + sitter(x, 66, 0.6, k);
        b += `<g transform="translate(${x + 26} 22)"><circle r="10" fill="${C.red}"/><path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></g>`;
        b += T(x, 164, "Грешно:", 11, { c: C.red, w: 800 }) + T(x, 180, t, 9.5, { c: C.red, w: 600 });
      });
      b += `<g transform="translate(6 206)">${badge(8, 8, "1")}${T(20, 8.5, "облегалка ≈ темето", 10, { a: "start", w: 600 })}${badge(140, 8, "2")}${T(152, 8.5, "през ключицата", 10, { a: "start", w: 600 })}${badge(254, 8, "3")}${T(266, 8.5, "ниско на таза", 10, { a: "start", w: 600 })}</g>`;
      return svg(b, "Колан и облегалка за глава: правилно и грешно", w, hh);
    },
    interiorMirror() {
      const w = 360, hh = 220;
      let b = `<defs><clipPath id="im-glass"><rect x="104" y="40" width="152" height="46" rx="20"/></clipPath></defs>`;
      // driver's view through the windscreen
      b += `<rect width="${w}" height="${hh}" fill="#2b2f36"/>`;
      b += `<path d="M30 0 H330 L360 150 H0 Z" fill="#cfe3f5"/>`;
      b += `<path d="M0 150 L150 96 H210 L360 150 Z" fill="${C.road}"/><path d="M179 98 L177 150" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 9"/>`;
      b += `<path d="M0 150 L150 96 L0 112 Z" fill="${C.grass}"/><path d="M360 150 L210 96 L360 112 Z" fill="${C.grass}"/>`;
      b += `<path d="M0 0 H34 L8 150 H0 Z M360 0 H326 L352 150 H360 Z" fill="#1f2328"/>`;
      b += `<path d="M0 146 Q180 128 360 146 V220 H0 Z" fill="#1f2328"/>`;
      b += `<g transform="translate(180 222)"><circle r="62" fill="none" stroke="#3a3f46" stroke-width="12"/><circle r="16" fill="#3a3f46"/><path d="M-60 0 H60" stroke="#3a3f46" stroke-width="10"/></g>`;
      // the mirror: starts tilted (rear window off-centre), then aligned
      b += `<rect x="177" y="0" width="6" height="34" fill="#14171a"/>`;
      b += `<g><animateTransform attributeName="transform" type="rotate" values="0 180 63;-7 180 63;-7 180 63;0 180 63;0 180 63" keyTimes="0;.08;.3;.5;1" dur="8s" repeatCount="indefinite"/>
        <rect x="96" y="32" width="168" height="62" rx="28" fill="#14171a"/><rect x="104" y="40" width="152" height="46" rx="20" fill="#59616c"/>
        <g clip-path="url(#im-glass)"><g><animateTransform attributeName="transform" type="translate" values="0 0;-46 10;-46 10;0 0;0 0" keyTimes="0;.08;.3;.5;1" dur="8s" repeatCount="indefinite"/>
          <rect x="110" y="36" width="140" height="54" fill="#40464f"/>
          <path d="M122 44 H238 Q246 44 244 52 L238 80 H122 L116 52 Q114 44 122 44 Z" fill="#9fc6ea"/>
          <path d="M120 72 L160 60 H200 L240 72 V80 H120 Z" fill="${C.road}"/>
          <g><animateTransform attributeName="transform" type="scale" values="0.6;0.6;1.2;0.6" keyTimes="0;.5;.9;1" dur="8s" repeatCount="indefinite" additive="sum"/></g>
          <g transform="translate(180 68)"><g><animateTransform attributeName="transform" type="scale" values=".55;.55;1;.55" keyTimes="0;.5;.92;1" dur="8s" repeatCount="indefinite"/><rect x="-12" y="-7" width="24" height="12" rx="4" fill="${C.orange}"/><rect x="-9" y="-12" width="18" height="7" rx="3" fill="#ffd2a6"/><circle cx="-8" cy="0" r="2" fill="#fff6c2"/><circle cx="8" cy="0" r="2" fill="#fff6c2"/></g></g>
          <rect x="110" y="80" width="140" height="10" fill="#40464f"/><rect x="134" y="82" width="12" height="6" rx="2" fill="#2b2f36"/><rect x="214" y="82" width="12" height="6" rx="2" fill="#2b2f36"/>
        </g></g>
        <rect x="174" y="88" width="12" height="6" rx="2" fill="#59616c"/>
      </g>`;
      b += `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.5;.54;.95;1" dur="8s" repeatCount="indefinite"/><circle cx="276" cy="40" r="11" fill="${C.green}"/><path d="M271 40 l3.5 3.5 l7 -8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`;
      b += label(180, 116, "Цялото задно стъкло – в средата на огледалото", { size: 11 });
      b += T(180, 176, "Лостчето отдолу = нощен режим срещу заслепяване", 10.5, { c: "#cfd6dd", w: 600 });
      return svg(b, "Вътрешното огледало, както го виждаш от мястото на шофьора", w, hh);
    },

    // ================= weather =================
    aquaplaning() {
      let b = `<rect width="${W}" height="${H}" fill="${C.sky}"/><rect y="150" width="${W}" height="50" fill="${C.road}"/><rect x="0" y="144" width="${W}" height="9" fill="${C.water}" opacity=".85"/>`;
      for (let i = 0; i < 18; i++) b += `<line x1="${i * 22}" y1="${(i * 37) % 120}" x2="${i * 22 - 6}" y2="${((i * 37) % 120) + 14}" stroke="${C.water}" stroke-width="2"><animateTransform attributeName="transform" type="translate" values="0 -30; 0 150" dur="${0.8 + (i % 4) * 0.15}s" repeatCount="indefinite"/></line>`;
      b += `<g>${loop("0 0; 3 -2; 0 0", 0.6)}${sideCar(150, 142, 1.25, C.blue)}</g>`;
      b += `<g fill="${C.water}">${[0, 1, 2, 3].map((k) => `<circle cx="${70 - k * 10}" cy="${138 - k * 6}" r="${4 - k * 0.6}"><animate attributeName="opacity" values="1;0" dur="0.7s" begin="${k * 0.15}s" repeatCount="indefinite"/></circle>`).join("")}</g>`;
      b += label(280, 30, "пусни газта", { size: 11 }) + label(280, 54, "дръж волана право", { size: 11 }) + label(280, 78, "без рязко спиране", { size: 11 });
      b += T(180, 180, "Гумата „плава“ върху водата", 12, { c: "#fff", w: 700 });
      return svg(b, "Аквапланинг");
    },
    fog() {
      let b = `<rect width="${W}" height="${H}" fill="#cfd6dd"/><rect y="120" width="${W}" height="80" fill="${C.road}"/>${dashes(160, 0, W)}`;
      b += sideCar(150, 150, 1.1, C.blue) + `<path d="M84 128 L-10 108 L-10 150 Z" fill="#ff3b30" opacity=".35"><animate attributeName="opacity" values=".25;.45;.25" dur="2s" repeatCount="indefinite"/></path><rect x="80" y="126" width="6" height="7" rx="1.5" fill="#ff3b30"/>`;
      b += `<path d="M216 140 L380 116 L380 168 Z" fill="#fff8c8" opacity=".55"/>`;
      for (let i = 0; i < 4; i++) b += `<ellipse cx="${90 + i * 90}" cy="${60 + (i % 2) * 40}" rx="120" ry="34" fill="#fff" opacity=".45"><animateTransform attributeName="transform" type="translate" values="-40 0; 40 0; -40 0" dur="${9 + i * 2}s" repeatCount="indefinite"/></ellipse>`;
      b += dim(220, 186, 340, 186, "", { w: true, c: "#fff" }) + T(280, 174, "видимост под 50 м", 11.5, { c: "#fff", w: 700 });
      b += label(110, 30, "Задна светлина за мъгла – само под 50 м", { size: 10.5 });
      return svg(b, "Задна светлина за мъгла");
    },
    headlights() {
      let b = `<rect width="${W}" height="${H}" fill="#152033"/>`;
      for (let i = 0; i < 30; i++) b += `<circle cx="${(i * 53) % W}" cy="${(i * 29) % 70}" r="${i % 3 ? 0.8 : 1.3}" fill="#fff" opacity=".7"/>`;
      b += `<rect y="80" width="${W}" height="100" fill="#2a2f36"/>${dashes(130, 0, W)}`;
      b += `<g><path d="M70 152 L360 120 L360 182 Z" fill="#fff6b0" opacity=".35"><animate attributeName="d" values="M70 152 L360 120 L360 182 Z;M70 152 L360 120 L360 182 Z;M70 152 L200 140 L200 170 Z;M70 152 L200 140 L200 170 Z" keyTimes="0;.45;.5;1" dur="7s" repeatCount="indefinite"/></path></g>`;
      b += car(46, 155, 0, C.blue);
      b += `<g>${loop("0 0; -150 0; -150 0", 7, 'keyTimes="0;.5;1"')}<g transform="translate(380 105)"><path d="M-22 0 L-200 -20 L-200 24 Z" fill="#fff6b0" opacity=".25"/>${car(0, 0, 180, C.orange)}</g></g>`;
      b += label(120, 30, "Дълги → къси най-късно на 150 м от насрещния", { size: 10.5 }) + label(260, 60, "зад кола под 50 м – само къси", { size: 10.5 });
      return svg(b, "Превключване от дълги на къси светлини");
    },
    bridgeIce() {
      let b = `<rect width="${W}" height="${H}" fill="${C.sky}"/><rect y="150" width="${W}" height="50" fill="${C.grass}"/><rect y="160" width="${W}" height="40" fill="#8fc0e8"/>`;
      b += `<rect x="0" y="110" width="90" height="16" fill="${C.road}"/><rect x="270" y="110" width="90" height="16" fill="${C.road}"/><rect x="90" y="100" width="180" height="16" fill="${C.road}"/><rect x="90" y="96" width="180" height="5" fill="#e3f3ff"/>`;
      b += `<rect x="112" y="116" width="12" height="50" fill="#8b939c"/><rect x="236" y="116" width="12" height="50" fill="#8b939c"/>`;
      b += `<g fill="none" stroke="#6aa9e0" stroke-width="2.5"><path d="M180 30 V66 M164 39 L196 57 M164 57 L196 39"/></g>`;
      b += `<g>${cruise(40, 8)}${sideCar(40, 100, 0.45, C.blue)}</g>`;
      b += label(180, 184, "Мостът замръзва първи – студ отгоре и отдолу", { size: 10.5 });
      return svg(b, "Мостовете замръзват първи");
    },
    wind() {
      let b = `<rect width="${W}" height="${H}" fill="${C.sky}"/><rect y="120" width="${W}" height="80" fill="${C.road}"/>${dashes(160, 0, W)}`;
      b += S("А37", 14, 14, 56);
      b += `<g>${loop("0 0; 0 8; 0 0", 2.5)}${sideCar(200, 150, 1, C.blue)}</g>`;
      for (let i = 0; i < 4; i++) b += `<path d="M80 ${50 + i * 18} Q130 ${40 + i * 18} 180 ${50 + i * 18}" stroke="#7e8a97" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="40 200"><animate attributeName="stroke-dashoffset" values="240;0" dur="${1.4 + i * 0.2}s" repeatCount="indefinite"/></path>`;
      b += label(290, 40, "Дръж волана с двете ръце", { size: 10.5 }) + label(180, 186, "мостове, изходи на тунели, покрай камиони", { size: 10.5 });
      return svg(b, "Силен страничен вятър");
    },
    winterTyres() {
      let b = `<rect width="${W}" height="${H}" fill="#eef2f6"/>`;
      b += `<g transform="translate(90 100)"><g><animateTransform attributeName="transform" type="rotate" values="0;360" dur="4s" repeatCount="indefinite"/><circle r="76" fill="${C.tyre}"/>`;
      for (let a = 0; a < 360; a += 20) b += `<rect x="-6" y="-76" width="12" height="18" fill="#3a3f45" transform="rotate(${a})"/>`;
      b += `<circle r="40" fill="${C.rim}"/>${[0, 72, 144, 216, 288].map((a) => `<rect x="-4" y="-36" width="8" height="24" rx="3" fill="#b9c0c8" transform="rotate(${a})"/>`).join("")}<circle r="10" fill="#9aa1a9"/></g></g>`;
      b += `<g transform="translate(220 40)"><rect width="110" height="120" rx="12" fill="#fff"/><rect x="20" y="46" width="70" height="34" fill="${C.tyre}"/><rect x="20" y="20" width="22" height="26" fill="${C.tyre}"/><rect x="68" y="20" width="22" height="26" fill="${C.tyre}"/>
        <g><animateTransform attributeName="transform" type="translate" values="0 -18;0 -18;0 0;0 0;0 -18" keyTimes="0;.2;.4;.8;1" dur="4s" repeatCount="indefinite"/><rect x="51" y="-4" width="8" height="50" fill="${C.amber}"/><rect x="44" y="-8" width="22" height="6" rx="2" fill="${C.ink}"/></g>
        ${dim(96, 20, 96, 46, "", {})}${T(55, 100, "≥ 4 мм", 18, { w: 800 })}</g>`;
      b += label(180, 186, "15 ноември – 1 март: зимни гуми или протектор поне 4 мм", { size: 10.5 });
      return svg(b, "Гуми през зимата");
    },
    dayLights() {
      let b = `<rect width="${W}" height="${H}" fill="${C.sky}"/><circle cx="310" cy="40" r="20" fill="#ffd25a"/><rect y="130" width="${W}" height="70" fill="${C.road}"/>${dashes(170, 0, W)}`;
      b += `<g>${cruise(110, 7)}<g transform="translate(110 0)">${sideCar(0, 160, 1, C.blue)}<path d="M58 132 L120 124 L120 146 Z" fill="#fff6b0" opacity=".55"/></g></g>`;
      b += label(150, 30, "Денем – светлини за движение през деня или къси", { size: 10.5 }) + label(150, 56, "в тунел – къси", { size: 10.5 });
      return svg(b, "Светлини през деня");
    },
  };

  window.BGIllustrations = IL;
  // drawing kit, shared with js/scenarios.js
  window.BGDraw = { C, W, H, S, svg, T, label, dim, dashes, vdashes, zebra, car, sideCar, person, walker, ground, roadH, loop, cruise };
})();
