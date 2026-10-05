/* App shell: hash routing, chapter pages, quizzes and per-viewer progress. */
(function () {
  const { CATS, RULES, Q } = window.BGData;
  const { signSVG } = window.BGSigns;
  const W = window.BGWidgets;

  const STORE_KEY = "bg-driving-refresher.v1";
  let progress = { q: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) progress = JSON.parse(raw) || progress;
    if (!progress.q) progress.q = {};
  } catch (e) { /* storage unavailable: progress lives only in memory */ }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ }
  };

  const h = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const chapters = CATS.filter((c) => c.id !== "izpit");
  const qsFor = (id) => Q.filter((q) => q.c === id);
  const stats = (id) => {
    const list = id ? qsFor(id) : Q;
    let right = 0, wrong = 0;
    list.forEach((q) => {
      if (progress.q[q.id] === 1) right++;
      else if (progress.q[q.id] === 0) wrong++;
    });
    return { total: list.length, right, wrong };
  };
  const meter = (id) => {
    const list = qsFor(id);
    return `<div class="meter" aria-hidden="true">${list.map((q) => `<i class="${progress.q[q.id] === 1 ? "on" : progress.q[q.id] === 0 ? "miss" : ""}"></i>`).join("")}</div>`;
  };

  // ---------- nav ----------
  const nav = document.getElementById("nav");
  function renderNav(active) {
    nav.innerHTML = `<div class="nav-label">Глави</div>`;
    nav.appendChild(h(`<a href="#nachalo" ${active === "nachalo" ? 'aria-current="page"' : ""}>${signSVG("B3")}<span>Начало</span><span></span></a>`));
    CATS.forEach((c) => {
      const st = stats(c.id === "izpit" ? null : c.id);
      const done = c.id !== "izpit" && st.right === st.total;
      const label = c.id === "izpit" ? "" : `${st.right}/${st.total}`;
      nav.appendChild(h(`<a href="#${c.id}" ${active === c.id ? 'aria-current="page"' : ""}>${signSVG(c.sign)}<span>${c.title}</span><span class="nav-meter ${done ? "done" : ""}">${label}</span></a>`));
    });
    const cur = nav.querySelector('[aria-current="page"]');
    if (cur && window.matchMedia("(max-width: 900px)").matches) cur.scrollIntoView({ block: "nearest", inline: "center" });
  }

  // ---------- quiz ----------
  let activeQuiz = null;
  function quiz(root, list, opts = {}) {
    let i = 0;
    let answered = false;
    let score = 0;
    const wrongs = [];
    const box = h(`<div class="quiz"></div>`);
    root.appendChild(box);

    function show() {
      answered = false;
      const q = list[i];
      box.innerHTML = `
        <div class="quiz-top"><span class="quiz-count">Въпрос ${i + 1} / ${list.length}</span>${opts.exam ? `<span class="quiz-count">Верни: ${score}</span>` : ""}</div>
        <div class="quiz-q ${q.img ? "" : "noimg"}">${q.img ? signSVG(q.img) : ""}<h3>${q.q}</h3></div>
        <div class="opts">${q.o.map((o, k) => `<button type="button" class="opt" data-k="${k}"><span class="k">${k + 1}</span><span>${o}</span></button>`).join("")}</div>
        <div class="slot"></div>`;
      box.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => pick(parseInt(b.dataset.k, 10))));
      activeQuiz = { pick, next, isAnswered: () => answered, el: box };
    }
    function pick(k) {
      if (answered) return;
      const q = list[i];
      if (k < 0 || k >= q.o.length) return;
      answered = true;
      const ok = k === q.a;
      if (ok) score++;
      else wrongs.push({ q, k });
      progress.q[q.id] = ok ? 1 : 0;
      save();
      renderNav(current);
      if (opts.onProgress) opts.onProgress();
      box.querySelectorAll(".opt").forEach((b) => {
        const kk = parseInt(b.dataset.k, 10);
        b.disabled = true;
        if (kk === q.a) b.classList.add("right");
        if (kk === k && !ok) b.classList.add("wrong");
      });
      const slot = box.querySelector(".slot");
      slot.innerHTML = `<div class="explain" aria-live="polite"><span class="verdict ${ok ? "ok" : "no"}">${ok ? "Вярно." : `Грешно. Верният отговор е: ${q.o[q.a]}`}</span><span>${q.e}</span><span class="lawref" style="justify-self:start">${q.ref}</span></div>
        <div class="quiz-foot"><button type="button" class="btn primary small next">${i + 1 < list.length ? "Следващ въпрос →" : "Виж резултата"}</button></div>`;
      const nb = slot.querySelector(".next");
      nb.addEventListener("click", next);
      nb.focus({ preventScroll: true });
    }
    function next() {
      if (!answered) return;
      i++;
      if (i < list.length) show();
      else finish();
    }
    function finish() {
      activeQuiz = null;
      const pct = Math.round((score / list.length) * 100);
      const msg = pct === 100 ? "Чисто. Всичко е вярно." : pct >= 85 ? "Много добре – прегледай грешките." : pct >= 60 ? "Добра основа. Върни се към правилата за грешните въпроси." : "Има какво да се опресни. Прочети правилата и опитай пак.";
      box.innerHTML = `<div class="result">
        <span class="eyebrow">Резултат</span>
        <span class="big">${score} / ${list.length}</span>
        <p>${msg}</p>
        ${wrongs.length ? `<div class="review">${wrongs.map((w) => `<div><b>${w.q.q}</b>Твоят отговор: ${w.q.o[w.k]}<br>Верен: ${w.q.o[w.q.a]} <span class="lawref">${w.q.ref}</span></div>`).join("")}</div>` : ""}
        <div class="controls"><button type="button" class="btn primary small again">${opts.exam ? "Нов тест" : "Опитай пак"}</button></div>
      </div>`;
      box.querySelector(".again").addEventListener("click", () => {
        root.innerHTML = "";
        quiz(root, opts.exam ? pickExam() : list, opts);
      });
    }
    show();
  }
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pickExam = () => shuffle(Q).slice(0, 20);

  document.addEventListener("keydown", (e) => {
    if (!activeQuiz || !document.body.contains(activeQuiz.el)) return;
    if (e.target.closest("input, textarea, select")) return;
    if (/^[1-4]$/.test(e.key) && !activeQuiz.isAnswered()) {
      activeQuiz.pick(parseInt(e.key, 10) - 1);
      e.preventDefault();
    }
  });

  // ---------- pages ----------
  const main = document.getElementById("main");
  let current = "nachalo";

  function overview() {
    const all = stats(null);
    const doneCh = chapters.filter((c) => { const s = stats(c.id); return s.right === s.total; }).length;
    const page = h(`<div>
      <section class="hero">
        <span class="eyebrow">Категория B · автоматична скоростна кутия · ЗДвП 2025</span>
        <h1>Шофьорски опреснителен курс</h1>
        <p class="lede">Правилата, които се забравят най-лесно – знаци, маркировка, светофар, регулировчик, предимство, кръгово, паркиране, огледала, табло и каране при лошо време. Всяка глава има интерактивен модел и въпроси с обяснение и член от закона.</p>
        <div class="hero-row">
          <a class="btn primary" href="#osnovni">Започни от основните правила</a>
          <a class="btn" href="#izpit">Пробен тест · 20 въпроса</a>
        </div>
        <div class="stats">
          <span><b>${Q.length}</b> въпроса</span>
          <span><b>${all.right}</b> верни</span>
          <span><b>${all.wrong}</b> за преговор</span>
          <span><b>${doneCh}/${chapters.length}</b> завършени глави</span>
        </div>
      </section>
      <div class="laneline"></div>
      <div class="cat-grid"></div>
      <div class="laneline"></div>
      <div class="note"><b>Източници.</b> Закон за движението по пътищата с измененията от 7.09.2025 г. (ДВ бр. 64/2025) и Правилник за прилагане на ЗДвП. Номерацията на знаците следва Правилника; проектът на новата наредба за сигнализацията (2026 г.) я запазва. Съветите, отбелязани „Добра практика“, не са законови изисквания. Курсът е за опресняване и не замества официалните изпитни материали на ИААА.</div>
    </div>`);
    const grid = page.querySelector(".cat-grid");
    CATS.forEach((c, n) => {
      grid.appendChild(h(`<a class="cat-card" href="#${c.id}">${signSVG(c.sign)}<div><h3>${c.title}</h3><p>${c.short}</p>${c.id === "izpit" ? "" : meter(c.id)}</div></a>`));
    });
    return page;
  }

  function chapter(c) {
    const n = CATS.indexOf(c);
    const page = h(`<div>
      <header class="chapter-head">
        <div class="row">${signSVG(c.sign)}<div style="display:grid;gap:4px;min-width:0"><span class="eyebrow">Глава ${n + 1} от ${CATS.length}${c.law ? ` · ${c.law}` : ""}</span><h1>${c.title}</h1></div></div>
        <p class="lede">${c.lede}</p>
      </header>
      <div class="w-slot"></div>
      <div class="r-slot"></div>
      <h2 class="section-title">Провери се <small>${qsFor(c.id).length} въпроса · клавиши 1–4 за отговор</small></h2>
      <div class="q-slot"></div>
      <nav class="pager"></nav>
    </div>`);
    if (W[c.id]) W[c.id](page.querySelector(".w-slot"));
    const rules = RULES[c.id] || [];
    if (rules.length) {
      const r = page.querySelector(".r-slot");
      r.appendChild(h(`<h2 class="section-title">Правилата</h2>`));
      const grid = h(`<div class="rules"></div>`);
      rules.forEach((x) => grid.appendChild(h(`<article class="rule ${x.k || ""}"><h4>${x.t}</h4><div class="body">${x.b}</div><span class="lawref">${x.ref}</span></article>`)));
      r.appendChild(grid);
    }
    quiz(page.querySelector(".q-slot"), qsFor(c.id));
    const pager = page.querySelector(".pager");
    const prev = CATS[n - 1];
    const next = CATS[n + 1];
    pager.appendChild(prev ? h(`<a class="btn" href="#${prev.id}">← ${prev.title}</a>`) : h(`<a class="btn" href="#nachalo">← Начало</a>`));
    if (next) pager.appendChild(h(`<a class="btn primary" href="#${next.id}">${next.title} →</a>`));
    return page;
  }

  function exam(c) {
    const page = h(`<div>
      <header class="chapter-head">
        <div class="row">${signSVG(c.sign)}<div style="display:grid;gap:4px"><span class="eyebrow">Всички глави</span><h1>${c.title}</h1></div></div>
        <p class="lede">${c.lede}</p>
      </header>
      <div class="q-slot"></div>
      <nav class="pager"><a class="btn" href="#nachalo">← Начало</a></nav>
    </div>`);
    quiz(page.querySelector(".q-slot"), pickExam(), { exam: true });
    return page;
  }

  function route() {
    const id = (location.hash || "#nachalo").slice(1);
    const c = CATS.find((x) => x.id === id);
    current = c ? c.id : "nachalo";
    activeQuiz = null;
    main.innerHTML = "";
    main.appendChild(!c ? overview() : c.id === "izpit" ? exam(c) : chapter(c));
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
