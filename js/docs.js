/* Real-life looking document examples with numbered fields you can tap. All data on them is fictional
   and every picture carries „ОБРАЗЕЦ“. Used by the „Документи“ tab in car.js. */
(function () {
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const F = "font-family=\"Arial, Helvetica, sans-serif\"";
  const txt = (x, y, s, size = 9, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${o.w || 400}" fill="${o.c || "#1f2933"}" ${o.a ? `text-anchor="${o.a}"` : ""} ${F}>${s}</text>`;
  const stamp = (x, y, w = 400) => `<text x="${x}" y="${y}" font-size="${w / 9}" font-weight="800" fill="#d0021b" opacity=".13" text-anchor="middle" transform="rotate(-18 ${x} ${y})" ${F}>ОБРАЗЕЦ</text>`;
  const euFlag = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect width="36" height="26" rx="2" fill="#1f4fbf"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${18 + 8 * Math.cos((i * Math.PI) / 6)}" cy="${12 + 8 * Math.sin((i * Math.PI) / 6)}" r="1.1" fill="#ffd400"/>`).join("")}${txt(18, 24.5, "BG", 6.5, { w: 800, c: "#fff", a: "middle" })}</g>`;
  const person = (x, y, w, hgt) => `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="3" fill="#dfe6ee"/><circle cx="${x + w / 2}" cy="${y + hgt * 0.38}" r="${w * 0.22}" fill="#9fb0c3"/><path d="M${x + w * 0.12} ${y + hgt} Q${x + w / 2} ${y + hgt * 0.55} ${x + w * 0.88} ${y + hgt} Z" fill="#9fb0c3"/>`;
  const guilloche = (w, hgt, col) => Array.from({ length: 9 }, (_, i) => `<path d="M0 ${hgt * (0.1 + i * 0.1)} Q${w * 0.25} ${hgt * (0.02 + i * 0.1)} ${w * 0.5} ${hgt * (0.1 + i * 0.1)} T${w} ${hgt * (0.1 + i * 0.1)}" stroke="${col}" stroke-width=".6" fill="none" opacity=".45"/>`).join("");

  // each document: views (front/back…) → svg + hotspots [n, x, y, title, text]
  const DOCS = {
    licence: {
      name: "Шофьорска книжка",
      views: {
        "Лице": {
          svg: () => `<defs><linearGradient id="lic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe3ea"/><stop offset=".55" stop-color="#f3eaf6"/><stop offset="1" stop-color="#dbe8fb"/></linearGradient></defs>
            <rect width="400" height="252" rx="16" fill="url(#lic)" stroke="#d6c3cc"/>${guilloche(400, 252, "#d9a5b8")}
            ${euFlag(16, 14, 1.15)}${txt(66, 26, "СВИДЕТЕЛСТВО ЗА УПРАВЛЕНИЕ", 11.5, { w: 800, c: "#7a2840" })}${txt(66, 40, "РЕПУБЛИКА БЪЛГАРИЯ · DRIVING LICENCE", 8.5, { w: 600, c: "#7a2840" })}
            ${person(18, 62, 96, 122)}
            ${[["1.", "ИВАНОВА"], ["2.", "МАРИЯ ПЕТРОВА"], ["3.", "01.02.1990 СОФИЯ"], ["4a.", "15.06.2024"], ["4b.", "15.06.2034"], ["4c.", "МВР"], ["4d.", "9002011234"], ["5.", "123456789"]].map(([k, v], i) => txt(128, 70 + i * 17, `<tspan font-weight="700" fill="#7a2840">${k}</tspan> ${v}`, 10.5)).join("")}
            ${txt(128, 214, `<tspan font-weight="700" fill="#7a2840">8.</tspan> ГР. СОФИЯ, УЛ. ПРИМЕРНА 1`, 9)}
            <path d="M24 214 q14 -12 26 0 t26 -4 t24 2" stroke="#1f2933" stroke-width="1.4" fill="none"/>${txt(18, 200, "7.", 9, { w: 700, c: "#7a2840" })}
            ${txt(128, 236, `<tspan font-weight="700" fill="#7a2840">9.</tspan> AM / B1 / B`, 11, { w: 700 })}${stamp(250, 160)}`,
          spots: [
            [1, 120, 66, "1–2. Фамилия и име", "Както в личната карта."],
            [2, 120, 117, "4a. Дата на издаване", "Кога е издадена тази книжка."],
            [3, 120, 134, "4b. Валидна до", "Най-важното поле: след тази дата книжката е невалидна – подновяваш я преди това."],
            [4, 120, 168, "4d. ЕГН и 5. номер", "Номерът на документа – от него проверяват книжката."],
            [5, 120, 232, "9. Категории", "Какво можеш да караш. За лека кола – B."],
            [6, 12, 206, "7. Подпис", "Твоят подпис."],
          ],
        },
        "Гръб": {
          svg: () => {
            const rows = [["AM", "", ""], ["A1", "", ""], ["A2", "", ""], ["A", "", ""], ["B1", "15.06.2014", "15.06.2034"], ["B", "15.06.2014", "15.06.2034", "78"], ["C1", "", ""], ["C", "", ""], ["D1", "", ""], ["BE", "", ""]];
            let s = `<rect width="400" height="252" rx="16" fill="#f6eef3" stroke="#d6c3cc"/>${guilloche(400, 252, "#d9a5b8")}`;
            s += `<rect x="14" y="14" width="300" height="20" fill="#e8d3dc"/>${txt(30, 28, "9.", 9, { w: 700, c: "#7a2840" })}${txt(110, 28, "10.", 9, { w: 700, c: "#7a2840" })}${txt(185, 28, "11.", 9, { w: 700, c: "#7a2840" })}${txt(262, 28, "12.", 9, { w: 700, c: "#7a2840" })}`;
            rows.forEach(([c, a, b, code], i) => {
              const y = 34 + i * 19;
              s += `<rect x="14" y="${y}" width="300" height="19" fill="${c === "B" ? "#fff6c4" : i % 2 ? "#fbf6f8" : "#f3e8ee"}" stroke="#e3d0d9" stroke-width=".6"/>${txt(30, y + 13, c, 9.5, { w: 700 })}${txt(84, y + 13, a, 8.5)}${txt(160, y + 13, b, 8.5)}${code ? txt(262, y + 13, code, 10, { w: 800, c: "#d0021b" }) : ""}`;
            });
            s += `<rect x="322" y="14" width="64" height="210" rx="6" fill="#efe1e8"/>${txt(354, 34, "12.", 9, { w: 700, c: "#7a2840", a: "middle" })}${txt(354, 54, "01 · 78", 9, { w: 700, a: "middle" })}${txt(18, 240, "Пример: категория B с код 78 – само автоматична скоростна кутия", 8.5, { c: "#7a2840" })}${stamp(200, 150)}`;
            return s;
          },
          spots: [
            [1, 22, 132, "9. Категория", "Ред за всяка категория. Твоят ред е B."],
            [2, 92, 132, "10. Придобита на", "Кога си взел категорията за първи път – от тази дата се брои стажът."],
            [3, 170, 132, "11. Валидна до", "До кога важи категорията."],
            [4, 270, 132, "12. Кодове – 78", "Ограничения. Код 78 = само кола с автоматична скоростна кутия (ако изпитът е бил на автоматик). Код 01 = очила или лещи."],
          ],
        },
      },
    },
    reg: {
      name: "Талон (свидетелство за регистрация)",
      views: {
        "Част II": {
          svg: () => `<rect width="400" height="252" rx="16" fill="#e4f2e9" stroke="#9cc9ad"/>${guilloche(400, 252, "#9cc9ad")}
            ${euFlag(16, 14, 1.15)}${txt(66, 26, "СВИДЕТЕЛСТВО ЗА РЕГИСТРАЦИЯ", 11.5, { w: 800, c: "#235c3b" })}${txt(66, 40, "ЧАСТ II · РЕПУБЛИКА БЪЛГАРИЯ", 8.5, { w: 600, c: "#235c3b" })}
            ${[["A", "CA 1234 AB"], ["B", "12.03.2019"], ["C.1.1", "ИВАНОВА МАРИЯ"], ["D.1", "ПРИМЕРНА МАРКА"], ["D.3", "МОДЕЛ X"], ["E", "WVWZZZ1KZ9W000000"], ["P.3", "БЕНЗИН"], ["J", "M1"]].map(([k, v], i) => `${txt(22, 70 + i * 21, k, 10, { w: 800, c: "#235c3b" })}${txt(82, 70 + i * 21, v, 11, { w: k === "A" ? 800 : 500 })}`).join("")}
            <rect x="268" y="58" width="114" height="34" rx="5" fill="#fff" stroke="#1f2933"/><rect x="268" y="58" width="16" height="34" rx="4" fill="#1f4fbf"/>${txt(276, 79, "BG", 7, { w: 800, c: "#fff", a: "middle" })}${txt(333, 81, "CA 1234 AB", 13, { w: 800, a: "middle" })}${stamp(240, 170)}`,
          spots: [
            [1, 14, 66, "A. Регистрационен номер", "Номерът на колата – по него се проверяват ГО, ГТП и винетката."],
            [2, 14, 87, "B. Първа регистрация", "Датата, от която се брои възрастта на колата – по нея е графикът на техническите прегледи."],
            [3, 14, 108, "C.1. Собственик", "На чие име е колата."],
            [4, 14, 171, "E. VIN номер", "Уникалният номер на шасито. Сравни го с колата, ако купуваш."],
            [5, 14, 213, "J. Категория на колата", "M1 = лека кола до 8 места плюс шофьора."],
          ],
        },
      },
    },
    go: {
      name: "Полица „Гражданска отговорност“",
      views: {
        "Полица": {
          svg: () => `<rect width="400" height="252" rx="8" fill="#fff" stroke="#c9d1db"/>${guilloche(400, 252, "#b9cbe6")}
            <rect width="400" height="40" rx="8" fill="#1f4fbf"/><rect y="30" width="400" height="10" fill="#1f4fbf"/>${txt(18, 26, "ЗАСТРАХОВАТЕЛНА ПОЛИЦА", 13, { w: 800, c: "#fff" })}${txt(382, 26, "ПРИМЕРНО ЗАСТРАХОВАНЕ АД", 8.5, { w: 600, c: "#cfe0ff", a: "end" })}
            ${txt(18, 62, "Задължителна застраховка „Гражданска отговорност“ на автомобилистите", 9.5, { w: 700 })}
            ${[["Полица №", "BG/00/000000000"], ["Валидна от", "10.03.2026 00:00"], ["Валидна до", "09.03.2027 23:59"], ["Рег. номер", "CA 1234 AB"], ["Собственик", "ИВАНОВА МАРИЯ"], ["Премия", "платена изцяло"]].map(([k, v], i) => `${txt(18, 88 + i * 22, k, 9.5, { c: "#5b6673" })}${txt(118, 88 + i * 22, v, 10.5, { w: 700 })}`).join("")}
            <circle cx="330" cy="170" r="38" fill="none" stroke="#1f4fbf" stroke-width="3" opacity=".55"/>${txt(330, 166, "ПЕЧАТ", 9, { w: 800, c: "#1f4fbf", a: "middle" })}${txt(330, 180, "ЗАСТРАХОВАТЕЛ", 6.5, { c: "#1f4fbf", a: "middle" })}${stamp(200, 160)}`,
          spots: [
            [1, 10, 84, "Номер на полицата", "По него застрахователят и полицията намират застраховката."],
            [2, 10, 128, "Валидна до", "След тази дата колата е незастрахована – поднови преди това."],
            [3, 10, 150, "Рег. номер", "Полицата е за колата, не за шофьора: важи за всеки, който я кара законно."],
            [4, 292, 170, "Печат", "Издадена от лицензиран застраховател. Проверка онлайн в Гаранционния фонд."],
          ],
        },
        "Стикер": {
          svg: () => `<rect width="400" height="252" fill="#2b2f36"/><path d="M28 18 H372 L392 236 H8 Z" fill="#cfe3f5"/><path d="M8 236 L150 150 H250 L392 236 Z" fill="#4a4f57"/><path d="M200 152 V236" stroke="#fff" stroke-dasharray="10 9" stroke-width="2"/><path d="M8 236 L150 150 L8 168 Z" fill="#bcd5a9"/><path d="M392 236 L250 150 L392 168 Z" fill="#bcd5a9"/>
            <rect x="188" y="18" width="24" height="26" rx="4" fill="#16181b"/>
            <g transform="translate(40 178) rotate(-4)"><rect width="64" height="44" rx="5" fill="#fff" stroke="#1f4fbf" stroke-width="2"/><rect width="64" height="12" rx="4" fill="#1f4fbf"/>${txt(32, 9, "ГО 2026", 7.5, { w: 800, c: "#fff", a: "middle" })}${txt(32, 26, "CA 1234 AB", 7.5, { w: 700, a: "middle" })}${txt(32, 37, "до 09.03.2027", 6.5, { a: "middle", c: "#5b6673" })}</g>
            ${txt(200, 246, "Изглед отвътре – долният ляв ъгъл на предното стъкло", 9, { c: "#fff", a: "middle" })}${stamp(260, 100)}`,
          spots: [
            [1, 72, 168, "Стикер за ГО", "Залепва се в долния ляв ъгъл на предното стъкло. Задължителен е и през 2026 г."],
            [2, 110, 210, "Срок", "Стикерът показва до кога е застраховката – сменя се с всяка нова полица."],
          ],
        },
      },
    },
    protocol: {
      name: "Двустранен констативен протокол",
      views: {
        "Формуляр": {
          // laid out like the official form (Приложение № 3 към чл. 5, ал. 1 от Наредба № Із-41/2009):
          // А (blue) on the left – the driver at fault, Б (yellow) on the right – the injured driver
          svg: () => {
            const BLUE = "#bcd8f3", BLUE_D = "#1f4e8c", YEL = "#fff1a6", YEL_D = "#f2c200", LINE = "#5b6673";
            const t = (x, y, s, size = 5.2, o = {}) => txt(x, y, s, size, o);
            const box = (x, y, w, hh, fill = "#fff") => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${fill}" stroke="${LINE}" stroke-width=".7"/>`;
            const num = (x, y, n) => `<rect x="${x}" y="${y}" width="9" height="8" fill="${BLUE_D}"/>${t(x + 4.5, y + 6.2, n, 5.6, { w: 800, c: "#fff", a: "middle" })}`;
            const cb = (x, y, on) => `<rect x="${x}" y="${y}" width="5.5" height="5.5" fill="#fff" stroke="${LINE}" stroke-width=".6"/>${on ? `<path d="M${x + 0.8} ${y + 0.8} l4 4 m0 -4 l-4 4" stroke="#d0021b" stroke-width="1.1"/>` : ""}`;
            const dots = (x1, x2, y) => `<path d="M${x1} ${y} H${x2}" stroke="#8b939c" stroke-width=".5" stroke-dasharray="1 1.4"/>`;
            const lines = (x, y, w, labels) => labels.map((l, i) => t(x, y + i * 8.4, l, 5) + dots(x + l.length * 2.6 + 2, x + w, y + i * 8.4 + 0.5)).join("");
            // one side of the form (А or Б): fields 6–9
            const side = (x, fill, dark, title, ink) => {
              const w = 128;
              let s = `<rect x="${x}" y="86" width="${w}" height="330" fill="${fill}" stroke="${dark}" stroke-width="1.2"/>`;
              s += `<rect x="${x}" y="86" width="${w}" height="13" fill="${dark}"/>${t(x + w / 2, 95.5, title, 7, { w: 800, c: ink, a: "middle" })}`;
              s += num(x + 2, 102, "6") + t(x + 13, 108, "ЗАСТРАХОВАН / ПРИТЕЖАТЕЛ НА ПОЛИЦА", 4.6, { w: 700 });
              s += lines(x + 4, 118, w - 8, ["ФАМИЛИЯ:", "Име:", "Адрес:", "Пощ. код:", "Тел. или ел. поща:"]);
              s += num(x + 2, 160, "7") + t(x + 13, 166, "ПРЕВОЗНО СРЕДСТВО", 4.8, { w: 700 });
              s += box(x + 3, 170, w / 2 - 4, 40, "rgba(255,255,255,.35)") + box(x + w / 2 + 1, 170, w / 2 - 4, 40, "rgba(255,255,255,.35)");
              s += t(x + w / 4, 177, "МПС", 4.8, { w: 700, a: "middle" }) + t(x + (3 * w) / 4, 177, "Ремарке", 4.8, { w: 700, a: "middle" });
              s += [x + 6, x + w / 2 + 4].map((cx) => t(cx, 186, "Модел, марка", 4) + t(cx, 195, "Рег. №", 4) + t(cx, 204, "Държава", 4)).join("");
              s += num(x + 2, 214, "8") + t(x + 13, 220, "ЗАСТРАХОВАТЕЛ", 4.8, { w: 700 });
              s += lines(x + 4, 230, w - 8, ["Име:", "Застрахователна полица №:", "Зелена карта №:", "Валидна от / до:", "Агенция или брокер:", "Адрес:", "Тел. или ел. поща:"]);
              s += t(x + 4, 292, "Покрива ли полицата щетите на превозното средство?", 4.1) + t(x + 30, 302, "не", 4.6) + cb(x + 38, 297) + t(x + 56, 302, "да", 4.6) + cb(x + 64, 297);
              s += num(x + 2, 310, "9") + t(x + 13, 316, "ВОДАЧ (провери в книжката)", 4.8, { w: 700 });
              s += lines(x + 4, 326, w - 8, ["ФАМИЛИЯ:", "Име:", "Дата на раждане:", "Адрес:", "Тел. или ел. поща:", "Свидетелство №:", "Категория (A, B…):", "Валидно до:"]);
              return s;
            };
            const W = 400;
            let s = `<rect width="${W}" height="600" fill="#fff" stroke="#c9d1db"/>`;
            s += t(10, 14, "ДВУСТРАНЕН КОНСТАТИВЕН ПРОТОКОЛ", 7.6, { w: 800 }) + t(10, 23, "ЗА ПЪТНОТРАНСПОРТНО ПРОИЗШЕСТВИЕ", 7.6, { w: 800 }) + t(390, 15, "Приложение № 3 към чл. 5, ал. 1", 6, { a: "end" });
            // 1–3
            s += box(10, 30, 120, 22) + num(11, 31, "1") + t(22, 37.5, "Дата на ПТП", 5, { w: 700 }) + `<path d="M92 30 V52" stroke="${LINE}" stroke-width=".6"/>` + t(95, 37.5, "Час", 5, { w: 700 });
            s += box(134, 30, 160, 22) + num(135, 31, "2") + t(146, 37.5, "Местоположение:", 5, { w: 700 }) + t(210, 37.5, "Място", 5) + t(146, 48, "Държава", 5);
            s += box(298, 30, 92, 22) + num(299, 31, "3") + t(310, 37.5, "Пострадали /дори леко/", 4.4, { w: 700 }) + t(312, 48, "не", 5) + cb(322, 43.5, true) + t(344, 48, "да", 5) + cb(354, 43.5);
            // 4–5
            s += box(10, 56, 186, 26) + num(11, 57, "4") + t(22, 63.5, "Материални щети", 5, { w: 700 });
            s += t(14, 71, "освен по превозни средства „А“ и „Б“", 4.1) + t(14, 79, "не", 4.8) + cb(22, 74.5, true) + t(36, 79, "да", 4.8) + cb(44, 74.5);
            s += t(104, 71, "по други обекти (ограда, стълб…)", 4.1) + t(104, 79, "не", 4.8) + cb(112, 74.5, true) + t(126, 79, "да", 4.8) + cb(134, 74.5);
            s += box(200, 56, 190, 26) + num(201, 57, "5") + t(212, 63.5, "Свидетели (име, адрес, телефон)", 5, { w: 700 }) + dots(204, 386, 72) + dots(204, 386, 79);
            // sides А and Б, circumstances in the middle
            s += side(10, BLUE, BLUE_D, "ПРЕВОЗНО СРЕДСТВО А", "#fff") + side(262, YEL, YEL_D, "ПРЕВОЗНО СРЕДСТВО Б", "#1f2933");
            s += `<rect x="140" y="86" width="120" height="330" fill="#fff" stroke="${LINE}" stroke-width=".8"/>${t(200, 96, "12. ОБСТОЯТЕЛСТВА", 7, { w: 800, a: "middle" })}`;
            s += t(200, 104, "Поставете „х“ в съответното квадратче", 4.2, { a: "middle" }) + t(200, 110, "с цел уточняване на схемата на ПТП", 4.2, { a: "middle" });
            s += t(146, 112, "А", 6, { w: 800 }) + t(254, 112, "Б", 6, { w: 800, a: "end" });
            const CIRC = ["паркирано / в спряно състояние", "при тръгване / при отваряне на вратата", "при паркиране", "при излизане от паркинг, частен терен, черен път", "при влизане в паркинг, частен терен, черен път", "при влизане в кръгово движение", "в кръстовище с кръгово движение", "удар в задната част на друго превозно средство – в една посока и в същата лента", "движение в една посока, но в различна лента", "при смяна на лентите", "при изпреварване", "при завиване надясно", "при завиване наляво", "при обратен завой", "навлиза в лента за насрещно движение", "идвайки отдясно /на кръстовище/", "неспазване на знак за предимство или червена светлина"];
            // example: А hit Б from behind (8 for А), Б was standing (1 for Б)
            const wrap = (str, n) => { const out = [""]; str.split(" ").forEach((wd) => { if ((out[out.length - 1] + " " + wd).trim().length > n) out.push(wd); else out[out.length - 1] = (out[out.length - 1] + " " + wd).trim(); }); return out; };
            CIRC.forEach((c, i) => {
              const y = 118 + i * 15.6;
              s += cb(144, y, i === 7) + t(152, y + 4.8, String(i + 1), 4.6, { w: 700 }) + cb(250.5, y, i === 0) + t(248, y + 4.8, String(i + 1), 4.6, { w: 700, a: "end" });
              wrap(c, 30).slice(0, 3).forEach((ln, k, arr) => (s += t(200, y + 4.6 + (k - (arr.length - 1) / 2) * 4.6, ln, 3.9, { a: "middle" })));
            });
            s += `<path d="M140 385 H260" stroke="${LINE}" stroke-width=".6"/>` + cb(144, 390, false) + t(147, 395, "1", 5, { w: 800, c: "#d0021b" }) + t(200, 391, "Посочете броя на", 4.4, { a: "middle", w: 700 }) + t(200, 397, "квадратчетата с „х“", 4.4, { a: "middle", w: 700 }) + cb(250.5, 390, false) + t(253.5, 395, "1", 5, { w: 800, c: "#d0021b" });
            s += t(200, 406, "Да се подпише от двамата водачи.", 4.4, { a: "middle", w: 700 }) + t(200, 412, "Не е признаване на вина – уточнява фактите.", 3.8, { a: "middle", c: "#5b6673" });
            // 10–11 under each side, sketch 13 in the middle
            const car10 = (x, fill, arrowAt) => `${box(x, 420, 92, 54, fill)}${num(x + 1, 421, "10")}${t(x + 12, 427, "Отбележете зоната на", 4.2, { w: 700 })}${t(x + 12, 432, "първоначалния удар →", 4.2, { w: 700 })}
              <g transform="translate(${x + 8} 438)"><path d="M6 6 v24 M2 14 h8" stroke="#1f2933" stroke-width="1.2"/><rect x="18" y="2" width="16" height="30" rx="5" fill="#fff" stroke="#1f2933"/><rect x="42" y="0" width="22" height="34" rx="4" fill="#fff" stroke="#1f2933"/></g>
              <path d="${arrowAt}" stroke="#d0021b" stroke-width="1.6" fill="none" marker-end="url(#pa)"/>`;
            s += `<defs><marker id="pa" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#d0021b"/></marker></defs>`;
            s += car10(10, BLUE, "M34 428 L34 437") + car10(298, YEL, "M334 482 L334 473");
            s += box(10, 476, 92, 44, BLUE) + num(11, 477, "11") + t(23, 483, "Видими щети на „А“", 4.6, { w: 700 }) + t(14, 493, "предна броня, капак", 4.6, { c: "#2557b8" }) + dots(14, 98, 503) + dots(14, 98, 512);
            s += box(298, 476, 92, 44, YEL) + num(299, 477, "11") + t(311, 483, "Видими щети на „Б“", 4.6, { w: 700 }) + t(302, 493, "задна броня", 4.6, { c: "#2557b8" }) + dots(302, 386, 503) + dots(302, 386, 512);
            s += box(106, 420, 188, 100) + num(107, 421, "13") + t(119, 427.5, "Скица на пътната обстановка и ПТП", 5, { w: 700 });
            for (let gx = 110; gx < 292; gx += 8) s += `<path d="M${gx} 432 V518" stroke="#e3e7ec" stroke-width=".5"/>`;
            for (let gy = 432; gy < 518; gy += 8) s += `<path d="M108 ${gy} H292" stroke="#e3e7ec" stroke-width=".5"/>`;
            s += `<rect x="112" y="458" width="176" height="34" fill="#dfe4ea"/><path d="M112 475 H288" stroke="#fff" stroke-dasharray="7 6" stroke-width="1.4"/>`;
            s += `<g><rect x="214" y="478" width="26" height="11" rx="3" fill="${YEL_D}"/>${t(227, 486, "Б", 7, { w: 800, a: "middle" })}</g><path d="M196 483.5 H210" stroke="${BLUE_D}" stroke-width="1.4" marker-end="url(#pa)"/>`;
            s += `<g><animateTransform attributeName="transform" type="translate" values="-44 0;0 0;0 0;-44 0" keyTimes="0;.35;.85;1" dur="4s" repeatCount="indefinite"/><rect x="186" y="478" width="26" height="11" rx="3" fill="${BLUE_D}"/>${t(199, 486, "А", 7, { w: 800, c: "#fff", a: "middle" })}</g>`;
            s += `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.34;.38;.85;1" dur="4s" repeatCount="indefinite"/><path d="M212 476 l3 -6 l2 6 l3 -5" stroke="#d0021b" stroke-width="1.6" fill="none"/></g>`;
            s += t(200, 514, "посоки, ленти, знаци, места на колите", 4.6, { a: "middle", c: "#5b6673" });
            // 14 remarks, 15 signatures
            s += box(10, 526, 120, 50, BLUE) + num(11, 527, "14") + t(23, 533, "Забележка:", 5, { w: 700 }) + t(14, 544, "Аз съм виновен за ПТП.", 5, { c: "#2557b8" }) + dots(14, 126, 555) + dots(14, 126, 565);
            s += box(270, 526, 120, 50, YEL) + num(271, 527, "14") + t(283, 533, "Забележка:", 5, { w: 700 }) + dots(274, 386, 545) + dots(274, 386, 555) + dots(274, 386, 565);
            s += box(134, 526, 132, 22) + num(135, 527, "15") + t(200, 533.5, "Подписи на водачите", 5.2, { w: 700, a: "middle" });
            s += `<path d="M144 544 c6 -6 10 4 16 -2 s8 2 12 -3" stroke="#2557b8" stroke-width=".9" fill="none"/><path d="M226 544 c5 -5 9 3 14 -2 s9 3 14 -3" stroke="#2557b8" stroke-width=".9" fill="none"/>`;
            s += t(150, 566, "А", 11, { w: 800, c: BLUE_D }) + t(250, 566, "Б", 11, { w: 800, c: "#b58f00", a: "end" });
            s += stamp(200, 330, 520);
            return s;
          },
          viewBox: "0 0 400 600",
          spots: [
            [1, 64, 41, "1–3. Дата, място, пострадали", "Дата, час и място. Поле 3: има ли пострадал, дори леко. Ако има – протокол не се попълва, звъниш на 112."],
            [2, 196, 69, "4–5. Други щети и свидетели", "Отметни дали има щети по други коли или по имущество (ограда, стълб) и запиши свидетелите, ако има."],
            [3, 74, 132, "6. Застрахован", "Лявата, синята страна (А) попълва виновният водач, дясната, жълтата (Б) – пострадалият. Тук – собственикът по полицата за ГО."],
            [4, 74, 190, "7. Превозното средство", "Марка, модел, регистрационен номер и държава. Ако теглиш ремарке – и неговите данни."],
            [5, 74, 252, "8. Застраховател", "От полицата за ГО: застраховател, номер на полицата, зелена карта и валидност. Отметни дали полицата покрива и щетите по твоята кола (Каско)."],
            [6, 74, 360, "9. Водач", "От книжката: имена, дата на раждане, номер на книжката, категория и до кога важи."],
            [7, 200, 230, "12. Обстоятелства", "Всеки отмята квадратчетата в своята колона – А вляво, Б вдясно – и долу пише колко са. Тук А е отметнал 8 (удар отзад), Б – 1 (спрял)."],
            [8, 200, 470, "13. Скица", "Пътят, лентите, посоките, знаците и колите А и Б в момента на удара. Рисувате я заедно."],
            [9, 56, 498, "10–11. Ударът и щетите", "Стрелка къде е първоначалният удар по колата и кои щети се виждат."],
            [10, 70, 552, "14. Забележка", "Тук се пише кой е виновен – например „Аз съм виновен за ПТП“ – или с какво не си съгласен."],
            [11, 200, 557, "15. Подписи", "Двамата подписвате – само ако сте съгласни. Всеки взима по един екземпляр."],
          ],
        },
      },
    },
  };

  // one document viewer: tabs for the views, the picture with numbered dots, the explanation beside it
  function viewer(key) {
    const d = DOCS[key];
    const views = Object.keys(d.views);
    let view = views[0], sel = 0;
    const el = h(`<div class="dv"><div class="dv-top">${views.length > 1 ? `<div class="seg dv-views" role="group" aria-label="Страна">${views.map((v) => `<button type="button" data-v="${v}" aria-pressed="${v === view}">${v}</button>`).join("")}</div>` : ""}</div><div class="dv-body"><figure class="dv-pic" data-no-play><svg role="img" aria-label="${d.name} – образец"></svg></figure><div class="dv-info readout" aria-live="polite"></div></div></div>`);
    const svg = el.querySelector("svg"), info = el.querySelector(".dv-info");
    function render() {
      const v = d.views[view];
      svg.setAttribute("viewBox", v.viewBox || "0 0 400 252");
      svg.innerHTML = v.svg() + v.spots.map(([n, x, y], i) => `<g class="dv-dot${i === sel ? " sel" : ""}" data-i="${i}" tabindex="0" role="button" aria-label="Поле ${n}"><circle cx="${x}" cy="${y}" r="10" fill="${i === sel ? "#ffb21a" : "#0a84ff"}" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 3.6}" font-size="10" font-weight="800" fill="#fff" text-anchor="middle" ${F}>${n}</text>${i === sel ? `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#ffb21a" stroke-width="2"><animate attributeName="r" values="11;17;11" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="1.4s" repeatCount="indefinite"/></circle>` : ""}</g>`).join("");
      svg.querySelectorAll(".dv-dot").forEach((g) => {
        const go = () => { sel = +g.dataset.i; render(); };
        g.addEventListener("click", go);
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      const sp = v.spots[sel];
      info.innerHTML = `<span class="dv-count">Поле ${sel + 1} от ${v.spots.length}</span><h4>${sp[3]}</h4><p>${sp[4]}</p><div class="dv-nav"><button type="button" class="btn small" data-step="-1" ${sel ? "" : "disabled"}>‹ Назад</button><button type="button" class="btn small primary" data-step="1" ${sel < v.spots.length - 1 ? "" : "disabled"}>Напред ›</button></div>`;
      info.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => { sel = Math.max(0, Math.min(v.spots.length - 1, sel + +b.dataset.step)); render(); }));
    }
    el.querySelectorAll(".dv-views button").forEach((b) => b.addEventListener("click", () => {
      view = b.dataset.v; sel = 0;
      el.querySelectorAll(".dv-views button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    }));
    render();
    return el;
  }

  window.BGDocs = { viewer, DOCS };
})();
