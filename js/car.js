/* „Колата и пътят“: documents, equipment, pre-trip walk-around, what to do if…, and expiry dates.
   Everything is visual first: drawn documents, an open boot with tappable items, a car to walk around,
   step pictograms and a calendar. Facts are in DATA at the top so they are easy to keep current. */
(function () {
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------------- drawings ----------------
  const docArt = {
    licence: `<rect x="6" y="10" width="148" height="92" rx="9" fill="#f7d6df"/><rect x="6" y="10" width="148" height="92" rx="9" fill="url(#dg1)" opacity=".55"/><rect x="14" y="18" width="24" height="18" rx="2" fill="#1f4fbf"/><g fill="#ffd400">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${26 + 6 * Math.cos(i * 0.785)}" cy="${27 + 6 * Math.sin(i * 0.785)}" r=".9"/>`).join("")}</g><text x="26" y="34" font-size="5" font-weight="800" fill="#fff" text-anchor="middle">BG</text><text x="44" y="26" font-size="7" font-weight="800" fill="#7a2840">СВИДЕТЕЛСТВО ЗА</text><text x="44" y="34" font-size="7" font-weight="800" fill="#7a2840">УПРАВЛЕНИЕ</text><rect x="14" y="44" width="34" height="44" rx="3" fill="#e9eef5"/><circle cx="31" cy="60" r="8" fill="#b8c3d1"/><path d="M19 86 Q31 68 43 86 Z" fill="#b8c3d1"/>${[48, 58, 68, 78].map((y) => `<rect x="56" y="${y}" width="${y === 78 ? 50 : 86}" height="4" rx="2" fill="#c9a3b0"/>`).join("")}<text x="140" y="96" font-size="9" font-weight="800" fill="#7a2840" text-anchor="end">B</text>`,
    reg: `<rect x="6" y="10" width="148" height="92" rx="9" fill="#d7ecdf"/><rect x="6" y="10" width="148" height="20" rx="9" fill="#7fbf98"/><rect x="6" y="22" width="148" height="8" fill="#7fbf98"/><text x="80" y="24" font-size="7.5" font-weight="800" fill="#fff" text-anchor="middle">СВИДЕТЕЛСТВО ЗА РЕГИСТРАЦИЯ</text><rect x="16" y="40" width="60" height="16" rx="3" fill="#fff" stroke="#1f2933" stroke-width="1.2"/><rect x="16" y="40" width="9" height="16" rx="2" fill="#1f4fbf"/><text x="50" y="51.5" font-size="8" font-weight="800" fill="#1f2933" text-anchor="middle">CA 1234 AB</text>${[64, 74, 84].map((y) => `<rect x="16" y="${y}" width="${y === 84 ? 70 : 120}" height="4" rx="2" fill="#9ccab0"/>`).join("")}<rect x="96" y="40" width="44" height="16" rx="3" fill="#bfe0cc"/>`,
    go: `<path d="M24 6 H122 L136 20 V104 H24 Z" fill="#fff" stroke="#c9d1db"/><path d="M122 6 V20 H136" fill="#eef2f6" stroke="#c9d1db"/><path d="M80 22 l16 6 v12 c0 10 -7 16 -16 20 c-9 -4 -16 -10 -16 -20 v-12 z" fill="#2f6fdc"/><path d="M73 40 l5 5 l10 -11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="80" y="74" font-size="7.5" font-weight="800" fill="#1f2933" text-anchor="middle">„ГРАЖДАНСКА</text><text x="80" y="83" font-size="7.5" font-weight="800" fill="#1f2933" text-anchor="middle">ОТГОВОРНОСТ“</text>${[90, 96].map((y) => `<rect x="36" y="${y}" width="88" height="3" rx="1.5" fill="#d5dbe2"/>`).join("")}`,
    green: `<path d="M24 6 H136 V104 H24 Z" fill="#cfe8c4" stroke="#94c286"/><text x="80" y="24" font-size="9" font-weight="800" fill="#2e6b25" text-anchor="middle">GREEN CARD</text><text x="80" y="35" font-size="7" font-weight="700" fill="#2e6b25" text-anchor="middle">„ЗЕЛЕНА КАРТА“</text><g fill="#7fb36f">${[46, 56, 66, 76, 86, 96].map((y) => `<rect x="34" y="${y}" width="92" height="3" rx="1.5"/>`).join("")}</g><g>${["A", "B", "D", "GR", "RO", "TR"].map((c, i) => `<rect x="${34 + i * 15.5}" y="38" width="13" height="0" fill="none"/>`).join("")}</g>`,
    vignette: `<rect x="52" y="4" width="56" height="104" rx="10" fill="#1f2933"/><rect x="56" y="12" width="48" height="86" rx="4" fill="#eaf3ff"/><circle cx="80" cy="40" r="15" fill="#2ea44f"/><path d="M72 40 l6 6 l11 -12" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="80" y="68" font-size="7" font-weight="800" fill="#1f2933" text-anchor="middle">Е-ВИНЕТКА</text><text x="80" y="78" font-size="6.5" fill="#1f2933" text-anchor="middle">CA 1234 AB</text><text x="80" y="88" font-size="6" fill="#2ea44f" text-anchor="middle" font-weight="700">валидна</text>`,
    gtp: `<path d="M24 6 H136 V104 H24 Z" fill="#fff" stroke="#c9d1db"/><text x="80" y="22" font-size="7.5" font-weight="800" fill="#1f2933" text-anchor="middle">ПРОТОКОЛ ЗА ГТП</text>${[34, 46, 58, 70].map((y, i) => `<rect x="34" y="${y}" width="10" height="8" rx="2" fill="${i === 2 ? "#f5b301" : "#2ea44f"}"/><rect x="50" y="${y + 2}" width="${60 + (i % 2) * 14}" height="4" rx="2" fill="#d5dbe2"/>`).join("")}<circle cx="112" cy="88" r="12" fill="none" stroke="#2f6fdc" stroke-width="2.5"/><path d="M106 88 l4 4 l8 -9" stroke="#2f6fdc" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  };
  const docSVG = (k) => `<svg viewBox="0 0 160 112" class="doc-art" aria-hidden="true"><defs><linearGradient id="dg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfe0ff"/></linearGradient></defs>${docArt[k]}</svg>`;

  // line pictograms for steps (24×24)
  const PI = {
    hazard: `<path d="M12 3.5 21 19H3z"/><path d="M12 8.5 16.6 16.5H7.4z"/>`,
    vest: `<path d="M8 3h2.5l1.5 3 1.5-3H16l2 4v13h-4v-7h-4v7H6V7z"/><path d="M6 12h12M6 15.5h12" stroke-width="1.6"/>`,
    triangle: `<path d="M12 3 21 18.5H3z"/><path d="M12 7.6 17 16H7z"/><path d="M5 21h14" stroke-dasharray="2 2"/>`,
    phone: `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>`,
    sos: `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><text x="12" y="13.5" font-size="5.6" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none">112</text>`,
    aid: `<rect x="3.5" y="6.5" width="17" height="13" rx="2"/><path d="M9 6.5V4.5h6v2"/><path d="M12 10v6M9 13h6"/>`,
    camera: `<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.4"/><path d="M8.5 7 10 4.5h4L15.5 7"/>`,
    form: `<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 12.5h6M9 16h4"/><path d="M15 3v3h3"/>`,
    tow: `<path d="M3 15V11l2-4h7l2 4v4z"/><circle cx="6" cy="16" r="1.6"/><circle cx="11" cy="16" r="1.6"/><path d="M14 13h3l3-6"/><path d="M20 7v4"/>`,
    fire: `<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-4 3.5-5.5 3.5-9.5 3 1.5 4.5 4 4.5 6 1-1 1.5-2.5 1.5-3.5 2 1.5 3.5 4 3.5 7 0 3.4-2.5 6-6.5 6z"/>`,
    run: `<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2v4M11 15l1.5-5-3 1-2 3M12.5 10l3 3h3"/>`,
    key: `<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>`,
    police: `<path d="M12 3 19 6v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/><path d="M12 8.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" stroke-width="1.3"/>`,
    fuel: `<rect x="4" y="4" width="10" height="16" rx="1.5"/><path d="M6.5 7.5h5v4h-5z"/><path d="M14 9h2l2.5 2.5V17a1.5 1.5 0 0 0 3 0V8l-2.5-2.5"/>`,
    temp: `<path d="M12 3v11"/><circle cx="12" cy="17" r="3.5"/><path d="M12 6h3M12 9h3M12 12h3"/>`,
    brake: `<circle cx="12" cy="12" r="6.5"/><path d="M12 8.5v4"/><circle cx="12" cy="15.3" r=".6" fill="currentColor"/><path d="M4 7.5a10 10 0 0 0 0 9M20 7.5a10 10 0 0 1 0 9"/>`,
    gear: `<path d="M8 4v16M8 12h8M16 4v8"/><circle cx="8" cy="4" r="1.6"/><circle cx="16" cy="4" r="1.6"/><circle cx="8" cy="20" r="1.6"/>`,
    wheel: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5"/>`,
    jack: `<path d="M4 20h16M7 20l5-9 5 9M9 16h6"/><path d="M12 11V5M9 5h6"/>`,
    stop: `<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path d="M8.5 12h7"/>`,
    eye: `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>`,
    wait: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>`,
    car: `<path d="M5.5 15.5v-4l2-5h9l2 5v4"/><path d="M4 11.5h16v4.5H4z"/><path d="M6.5 16v2.5M17.5 16v2.5"/>`,
    water: `<path d="M12 3.5c3 4 6 7 6 10.5a6 6 0 0 1-12 0c0-3.5 3-6.5 6-10.5z"/>`,
    steer: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M3.8 11h6M14.2 11h6M12 14.2v6"/>`,
    no: `<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>`,
  };
  // a pictogram placed inside another SVG at (x, y) with the given size
  const picAt = (k, x, y, size, col) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${col || "currentColor"}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${PI[k] || ""}</svg>`;
  const pic = (k, col) => `<svg viewBox="0 0 24 24" fill="none" stroke="${col || "currentColor"}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PI[k] || ""}</svg>`;

  // ---------------- data ----------------
  // need: "car" = carry it, "online" = checked electronically, "abroad" = only when leaving Bulgaria
  const DOCS = [
    { k: "licence", t: "Шофьорска книжка", need: "car", valid: "10 години за категория B", how: "Датата е на лицето – поле 4b. С изтекла книжка не може да се кара.", note: "Носиш я винаги, когато шофираш. Книжка в телефона все още не се признава.", ref: "ЗДвП чл. 100, ал. 1, т. 1; чл. 150а; ЗБЛД чл. 51" },
    { k: "reg", t: "Талон на колата", need: "car", valid: "Без срок – сменя се при промяна на собственика или данните", how: "В колата се носи част II („малкият талон“).", note: "За колата, която караш, и за ремаркето, ако теглиш.", ref: "ЗДвП чл. 100, ал. 1, т. 2; Наредба № I-45, чл. 33" },
    { k: "go", t: "„Гражданска отговорност“", need: "car", valid: "Обикновено 1 година (по полицата)", how: "Проверка онлайн в Гаранционния фонд по номера на колата.", note: "Носиш документа за ГО, а стикерът е залепен в долния ляв ъгъл на предното стъкло – още е задължителен.", ref: "ЗДвП чл. 100, ал. 1, т. 3 и ал. 3; КЗ чл. 487" },
    { k: "gtp", t: "Технически преглед (ГТП)", need: "online", valid: "Нова кола: до края на 3-тата година, после до края на 5-тата, след това всяка година", how: "Проверка онлайн на rta.government.bg по номера на колата.", note: "Без валиден преглед се глобяват и собственикът, и водачът.", ref: "ЗДвП чл. 147, ал. 3; чл. 181; Наредба № Н-32, чл. 29" },
    { k: "vignette", t: "Е-винетка", need: "online", valid: "1 ден, уикенд, седмица, месец, 3 месеца или година", how: "Проверка на bgtoll.bg или в приложението на БГ ТОЛ по номера на колата. Стикер няма.", note: "За платената пътна мрежа – републиканските пътища (карта на bgtoll.bg).", ref: "Закон за пътищата, чл. 10 и 10а" },
    { k: "protocol", t: "Двустранен протокол", need: "tip", valid: "Празен формуляр – без срок", how: "Получаваш бланка при сключване на ГО. Дръж 1–2 в жабката.", note: "Попълвате го заедно при ПТП само с щети, ако сте съгласни за обстоятелствата. Ползва се и за ГО, и за Каско.", ref: "ЗДвП чл. 123, ал. 1, т. 3; КЗ чл. 487, ал. 4" },
    { k: "green", t: "„Зелена карта“", need: "abroad", valid: "Колкото и ГО", how: "Застрахователят я издава безплатно заедно с полицата за ГО.", note: "Законът я изисква при напускане на България. В ЕС на практика рядко се проверява, но я носи.", ref: "ЗДвП чл. 100, ал. 1, т. 5; КЗ чл. 488" },
  ];
  const NEED = { car: ["Носиш в колата", "go"], online: ["Проверява се онлайн", "info"], abroad: ["Само в чужбина", "wait"], tip: ["Добре е да го имаш", "info"] };

  const EQUIP = [
    { id: "triangle", t: "Обезопасителен триъгълник", must: true, at: [104, 120], what: "Слагаш го на поне 30 м зад колата при повреда или ПТП, на магистрала и пътища над 90 km/h – на поне 100 м.", check: "Да е цял и със запазени светлоотразителни ленти.", ref: "ЗДвП чл. 97, чл. 139, ал. 2" },
    { id: "aid", t: "Аптечка", must: true, at: [178, 112], what: "Съдържанието е определено с инструкция на МЗ: турникет, бинтове, стерилни превръзки, ръкавици, дезинфекциращ разтвор, ножица, уред за обдишване и др. – в чанта с надпис „Аптечка“.", check: "Всичко трябва да е в срок на годност – провери датите и допълни използваното.", ref: "ЗДвП чл. 139, ал. 2; Инструкция № 1/2008 на МЗ" },
    { id: "vest", t: "Светлоотразителна жилетка", must: true, at: [295, 78], what: "Обличаш я, преди да слезеш на платното. Дръж я в купето – в джоба на вратата, не в багажника.", check: "Законът изисква една. По една за всеки пътник е добра идея.", ref: "ЗДвП чл. 101, ал. 1; чл. 139, ал. 2" },
    { id: "ext", t: "Пожарогасител", must: true, at: [242, 116], what: "Задължителен и след 7.02.2026 г. Видът се определя с наредба – проектът предвижда прахов, поне 1 кг.", check: "Трябва да е обслужен – стикер от сервиз с месеца и годината на следващото обслужване. Манометърът – в зеленото.", ref: "ЗДвП чл. 139, ал. 8 и 11; чл. 183, ал. 2, т. 5" },
    { id: "spare", t: "Резервна гума или комплект за лепене", must: true, at: [140, 150], what: "Резервно колело („патерица“) или комплект за ремонт на гума.", check: "Провери налягането на резервната поне веднъж на сезон.", ref: "Наредба № I-45, чл. 48, ал. 2" },
    { id: "jack", t: "Крик и ключ за болтове", must: false, at: [214, 150], what: "За смяна на гума. Провери дали ключът за секретния болт е в колата.", check: "Пробвай веднъж у дома, не за първи път на пътя.", ref: "Добра практика" },
    { id: "rope", t: "Въже за теглене и фенерче", must: false, at: [70, 140], what: "Въже или щанга; фенерче за нощем.", check: "При теглене – до 40 km/h.", ref: "ЗДвП чл. 84" },
    { id: "winter", t: "Зимен комплект", must: false, at: [272, 146], what: "Стъргалка, четка, течност за чистачки за зима; вериги при знак Г19.", check: "От 15 ноември до 1 март: зимни гуми или протектор поне 4 мм.", ref: "ЗДвП чл. 139, ал. 1, т. 4" },
  ];

  // walk-around: hotspot positions on the top-down car (x, y in a 360×300 box)
  const WALK = [
    { id: "tyres", n: 1, t: "Гуми", at: [[92, 82], [268, 82], [92, 218], [268, 218]], d: "Налягане на студено (стойностите са на вратата или капачката на резервоара). Протектор и странични повреди." },
    { id: "lights", n: 2, t: "Светлини", at: [[180, 40], [180, 262]], d: "Къси, дълги, мигачи, стопове, задна мъгла. Стоповете – виж отражението в стъкло или помоли някого." },
    { id: "glass", n: 3, t: "Стъкла, чистачки, огледала", at: [[180, 104]], d: "Чисти и без пукнатини в полето на чистачките. Течност за чистачки – пълна (зимна през зимата)." },
    { id: "bonnet", n: 4, t: "Под капака", at: [[180, 66]], d: "Масло между MIN и MAX, антифриз, спирачна течност. Капачките – добре затворени." },
    { id: "dash", n: 5, t: "Табло", at: [[148, 128]], d: "При запалване лампите светват и изгасват. Остане ли червена – не тръгваш." },
    { id: "seat", n: 6, t: "Седалка, огледала, колан", at: [[146, 158]], d: "В този ред: седалка, волан, облегалка за глава, колан, огледала. Всички в колата – с колан." },
    { id: "boot", n: 7, t: "Багаж и оборудване", at: [[180, 236]], d: "Триъгълник, аптечка; жилетка – в купето. Тежкото – най-долу и напред, нищо свободно на задната седалка." },
    { id: "docs", n: 8, t: "Документи и винетка", at: [[212, 158]], d: "Книжка, талон (част II), ГО и стикерът ѝ на стъклото. Провери винетката и прегледа онлайн преди дълъг път." },
    { id: "trip", n: 9, t: "Маршрут и почивки", at: [[300, 150]], d: "Гориво или заряд с резерв, маршрут, почивка на всеки 2 часа. Телефонът – на стойка, не в ръка." },
  ];

  // what to do if… – steps are [pictogram, text]
  const SOS = [
    { id: "breakdown", t: "Повреда на пътя", ic: "hazard", steps: [["hazard", "Аварийни светлини и отбий възможно най-вдясно."], ["vest", "Жилетката – преди да слезеш на платното."], ["triangle", "Триъгълник на 30 м отзад (100 м на магистрала)."], ["run", "Всички излизат откъм банкета и застават зад мантинелата."], ["phone", "Пътна помощ – от безопасно място."]], no: "Не стой в колата и между колите на магистралата.", ref: "ЗДвП чл. 97, 101" },
    { id: "flat", t: "Спукана гума", ic: "wheel", steps: [["hazard", "Не спирай рязко – дръж волана здраво, пусни газта и спри плавно встрани."], ["vest", "Жилетка и триъгълник."], ["jack", "Равна и твърда основа, ръчна спирачка, P. Разхлаби болтовете преди да вдигнеш."], ["wheel", "Смени гумата, затегни болтовете на кръст."], ["eye", "Резервна „патерица“ – обикновено до 80 km/h. Провери налягането."]], no: "Не вдигай колата на наклон или на мек банкет.", ref: "Добра практика; ЗДвП чл. 97" },
    { id: "crash", t: "ПТП само с щети", ic: "form", steps: [["hazard", "Аварийни, жилетка, триъгълник. Провери дали има пострадали."], ["camera", "Снимай местата на колите и щетите, преди да ги преместиш."], ["car", "Преместете колите така, че да не пречат на движението."], ["form", "Съгласни сте за обстоятелствата – двустранен констативен протокол."], ["police", "Не сте съгласни – 112, не напускате мястото и не пиете алкохол до идването на полицията."], ["phone", "Уведоми застрахователя до 7 работни дни."]], no: "Не напускай мястото, преди да разменете данни за самоличност и ГО.", ref: "ЗДвП чл. 123, ал. 1, т. 3 и ал. 2; КЗ чл. 430" },
    { id: "injured", t: "ПТП с пострадали", ic: "sos", steps: [["hazard", "Обезопаси мястото: аварийни, жилетка, триъгълник."], ["sos", "Обади се на 112 – къде, колко ранени, какво виждаш."], ["aid", "Окажи първа помощ, доколкото можеш. Не мести ранен без нужда."], ["no", "Не пипай нищо по мястото, освен за да помогнеш."], ["wait", "Остани до идването на полицията, запази следите и не пий алкохол."]], no: "Не мести колата, освен за да закараш ранен до болница – и после се върни.", ref: "ЗДвП чл. 123, ал. 1, т. 1–2" },
    { id: "overheat", t: "Прегряване на двигателя", ic: "temp", steps: [["temp", "Червената лампа или стрелката в червено – спри безопасно."], ["key", "Изгаси двигателя."], ["wait", "Изчакай поне 30 минути."], ["no", "Не отваряй капачката на антифриза, докато е горещо – изгаря."], ["phone", "Липсва течност или тече – пътна помощ."]], no: "Не карай нататък „до сервиза“ с червена лампа.", ref: "Добра практика" },
    { id: "brakes", t: "Спирачките отслабват", ic: "brake", steps: [["brake", "Натисни педала няколко пъти, силно."], ["gear", "Автоматик: L/B или ръчен режим – двигателят спира колата."], ["stop", "Ръчната/електрическата спирачка – плавно (с бутона задържан)."], ["hazard", "Аварийни и клаксон; търси нагорнище или пясък встрани."]], no: "Не гаси двигателя в движение – губиш усилвателя.", ref: "Добра практика" },
    { id: "fire", t: "Пушек или огън", ic: "fire", steps: [["stop", "Спри веднага встрани и изгаси двигателя."], ["run", "Всички излизат и отиват на поне 30 м."], ["sos", "Обади се на 112."], ["fire", "Гасиш само ако е малко и имаш пожарогасител – без да отваряш капака широко."]], no: "Не се връщай за вещи.", ref: "Добра практика" },
    { id: "police", t: "Полицията те спира", ic: "police", steps: [["hazard", "Мигач и спри безопасно, където ти покажат."], ["key", "Остани в колата, ръцете – на волана; свали прозореца."], ["form", "Покажи книжката, талона и ГО."], ["eye", "Може да има проверка за алкохол и наркотици. Отказът се наказва като карането с алкохол: 2 години без книжка."]], no: "Не слизай, преди да те помолят.", ref: "ЗДвП чл. 103, 165, 174" },
  ];

  // deadlines and maintenance – "law" or "tip"
  const TIMES = [
    { t: "Книжка", v: "10 г.", note: "Подновяваш с медицинско свидетелство", kind: "law" },
    { t: "„Гражданска отговорност“", v: "1 г.", note: "Обикновено; по полицата", kind: "law" },
    { t: "Технически преглед", v: "по график", note: "Според годините на колата", kind: "law" },
    { t: "Е-винетка", v: "по вида", note: "Уикенд до година", kind: "law" },
    { t: "Аптечка", v: "срок на годност", note: "Виж датите на материалите", kind: "law" },
    { t: "Масло и филтри", v: "~1 г.", note: "Или по сервизната книжка (км)", kind: "tip" },
    { t: "Спирачна течност", v: "~2 г.", note: "Поема влага – по-лошо спиране", kind: "tip" },
    { t: "Перата на чистачките", v: "~1 г.", note: "Като започнат да оставят ивици", kind: "tip" },
    { t: "Гуми", v: "~6–8 г.", note: "Дори с дълбок протектор – стареят", kind: "tip" },
    { t: "Акумулатор", v: "~4–6 г.", note: "Проверка преди зимата", kind: "tip" },
  ];

  // ---------------- widget ----------------
  function widget(root) {
    let tab = "docs";
    const box = h(`<div class="widget car-w">
      <div class="car-tabs" role="tablist" aria-label="Колата и пътят">${[["docs", "Документи", "form"], ["equip", "Оборудване", "aid"], ["walk", "Преди път", "eye"], ["sos", "Ако се случи", "hazard"], ["times", "Срокове", "wait"]].map(([k, t, ic]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === tab}">${pic(ic)}<span>${t}</span></button>`).join("")}</div>
      <div class="car-pane"></div>
    </div>`);
    const pane = box.querySelector(".car-pane");
    box.querySelectorAll(".car-tabs button").forEach((b) => b.addEventListener("click", () => {
      tab = b.dataset.t;
      box.querySelectorAll(".car-tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      draw();
    }));
    function draw() { pane.innerHTML = ""; ({ docs, equip, walk, sos, times })[tab](pane); }
    draw();
    root.appendChild(box);
  }

  // which documents have a real-life example in docs.js
  const REAL = { licence: "licence", reg: "reg", go: "go", protocol: "protocol" };
  function docs(el) {
    let sel = "licence";
    const wrap = h(`<div class="docs2"><div class="doc-pick" role="group" aria-label="Документ">${DOCS.map((d) => `<button type="button" data-k="${d.k}" aria-pressed="${d.k === sel}"><span class="doc-thumb">${docSVG(d.k === "protocol" ? "go" : d.k)}</span><span>${d.t}</span><small class="need-${d.need}">${NEED[d.need][0]}</small></button>`).join("")}</div><div class="doc-view"></div></div>`);
    const view = wrap.querySelector(".doc-view");
    function render() {
      const d = DOCS.find((x) => x.k === sel);
      view.innerHTML = "";
      view.appendChild(h(`<div class="doc-facts"><span class="pill ${NEED[d.need][1]}">${NEED[d.need][0]}</span><h4>${d.t}</h4><div class="doc-facts-grid"><div><span>Валидност</span><b>${d.valid}</b></div><div><span>Как да провериш</span><b>${d.how}</b></div></div><p>${d.note}</p><span class="lawref">${d.ref}</span></div>`));
      if (REAL[d.k] && window.BGDocs) {
        view.appendChild(h(`<h5 class="doc-sub">Как изглежда – натисни номерата</h5>`));
        view.appendChild(window.BGDocs.viewer(REAL[d.k]));
      } else {
        view.appendChild(h(`<div class="doc-big">${docSVG(d.k)}</div>`));
      }
      if (d.k === "protocol") view.appendChild(protocolHowTo());
    }
    wrap.querySelectorAll(".doc-pick button").forEach((b) => b.addEventListener("click", () => {
      sel = b.dataset.k;
      wrap.querySelectorAll(".doc-pick button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    }));
    el.appendChild(wrap);
    render();
  }
  // how to use the accident statement – steps with pictograms, when to call the police instead
  function protocolHowTo() {
    const steps = [["hazard", "Обезопаси мястото: аварийни, жилетка, триъгълник."], ["camera", "Снимай колите, щетите и номерата – преди да ги преместите."], ["form", "Попълвате ЕДИН формуляр заедно – A за единия, B за другия. Копието отдолу се изписва само."], ["car", "Скица (13) и обстоятелства (12) – отметни своите и напиши колко са."], ["eye", "Подпиши само ако си съгласен. После нищо не се поправя."], ["phone", "Всеки взима екземпляр и уведомява застрахователя до 7 работни дни."]];
    return h(`<div class="proto">
      <h5 class="doc-sub">Как се попълва</h5>
      <ol class="sos-steps">${steps.map(([ic, t], i) => `<li style="--i:${i}"><span class="sos-ic">${pic(ic)}</span><span class="sos-n">${i + 1}</span><p>${t}</p></li>`).join("")}</ol>
      <div class="proto-cols">
        <div class="proto-box ok">${pic("form")}<div><b>Протокол е достатъчен</b><p>Има само щети, никой не е ранен и сте съгласни за обстоятелствата. Застрахователят е длъжен да го приеме, ако колите могат да се движат сами.</p></div></div>
        <div class="proto-box no">${pic("police")}<div><b>Звъниш на 112 – полицията идва</b><p>Има убит или ранен; несъгласие за обстоятелствата; съмнение за алкохол или наркотици; участник без книжка; задръстване; опасен товар; военна кола; ПТП с една кола, която не може да продължи сама.</p></div></div>
      </div>
      <div class="proto-box info">${pic("aid")}<div><b>ГО или Каско?</b><p><b>ГО</b> на виновния плаща щетите на другия (КЗ чл. 430, 496). <b>Каско</b> е доброволна застраховка на твоята кола – плаща твоите щети, дори ти да си виновен. Протоколът е един и същ – подаваш го при застрахователя, от когото искаш обезщетение.</p></div></div>
    </div>`);
  }

  function equip(el) {
    let sel = EQUIP[0].id;
    const wrap = h(`<div class="eq"><figure class="eq-scene" data-no-play><svg viewBox="0 0 360 220" role="img" aria-label="Отворен багажник с оборудването"></svg></figure><div class="eq-side"><div class="eq-list"></div><div class="eq-detail readout" aria-live="polite"></div></div></div>`);
    const svg = wrap.querySelector("svg"), list = wrap.querySelector(".eq-list"), detail = wrap.querySelector(".eq-detail");
    const art = {
      triangle: (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 -22 L20 12 H-20 Z" fill="#e0352b"/><path d="M0 -12 L11 7 H-11 Z" fill="#3a3f46"/></g>`,
      aid: (x, y) => `<g transform="translate(${x} ${y})"><rect x="-20" y="-14" width="40" height="28" rx="5" fill="#fff" stroke="#c9d1db"/><rect x="-20" y="-14" width="40" height="7" rx="3" fill="#2ea44f"/><path d="M0 -4v14M-7 3h14" stroke="#e0352b" stroke-width="5"/></g>`,
      vest: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-14 -18 h9 l5 8 l5 -8 h9 l6 10 v26 h-12 v-14 h-16 v14 h-12 v-26 z" fill="#c8f03c" stroke="#9fc22a"/><path d="M-20 4 h40 M-20 10 h40" stroke="#e6ebee" stroke-width="3"/></g>`,
      ext: (x, y) => `<g transform="translate(${x} ${y})"><rect x="-8" y="-16" width="16" height="34" rx="7" fill="#e0352b" opacity=".85"/><rect x="-4" y="-22" width="8" height="7" fill="#1f2933"/><path d="M4 -20 q12 0 12 10" stroke="#1f2933" stroke-width="2.5" fill="none"/><circle cx="0" cy="-4" r="4" fill="#fff"/></g>`,
      spare: (x, y) => `<g transform="translate(${x} ${y})"><ellipse rx="34" ry="11" fill="#2b2f36"/><ellipse rx="17" ry="5.5" fill="#9aa1a9"/></g>`,
      jack: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-18 8 H18 M-12 8 L0 -8 L12 8 M-6 0 H6" stroke="#d5dae0" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M0 -8 V-16 M-6 -16 H6" stroke="#d5dae0" stroke-width="3" stroke-linecap="round"/></g>`,
      rope: (x, y) => `<g transform="translate(${x} ${y})"><circle r="13" fill="none" stroke="#f08a24" stroke-width="5"/><circle r="6" fill="none" stroke="#f08a24" stroke-width="4"/><rect x="14" y="-6" width="14" height="8" rx="3" fill="#3a3f46"/></g>`,
      winter: (x, y) => `<g transform="translate(${x} ${y})"><rect x="-3.5" y="-18" width="7" height="22" rx="3" fill="#ffcc00"/><path d="M-14 4 H14 L10 14 H-10 Z" fill="#5ac8fa"/><path d="M-10 14 V17 M-5 14 V17 M0 14 V17 M5 14 V17 M10 14 V17" stroke="#5ac8fa" stroke-width="2"/></g>`,
    };
    function scene() {
      let s = `<rect width="360" height="220" fill="#eef2f6"/>`;
      // rear of a hatchback with the tailgate up
      s += `<path d="M40 196 V120 Q40 92 70 88 H290 Q320 92 320 120 V196 Z" fill="#2f6fdc"/>`;
      s += `<path d="M60 172 V104 Q60 96 70 96 H290 Q300 96 300 104 V172 Z" fill="#4a4f57"/><path d="M60 172 H300 V180 H60 Z" fill="#3a3f46"/>`;
      s += `<path d="M56 88 L90 18 H270 L304 88 Z" fill="#2f6fdc"/><path d="M80 80 L104 30 H256 L280 80 Z" fill="#cfe6fb"/><rect x="164" y="20" width="32" height="5" rx="2" fill="#e0352b"/>`;
      s += `<rect x="40" y="186" width="34" height="18" rx="4" fill="#24282d"/><rect x="286" y="186" width="34" height="18" rx="4" fill="#24282d"/><rect x="146" y="184" width="68" height="16" rx="3" fill="#fff" stroke="#1f2933"/><text x="180" y="195.5" font-size="9" font-weight="800" text-anchor="middle" fill="#1f2933">CA 1234 AB</text>`;
      // the door pocket inset for the vest
      s += `<g><rect x="250" y="30" width="96" height="78" rx="10" fill="#fff" stroke="#c9d1db"/><text x="298" y="44" font-size="8.5" font-weight="700" text-anchor="middle" fill="#5b6673">в купето, до теб</text></g>`;
      EQUIP.forEach((e) => {
        const [x, y] = e.at;
        s += `<g class="eq-item${e.must ? "" : " opt"}${e.id === sel ? " sel" : ""}" data-id="${e.id}" tabindex="0" role="button" aria-label="${esc(e.t)}">${art[e.id](x, y)}<circle cx="${x}" cy="${y}" r="26" fill="transparent"/>${e.id === sel ? `<circle cx="${x}" cy="${y}" r="27" fill="none" stroke="#ffb21a" stroke-width="3"><animate attributeName="r" values="24;30;24" dur="1.4s" repeatCount="indefinite"/></circle>` : ""}</g>`;
      });
      svg.innerHTML = s;
      svg.querySelectorAll(".eq-item").forEach((g) => {
        g.addEventListener("click", () => pick(g.dataset.id));
        g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(g.dataset.id); } });
      });
    }
    function pick(id) {
      sel = id;
      scene();
      list.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
      const e = EQUIP.find((x) => x.id === id);
      detail.innerHTML = `<span class="pill ${e.must ? "stop" : "info"}">${e.must ? "Задължително" : "Препоръчително"}</span><h4>${e.t}</h4><p>${e.what}</p><p><b>Провери:</b> ${e.check}</p><span class="lawref">${e.ref}</span>`;
    }
    list.innerHTML = EQUIP.map((e) => `<button type="button" data-id="${e.id}" aria-pressed="false"><i class="${e.must ? "must" : ""}"></i>${e.t}</button>`).join("");
    list.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => pick(b.dataset.id)));
    el.appendChild(wrap);
    pick(sel);
  }

  function walk(el) {
    const KEY = "bg-car-walk";
    let done = {};
    try { done = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { done = {}; }
    let sel = WALK[0].id;
    const wrap = h(`<div class="walk"><figure class="walk-scene" data-no-play><svg viewBox="0 0 360 300" role="img" aria-label="Обиколка около колата"></svg></figure><div class="walk-side"><div class="walk-progress"></div><ol class="walk-list"></ol><button type="button" class="btn small walk-reset">Започни отначало</button></div></div>`);
    const svg = wrap.querySelector("svg"), list = wrap.querySelector(".walk-list"), prog = wrap.querySelector(".walk-progress");
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) { /* ignore */ } };
    function scene() {
      let s = `<rect width="360" height="300" fill="#bcd5a9"/><rect x="40" y="0" width="280" height="300" fill="#8e959d"/>`;
      // walking path around the car
      s += `<rect x="70" y="18" width="220" height="264" rx="40" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="7 7" opacity=".9"><animate attributeName="stroke-dashoffset" values="0;-28" dur="1.2s" repeatCount="indefinite"/></rect>`;
      // car seen from above
      s += `<g><rect x="80" y="66" width="22" height="34" rx="5" fill="#24282d"/><rect x="258" y="66" width="22" height="34" rx="5" fill="#24282d"/><rect x="80" y="202" width="22" height="34" rx="5" fill="#24282d"/><rect x="258" y="202" width="22" height="34" rx="5" fill="#24282d"/>
        <rect x="96" y="34" width="168" height="232" rx="46" fill="#2f6fdc" stroke="rgba(0,0,0,.3)"/><rect x="112" y="92" width="136" height="40" rx="10" fill="#cfe6fb"/><rect x="114" y="136" width="132" height="62" rx="10" fill="rgba(0,0,0,.14)"/><rect x="118" y="204" width="124" height="28" rx="9" fill="#cfe6fb"/>
        <rect x="112" y="38" width="30" height="8" rx="3" fill="#fff6c2"/><rect x="218" y="38" width="30" height="8" rx="3" fill="#fff6c2"/><rect x="112" y="256" width="30" height="7" rx="3" fill="#e0352b"/><rect x="218" y="256" width="30" height="7" rx="3" fill="#e0352b"/>
        <rect x="88" y="120" width="10" height="8" rx="2" fill="#16181b"/><rect x="262" y="120" width="10" height="8" rx="2" fill="#16181b"/></g>`;
      // the walking person
      s += `<g><animateMotion dur="12s" repeatCount="indefinite" path="M180 18 H250 Q290 18 290 58 V242 Q290 282 250 282 H110 Q70 282 70 242 V58 Q70 18 110 18 Z"/><circle r="8" fill="#f08a24" stroke="#fff" stroke-width="2"/><circle r="3.5" fill="#f3c7a1"/></g>`;
      WALK.forEach((w) => w.at.forEach(([x, y], i) => {
        const ok = done[w.id];
        s += `<g class="walk-dot${w.id === sel ? " sel" : ""}" data-id="${w.id}" tabindex="${i ? -1 : 0}" role="button" aria-label="${w.n}. ${esc(w.t)}"><circle cx="${x}" cy="${y}" r="13" fill="${ok ? "#2ea44f" : w.id === sel ? "#ffb21a" : "#fff"}" stroke="#1f2933" stroke-width="1.5"/>${ok ? `<path d="M${x - 5} ${y} l3.5 3.5 l6.5 -7" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>` : `<text x="${x}" y="${y + 0.5}" font-size="12" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#1f2933">${w.n}</text>`}${w.id === sel ? `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#ffb21a" stroke-width="2.5"><animate attributeName="r" values="14;20;14" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="1.4s" repeatCount="indefinite"/></circle>` : ""}</g>`;
      }));
      svg.innerHTML = s;
      svg.querySelectorAll(".walk-dot").forEach((g) => g.addEventListener("click", () => { sel = g.dataset.id; render(); }));
    }
    function render() {
      scene();
      const n = WALK.filter((w) => done[w.id]).length;
      prog.innerHTML = `<div class="walk-bar"><span style="width:${(n / WALK.length) * 100}%"></span></div><b>${n === WALK.length ? "Готов си за път 👍" : `${n} от ${WALK.length} проверени`}</b>`;
      list.innerHTML = WALK.map((w) => `<li class="${w.id === sel ? "sel" : ""}${done[w.id] ? " ok" : ""}"><label><input type="checkbox" data-id="${w.id}" ${done[w.id] ? "checked" : ""}><span class="walk-n">${w.n}</span><span class="walk-t"><b>${w.t}</b>${w.id === sel ? `<small>${w.d}</small>` : ""}</span></label></li>`).join("");
      list.querySelectorAll("input").forEach((i) => i.addEventListener("change", () => { done[i.dataset.id] = i.checked; if (i.checked) { const nx = WALK.find((w) => !done[w.id]); if (nx) sel = nx.id; } save(); render(); }));
      list.querySelectorAll("li").forEach((li, k) => li.addEventListener("click", (e) => { if (e.target.closest("input")) return; sel = WALK[k].id; render(); }));
    }
    wrap.querySelector(".walk-reset").addEventListener("click", () => { done = {}; sel = WALK[0].id; save(); render(); });
    el.appendChild(wrap);
    render();
  }

  function sos(el) {
    let sel = SOS[0].id;
    const wrap = h(`<div class="sos"><div class="sos-pick" role="group" aria-label="Ситуация">${SOS.map((x) => `<button type="button" data-id="${x.id}" aria-pressed="${x.id === sel}">${pic(x.ic)}<span>${x.t}</span></button>`).join("")}</div><div class="sos-body" aria-live="polite"></div></div>`);
    const body = wrap.querySelector(".sos-body");
    function render() {
      const x = SOS.find((s) => s.id === sel);
      body.innerHTML = `<h4>${x.t}</h4><ol class="sos-steps">${x.steps.map(([ic, t], i) => `<li style="--i:${i}"><span class="sos-ic">${pic(ic)}</span><span class="sos-n">${i + 1}</span><p>${t}</p></li>`).join("")}</ol><p class="sos-no">${pic("no", "#e0352b")}<span><b>Не прави:</b> ${x.no}</span></p><span class="lawref">${x.ref}</span>`;
    }
    wrap.querySelectorAll(".sos-pick button").forEach((b) => b.addEventListener("click", () => {
      sel = b.dataset.id;
      wrap.querySelectorAll(".sos-pick button").forEach((y) => y.setAttribute("aria-pressed", String(y === b)));
      render();
    }));
    el.appendChild(wrap);
    render();
  }

  // renewal ruler: every row is an item renewed at the given ages (years from start)
  const GTP_AGES = [3, 5, 6, 7, 8, 9, 10]; // M1: by the end of year 3, of year 5, then yearly (ЗДвП чл. 147, ал. 3; Н-32 чл. 29)
  const RULER = [
    { t: "Книжка", ic: "form", col: "#c2185b", marks: [10], bar: [0, 10], note: "на 10 години" },
    { t: "„Гражданска отговорност“", ic: "aid", col: "#1f4fbf", marks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], note: "всяка година (обикновено)" },
    { t: "Технически преглед", ic: "eye", col: "#2ea44f", marks: GTP_AGES, note: "3-та и 5-та година, после всяка" },
    { t: "Пожарогасител – обслужване", ic: "fire", col: "#e0352b", marks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], note: "до датата на стикера" },
  ];
  // prices for cars up to 3.5 t from 1.08.2026 (bgtoll.bg)
  const VIGNETTES = [["1 ден", 1, "5,30 €"], ["Уикенд", 3, "6,60 €"], ["Седмица", 7, "10,00 €"], ["Месец", 30, "19,90 €"], ["3 месеца", 91, "35,90 €"], ["Година", 365, "64,50 €"]];
  const SERVICE = [
    { t: "Масло и филтри", v: "~1 г.", sub: "или по км", at: [262, 84], ic: "water" },
    { t: "Спирачна течност", v: "~2 г.", sub: "поема влага", at: [232, 62], ic: "brake" },
    { t: "Чистачки", v: "~1 г.", sub: "при ивици", at: [204, 92], ic: "eye" },
    { t: "Акумулатор", v: "4–6 г.", sub: "провери преди зимата", at: [298, 108], ic: "key" },
    { t: "Гуми", v: "6–8 г.", sub: "и при протектор под 4 мм зимата", at: [96, 142], ic: "wheel" },
  ];
  function times(el) {
    const months = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];
    const dayOfYear = (m, d) => Math.round((Date.UTC(2026, m, d) - Date.UTC(2026, 0, 1)) / 864e5);
    const now = new Date(), today = dayOfYear(now.getMonth(), now.getDate());
    const pct = (d) => (d / 365) * 100;
    // 0–10 year ruler
    const RW = 560, X0 = 250, X1 = 545, yr = (v) => X0 + ((X1 - X0) * v) / 10;
    let ruler = `<svg viewBox="0 0 ${RW} ${40 + RULER.length * 44}" class="ruler" role="img" aria-label="Кога се подновява">`;
    for (let v = 0; v <= 10; v++) ruler += `<line x1="${yr(v)}" y1="22" x2="${yr(v)}" y2="${30 + RULER.length * 44}" stroke="currentColor" stroke-opacity=".12"/><text x="${yr(v)}" y="16" font-size="11" text-anchor="middle" fill="currentColor" fill-opacity=".6">${v === 0 ? "сега" : v + " г."}</text>`;
    RULER.forEach((r, i) => {
      const y = 44 + i * 44;
      ruler += `<g><circle cx="20" cy="${y}" r="15" fill="${r.col}"/>${picAt(r.ic, 9, y - 11, 22, "#fff")}<text x="42" y="${y - 2}" font-size="12" font-weight="700" fill="currentColor">${r.t}</text><text x="42" y="${y + 13}" font-size="10" fill="currentColor" fill-opacity=".6">${r.note}</text>`;
      ruler += `<line x1="${yr(0)}" y1="${y}" x2="${yr(10)}" y2="${y}" stroke="${r.col}" stroke-opacity=".25" stroke-width="8" stroke-linecap="round"/>`;
      if (r.bar) ruler += `<line class="ruler-bar" x1="${yr(r.bar[0])}" y1="${y}" x2="${yr(r.bar[1])}" y2="${y}" stroke="${r.col}" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>`;
      r.marks.forEach((m, k) => (ruler += `<circle class="ruler-dot" style="animation-delay:${(0.12 * k).toFixed(2)}s" cx="${yr(m)}" cy="${y}" r="7" fill="#fff" stroke="${r.col}" stroke-width="3"/>`));
      ruler += `</g>`;
    });
    ruler += `</svg>`;
    // vignettes to scale (a year = full width)
    const vig = VIGNETTES.map(([t, d, price]) => `<div class="vig"><span>${t}</span><div class="vig-bar"><i style="width:${Math.max(1.2, (d / 365) * 100)}%"></i></div><b>${price}</b></div>`).join("");
    // service car
    let car = `<svg viewBox="0 0 360 170" class="svc" role="img" aria-label="Поддръжка на колата"><rect width="360" height="170" fill="#eef2f6"/><rect y="150" width="360" height="20" fill="#cfd5dc"/>`;
    car += `<g transform="translate(40 30)"><path d="M10 96 C6 84 12 76 26 74 L58 68 C72 46 88 38 108 38 L160 38 C178 38 190 46 204 68 L224 74 C234 76 238 84 236 96 L236 104 C236 108 232 112 228 112 L14 112 C10 112 10 106 10 96 Z" fill="#2f6fdc"/><path d="M70 70 C80 52 92 46 108 46 L126 46 L126 70 Z M134 46 L160 46 C174 46 184 54 194 70 L134 70 Z" fill="#cfe6fb"/><circle cx="56" cy="112" r="20" fill="#24282d"/><circle cx="56" cy="112" r="9" fill="#d5dae0"/><circle cx="196" cy="112" r="20" fill="#24282d"/><circle cx="196" cy="112" r="9" fill="#d5dae0"/></g>`;
    SERVICE.forEach((x, i) => {
      const [cx, cy] = x.at, lx = i % 2 ? 300 : 300;
      car += `<g><circle cx="${cx}" cy="${cy}" r="13" fill="#fff" stroke="#1f2933" stroke-width="1.5"/>${picAt(x.ic, cx - 8.5, cy - 8.5, 17, "#1f2933")}</g>`;
    });
    car += `</svg>`;
    const svcList = SERVICE.map((x) => `<div class="svc-row"><span class="svc-ic">${pic(x.ic)}</span><span><b>${x.t}</b><small>${x.sub}</small></span><em>${x.v}</em></div>`).join("");
    const wrap = h(`<div class="times">
      <h4>Зимните гуми през годината</h4>
      <div class="year"><div class="year-band" style="left:0;width:${pct(dayOfYear(2, 1))}%"></div><div class="year-band" style="left:${pct(dayOfYear(10, 15))}%;width:${100 - pct(dayOfYear(10, 15))}%"></div><div class="year-now" style="left:${pct(today)}%"><span>днес</span></div>${months.map((m, i) => `<span class="year-m" style="left:${pct(dayOfYear(i, 1))}%">${m}</span>`).join("")}</div>
      <p class="times-note">Синьото = от <b>15 ноември</b> до <b>1 март</b>: зимни гуми или протектор поне 4 мм (ЗДвП чл. 139, ал. 1, т. 4).</p>
      <h4>Кога се подновява – по закон</h4>
      <div class="ruler-wrap">${ruler}</div>
      <p class="times-note">Всяка точка = подновяване. Техническият преглед се брои от <b>датата на първа регистрация</b> (поле B в талона).</p>
      <h4>Колко трае винетката и колко струва</h4>
      <div class="vigs">${vig}</div>
      <p class="times-note">Цени за кола до 3,5 т от 1.08.2026 г. Уикендът е от петък 12:00 до неделя 23:59. Купува се до 30 дни предварително.</p>
      <h4>Поддръжка – препоръки</h4>
      <div class="svc-wrap">${car}<div class="svc-list">${svcList}</div></div>
      <p class="times-note">Препоръките не са закон – виж сервизната книжка на колата си.</p>
    </div>`);
    el.appendChild(wrap);
  }

  window.BGCar = { widget, DOCS, EQUIP, WALK, SOS, TIMES };
  if (window.BGWidgets) window.BGWidgets.kola = widget;
})();
