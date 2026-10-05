/* Shared behaviour for the design mockups. Each mockup styles these pieces with its own CSS.
   Every sign interaction below is a different idea for "interactive, not a table". */
(function () {
  const { SIGNS, GROUPS } = window.BGSignData;
  const BASE = "../";
  const S = (c) => SIGNS.find((s) => s.c === c);
  const G = (g) => GROUPS.find((x) => x.g === g);
  const img = (s, cls = "k-img") => `<img class="${cls}" src="${BASE + s.f}" alt="${s.c} ${s.n}" loading="lazy">`;
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const KIND = { warn: "Предупреждава", priority: "Предимство", ban: "Забранява", must: "Задължава", info: "Указва", end: "Отменя" };

  // full info block, reused by most patterns
  const info = (s) => `
    <div class="k-info">
      <div class="k-meta"><span class="k-code">${s.c}</span><span class="k-group">Група ${s.g} · ${G(s.g).title}</span><span class="k-kind k-${s.k}">${KIND[s.k]}</span></div>
      <h3 class="k-name">${s.n}</h3>
      <p class="k-desc">${s.d}</p>
      <div class="k-mnem"><span class="k-mnem-label">Как да запомниш</span><p>${s.m}</p></div>
    </div>`;

  const SAMPLE = ["Б1", "Б2", "Б3", "В27", "В28", "Г12", "А19", "В26", "Б5", "Б6", "Д17", "А18"];

  const P = {
    // 1. flip cards
    flip(root, codes = SAMPLE.slice(0, 6)) {
      const grid = h(`<div class="k-flip-grid"></div>`);
      codes.map(S).forEach((s) => {
        const b = h(`<button type="button" class="k-flip" aria-pressed="false"><span class="k-face k-front">${img(s)}<span class="k-code">${s.c}</span><span class="k-hint">Обърни</span></span><span class="k-face k-back">${info(s)}</span></button>`);
        b.onclick = () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
        grid.appendChild(b);
      });
      root.appendChild(grid);
    },
    // 2. list + big detail
    masterDetail(root, codes = SAMPLE) {
      const box = h(`<div class="k-md"><div class="k-md-list" role="listbox" aria-label="Знаци"></div><div class="k-md-detail"></div></div>`);
      const list = box.querySelector(".k-md-list"), det = box.querySelector(".k-md-detail");
      const show = (s, btn) => {
        list.querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", "false"));
        btn.setAttribute("aria-selected", "true");
        det.innerHTML = `<div class="k-md-img">${img(s, "k-img k-big")}</div>${info(s)}`;
      };
      codes.map(S).forEach((s, i) => {
        const b = h(`<button type="button" role="option" aria-selected="false">${img(s, "k-thumb")}<span><b>${s.c}</b> ${s.n}</span></button>`);
        b.onclick = () => show(s, b);
        list.appendChild(b);
        if (!i) show(s, b);
      });
      root.appendChild(box);
    },
    // 3. flashcard stack: know / don't know
    stack(root, codes = SAMPLE) {
      let deck = codes.map(S), known = 0, revealed = false;
      const box = h(`<div class="k-stack"><div class="k-stack-card"></div><div class="k-stack-actions"><button type="button" class="k-btn k-no">Не знам</button><button type="button" class="k-btn k-show">Покажи</button><button type="button" class="k-btn k-yes">Знам го</button></div><p class="k-stack-count"></p></div>`);
      const card = box.querySelector(".k-stack-card"), count = box.querySelector(".k-stack-count");
      const draw = () => {
        if (!deck.length) { card.innerHTML = `<div class="k-done"><b>Тестето свърши.</b><p>Знаеш ${known} от ${codes.length}.</p></div>`; count.textContent = ""; return; }
        const s = deck[0];
        card.innerHTML = `${img(s, "k-img k-big")}${revealed ? info(s) : `<p class="k-q">Какво означава?</p>`}`;
        count.textContent = `Остават ${deck.length} · знаеш ${known}`;
      };
      box.querySelector(".k-show").onclick = () => { revealed = true; draw(); };
      box.querySelector(".k-yes").onclick = () => { if (!deck.length) return; known++; deck.shift(); revealed = false; draw(); };
      box.querySelector(".k-no").onclick = () => { if (!deck.length) return; deck.push(deck.shift()); revealed = true; draw(); revealed = false; };
      draw();
      root.appendChild(box);
    },
    // 4. guess first, then learn
    guess(root, codes = SAMPLE) {
      let i = 0;
      const box = h(`<div class="k-guess"></div>`);
      const draw = () => {
        const s = S(codes[i % codes.length]);
        const others = SIGNS.filter((x) => x.g === s.g && x.c !== s.c).sort(() => Math.random() - 0.5).slice(0, 2);
        const opts = [s, ...others].sort(() => Math.random() - 0.5);
        box.innerHTML = `<div class="k-guess-q">${img(s, "k-img k-big")}<p>Какво означава този знак?</p></div><div class="k-guess-opts">${opts.map((o) => `<button type="button" class="k-opt" data-c="${o.c}">${o.n}</button>`).join("")}</div><div class="k-guess-out"></div>`;
        box.querySelectorAll(".k-opt").forEach((b) => (b.onclick = () => {
          const ok = b.dataset.c === s.c;
          box.querySelectorAll(".k-opt").forEach((x) => { x.disabled = true; if (x.dataset.c === s.c) x.classList.add("is-right"); });
          if (!ok) b.classList.add("is-wrong");
          const out = box.querySelector(".k-guess-out");
          out.innerHTML = `<p class="k-verdict ${ok ? "ok" : "no"}">${ok ? "Точно така!" : "Не е това."}</p>${info(s)}<button type="button" class="k-btn k-next">Следващ знак →</button>`;
          out.querySelector(".k-next").onclick = () => { i++; draw(); };
        }));
      };
      draw();
      root.appendChild(box);
    },
    // 5. filter by shape / colour
    shapes(root) {
      const filters = [
        ["А", "Триъгълник", "предупреждава"], ["Б", "Особени форми", "кой минава пръв"], ["В", "Червен кръг", "забранява"], ["Г", "Син кръг", "задължава"], ["Д", "Квадрат", "режим на зона"],
      ];
      let cur = "В";
      const box = h(`<div class="k-shapes"><div class="k-shape-tabs"></div><p class="k-shape-hook"></p><div class="k-shape-grid"></div><div class="k-shape-detail"></div></div>`);
      const tabs = box.querySelector(".k-shape-tabs"), grid = box.querySelector(".k-shape-grid"), det = box.querySelector(".k-shape-detail"), hook = box.querySelector(".k-shape-hook");
      const draw = () => {
        tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.g === cur)));
        hook.innerHTML = `<b>${G(cur).shape}.</b> ${G(cur).hook}`;
        grid.innerHTML = "";
        SIGNS.filter((s) => s.g === cur).slice(0, 12).forEach((s, i) => {
          const b = h(`<button type="button" class="k-tile" title="${s.n}">${img(s)}<span>${s.c}</span></button>`);
          b.onclick = () => { grid.querySelectorAll(".k-tile").forEach((x) => x.classList.remove("is-on")); b.classList.add("is-on"); det.innerHTML = info(s); };
          grid.appendChild(b);
          if (!i) b.click();
        });
      };
      filters.forEach(([g, t, sub]) => { const b = h(`<button type="button" data-g="${g}"><b>${g}</b><span>${t}</span><small>${sub}</small></button>`); b.onclick = () => { cur = g; draw(); }; tabs.appendChild(b); });
      draw();
      root.appendChild(box);
    },
    // 6. carousel
    carousel(root, codes = SAMPLE) {
      let i = 0;
      const box = h(`<div class="k-car"><button type="button" class="k-car-nav prev" aria-label="Предишен">‹</button><div class="k-car-stage"></div><button type="button" class="k-car-nav next" aria-label="Следващ">›</button><div class="k-car-dots"></div></div>`);
      const stage = box.querySelector(".k-car-stage"), dots = box.querySelector(".k-car-dots");
      const draw = () => {
        const s = S(codes[i]);
        stage.innerHTML = `<div class="k-car-slide">${img(s, "k-img k-big")}${info(s)}</div>`;
        dots.innerHTML = codes.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
      };
      box.querySelector(".prev").onclick = () => { i = (i - 1 + codes.length) % codes.length; draw(); };
      box.querySelector(".next").onclick = () => { i = (i + 1) % codes.length; draw(); };
      draw();
      root.appendChild(box);
    },
    // 7. signs along a road: you "drive" past them
    roadside(root, codes = ["Д11", "А19", "А18", "Д17", "В26", "Б1", "Г12"]) {
      let i = 0;
      const box = h(`<div class="k-road"><div class="k-road-strip"><div class="k-road-lane"></div><div class="k-road-signs"></div><div class="k-road-car"></div></div><div class="k-road-controls"><button type="button" class="k-btn k-back">← Назад</button><button type="button" class="k-btn k-fwd">Карай напред →</button></div><div class="k-road-detail"></div></div>`);
      const signs = box.querySelector(".k-road-signs"), car = box.querySelector(".k-road-car"), det = box.querySelector(".k-road-detail");
      codes.map(S).forEach((s, k) => signs.appendChild(h(`<button type="button" class="k-post" style="left:${8 + k * (84 / (codes.length - 1))}%">${img(s, "k-post-img")}<span></span></button>`)));
      const draw = () => {
        const s = S(codes[i]);
        car.style.left = `calc(${8 + i * (84 / (codes.length - 1))}% - 22px)`;
        signs.querySelectorAll(".k-post").forEach((b, k) => b.classList.toggle("is-on", k === i));
        det.innerHTML = info(s);
      };
      signs.querySelectorAll(".k-post").forEach((b, k) => (b.onclick = () => { i = k; draw(); }));
      box.querySelector(".k-fwd").onclick = () => { i = Math.min(codes.length - 1, i + 1); draw(); };
      box.querySelector(".k-back").onclick = () => { i = Math.max(0, i - 1); draw(); };
      draw();
      root.appendChild(box);
    },
    // 8. match pairs: sign ↔ meaning
    match(root, codes = ["Б1", "Б2", "В27", "В28", "Г12", "Б6"]) {
      const box = h(`<div class="k-match"><div class="k-match-col k-match-signs"></div><div class="k-match-col k-match-names"></div><p class="k-match-out" aria-live="polite">Избери знак, после значението му.</p></div>`);
      const left = box.querySelector(".k-match-signs"), right = box.querySelector(".k-match-names"), out = box.querySelector(".k-match-out");
      let pick = null, done = 0;
      const items = codes.map(S);
      items.forEach((s) => left.appendChild(h(`<button type="button" class="k-m-sign" data-c="${s.c}">${img(s)}</button>`)));
      items.slice().sort(() => Math.random() - 0.5).forEach((s) => right.appendChild(h(`<button type="button" class="k-m-name" data-c="${s.c}">${s.n}</button>`)));
      left.querySelectorAll("button").forEach((b) => (b.onclick = () => { left.querySelectorAll("button").forEach((x) => x.classList.remove("is-pick")); b.classList.add("is-pick"); pick = b.dataset.c; }));
      right.querySelectorAll("button").forEach((b) => (b.onclick = () => {
        if (!pick) { out.textContent = "Първо избери знак отляво."; return; }
        const s = S(pick);
        if (b.dataset.c === pick) {
          b.classList.add("is-done"); b.disabled = true;
          const lb = left.querySelector(`[data-c="${pick}"]`); lb.classList.remove("is-pick"); lb.classList.add("is-done"); lb.disabled = true;
          done++; out.innerHTML = `<b>Вярно.</b> ${s.m}`; pick = null;
          if (done === items.length) out.innerHTML = "<b>Всички двойки са намерени.</b>";
        } else {
          b.classList.add("is-wrong"); setTimeout(() => b.classList.remove("is-wrong"), 600);
          out.innerHTML = `Не съвпада. Подсказка: ${s.m}`;
        }
      }));
      root.appendChild(box);
    },
    // 9. accordion by group
    accordion(root) {
      const box = h(`<div class="k-acc"></div>`);
      GROUPS.slice(0, 5).forEach((g, gi) => {
        const sec = h(`<details class="k-acc-sec" ${gi === 1 ? "open" : ""}><summary>${img(SIGNS.find((s) => s.g === g.g), "k-thumb")}<span><b>Група ${g.g} – ${g.title}</b><small>${g.shape}</small></span></summary><p class="k-acc-hook">${g.hook}</p><div class="k-acc-list"></div></details>`);
        const list = sec.querySelector(".k-acc-list");
        SIGNS.filter((s) => s.g === g.g).slice(0, 6).forEach((s) => {
          const it = h(`<details class="k-acc-item"><summary>${img(s, "k-thumb")}<span><b>${s.c}</b> ${s.n}</span></summary>${info(s)}</details>`);
          list.appendChild(it);
        });
        box.appendChild(sec);
      });
      root.appendChild(box);
    },
    // 10. grid with expanding tile
    expand(root, codes = SAMPLE) {
      const grid = h(`<div class="k-exp"></div>`);
      codes.map(S).forEach((s, i) => {
        const b = h(`<button type="button" class="k-exp-tile" aria-expanded="${i === 0}">${img(s)}<span class="k-exp-body">${info(s)}</span><span class="k-exp-code">${s.c}</span></button>`);
        b.onclick = () => { grid.querySelectorAll(".k-exp-tile").forEach((x) => x.setAttribute("aria-expanded", "false")); b.setAttribute("aria-expanded", "true"); };
        grid.appendChild(b);
      });
      root.appendChild(grid);
    },
  };

  function quiz(root) {
    const q = { q: "Знак В28 е поставен пред магазин. Можеш ли да спреш за минута, за да слезе пътник?", o: ["Не, забранено е всяко спиране", "Да – забранено е само паркирането", "Само с аварийни светлини"], a: 1, e: "В28 забранява само паркирането. Кратък престой, докато водачът е при колата, е позволен. Забраната за всяко спиране е В27.", ref: "ППЗДвП чл. 47" };
    const box = h(`<div class="k-quiz"><p class="k-quiz-q">${q.q}</p><div class="k-quiz-o">${q.o.map((o, i) => `<button type="button" class="k-opt" data-i="${i}"><span>${String.fromCharCode(1040 + i)}</span>${o}</button>`).join("")}</div><div class="k-quiz-out"></div></div>`);
    box.querySelectorAll(".k-opt").forEach((b) => (b.onclick = () => {
      box.querySelectorAll(".k-opt").forEach((x) => { x.disabled = true; if (+x.dataset.i === q.a) x.classList.add("is-right"); });
      const ok = +b.dataset.i === q.a;
      if (!ok) b.classList.add("is-wrong");
      box.querySelector(".k-quiz-out").innerHTML = `<p class="k-verdict ${ok ? "ok" : "no"}">${ok ? "Вярно." : "Грешно."}</p><p>${q.e}</p><span class="k-ref">${q.ref}</span>`;
    }));
    root.appendChild(box);
  }

  const CHAPTERS = [
    ["Основни правила", "Скорости, алкохол, колан", "В26"],
    ["Пътни знаци", "Как да ги запомниш", "Б2"],
    ["Маркировка", "Линии, стрелки, зебра", "Д1а"],
    ["Светофар", "Всеки сигнал", "А24"],
    ["Регулировчик", "Гърди, гръб, рамо", "А39"],
    ["Предимство", "Кой минава пръв", "Б3"],
    ["Кръгово", "Влизане, ленти, мигачи", "Г12"],
    ["Паркиране", "Къде може и къде не", "Д19"],
    ["Огледала", "Мъртва зона", "Д17"],
    ["Табло", "Червено, жълто, зелено", "А40"],
    ["Времето", "Дъжд, мъгла, лед", "А15"],
  ];

  window.Kit = {
    S, G, img, info, P, quiz, CHAPTERS, SIGNS, GROUPS,
    // mount everything that a mockup declares with data-k attributes
    auto() {
      document.querySelectorAll("[data-k-pattern]").forEach((el) => P[el.dataset.kPattern](el));
      document.querySelectorAll("[data-k-anim]").forEach((el) => window.BGAnim.mount(el, el.dataset.kAnim, { base: BASE }));
      document.querySelectorAll("[data-k-quiz]").forEach((el) => quiz(el));
      document.querySelectorAll("[data-k-chapters]").forEach((el) => {
        const tpl = el.dataset.kChapters;
        el.innerHTML = CHAPTERS.map(([t, sub, code], i) =>
          tpl === "plain" ? `<a href="#" class="k-ch"><span class="k-ch-n">${String(i + 1).padStart(2, "0")}</span><span class="k-ch-t">${t}</span><small>${sub}</small></a>`
            : `<a href="#" class="k-ch">${img(S(code), "k-ch-img")}<span class="k-ch-t">${t}</span><small>${sub}</small><i class="k-ch-bar" style="--p:${[80, 45, 30, 100, 10, 60, 0, 25, 0, 0, 0][i]}%"></i></a>`
        ).join("");
      });
    },
  };
})();
