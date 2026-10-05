/* Road signs (Bulgarian groups А, Б, В, Г, Д, Т) and dashboard lamps, drawn as inline SVG.
   Signs keep their real-world colours in both themes: they are physical objects. */
(function () {
  const RED = "#c8102e";
  const BLUE = "#1d5fb4";
  const GREEN = "#1b7a3e";
  const YELLOW = "#f7c600";
  const BLACK = "#16181b";
  const WHITE = "#ffffff";

  const wrap = (inner, label) =>
    `<svg viewBox="0 0 100 100" class="sign" role="img" aria-label="${label || ""}">${inner}</svg>`;

  // ---- frames ----
  const warn = (sym, bg = WHITE) =>
    `<polygon points="50,9 93,86 7,86" fill="${bg}" stroke="${RED}" stroke-width="10" stroke-linejoin="round"/>${sym}`;
  const prohib = (sym, fill = WHITE) =>
    `<circle cx="50" cy="50" r="44" fill="${fill}" stroke="${RED}" stroke-width="10"/>${sym}`;
  const mand = (sym) =>
    `<circle cx="50" cy="50" r="47" fill="${BLUE}"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="${WHITE}" stroke-width="2"/>${sym}`;
  const square = (fill, sym) =>
    `<rect x="4" y="4" width="92" height="92" rx="9" fill="${fill}"/><rect x="8" y="8" width="84" height="84" rx="6" fill="none" stroke="${WHITE}" stroke-width="2.5"/>${sym}`;

  // ---- symbols ----
  const arrowUp = (x = 50, color = WHITE, top = 18, bottom = 84, w = 8, head = 15) =>
    `<path d="M${x - w / 2} ${bottom} V${top + head + 6} H${x - head} L${x} ${top} L${x + head} ${top + head + 6} H${x + w / 2} V${bottom} Z" fill="${color}"/>`;
  const arrowDown = (x, color, top = 18, bottom = 84, w = 8, head = 15) =>
    `<g transform="rotate(180 ${x} ${(top + bottom) / 2})">${arrowUp(x, color, top, bottom, w, head)}</g>`;
  const turnRight = (color) =>
    `<path d="M40 82 V58 Q40 44 54 44 H60" fill="none" stroke="${color}" stroke-width="10"/><polygon points="58,28 80,44 58,60" fill="${color}"/>`;
  const turnLeft = (color) => `<g transform="translate(100 0) scale(-1 1)">${turnRight(color)}</g>`;
  const uTurn = (color) =>
    `<path d="M62 82 V46 Q62 30 47 30 Q32 30 32 46 V54" fill="none" stroke="${color}" stroke-width="10"/><polygon points="20,52 44,52 32,72" fill="${color}"/>`;
  const bar = `<line x1="21" y1="21" x2="79" y2="79" stroke="${RED}" stroke-width="9"/>`;

  function roundaboutArrows(cx, cy, r, color, sw, hs) {
    let out = "";
    const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
    for (let i = 0; i < 3; i++) {
      const a0 = 30 + i * 120;
      const a1 = a0 - 78;
      const [x0, y0] = p(a0);
      const [x1, y1] = p(a1);
      out += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 0 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
      const rad = (a1 * Math.PI) / 180;
      const tx = Math.sin(rad), ty = -Math.cos(rad); // tangent, counter-clockwise on screen
      const nx = Math.cos(rad), ny = Math.sin(rad);
      const tip = [x1 + tx * hs * 1.1, y1 + ty * hs * 1.1];
      const b1 = [x1 + nx * hs - tx * 2, y1 + ny * hs - ty * 2];
      const b2 = [x1 - nx * hs - tx * 2, y1 - ny * hs - ty * 2];
      out += `<polygon points="${tip.map((v) => v.toFixed(1)).join(",")} ${b1.map((v) => v.toFixed(1)).join(",")} ${b2.map((v) => v.toFixed(1)).join(",")}" fill="${color}"/>`;
    }
    return out;
  }

  function person(x, y, s = 1, color = BLACK) {
    // walking pictogram; (x,y) = feet baseline centre
    const k = (v) => (v * s).toFixed(1);
    return `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="${k(4.2)}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="${k(1)}" cy="${k(-31)}" r="${k(3.6)}" fill="${color}" stroke="none"/>
      <path d="M${k(0)} ${k(-25)} L${k(-1)} ${k(-12)} M${k(-1)} ${k(-12)} L${k(-7)} ${k(0)} M${k(-1)} ${k(-12)} L${k(6)} ${k(-5)} L${k(7)} ${k(0)} M${k(0)} ${k(-23)} L${k(-7)} ${k(-15)} M${k(0)} ${k(-23)} L${k(7)} ${k(-17)}"/>
    </g>`;
  }

  function carFront(x, color) {
    return `<g fill="${color}"><path d="M${x - 9} 46 L${x - 6} 36 H${x + 6} L${x + 9} 46 Z"/><rect x="${x - 13}" y="45" width="26" height="15" rx="3"/><rect x="${x - 12}" y="59" width="6" height="7" rx="1.5"/><rect x="${x + 6}" y="59" width="6" height="7" rx="1.5"/></g><rect x="${x - 7}" y="38.5" width="14" height="6" fill="#fff" opacity=".9"/>`;
  }

  const txt = (x, y, s, size, color = BLACK, weight = 800, family = "Arial, Helvetica, sans-serif", extra = "") =>
    `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle" dominant-baseline="central" ${extra}>${s}</text>`;

  const SIGNS = {
    // ---------- А: warning ----------
    A1: {
      name: "Опасен завой надясно",
      g: "А",
      d: "Предупреждава за остър завой. Намали скоростта преди завоя, а не в него.",
      svg: () => warn(`<path d="M42 79 V62 Q42 50 54 48" fill="none" stroke="${BLACK}" stroke-width="7"/><polygon points="52,39 66,48 52,57" fill="${BLACK}"/>`),
    },
    A15: {
      name: "Опасност от хлъзгане",
      g: "А",
      d: "Хлъзгав участък (често с табела Т14 – при влага или заледяване). Плавно с волана, газта и спирачката.",
      svg: () =>
        warn(`<g fill="${BLACK}"><path d="M38 52 L42 44 H58 L62 52 Z"/><rect x="35" y="51" width="30" height="9" rx="2"/><rect x="36" y="59" width="6" height="5"/><rect x="58" y="59" width="6" height="5"/></g><path d="M41 80 q-5 -5 0 -9 t0 -7 M59 80 q5 -5 0 -9 t0 -7" fill="none" stroke="${BLACK}" stroke-width="3"/>`),
    },
    A18: {
      name: "Пешеходна пътека",
      g: "А",
      d: "Предупреждава, че наближаваш пешеходна пътека, означена със знак Д17.",
      svg: () =>
        warn(`<g fill="${BLACK}"><rect x="26" y="74" width="7" height="6"/><rect x="38" y="74" width="7" height="6"/><rect x="50" y="74" width="7" height="6"/><rect x="62" y="74" width="7" height="6"/></g>${person(49, 72, 1.15)}`),
    },
    A19: {
      name: "Деца",
      g: "А",
      d: "Възможна е внезапна поява на деца – училище, детска градина, площадка. Намали и бъди готов да спреш.",
      svg: () => warn(`${person(42, 80, 1.15)}${person(60, 80, 0.85)}`),
    },
    A23: {
      name: "Участък от пътя в ремонт",
      g: "А",
      d: "Жълт фон. Ремонт, работници и техника на пътя. Временните знаци и маркировка са с предимство.",
      svg: () =>
        warn(`<g stroke="${BLACK}" stroke-width="4" stroke-linecap="round" fill="none"><path d="M45 54 L42 66 L36 78 M42 66 L50 72 L52 79 M45 56 L56 60 L62 54 M62 54 L70 76"/></g><circle cx="47" cy="47" r="4" fill="${BLACK}"/><path d="M62 79 Q70 70 80 79 Z" fill="${BLACK}"/>`, YELLOW),
    },
    A24: {
      name: "Светофар",
      g: "А",
      d: "Предупреждава за кръстовище или участък, регулиран със светофар, който може да не се вижда отдалеч.",
      svg: () =>
        warn(`<rect x="40" y="36" width="20" height="46" rx="5" fill="${BLACK}"/><circle cx="50" cy="45" r="5.5" fill="#e3261b"/><circle cx="50" cy="59" r="5.5" fill="#f6c000"/><circle cx="50" cy="73" r="5.5" fill="#1aa64b"/>`),
    },
    A29: {
      name: "Кръстовище с кръгово движение",
      g: "А",
      d: "Предупреждава за кръгово кръстовище напред. Самото предимство се определя от знаците на входа (обикновено Б1).",
      svg: () => warn(roundaboutArrows(50, 63, 13, BLACK, 4.5, 5)),
    },
    A33: {
      name: "Железопътен прелез без бариери",
      g: "А",
      d: "Спирането пред прелез без бариери е задължително – на поне 2 м преди първата релса, ако няма други указания.",
      svg: () =>
        warn(`<g fill="${BLACK}"><rect x="30" y="56" width="32" height="16" rx="2"/><rect x="56" y="46" width="14" height="26"/><rect x="34" y="47" width="6" height="10"/><rect x="26" y="70" width="46" height="4"/><circle cx="38" cy="78" r="4"/><circle cx="50" cy="78" r="4"/><circle cx="63" cy="78" r="4"/></g>`),
    },
    A39: {
      name: "Внимание! Други опасности",
      g: "А",
      d: "Опасност, за която няма отделен знак. Често е придружен от допълнителна табела с пояснение.",
      svg: () => warn(`<rect x="45.5" y="38" width="9" height="28" rx="3" fill="${BLACK}"/><circle cx="50" cy="75" r="5" fill="${BLACK}"/>`),
    },

    // ---------- Б: priority ----------
    B1: {
      name: "Пропусни движещите се по пътя с предимство!",
      g: "Б",
      d: "Пропускаш всички по пътя, в който се вливаш. Спиране не е задължително, ако пътят е свободен.",
      svg: () => `<polygon points="8,13 92,13 50,88" fill="${WHITE}" stroke="${RED}" stroke-width="10" stroke-linejoin="round"/>`,
    },
    B2: {
      name: "Спри! Пропусни движещите се по пътя с предимство!",
      g: "Б",
      d: "Задължително пълно спиране на стоп-линията (или на линията на знака), дори пътят да е празен. След това пропускаш движещите се с предимство.",
      svg: () => {
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const a = ((22.5 + i * 45) * Math.PI) / 180;
          pts.push(`${(50 + 47 * Math.cos(a)).toFixed(1)},${(50 + 47 * Math.sin(a)).toFixed(1)}`);
        }
        const inner = [];
        for (let i = 0; i < 8; i++) {
          const a = ((22.5 + i * 45) * Math.PI) / 180;
          inner.push(`${(50 + 42 * Math.cos(a)).toFixed(1)},${(50 + 42 * Math.sin(a)).toFixed(1)}`);
        }
        return `<polygon points="${pts.join(" ")}" fill="${RED}"/><polygon points="${inner.join(" ")}" fill="none" stroke="${WHITE}" stroke-width="2.5"/>${txt(50, 51, "STOP", 25, WHITE, 800)}`;
      },
    },
    B3: {
      name: "Път с предимство",
      g: "Б",
      d: "Ти си на пътя с предимство – пресичащите пътища имат Б1 или Б2. В населено място се поставя пред всяко кръстовище.",
      svg: () =>
        `<rect x="18" y="18" width="64" height="64" transform="rotate(45 50 50)" fill="${WHITE}" stroke="${BLACK}" stroke-width="2"/><rect x="28" y="28" width="44" height="44" transform="rotate(45 50 50)" fill="${YELLOW}"/>`,
    },
    B4: {
      name: "Край на пътя с предимство",
      g: "Б",
      d: "От следващото кръстовище нататък важат общите правила или другите знаци.",
      svg: () =>
        `<rect x="18" y="18" width="64" height="64" transform="rotate(45 50 50)" fill="${WHITE}" stroke="${BLACK}" stroke-width="2"/><rect x="28" y="28" width="44" height="44" transform="rotate(45 50 50)" fill="${YELLOW}"/><line x1="27" y1="73" x2="73" y2="27" stroke="${BLACK}" stroke-width="7"/>`,
    },
    B5: {
      name: "Пропусни насрещно движещите се ППС!",
      g: "Б",
      d: "В стеснение не влизаш, ако насрещните ще трябва да спрат заради теб.",
      svg: () => prohib(`${arrowDown(38, BLACK, 22, 78, 7, 11)}${arrowUp(62, RED, 22, 78, 7, 11)}`),
    },
    B6: {
      name: "Премини, ако пътят е свободен!",
      g: "Б",
      d: "В стеснението имаш предимство пред насрещно движещите се. Поставя се в двата края заедно с Б5.",
      svg: () => square(BLUE, `${arrowDown(38, RED, 20, 80, 8, 12)}${arrowUp(62, WHITE, 20, 80, 8, 12)}`),
    },
    T13: {
      name: "Направление на пътя с предимство (табела Т13)",
      g: "Т",
      d: "Под Б1, Б2 или Б3. Дебелата линия показва накъде продължава пътят с предимство. Колите по него се съобразяват помежду си с правилото на дясното.",
      svg: () =>
        `<rect x="16" y="6" width="68" height="88" rx="4" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/><path d="M50 16 V84 M26 48 H74" stroke="${BLACK}" stroke-width="3"/><path d="M50 84 V48 H26" fill="none" stroke="${BLACK}" stroke-width="9" stroke-linejoin="miter"/>`,
    },

    // ---------- В: prohibitory ----------
    V1: {
      name: "Забранено е влизането на ППС",
      g: "В",
      d: "„Тухла“. Обикновено поставен в края на еднопосочна улица – оттук не се влиза.",
      svg: () => `<circle cx="50" cy="50" r="47" fill="${RED}"/><rect x="17" y="41" width="66" height="18" fill="${WHITE}"/>`,
    },
    V2: {
      name: "Забранено е влизането на ППС в двете посоки",
      g: "В",
      d: "Пътят е затворен за превозни средства и в двете посоки.",
      svg: () => prohib(""),
    },
    V21: {
      name: "Забранено е завиването надясно",
      g: "В",
      d: "Важи за кръстовището непосредствено след знака.",
      svg: () => prohib(`${turnRight(BLACK)}${bar}`),
    },
    V22: {
      name: "Забранено е завиването наляво",
      g: "В",
      d: "Важи за кръстовището непосредствено след знака.",
      svg: () => prohib(`${turnLeft(BLACK)}${bar}`),
    },
    V23: {
      name: "Забранено е завиването в обратна посока",
      g: "В",
      d: "Забранява обратния завой. Завой наляво остава разрешен.",
      svg: () => prohib(`${uTurn(BLACK)}${bar}`),
    },
    V24: {
      name: "Забранено е изпреварването",
      g: "В",
      d: "Важи до следващото кръстовище или до знак В31/В34. Изпреварване на мотоциклет без кош е разрешено.",
      svg: () => prohib(`${carFront(36, RED)}${carFront(64, BLACK)}`),
    },
    V26: {
      name: "Забранено е движението със скорост, по-висока от означената",
      g: "В",
      d: "Важи до следващото кръстовище или до знак, който го отменя. Заедно с Д11 – за цялото населено място.",
      svg: () => prohib(txt(50, 52, "50", 38, BLACK, 800)),
    },
    V27: {
      name: "Забранени са престоят и паркирането",
      g: "В",
      d: "Не спираш дори за качване или слизане на пътник. Важи до следващото кръстовище.",
      svg: () =>
        `<circle cx="50" cy="50" r="44" fill="${BLUE}" stroke="${RED}" stroke-width="10"/><path d="M22 22 L78 78 M78 22 L22 78" stroke="${RED}" stroke-width="9"/>`,
    },
    V28: {
      name: "Забранено е паркирането",
      g: "В",
      d: "Престоят (качване, слизане, товарене с водач до колата) е разрешен, паркирането – не.",
      svg: () => `<circle cx="50" cy="50" r="44" fill="${BLUE}" stroke="${RED}" stroke-width="10"/><path d="M22 22 L78 78" stroke="${RED}" stroke-width="9"/>`,
    },
    V33: {
      name: "Край на ограничението на скоростта",
      g: "В",
      d: "Отменя В26. Оттук важи общото ограничение за пътя.",
      svg: () =>
        `<circle cx="50" cy="50" r="45" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/>${txt(50, 52, "50", 36, "#9aa1a9", 800)}<path d="M72 22 L22 72 M78 30 L30 78 M66 16 L16 66" stroke="${BLACK}" stroke-width="2.5"/>`,
    },
    V34: {
      name: "Край на забраните, въведени с пътни знаци",
      g: "В",
      d: "Отменя едновременно ограничението на скоростта и забраната за изпреварване.",
      svg: () =>
        `<circle cx="50" cy="50" r="45" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/><path d="M78 30 L30 78 M74 23 L23 74 M70 17 L17 70 M81 37 L37 81 M64 13 L13 64" stroke="${BLACK}" stroke-width="2.5"/>`,
    },

    // ---------- Г: mandatory ----------
    G1: {
      name: "Движение само направо след знака",
      g: "Г",
      d: "Задължава те да продължиш само направо на следващото кръстовище.",
      svg: () => mand(arrowUp(50, WHITE, 18, 82, 11, 17)),
    },
    G3: {
      name: "Движение само наляво след знака",
      g: "Г",
      d: "На следващото кръстовище е разрешен само завой наляво.",
      svg: () => mand(turnLeft(WHITE)),
    },
    G9: {
      name: "Преминаване отдясно на знака",
      g: "Г",
      d: "Поставя се на острови и препятствия – заобикаляш ги отдясно.",
      svg: () => mand(`<g transform="rotate(135 50 50)">${arrowUp(50, WHITE, 16, 84, 11, 17)}</g>`),
    },
    G12: {
      name: "Кръгово движение",
      g: "Г",
      d: "Задължава да се движиш само в посоката на стрелките (обратно на часовниковата стрелка). Обикновено е заедно с Б1.",
      svg: () => mand(roundaboutArrows(50, 50, 22, WHITE, 8, 8)),
    },

    // ---------- Д: special regulations ----------
    D4: {
      name: "Еднопосочно движение след знака",
      g: "Д",
      d: "Улица с едно направление до следващото кръстовище. В населено място престоят е разрешен и отляво, паркирането – само отдясно.",
      svg: () => square(BLUE, arrowUp(50, WHITE, 14, 86, 14, 20)),
    },
    D5: {
      name: "Автомагистрала",
      g: "Д",
      d: "Зелен знак. Ограничение 140 km/h, без спиране, обратен завой и движение назад.",
      svg: () =>
        square(GREEN, `<path d="M18 86 L41 46 H46 L37 86 Z M82 86 L59 46 H54 L63 86 Z" fill="${WHITE}"/><rect x="14" y="30" width="72" height="11" fill="${WHITE}"/><rect x="21" y="41" width="7" height="12" fill="${WHITE}"/><rect x="72" y="41" width="7" height="12" fill="${WHITE}"/><rect x="48" y="58" width="4" height="8" fill="${WHITE}"/><rect x="48" y="72" width="4" height="10" fill="${WHITE}"/>`),
    },
    D11: {
      name: "Начало на населено място",
      g: "Д",
      d: "Бял знак с името. Оттук: 50 km/h (ако няма друг знак), звуков сигнал само за предотвратяване на ПТП.",
      svg: () =>
        `<rect x="3" y="24" width="94" height="52" rx="4" fill="${WHITE}" stroke="${BLACK}" stroke-width="3"/><rect x="8" y="29" width="84" height="42" rx="2" fill="none" stroke="${BLACK}" stroke-width="1.5"/>${txt(50, 51, "ПЛОВДИВ", 15, BLACK, 800)}`,
    },
    D15: {
      name: "Начало на жилищна зона",
      g: "Д",
      d: "До 20 km/h, пешеходците и децата могат да ползват цялата улица, паркиране само на обозначени места.",
      svg: () =>
        `<rect x="4" y="4" width="92" height="92" rx="9" fill="${BLUE}"/><rect x="10" y="10" width="80" height="80" rx="5" fill="${WHITE}"/><path d="M16 50 L30 38 L44 50 V66 H16 Z" fill="${BLACK}"/>${person(58, 70, 0.9)}<g fill="${BLACK}"><rect x="64" y="70" width="22" height="8" rx="2"/><path d="M68 70 L71 64 H80 L83 70 Z"/></g><circle cx="49" cy="76" r="3.5" fill="${BLACK}"/>`,
    },
    D17: {
      name: "Пешеходна пътека",
      g: "Д",
      d: "Показва самото място на пешеходната пътека. Пешеходците на нея и тези, които сигнализират, че ще пресичат, имат предимство.",
      svg: () =>
        square(BLUE, `<polygon points="50,15 87,83 13,83" fill="${WHITE}"/><g fill="${BLACK}"><rect x="26" y="74" width="8" height="5"/><rect x="39" y="74" width="8" height="5"/><rect x="52" y="74" width="8" height="5"/><rect x="65" y="74" width="8" height="5"/></g>${person(50, 72, 1.05)}`),
    },
    D19: {
      name: "Паркинг",
      g: "Д",
      d: "Място за паркиране. Под знака може да има табела с часове, платеност или начин на подреждане.",
      svg: () => square(BLUE, txt(50, 53, "P", 66, WHITE, 800)),
    },
    D21: {
      name: "Място за паркиране на ППС, обслужващи хора с увреждания",
      g: "Д",
      d: "Паркиране само с валидна карта за хора с трайни увреждания. Паркирането без карта е нарушение.",
      svg: () =>
        square(BLUE, `${txt(32, 53, "P", 50, WHITE, 800)}<g fill="none" stroke="${WHITE}" stroke-width="4" stroke-linecap="round"><path d="M63 40 V58 H76 L80 70"/><path d="M70 50 a12 12 0 1 1 -12 -2"/></g><circle cx="63" cy="32" r="4" fill="${WHITE}"/>`),
    },
  };

  const signSVG = (code) => {
    const s = SIGNS[code];
    if (!s) return "";
    return wrap(s.svg(), `${code.replace(/^A/, "А").replace(/^B/, "Б").replace(/^V/, "В").replace(/^G/, "Г").replace(/^D/, "Д").replace(/^T/, "Т")} ${s.name}`);
  };
  const signLabel = (code) =>
    code.replace(/^A/, "А").replace(/^B/, "Б").replace(/^V/, "В").replace(/^G/, "Г").replace(/^D/, "Д").replace(/^T/, "Т");

  // ---------- Dashboard lamps (24-style icons in a 48 box) ----------
  const ic = (inner, extra = "") =>
    `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
  const t = (x, y, s, size, w = 800) =>
    `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-family="Arial, sans-serif" font-size="${size}" font-weight="${w}" text-anchor="middle" dominant-baseline="central">${s}</text>`;
  const brackets = `<path d="M10 12 a17 17 0 0 0 0 24 M38 12 a17 17 0 0 1 0 24"/>`;
  const lamp = `<path d="M27 12 C36 12 42 17 42 24 C42 31 36 36 27 36 C25 30 25 18 27 12 Z"/>`;

  const ICONS = {
    engine: ic(`<path d="M9 20 H13 V16 H19 V13 H29 V16 H33 L36 20 H39 V17 H42 V33 H39 V30 H36 L32 35 H17 L13 31 H9 Z"/><path d="M4 21 V31 M4 26 H9"/>`),
    oil: ic(`<path d="M8 20 H18 L21 17 H28 L31 20 L43 17 L32 31 H12 Z"/><path d="M24 17 V13 M20 13 H28"/><path d="M42 25 c1.5 3 1.5 5 0 6 c-1.5 -1 -1.5 -3 0 -6 z" fill="currentColor"/>`),
    battery: ic(`<rect x="6" y="15" width="36" height="23" rx="2"/><path d="M12 15 V11 H18 V15 M30 15 V11 H36 V15 M12 26 H18 M30 26 H36 M33 23 V29"/>`),
    coolant: ic(`<path d="M24 6 V27"/><circle cx="24" cy="31" r="4.5"/><path d="M24 10 H30 M24 16 H30 M24 22 H30"/><path d="M5 41 q4.5 -3.5 9 0 t9 0 t9 0 t9 0"/>`),
    brake: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24, 24.5, "!", 16)}`),
    abs: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24, 24.5, "ABS", 9)}`),
    esp: ic(`<path d="M11 25 L14 17 H34 L37 25 V31 H11 Z"/><path d="M15 31 V34 M33 31 V34"/><path d="M11 41 q3 -3 6 0 t6 0 M26 41 q3 -3 6 0 t6 0"/>`),
    airbag: ic(`<circle cx="15" cy="9" r="3.5"/><path d="M15 15 L17 28 H27 L31 40 M11 41 H21"/><path d="M15 21 L22 22"/><circle cx="33" cy="20" r="7" fill="currentColor" stroke="none"/>`),
    belt: ic(`<circle cx="24" cy="10" r="4.5"/><path d="M13 43 V30 a11 11 0 0 1 22 0 V43"/><path d="M17 22 L33 40"/><rect x="29" y="38" width="7" height="5" fill="currentColor"/>`),
    tpms: ic(`<path d="M13 37 C6 31 7 14 24 12 C41 14 42 31 35 37"/><path d="M11 41 H37 M13 37 L11 41 M35 37 L37 41"/>${t(24, 25, "!", 15)}`),
    fuel: ic(`<rect x="9" y="8" width="17" height="33" rx="2"/><rect x="13" y="12" width="9" height="8"/><path d="M26 17 H30 L34 21 V35 a3 3 0 0 0 6 0 V18 L36 14"/><path d="M6 41 H29"/>`),
    lowbeam: ic(`${lamp}<path d="M5 15 L19 19 M5 23 L19 27 M5 31 L19 35"/>`),
    highbeam: ic(`${lamp}<path d="M5 16 H20 M5 24 H20 M5 32 H20"/>`),
    fogfront: ic(`${lamp}<path d="M4 15 L19 19 M4 24 L19 28 M4 33 L19 37"/><path d="M12 10 q-3 4 0 8 t0 8 t0 8 t0 8"/>`),
    fogrear: ic(`<path d="M21 12 C12 12 6 17 6 24 C6 31 12 36 21 36 C23 30 23 18 21 12 Z"/><path d="M28 16 H44 M28 24 H44 M28 32 H44"/><path d="M36 10 q-3 4 0 8 t0 8 t0 8 t0 8"/>`),
    blinkers: ic(`<path d="M3 24 L14 14 V20 H21 V28 H14 V34 Z M45 24 L34 14 V20 H27 V28 H34 V34 Z" fill="currentColor" stroke="none"/>`),
    parkbrake: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24.5, 24.5, "P", 16)}`),
    autohold: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24, 24.5, "A", 16)}`),
    steering: ic(`<circle cx="22" cy="24" r="14"/><circle cx="22" cy="24" r="4"/><path d="M8 24 H18 M26 24 H36 M22 28 V38"/>${t(42, 10, "!", 13)}`),
    glow: ic(`<path d="M4 24 H10 q2.5 -8 5 0 q2.5 8 5 0 q2.5 -8 5 0 q2.5 8 5 0 q2.5 -8 5 0 H44"/><path d="M8 14 V34 M40 14 V34"/>`),
    frost: ic(`<path d="M24 5 V43 M7.5 14.5 L40.5 33.5 M7.5 33.5 L40.5 14.5"/><path d="M19 9 L24 13 L29 9 M19 39 L24 35 L29 39"/>`),
    service: ic(`<path d="M30 8 a9 9 0 0 0 -8 12 L8 34 a3.5 3.5 0 0 0 5 5 L27 25 a9 9 0 0 0 12 -8 l-6 2 l-4 -4 l2 -6 z"/>`),
    door: ic(`<path d="M7 31 L11 21 H37 L41 31 V37 H7 Z"/><path d="M12 37 V40 M36 37 V40"/><path d="M24 21 L15 11" stroke-width="3.5"/>`),
    washer: ic(`<path d="M6 36 Q24 20 42 36"/><path d="M24 30 V24"/><circle cx="18" cy="14" r="1.6" fill="currentColor"/><circle cx="24" cy="11" r="1.6" fill="currentColor"/><circle cx="30" cy="14" r="1.6" fill="currentColor"/><circle cx="14" cy="20" r="1.6" fill="currentColor"/><circle cx="34" cy="20" r="1.6" fill="currentColor"/>`),
    cruise: ic(`<path d="M8 34 a17 17 0 1 1 32 0"/><path d="M24 30 L32 18"/><circle cx="24" cy="31" r="2.5" fill="currentColor"/><path d="M38 6 l4 4 l-4 4"/>`),
  };

  window.BGSigns = { SIGNS, signSVG, signLabel, ICONS, roundaboutArrows };
})();
