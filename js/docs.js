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
          svg: () => {
            const W = 400, H = 300;
            let s = `<rect width="${W}" height="${H}" fill="#fff" stroke="#c9d1db"/>`;
            s += `<rect width="${W}" height="22" fill="#eef2f6"/>${txt(W / 2, 15, "ДВУСТРАНЕН КОНСТАТИВЕН ПРОТОКОЛ ЗА ПТП", 9.5, { w: 800, a: "middle" })}`;
            // header boxes 1–5
            ["1. Дата, час", "2. Място", "3. Ранени?", "4. Други щети?", "5. Свидетели"].forEach((t, i) => (s += `<rect x="${4 + i * 78.4}" y="26" width="76" height="24" fill="#fafbfc" stroke="#c9d1db"/>${txt(8 + i * 78.4, 36, t, 6.5, { w: 700 })}`));
            // columns A (blue) and B (yellow)
            const col = (x, c, L) => `<rect x="${x}" y="54" width="128" height="230" fill="${c}" stroke="#c9d1db"/>${txt(x + 64, 66, `ПРЕВОЗНО СРЕДСТВО ${L}`, 7, { w: 800, a: "middle" })}${txt(x + 64, 280, L === "A" ? "виновен" : "пострадал", 6.5, { w: 700, a: "middle", c: "#5b6673" })}${["6. Застрахован", "7. Превозно средство", "8. Застраховател", "9. Водач"].map((t, i) => `<rect x="${x + 4}" y="${72 + i * 26}" width="120" height="23" fill="#fff" opacity=".75"/>${txt(x + 7, 81 + i * 26, t, 6.5, { w: 700 })}`).join("")}<rect x="${x + 4}" y="178" width="120" height="44" fill="#fff" opacity=".75"/>${txt(x + 7, 187, "10. Първоначален удар", 6.5, { w: 700 })}<rect x="${x + 50}" y="190" width="28" height="28" rx="6" fill="none" stroke="#5b6673"/><path d="M${x + 64} ${L === "A" ? 186 : 222} L${x + 64} ${L === "A" ? 196 : 212}" stroke="#d0021b" stroke-width="2.4" marker-end="url(#pa)"/><rect x="${x + 4}" y="226" width="120" height="22" fill="#fff" opacity=".75"/>${txt(x + 7, 235, "11. Видими щети", 6.5, { w: 700 })}<rect x="${x + 4}" y="252" width="120" height="28" fill="#fff" opacity=".75"/>${txt(x + 7, 261, "15. Подпис на водача", 6.5, { w: 700 })}<path d="M${x + 20} ${275} q10 -8 20 0 t20 -3" stroke="#1f2933" fill="none"/>`;
            s += `<defs><marker id="pa" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#d0021b"/></marker></defs>`;
            s += col(4, "#dbe9ff", "A") + col(268, "#fff3bf", "B");
            // circumstances 12 in the middle
            s += `<rect x="136" y="54" width="128" height="148" fill="#fafbfc" stroke="#c9d1db"/>${txt(200, 64, "12. ОБСТОЯТЕЛСТВА", 6.8, { w: 800, a: "middle" })}`;
            const circ = ["паркирано / спряло", "потегля", "паркира", "излиза от паркинг", "влиза в паркинг", "влиза в кръгово", "в кръгово", "удря отзад", "същата посока, друга лента", "сменя лента", "изпреварва", "завива надясно", "завива наляво", "движи се назад", "в насрещното", "идва отдясно", "не спазва знак"];
            circ.forEach((t, i) => { const y = 70 + i * 7.7; s += `<rect x="140" y="${y}" width="6" height="6" fill="#fff" stroke="#5b6673" stroke-width=".7"/><rect x="254" y="${y}" width="6" height="6" fill="#fff" stroke="#5b6673" stroke-width=".7"/>${txt(149, y + 5.4, `${i + 1} ${t}`, 5.2)}`; });
            s += `<path d="M256 125.5 l2 2 l3.5 -4" stroke="#d0021b" stroke-width="1.6" fill="none"/>`;
            // sketch 13
            s += `<rect x="136" y="206" width="128" height="78" fill="#fafbfc" stroke="#c9d1db"/>${txt(140, 215, "13. СКИЦА В МОМЕНТА НА УДАРА", 6, { w: 800 })}`;
            s += `<rect x="140" y="236" width="120" height="30" fill="#e3e7ec"/><path d="M140 251 H260" stroke="#fff" stroke-dasharray="6 5"/>`;
            s += `<g><rect x="206" y="253" width="22" height="11" rx="3" fill="#2f6fdc"/>${txt(217, 261.5, "A", 7, { w: 800, c: "#fff", a: "middle" })}</g><path d="M190 258.5 H204" stroke="#2f6fdc" stroke-width="1.5" marker-end="url(#pa)"/>`;
            s += `<g><animateTransform attributeName="transform" type="translate" values="-34 0;0 0;0 0;-34 0" keyTimes="0;.35;.85;1" dur="4s" repeatCount="indefinite"/><rect x="182" y="253" width="22" height="11" rx="3" fill="#e6b400"/>${txt(193, 261.5, "B", 7, { w: 800, c: "#1f2933", a: "middle" })}</g>`;
            s += `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.34;.38;.85;1" dur="4s" repeatCount="indefinite"/><path d="M204 252 l3 -5 l2 5 l3 -4" stroke="#d0021b" stroke-width="1.6" fill="none"/></g>`;
            s += txt(140, 278, "посока, ленти, знаци, позиции", 5.5, { c: "#5b6673" });
            s += stamp(200, 170, 420);
            return s;
          },
          viewBox: "0 0 400 300",
          spots: [
            [1, 30, 38, "1–5. Общи данни", "Дата, час и място. Ако има ранени (3) – не попълвате протокол, а звъните на 112."],
            [2, 68, 117, "6–9. Данните на колите", "Колона А е за виновния водач (причинителя), колона Б – за пострадалия. Данните – от книжката, талона и полицата за ГО."],
            [3, 68, 200, "10. Първоначален удар", "Стрелка къде е ударена колата ти първо."],
            [4, 200, 112, "12. Обстоятелства", "Всеки отмята своите квадратчета и пише колко са отметнати. Тук B е отметнала 8 – удря отзад."],
            [5, 200, 250, "13. Скица", "Пътят, лентите, посоките, знаците и колите A и B в момента на удара."],
            [6, 332, 266, "14–15. Вина и подписи", "Поле 14: забележка кой е виновен. После двамата подписвате (15) – само ако си съгласен, след това нищо не се поправя."],
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
