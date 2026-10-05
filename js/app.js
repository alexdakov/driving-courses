/* App shell for design 10: Today, Chapters, chapter pages, test. Hash routing, quizzes, per-viewer progress. */
(function () {
  const { CATS, RULES, Q } = window.BGData;
  const { signSVG, DATA: SIGNDATA } = window.BGSigns;
  const W = window.BGWidgets;

  // ---------- progress ----------
  const STORE_KEY = "bg-driving-refresher.v1";
  let progress = { q: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) progress = JSON.parse(raw) || progress;
    if (!progress.q) progress.q = {};
  } catch (e) { /* storage unavailable: progress lives only in memory */ }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ } };

  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const chapters = CATS.filter((c) => c.id !== "izpit");
  const qsFor = (id) => Q.filter((q) => q.c === id);
  const stats = (id) => {
    const list = id ? qsFor(id) : Q;
    let right = 0, wrong = 0;
    list.forEach((q) => { if (progress.q[q.id] === 1) right++; else if (progress.q[q.id] === 0) wrong++; });
    return { total: list.length, right, wrong };
  };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickExam = () => shuffle(Q).slice(0, 20);

  // ---------- chrome: sidebar, navbar, tab bar ----------
  const nav = document.getElementById("nav");
  const navbar = document.getElementById("navbar");
  const tabbar = document.getElementById("tabbar");
  const ICON = {
    nachalo: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 2.5 11h2.7v9h5.3v-6h3v6h5.3v-9h2.7z"/></svg>`,
    glavi: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5h3v3H4zm5 0h11v3H9zM4 10.5h3v3H4zm5 0h11v3H9zM4 16h3v3H4zm5 0h11v3H9z"/></svg>`,
    znaci: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 22 20.5H2zm0 4.6L5.7 18.5h12.6z"/><rect x="11" y="10" width="2" height="5" rx="1"/><circle cx="12" cy="16.6" r="1.1"/></svg>`,
    izpit: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 1.5V8h3.5zM8.5 12.2l1.1-1.1 1.9 1.9 3.9-3.9 1.1 1.1-5 5z"/></svg>`,
  };
  const TABS = [["nachalo", "Днес"], ["glavi", "Глави"], ["znaci", "Знаци"], ["izpit", "Тест"]];

  function chapterRow(c, active) {
    const st = c.id === "izpit" ? null : stats(c.id);
    const done = st && st.right === st.total;
    return `<a class="row" href="#${c.id}" ${active === c.id ? 'aria-current="page"' : ""}>${signSVG(c.sign, "")}<span class="t">${c.title}</span><small>${c.short}</small><span class="count ${done ? "done" : ""}">${st ? (done ? "✓" : `${st.right}/${st.total}`) : ""}</span></a>`;
  }
  function renderNav(active) {
    nav.innerHTML = `
      <div class="list"><a class="row" href="#nachalo" ${active === "nachalo" ? 'aria-current="page"' : ""}><img src="assets/signs/B3.svg" alt=""><span class="t">Днес</span><small>Какво да учиш сега</small><span class="count"></span></a></div>
      <p class="list-label">Глави</p>
      <div class="list">${chapters.map((c) => chapterRow(c, active)).join("")}</div>
      <p class="list-label">Проверка</p>
      <div class="list">${chapterRow(CATS.find((c) => c.id === "izpit"), active)}</div>`;
    const tabOf = active === "nachalo" ? "nachalo" : active === "znaci" ? "znaci" : active === "izpit" ? "izpit" : "glavi";
    tabbar.innerHTML = TABS.map(([id, label]) => `<a href="#${id}" ${tabOf === id ? 'aria-current="page"' : ""}>${ICON[id]}<span>${label}</span></a>`).join("");
    const isRoot = ["nachalo", "glavi", "znaci", "izpit"].includes(active);
    navbar.hidden = isRoot;
    if (!isRoot) {
      const c = CATS.find((x) => x.id === active);
      navbar.innerHTML = `<a href="#glavi">Глави</a><span class="nt">${c ? c.title : ""}</span><span></span>`;
    }
  }

  // ---------- quiz ----------
  let activeQuiz = null;
  function quiz(root, list, opts = {}) {
    let i = 0, answered = false, score = 0;
    const wrongs = [];
    const box = h(`<div class="quiz"></div>`);
    root.appendChild(box);
    function show() {
      answered = false;
      const q = list[i];
      box.innerHTML = `
        ${list.length > 1 ? `<div class="quiz-top"><span class="quiz-count">Въпрос ${i + 1} от ${list.length}</span>${opts.exam ? `<span class="quiz-count">Верни: ${score}</span>` : ""}</div>` : ""}
        <div class="quiz-q ${q.img ? "" : "noimg"}">${q.img ? signSVG(q.img) : ""}<h3>${q.q}</h3></div>
        <div class="opts">${q.o.map((o, k) => `<button type="button" class="opt" data-k="${k}"><span class="k">${k + 1}</span><span>${o}</span></button>`).join("")}</div>
        <div class="slot"></div>`;
      box.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => pick(parseInt(b.dataset.k, 10))));
      activeQuiz = { pick, isAnswered: () => answered, el: box };
    }
    function pick(k) {
      if (answered) return;
      const q = list[i];
      if (k < 0 || k >= q.o.length) return;
      answered = true;
      const ok = k === q.a;
      if (ok) score++; else wrongs.push({ q, k });
      progress.q[q.id] = ok ? 1 : 0;
      save();
      renderNav(current);
      box.querySelectorAll(".opt").forEach((b) => {
        const kk = parseInt(b.dataset.k, 10);
        b.disabled = true;
        if (kk === q.a) b.classList.add("right");
        if (kk === k && !ok) b.classList.add("wrong");
      });
      const slot = box.querySelector(".slot");
      const last = i + 1 >= list.length;
      slot.innerHTML = `<div class="explain" aria-live="polite"><span class="verdict ${ok ? "ok" : "no"}">${ok ? "Вярно." : `Грешно. Верният отговор е: ${q.o[q.a]}`}</span><span>${q.e}</span><span class="lawref" style="justify-self:start">${q.ref}</span></div>
        ${opts.single ? "" : `<div class="quiz-foot"><button type="button" class="btn primary small next">${last ? "Виж резултата" : "Следващ въпрос"}</button></div>`}`;
      const nb = slot.querySelector(".next");
      if (nb) { nb.addEventListener("click", next); nb.focus({ preventScroll: true }); }
      if (opts.single && opts.onDone) opts.onDone(slot);
    }
    function next() {
      if (!answered) return;
      i++;
      if (i < list.length) show(); else finish();
    }
    function finish() {
      activeQuiz = null;
      const pct = Math.round((score / list.length) * 100);
      const msg = pct === 100 ? "Чисто. Всичко е вярно." : pct >= 85 ? "Много добре – прегледай грешките." : pct >= 60 ? "Добра основа. Върни се към правилата за грешните въпроси." : "Има какво да се опресни. Прочети правилата и опитай пак.";
      box.innerHTML = `<div class="result"><span class="eyebrow">Резултат</span><span class="big">${score} / ${list.length}</span><p>${msg}</p>
        ${wrongs.length ? `<div class="review">${wrongs.map((w) => `<div><b>${w.q.q}</b>Твоят отговор: ${w.q.o[w.k]}<br>Верен: ${w.q.o[w.q.a]} <span class="lawref">${w.q.ref}</span></div>`).join("")}</div>` : ""}
        <div class="controls"><button type="button" class="btn primary small again">${opts.exam ? "Нов тест" : "Опитай пак"}</button></div></div>`;
      box.querySelector(".again").addEventListener("click", () => { root.innerHTML = ""; quiz(root, opts.exam ? pickExam() : list, opts); });
    }
    show();
  }
  document.addEventListener("keydown", (e) => {
    if (!activeQuiz || !document.body.contains(activeQuiz.el)) return;
    if (e.target.closest("input, textarea, select")) return;
    if (/^[1-4]$/.test(e.key) && !activeQuiz.isAnswered()) { activeQuiz.pick(parseInt(e.key, 10) - 1); e.preventDefault(); }
  });

  // ---------- Today ----------
  const ring = (pct) => `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-3)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="var(--green)" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.max(pct, 0.01)} 100" transform="rotate(-90 18 18)"/><text x="18" y="18.6" text-anchor="middle" dominant-baseline="central" font-size="8.5" font-weight="700" fill="var(--ink)">${pct}%</text></svg>`;
  const dayIndex = () => Math.floor(Date.now() / 86400000);

  function matchGame(root) {
    const pool = SIGNDATA.SIGNS.filter((s) => "АБВГД".includes(s.g) && s.k !== "end");
    const items = shuffle(pool).slice(0, 3);
    const box = h(`<div class="match"><div class="match-signs"></div><div class="match-names"></div><p class="match-out" aria-live="polite">Избери знак, после значението му.</p><button type="button" class="btn small" style="justify-self:start">Нови знаци</button></div>`);
    const left = box.querySelector(".match-signs"), right = box.querySelector(".match-names"), out = box.querySelector(".match-out");
    let pick = null, done = 0;
    items.forEach((s) => left.appendChild(h(`<button type="button" class="m-sign" data-c="${s.c}" aria-label="Знак ${s.c}"><img src="${s.f}" alt=""></button>`)));
    shuffle(items).forEach((s) => right.appendChild(h(`<button type="button" class="m-name" data-c="${s.c}">${s.n}</button>`)));
    left.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      if (b.classList.contains("done")) return;
      left.querySelectorAll("button").forEach((x) => x.classList.remove("pick"));
      b.classList.add("pick"); pick = b.dataset.c;
    }));
    right.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      if (b.classList.contains("done")) return;
      if (!pick) { out.textContent = "Първо избери знак отгоре."; return; }
      const s = items.find((x) => x.c === pick);
      if (b.dataset.c === pick) {
        b.classList.add("done");
        const lb = left.querySelector(`[data-c="${pick}"]`); lb.classList.remove("pick"); lb.classList.add("done");
        done++; pick = null;
        out.innerHTML = done === items.length ? "<b>Всички двойки са намерени.</b>" : `<b>Вярно.</b> ${s.m}`;
      } else {
        b.classList.add("bad"); setTimeout(() => b.classList.remove("bad"), 600);
        out.innerHTML = `Не съвпада. Подсказка: ${s.m}`;
      }
    }));
    box.querySelector(".btn").addEventListener("click", () => { root.innerHTML = ""; matchGame(root); });
    root.appendChild(box);
  }

  function miniIntersection(root) {
    const keys = Object.keys(window.BGAnim.SCENARIOS);
    const key = keys[dayIndex() % keys.length];
    const wrap = h(`<div style="display:grid;gap:12px"><div class="mi-anim"></div><div class="opts"></div><div class="mi-out"></div></div>`);
    root.appendChild(wrap);
    const api = window.BGAnim.mount(wrap.querySelector(".mi-anim"), key, { base: "", playLabel: "▶ Покажи реда" });
    const sc = api.scenario;
    const opts = wrap.querySelector(".opts");
    sc.cars.forEach((c, i) => {
      const b = h(`<button type="button" class="opt"><span class="k">${i + 1}</span><span>${c.tram ? "Трамваят" : "Колата"} <b>${c.id}</b> минава първа</span></button>`);
      b.addEventListener("click", () => {
        const ok = c.id === sc.order[0];
        opts.querySelectorAll(".opt").forEach((x, k) => { x.disabled = true; if (sc.cars[k].id === sc.order[0]) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        wrap.querySelector(".mi-out").innerHTML = `<div class="explain"><span class="verdict ${ok ? "ok" : "no"}">${ok ? "Вярно." : "Не съвсем."}</span><span>Редът е <b>${sc.order.join(" → ")}</b>. Гледай анимацията. Още ситуации има в <a href="#predimstvo">„Предимство“</a>.</span></div>`;
        api.play();
      });
      opts.appendChild(b);
    });
  }

  function today() {
    const all = stats(null);
    const answered = all.right + all.wrong;
    const pct = Math.round((all.right / Q.length) * 100);
    const nextCh = chapters.find((c) => { const s = stats(c.id); return s.right < s.total; }) || chapters[0];
    const ns = stats(nextCh.id);
    const pool = SIGNDATA.SIGNS.filter((s) => "АБВГД".includes(s.g));
    const sotd = pool[dayIndex() % pool.length];
    const qPool = Q.filter((q) => progress.q[q.id] !== 1);
    const qOfDay = (qPool.length ? qPool : Q)[dayIndex() % (qPool.length || Q.length)];
    const dateStr = new Date().toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" });

    const page = h(`<div class="today">
      <header class="large"><span class="eyebrow">${dateStr}</span><h1>Днес</h1><p class="lede">Шофьорски опреснителен курс · категория B · по ЗДвП 2025</p></header>
      <div class="hero-card">${ring(pct)}<div><b>${answered ? `Продължи с „${nextCh.title}“` : "Започни с „Основни правила“"}</b><p>${answered ? `${ns.total - ns.right} въпроса до края на главата · общо верни ${all.right} от ${Q.length}` : "Скорости, алкохол, колан, оборудване – числата, които трябва да помниш."}</p><a class="btn primary small" href="#${answered ? nextCh.id : "osnovni"}">Продължи</a></div></div>
      <div class="tiles">
        <div><h2 class="section-title">Знак на деня</h2><div class="card"><div class="sotd"><img src="${sotd.f}" alt="${sotd.c}"><div style="display:grid;gap:6px"><h3>${sotd.c} · ${sotd.n}</h3><p>${sotd.d}</p></div></div><div class="sx-mnem"><span>Как да запомниш</span><p>${sotd.m}</p></div><a class="btn small" href="#znaci" style="justify-self:start">Всички знаци</a></div></div>
        <div><h2 class="section-title">Намери двойката</h2><div class="card t-match"></div></div>
      </div>
      <div class="tiles">
        <div><h2 class="section-title">Кой минава първи?</h2><div class="card t-inter"></div></div>
        <div><h2 class="section-title">Бърз въпрос</h2><div class="t-q"></div></div>
      </div>
      <h2 class="section-title">Глави</h2>
      <div class="list">${chapters.map((c) => chapterRow(c, "")).join("")}</div>
      <h2 class="section-title">За курса</h2>
      <p class="note"><b>Източници.</b> Закон за движението по пътищата с измененията от 7.09.2025 г. и Правилник за прилагане на ЗДвП. Знаците са официалните образци, сверени с Наредба № 18. Съветите, отбелязани „Добра практика“, не са законови изисквания. Курсът е за опресняване и не замества официалните изпитни материали на ИААА.</p>
    </div>`);
    matchGame(page.querySelector(".t-match"));
    miniIntersection(page.querySelector(".t-inter"));
    quiz(page.querySelector(".t-q"), [qOfDay], { single: true });
    return page;
  }

  // ---------- Chapters list ----------
  function chaptersPage() {
    const all = stats(null);
    return h(`<div>
      <header class="large"><span class="eyebrow">${all.right} от ${Q.length} верни отговора</span><h1>Глави</h1><p class="lede">Всяка глава има интерактивен модел, правилата с членовете от закона и въпроси с обяснение.</p></header>
      <div class="list">${chapters.map((c) => chapterRow(c, "")).join("")}</div>
      <h2 class="section-title">Проверка</h2>
      <div class="list">${chapterRow(CATS.find((c) => c.id === "izpit"), "")}</div>
    </div>`);
  }

  // ---------- Chapter ----------
  function chapter(c) {
    const n = CATS.indexOf(c);
    const page = h(`<div>
      <header class="large"><span class="eyebrow">Глава ${n + 1} от ${chapters.length}${c.law ? ` · ${c.law}` : ""}</span><div class="row-h">${signSVG(c.sign, "")}<h1>${c.title}</h1></div><p class="lede">${c.lede}</p></header>
      <div class="w-slot"></div>
      <div class="r-slot"></div>
      <h2 class="section-title">Провери се <small>${qsFor(c.id).length} въпроса · клавиши 1–4</small></h2>
      <div class="q-slot"></div>
      <nav class="pager" aria-label="Съседни глави"></nav>
    </div>`);
    if (W[c.id]) {
      page.querySelector(".w-slot").appendChild(h(`<h2 class="section-title">Опитай</h2>`));
      W[c.id](page.querySelector(".w-slot"));
    }
    const rules = RULES[c.id] || [];
    if (rules.length) {
      const r = page.querySelector(".r-slot");
      r.appendChild(h(`<h2 class="section-title">Правилата</h2>`));
      const grid = h(`<div class="rules"></div>`);
      rules.forEach((x) => grid.appendChild(h(`<article class="rule ${x.k || ""}">${x.il && window.BGIllustrations[x.il] ? `<figure class="rule-il">${window.BGIllustrations[x.il]()}</figure>` : ""}<h4>${x.t}</h4><div class="body">${x.b}</div><span class="lawref">${x.ref}</span></article>`)));
      r.appendChild(grid);
    }
    quiz(page.querySelector(".q-slot"), qsFor(c.id));
    const pager = page.querySelector(".pager");
    const prev = chapters[n - 1], next = chapters[n + 1] || CATS.find((x) => x.id === "izpit");
    if (next) pager.appendChild(h(`<a href="#${next.id}">Следваща: ${next.title}<span>›</span></a>`));
    if (prev) pager.appendChild(h(`<a href="#${prev.id}">Предишна: ${prev.title}<span>‹</span></a>`));
    return page;
  }

  function exam(c) {
    const page = h(`<div>
      <header class="large"><span class="eyebrow">Всички глави</span><h1>${c.title}</h1><p class="lede">${c.lede}</p></header>
      <div class="q-slot"></div>
    </div>`);
    quiz(page.querySelector(".q-slot"), pickExam(), { exam: true });
    return page;
  }

  // ---------- router ----------
  const main = document.getElementById("main");
  let current = "nachalo";
  function route() {
    const id = (location.hash || "#nachalo").slice(1);
    const c = CATS.find((x) => x.id === id);
    current = c ? c.id : id === "glavi" ? "glavi" : "nachalo";
    activeQuiz = null;
    main.innerHTML = "";
    main.appendChild(current === "glavi" ? chaptersPage() : !c ? today() : c.id === "izpit" ? exam(c) : chapter(c));
    renderNav(current);
    window.scrollTo({ top: 0 });
  }

  document.getElementById("reset").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    if (btn.dataset.armed !== "1") {
      btn.dataset.armed = "1";
      btn.textContent = "Сигурен ли си? Натисни пак";
      setTimeout(() => { btn.dataset.armed = ""; btn.textContent = "Изчисти напредъка"; }, 4000);
      return;
    }
    progress = { q: {} };
    save();
    btn.dataset.armed = "";
    btn.textContent = "Изчистено";
    route();
  });
  window.addEventListener("hashchange", route);
  route();
})();
