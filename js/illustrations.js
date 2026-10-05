/* Illustrations for rule cards. Each returns an SVG string; colours come from theme classes
   (r-road, r-grass, r-paint, r-walk, il-t …) so they work in light and dark. Official signs are
   placed with BGSigns.signImage. */
(function () {
  const S = (code, x, y, size) => window.BGSigns.signImage(code, x, y, size);
  const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" class="il" role="img" aria-label="${label}">${body}</svg>`;
  const t = (x, y, s, size = 11, cls = "il-t", anchor = "middle", weight = 600) =>
    `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" dominant-baseline="central">${s}</text>`;
  // top-down car, centre (x,y), facing angle in degrees (0 = right)
  const car = (x, y, a = 0, col = "#2b6fe0", len = 34, wid = 17) =>
    `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="${-len / 2}" y="${-wid / 2}" width="${len}" height="${wid}" rx="4" fill="${col}" stroke="rgba(0,0,0,.35)"/><rect x="${len / 2 - 12}" y="${-wid / 2 + 2.5}" width="6" height="${wid - 5}" rx="1.5" fill="rgba(255,255,255,.8)"/><rect x="${-len / 2 + 3}" y="${-wid / 2 + 3}" width="4" height="${wid - 6}" rx="1" fill="rgba(255,255,255,.55)"/></g>`;
  const dashH = (y, x0, x1, len = 16, gap = 12, cls = "r-paint") => {
    let s = "";
    for (let x = x0; x < x1; x += len + gap) s += `<rect x="${x}" y="${y - 1.5}" width="${Math.min(len, x1 - x)}" height="3" class="${cls}"/>`;
    return s;
  };
  const arrow = (x1, y1, x2, y2, cls = "il-arrow") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" stroke-width="1.6" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>`;
  const defs = `<defs><marker id="il-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" class="il-arrow-head"/></marker></defs>`;
  const person = (x, y, s = 1, cls = "il-ink") =>
    `<g transform="translate(${x} ${y}) scale(${s})" class="${cls}" stroke-linecap="round" fill="none" stroke-width="3"><circle cx="0" cy="-26" r="4" class="il-ink-fill" stroke="none"/><path d="M0 -21 V-8 M0 -8 L-5 2 M0 -8 L5 2 M0 -18 L-6 -11 M0 -18 L6 -12"/></g>`;

  const IL = {
    // ---------------- basics ----------------
    speeds() {
      const cols = [["D15", "20", "Жилищна зона"], ["D11", "50", "Населено място"], ["", "90", "Извън населено"], ["D7a", "120", "Скоростен път"], ["D5", "140", "Автомагистрала"]];
      let b = "";
      cols.forEach(([code, v, name], i) => {
        const x = 8 + i * 64;
        b += `<rect x="${x}" y="8" width="58" height="134" rx="8" class="il-card"/>`;
        b += code ? S(code, x + 9, 16, 40) : `<g transform="translate(${x + 9} 16)"><rect width="40" height="40" rx="6" class="r-grass"/><rect x="16" y="0" width="8" height="40" class="r-road"/><rect x="19.2" y="4" width="1.6" height="8" class="r-paint"/><rect x="19.2" y="18" width="1.6" height="8" class="r-paint"/><rect x="19.2" y="32" width="1.6" height="6" class="r-paint"/></g>`;
        b += t(x + 29, 84, v, 26, "il-t", "middle", 800) + t(x + 29, 104, "km/h", 9, "il-m") + `<foreignObject x="${x + 2}" y="112" width="54" height="30"><div xmlns="http://www.w3.org/1999/xhtml" class="il-fo">${name}</div></foreignObject>`;
      });
      return svg(330, 150, b, "Ограничения на скоростта за категория B");
    },
    distance() {
      let b = `<rect width="330" height="130" class="r-grass"/><rect y="38" width="330" height="58" class="r-road"/>${dashH(67, 0, 330)}`;
      b += `<rect x="150" y="18" width="4" height="22" fill="#8a8f96"/><rect x="146" y="14" width="12" height="6" fill="#f2b300"/>`;
      b += car(250, 82, 0, "#f08a24") + car(120, 82, 0, "#2b6fe0");
      b += `<path d="M137 108 H237" class="il-arrow" stroke-width="1.6" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>`;
      b += t(187, 120, "поне 2 секунди (сух път) · 4 на мокър", 10, "il-t");
      b += t(150, 8, "ориентир", 9, "il-m");
      return svg(330, 130, defs + b, "Дистанция от поне 2 секунди");
    },
    alcohol() {
      let b = `<path d="M40 20 H80 L76 70 Q60 80 44 70 Z" class="il-glass"/><path d="M44 46 H76 L75 66 Q60 75 45 66 Z" fill="#f2b300" opacity=".85"/><rect x="58" y="78" width="4" height="30" class="il-ink-fill"/><rect x="46" y="106" width="28" height="4" rx="2" class="il-ink-fill"/>`;
      b += `<g transform="translate(110 20)"><rect width="200" height="22" rx="11" class="il-track"/><rect width="80" height="22" rx="11" fill="#1aa64b"/><rect x="80" width="70" height="22" fill="#f2b300"/><rect x="150" width="50" height="22" rx="0" fill="#d13b2f"/><rect x="190" width="10" height="22" rx="0" fill="#d13b2f"/>`;
      b += t(80, 34, "0,5 ‰", 11, "il-t") + t(150, 34, "1,2 ‰", 11, "il-t") + t(40, 52, "до 0,5 ‰", 9.5, "il-m") + t(115, 52, "нарушение", 9.5, "il-m") + t(176, 66, "престъпление", 9.5, "il-m") + `</g>`;
      b += t(210, 100, "Безопасно: 0,0 ‰", 13, "il-t", "middle", 800);
      return svg(330, 120, b, "Граници на алкохола в кръвта");
    },
    phone() {
      const ph = (x, y) => `<rect x="${x}" y="${y}" width="34" height="58" rx="6" class="il-ink-fill"/><rect x="${x + 3}" y="${y + 6}" width="28" height="44" rx="2" fill="#7aa9ff"/>`;
      let b = `<g>${ph(48, 26)}<path d="M40 90 Q46 60 50 58 L60 70 Q58 92 70 104" class="il-skin"/><circle cx="65" cy="55" r="44" fill="none" stroke="#d13b2f" stroke-width="6"/><line x1="34" y1="24" x2="96" y2="86" stroke="#d13b2f" stroke-width="6"/></g>`;
      b += t(65, 118, "В ръка – забранено", 11, "il-t");
      b += `<g transform="translate(180 0)"><path d="M0 100 Q60 70 120 100" class="il-dash"/>${ph(40, 30)}<rect x="52" y="88" width="10" height="14" class="il-ink-fill"/><circle cx="57" cy="22" r="10" fill="none" stroke="#1aa64b" stroke-width="3"/><path d="M52 22 l4 4 l7 -8" fill="none" stroke="#1aa64b" stroke-width="3"/></g>`;
      b += t(240, 118, "Hands-free – може", 11, "il-t");
      return svg(330, 128, b, "Телефон по време на шофиране");
    },
    childSeat() {
      let b = `<path d="M10 100 Q20 52 70 46 L150 42 Q200 40 230 70 L300 78 Q318 82 318 100 Z" class="il-carbody"/><circle cx="80" cy="102" r="16" class="il-ink-fill"/><circle cx="262" cy="102" r="16" class="il-ink-fill"/>`;
      b += `<path d="M160 52 L196 52 L214 76 L150 80 Z" class="il-window"/><path d="M164 92 L170 60 L186 58 L190 92 Z" fill="#f2b300" stroke="rgba(0,0,0,.35)"/><circle cx="181" cy="64" r="6" fill="#f1c9a5"/><path d="M176 72 L186 86" stroke="#2b6fe0" stroke-width="3"/>`;
      b += `<g transform="translate(286 10)"><rect width="10" height="80" class="il-ruler"/>${[0, 20, 40, 60, 80].map((y) => `<rect x="0" y="${y}" width="6" height="1.5" class="il-ink-fill"/>`).join("")}${t(-6, 30, "150 см", 10, "il-t", "end")}</g>`;
      b += t(165, 124, "Под 150 см – в детско столче", 10.5, "il-t");
      return svg(330, 132, b, "Дете под 150 см пътува в система за обезопасяване");
    },
    triangle() {
      let b = `<rect width="330" height="140" class="r-grass"/><rect y="40" width="330" height="62" class="r-road"/>${dashH(71, 0, 330)}`;
      b += car(260, 86, 0, "#8a929c") + `<g transform="translate(290 88)"><circle r="3" fill="#ffb21a"/></g>`;
      b += `<polygon points="120,72 130,92 110,92" fill="#fff" stroke="#d13b2f" stroke-width="3"/>`;
      b += `<path d="M120 112 H242" class="il-arrow" stroke-width="1.6" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>`;
      b += t(181, 124, "поне 30 м (100 м на магистрала)", 10.5, "il-t");
      b += `<g transform="translate(300 64)">${person(0, 0, .8, "il-vest")}</g>`;
      b += t(165, 22, "Посока на движение →", 10, "il-m");
      return svg(330, 140, defs + b, "Поставяне на авариен триъгълник");
    },
    motorway() {
      let b = `<rect width="330" height="140" class="r-grass"/><rect y="22" width="330" height="100" class="r-road"/><rect y="26" width="330" height="2" class="r-paint"/>${dashH(52, 0, 330, 22, 14)}${dashH(78, 0, 330, 22, 14)}<rect y="102" width="330" height="2.5" class="r-paint"/>`;
      b += car(90, 40, 0, "#2b6fe0") + car(200, 65, 0, "#f08a24") + car(250, 113, 0, "#8a929c") + `<circle cx="268" cy="113" r="2.5" fill="#ffb21a"/><circle cx="232" cy="113" r="2.5" fill="#ffb21a"/>`;
      b += t(8, 113, "аварийна лента: само при повреда", 9, "il-tw", "start");
      return svg(330, 140, b, "Лента за принудително спиране на автомагистрала");
    },

    // ---------------- priority ----------------
    rightRule() {
      let b = `<rect width="200" height="140" class="r-grass"/><rect y="50" width="200" height="40" class="r-road"/><rect x="80" width="40" height="140" class="r-road"/>`;
      b += car(110, 118, -90, "#2b6fe0", 30, 15) + car(170, 60, 180, "#f08a24", 30, 15);
      b += t(132, 128, "ти", 10, "il-t", "start") + t(150, 40, "отдясно → минава първа", 9, "il-t");
      b += `<path d="M110 100 V30" stroke="#2b6fe0" stroke-width="2" stroke-dasharray="4 3" fill="none"/><path d="M150 60 H20" stroke="#f08a24" stroke-width="2" stroke-dasharray="4 3" fill="none"/>`;
      return svg(200, 140, b, "Правило на дясното");
    },
    merge() {
      let b = `<rect width="260" height="110" class="r-grass"/><rect y="20" width="260" height="70" class="r-road"/>${dashH(55, 0, 120)}<path d="M120 55 L200 55" class="r-paint" stroke-width="0"/><polygon points="140,90 220,55 260,55 260,90" class="r-grass"/>`;
      b += car(90, 38, 0, "#8a929c", 30, 15) + car(110, 73, 0, "#2b6fe0", 30, 15);
      b += t(110, 100, "дясната кола има предимство при едновременно престрояване", 9, "il-t");
      b += `<path d="M60 38 Q140 38 200 50" stroke="#8a929c" stroke-width="2" stroke-dasharray="4 3" fill="none"/>`;
      return svg(260, 110, b, "Две коли се престрояват в една лента");
    },
    pedestrianSignal() {
      let b = `<rect width="300" height="130" class="r-walk"/><rect y="30" width="300" height="72" class="r-road"/>`;
      for (let x = 130; x < 190; x += 12) b += `<rect x="${x}" y="34" width="7" height="64" class="r-paint"/>`;
      b += car(70, 82, 0, "#2b6fe0");
      b += `<g transform="translate(160 126)">${person(0, 0, .9)}<path d="M5 -16 L14 -30" class="il-ink" stroke-width="3" stroke-linecap="round"/></g>`;
      b += S("D17", 200, 2, 26) + t(70, 112, "спираш", 10, "il-t") + t(250, 116, "сигнализира с ръка", 10, "il-t");
      return svg(300, 130, b, "Пешеходец сигнализира, че ще пресича");
    },

    // ---------------- parking ----------------
    parkDistances() {
      let b = `<rect width="340" height="170" class="r-walk"/><rect y="20" width="340" height="120" class="r-road"/><rect x="0" y="0" width="54" height="170" class="r-road"/>`;
      for (let y = 26; y < 136; y += 13) b += `<rect x="196" y="${y}" width="34" height="7" class="r-paint"/>`;
      b += `<rect x="54" y="104" width="40" height="34" class="il-no"/><rect x="156" y="104" width="40" height="34" class="il-no"/>`;
      b += `<path d="M54 152 H94" class="il-arrow" stroke-width="1.4" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>${t(74, 162, "5 м", 10, "il-t")}`;
      b += `<path d="M156 152 H196" class="il-arrow" stroke-width="1.4" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>${t(176, 162, "5 м", 10, "il-t")}`;
      b += car(124, 121, 0, "#1aa64b") + car(272, 121, 0, "#1aa64b");
      b += t(74, 92, "кръстовище", 9, "il-tw") + t(213, 12, "пешеходна пътека", 9, "il-t") + t(124, 92, "може", 9, "il-tw") + t(176, 92, "не", 9, "il-tw");
      b += dashH(60, 54, 340);
      return svg(340, 170, defs + b, "Разстояния: 5 м от кръстовище и преди пешеходна пътека");
    },
    parkLine() {
      let b = `<rect width="300" height="120" class="r-walk"/><rect y="14" width="300" height="94" class="r-road"/><rect y="46" width="300" height="3" class="r-paint"/>`;
      b += car(150, 86, 0, "#d13b2f") + car(70, 28, 180, "#8a929c");
      b += `<path d="M196 50 V76" class="il-arrow" stroke-width="1.4" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>${t(204, 63, "под 3 м = забранено", 10, "il-tw", "start")}`;
      b += t(150, 116, "Минаващите ще трябва да пресекат непрекъснатата линия", 9, "il-t");
      return svg(300, 122, defs + b, "Спиране до непрекъсната линия");
    },
    sidewalk() {
      let b = `<rect width="300" height="130" class="r-grass"/><rect y="0" width="300" height="40" class="il-building"/><rect y="40" width="300" height="50" class="r-walk"/><rect y="90" width="300" height="40" class="r-road"/><rect y="88" width="300" height="3" class="r-curb"/>`;
      b += car(150, 78, 0, "#2b6fe0", 44, 20);
      b += `<path d="M230 42 V66" class="il-arrow" stroke-width="1.4" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>${t(238, 54, "поне 2 м", 10, "il-t", "start")}`;
      b += `<g transform="translate(60 70)">${person(0, 0, .7)}</g>` + t(150, 112, "само на определени места · до 2,5 т", 10, "il-tw");
      return svg(300, 130, defs + b, "Паркиране на тротоар");
    },
    parallel() {
      const frame = (i, body, cap) => `<g transform="translate(${i * 84} 0)"><rect x="2" y="2" width="80" height="120" rx="6" class="il-card"/><rect x="8" y="8" width="68" height="96" class="r-road"/><rect x="62" y="8" width="14" height="96" class="r-walk"/>${body}${t(42, 113, cap, 8, "il-t")}</g>`;
      const parked = `${car(56, 26, 90, "#8a929c", 30, 14)}${car(56, 88, 90, "#8a929c", 30, 14)}`;
      let b = frame(0, parked + car(36, 30, 90, "#2b6fe0", 30, 14), "1. до колата");
      b += frame(1, parked + car(42, 52, 115, "#2b6fe0", 30, 14), "2. надясно");
      b += frame(2, parked + car(50, 62, 75, "#2b6fe0", 30, 14), "3. наляво");
      b += frame(3, parked + car(56, 57, 90, "#2b6fe0", 30, 14), "4. изправи, P");
      return svg(338, 126, b, "Успоредно паркиране на заден ход в 4 стъпки");
    },
    slope() {
      const side = (x, down, cap) => `<g transform="translate(${x} 0)"><path d="M0 ${down ? 40 : 100} L150 ${down ? 100 : 40} V120 H0 Z" class="r-road"/><path d="M0 ${down ? 46 : 106} L150 ${down ? 106 : 46}" class="il-curbline" stroke-width="5" fill="none"/>
        <g transform="translate(75 ${70}) rotate(${down ? 21.8 : -21.8})"><rect x="-34" y="-26" width="68" height="20" rx="6" fill="#2b6fe0"/><circle cx="-20" cy="-4" r="7" class="il-ink-fill"/><circle cx="20" cy="-4" r="7" class="il-ink-fill"/></g>${t(75, 132, cap, 9.5, "il-t")}</g>`;
      return svg(330, 140, side(0, true, "Надолу: към бордюра") + side(176, false, "Нагоре: навън"), "Паркиране на наклон");
    },
    childExit() {
      let b = `<rect width="300" height="120" class="r-walk"/><rect y="0" width="300" height="74" class="r-road"/><rect y="72" width="300" height="3" class="r-curb"/>`;
      b += car(150, 56, 0, "#2b6fe0", 60, 26) + `<path d="M140 69 L130 86" stroke="#2b6fe0" stroke-width="4"/>`;
      b += `<g transform="translate(118 112)">${person(0, 0, .55)}</g>` + `<path d="M160 43 L172 26" stroke="#d13b2f" stroke-width="4"/><line x1="160" y1="20" x2="182" y2="34" stroke="#d13b2f" stroke-width="3"/>`;
      b += t(214, 100, "слизат откъм тротоара", 10, "il-t") + t(230, 18, "не към платното", 10, "il-tw");
      return svg(300, 120, b, "Деца слизат откъм тротоара");
    },

    // ---------------- seat and mirrors ----------------
    seat() {
      let b = `<path d="M60 128 L70 60 Q72 40 92 40 L100 40 L94 70 L120 108 L190 108 L196 128 Z" class="il-seat"/><rect x="74" y="22" width="22" height="18" rx="6" class="il-seat"/>`;
      b += `<circle cx="102" cy="40" r="11" fill="#f1c9a5"/><path d="M98 52 L94 92 L150 98 L200 120" stroke="#2b5aa6" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M98 58 L140 70 L180 52" stroke="#2b5aa6" stroke-width="8" stroke-linecap="round" fill="none"/>`;
      b += `<circle cx="196" cy="48" r="22" fill="none" class="il-ink" stroke-width="5" transform="rotate(-25 196 48)"/><path d="M178 70 L168 98" class="il-ink" stroke-width="5"/><rect x="196" y="116" width="26" height="8" rx="3" class="il-ink-fill" transform="rotate(-30 209 120)"/>`;
      b += t(232, 26, "китката – върху", 9, "il-t", "start") + t(232, 38, "горния ръб на волана", 9, "il-t", "start") + t(232, 110, "коляното леко свито", 9, "il-t", "start") + t(232, 122, "при спирачка докрай", 9, "il-t", "start") + t(8, 64, "темето =", 9, "il-t", "start") + t(8, 76, "ръба на", 9, "il-t", "start") + t(8, 88, "облегалката", 9, "il-t", "start");
      return svg(340, 136, b, "Правилна позиция зад волана");
    },
    belt() {
      let b = `<circle cx="80" cy="30" r="16" fill="#f1c9a5"/><path d="M48 130 V72 Q48 52 80 50 Q112 52 112 72 V130 Z" class="il-shirt"/><path d="M104 54 L60 120" stroke="#3a3f46" stroke-width="9" stroke-linecap="round"/><path d="M44 112 H116" stroke="#3a3f46" stroke-width="9" stroke-linecap="round"/>`;
      b += t(130, 64, "през средата на ключицата", 10, "il-t", "start") + t(130, 112, "ниско през таза, не през корема", 10, "il-t", "start");
      b += `<line x1="104" y1="58" x2="126" y2="64" class="il-ink" stroke-width="1"/><line x1="116" y1="112" x2="126" y2="112" class="il-ink" stroke-width="1"/>`;
      return svg(330, 136, b, "Как се поставя коланът");
    },
    interiorMirror() {
      let b = `<rect x="10" y="10" width="310" height="110" rx="14" class="il-dash-bg"/><rect x="65" y="30" width="200" height="56" rx="26" fill="#1c1f24" stroke="#555" stroke-width="3"/><rect x="77" y="38" width="176" height="40" rx="18" fill="#9cc3e6"/><rect x="77" y="62" width="176" height="16" fill="#3a3f46"/>`;
      b += car(165, 66, 0, "#f08a24", 30, 14).replace("rotate(0)", "rotate(0) scale(1 .7)");
      b += t(165, 104, "Виждаш цялото задно стъкло", 11, "il-tw");
      return svg(330, 130, b, "Вътрешното огледало");
    },

    // ---------------- weather ----------------
    aquaplaning() {
      let b = `<rect width="330" height="130" class="il-sky"/><rect y="96" width="330" height="34" class="r-road"/><rect x="40" y="88" width="250" height="10" fill="#6fb6ff" opacity=".7"/>`;
      b += `<circle cx="165" cy="70" r="26" class="il-ink-fill"/><circle cx="165" cy="70" r="12" fill="#8a929c"/><path d="M140 88 Q165 80 190 88" stroke="#6fb6ff" stroke-width="4" fill="none"/>`;
      b += t(165, 116, "Гумата „плава“ върху водата", 11, "il-tw", "middle", 700) + t(250, 34, "пусни газта", 10, "il-t") + t(250, 48, "дръж волана право", 10, "il-t") + t(250, 62, "без рязко спиране", 10, "il-t");
      return svg(330, 130, b, "Аквапланинг");
    },
    fog() {
      let b = `<rect width="330" height="130" class="r-road"/>`;
      for (let i = 0; i < 6; i++) b += `<rect x="${150 + i * 22}" y="0" width="${200}" height="130" fill="#d9dee3" opacity=".22"/>`;
      b += car(90, 70, 0, "#2b6fe0", 44, 22) + `<rect x="66" y="67" width="3" height="6" fill="#ff3b30"/><path d="M67 70 L-10 45 V95 Z" fill="#ff3b30" opacity=".25"/>`;
      b += `<path d="M116 108 H216" class="il-arrow" stroke-width="1.6" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>${t(166, 120, "видимост под 50 м", 10, "il-tw")}`;
      b += t(240, 40, "задна светлина за мъгла", 10, "il-tw") + t(240, 54, "само под 50 м", 10, "il-tw", "middle", 800);
      return svg(330, 130, defs + b, "Задна светлина за мъгла");
    },
    headlights() {
      let b = `<rect width="340" height="140" class="r-road"/>${dashH(70, 0, 340)}`;
      b += `<path d="M58 88 L230 72 L230 110 Z" fill="#fff6b0" opacity=".35"/>` + car(40, 92, 0, "#2b6fe0");
      b += car(300, 48, 180, "#f08a24");
      b += `<path d="M58 128 H282" class="il-arrow" stroke-width="1.6" marker-start="url(#il-ah)" marker-end="url(#il-ah)"/>${t(170, 120, "къси най-късно на 150 м от насрещния", 10, "il-tw")}`;
      b += t(170, 18, "зад кола – къси на по-малко от 50 м", 10, "il-tw");
      return svg(340, 140, defs + b, "Превключване от дълги на къси светлини");
    },
    wind() {
      let b = `<rect width="330" height="130" class="il-sky"/><rect y="70" width="330" height="44" class="r-road"/>${dashH(92, 0, 330)}`;
      b += S("A37", 12, 10, 52) + car(180, 102, -6, "#2b6fe0");
      b += `<g class="il-ink" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M110 30 Q150 22 190 30"/><path d="M120 46 Q160 38 200 46"/><path d="M186 26 l6 4 l-6 4 M196 42 l6 4 l-6 4"/></g>`;
      b += t(250, 30, "дръж волана", 10, "il-t") + t(250, 44, "с двете ръце", 10, "il-t") + t(165, 124, "мостове, изходи на тунели, изпреварване на камиони", 9, "il-m");
      return svg(330, 130, b, "Силен страничен вятър");
    },
    bridgeIce() {
      let b = `<rect width="330" height="130" class="il-sky"/><path d="M0 92 H330 V130 H0 Z" class="r-grass"/><rect x="80" y="70" width="170" height="14" class="r-road"/><rect x="0" y="78" width="80" height="14" class="r-road"/><rect x="250" y="78" width="80" height="14" class="r-road"/>`;
      b += `<rect x="96" y="84" width="10" height="46" fill="#8a929c"/><rect x="224" y="84" width="10" height="46" fill="#8a929c"/><rect x="80" y="66" width="170" height="5" fill="#cfe9ff"/>`;
      b += `<g fill="none" stroke="#6fb6ff" stroke-width="2"><path d="M165 30 V54 M155 36 L175 48 M155 48 L175 36"/></g>`;
      b += t(165, 112, "Мостовете замръзват първи", 11, "il-t", "middle", 700);
      return svg(330, 130, b, "Мостовете замръзват първи");
    },

    // ---------------- traffic lights ----------------
    blockBox() {
      let b = `<rect width="320" height="140" class="r-grass"/><rect y="50" width="320" height="40" class="r-road"/><rect x="130" width="40" height="140" class="r-road"/>`;
      b += car(210, 80, 0, "#8a929c", 30, 15) + car(246, 80, 0, "#8a929c", 30, 15) + car(282, 80, 0, "#8a929c", 30, 15) + car(150, 80, 0, "#d13b2f", 30, 15) + car(95, 80, 0, "#2b6fe0", 30, 15);
      b += `<g transform="translate(112 18)"><rect width="12" height="30" rx="3" fill="#15181b"/><circle cx="6" cy="7" r="3.5" fill="#34383d"/><circle cx="6" cy="15" r="3.5" fill="#34383d"/><circle cx="6" cy="23" r="3.5" fill="#22d36b"/></g>`;
      b += t(150, 112, "грешно: блокира кръстовището", 9.5, "il-t") + t(70, 112, "правилно: чака", 9.5, "il-t");
      return svg(320, 140, b, "Не влизай в кръстовището, ако няма къде да излезеш");
    },
  };

  window.BGIllustrations = IL;
})();
