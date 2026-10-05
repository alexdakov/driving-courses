/* App shell for design 10: Today, Chapters, chapter pages, Cheat sheet. Hash routing, per-viewer progress (chapters reviewed). */
(function () {
  const { CATS, RULES } = window.BGData;
  const { signSVG, DATA: SIGNDATA } = window.BGSigns;
  const W = window.BGWidgets;

  // ---------- progress ----------
  const STORE_KEY = "bg-driving-refresher.v1";
  let progress = { read: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) progress = JSON.parse(raw) || progress;
    if (!progress.read) progress.read = {};
  } catch (e) { /* storage unavailable: progress lives only in memory */ }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) { /* ignore */ } };

  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const chapters = CATS.filter((c) => c.id !== "izpit");
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const isRead = (id) => !!progress.read[id];
  const readCount = () => chapters.filter((c) => isRead(c.id)).length;

  // ---------- theme: auto (follows the device), light or dark ----------
  const THEME_KEY = "bg-theme";
  const root = document.documentElement;
  const darkMQ = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  const themeMode = () => root.getAttribute("data-theme") || "auto";
  const effectiveTheme = () => (themeMode() === "auto" ? (darkMQ && darkMQ.matches ? "dark" : "light") : themeMode());
  const SUN = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>`;
  const MOON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z" fill="currentColor"/></svg>`;
  function setTheme(mode) {
    if (mode === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", mode);
    try { if (mode === "auto") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, mode); } catch (e) { /* ignore */ }
    syncTheme();
  }
  function syncTheme() {
    const eff = effectiveTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      b.innerHTML = eff === "dark" ? SUN : MOON;
      const label = eff === "dark" ? "Включи светлата тема" : "Включи тъмната тема";
      b.setAttribute("aria-label", label);
      b.title = label;
    });
    document.querySelectorAll("[data-theme-seg] button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === eff)));
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.setAttribute("content", eff === "dark" ? "#000000" : "#f2f2f7"); m.removeAttribute("media"); });
  }
  const themeToggle = () => `<button type="button" class="theme-btn" data-theme-toggle></button>`;
  // two icon buttons: light and dark (until one is picked, the theme follows the device)
  const themeSeg = () => `<div class="theme-icons" role="group" aria-label="Тема">${[["light", SUN, "Светла тема"], ["dark", MOON, "Тъмна тема"]].map(([m, ic, l]) => `<button type="button" data-mode="${m}" aria-pressed="false" aria-label="${l}" title="${l}">${ic}</button>`).join("")}</div>`;
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-theme-toggle]");
    if (t) { setTheme(effectiveTheme() === "dark" ? "light" : "dark"); return; }
    const m = e.target.closest("[data-theme-seg] button");
    if (m) setTheme(m.dataset.mode);
  });
  if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener("change", syncTheme);
  document.querySelectorAll(".side-theme").forEach((el) => (el.innerHTML = themeSeg()));

  // ---------- chrome: sidebar, navbar, tab bar ----------
  const nav = document.getElementById("nav");
  const navbar = document.getElementById("navbar");
  const tabbar = document.getElementById("tabbar");
  const ICON = {
    nachalo: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 2.5 11h2.7v9h5.3v-6h3v6h5.3v-9h2.7z"/></svg>`,
    glavi: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5h3v3H4zm5 0h11v3H9zM4 10.5h3v3H4zm5 0h11v3H9zM4 16h3v3H4zm5 0h11v3H9z"/></svg>`,
    znaci: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 22 20.5H2zm0 4.6L5.7 18.5h12.6z"/><rect x="11" y="10" width="2" height="5" rx="1"/><circle cx="12" cy="16.6" r="1.1"/></svg>`,
    skorosti: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="M12 14l4-5"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none"/></svg>`,
    nakratko: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 2 5 13.5h5.6L9.5 22 19 9.8h-5.7z"/></svg>`,
  };
  const TABS = [["nachalo", "Днес"], ["glavi", "Глави"], ["znaci", "Знаци"], ["skorosti", "Скорости"], ["nakratko", "Накратко"]];

  function chapterRow(c, active) {
    const done = isRead(c.id);
    return `<a class="row" href="#${c.id}" ${active === c.id ? 'aria-current="page"' : ""}>${signSVG(c.sign, "")}<span class="t">${c.title}</span><small>${c.short}</small><span class="count ${done ? "done" : ""}">${done ? "✓" : ""}</span></a>`;
  }
  function renderNav(active) {
    nav.innerHTML = `
      <div class="list"><a class="row" href="#nachalo" ${active === "nachalo" ? 'aria-current="page"' : ""}><img src="assets/signs/B3.svg" alt=""><span class="t">Днес</span><small>Какво да опресниш сега</small><span class="count"></span></a><a class="row" href="#skorosti" ${active === "skorosti" ? 'aria-current="page"' : ""}><img src="assets/signs/V26-50.svg" alt=""><span class="t">Скорости</span><small>Град, магистрала, дъжд, мъгла…</small><span class="count"></span></a><a class="row" href="#nakratko" ${active === "nakratko" ? 'aria-current="page"' : ""}><img src="assets/signs/D5.svg" alt=""><span class="t">Накратко</span><small>Всички числа на един екран</small><span class="count"></span></a></div>
      <p class="list-label">Глави</p>
      <div class="list">${chapters.map((c) => chapterRow(c, active)).join("")}</div>`;
    const tabOf = ["nachalo", "znaci", "nakratko", "skorosti"].includes(active) ? active : "glavi";
    tabbar.innerHTML = TABS.map(([id, label]) => `<a href="#${id}" ${tabOf === id ? 'aria-current="page"' : ""}>${ICON[id]}<span>${label}</span></a>`).join("");
    const isRoot = ["nachalo", "glavi", "znaci", "nakratko", "skorosti"].includes(active);
    navbar.hidden = isRoot;
    if (!isRoot) {
      const c = CATS.find((x) => x.id === active);
      navbar.innerHTML = `<a href="#glavi">Глави</a><span class="nt">${c ? c.title : ""}</span><span></span>`;
    }
  }

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

  // Key facts for the cheat sheet and Today. v = value, t = what it means, ref = law, sign = optional sign code.
  const FACTS = {
    speeds: [
      ["20", "Жилищна зона", "ЗДвП чл. 62", "Д15"],
      ["30", "„Зона 30“ в населено място", "ЗДвП чл. 62а", ""],
      ["50", "Населено място", "ЗДвП чл. 21", "Д11"],
      ["90", "Извън населено място", "ЗДвП чл. 21", ""],
      ["120", "Скоростен път", "ЗДвП чл. 21", "Д7а"],
      ["140", "Автомагистрала", "ЗДвП чл. 21", "Д5"],
    ],
    distances: [
      ["5 м", "Без спиране на и пред пешеходна пътека и от кръстовище", "ЗДвП чл. 98", "Д17"],
      ["3 м", "Минимум между спряната кола и непрекъсната линия", "ЗДвП чл. 98", ""],
      ["2 м", "Свободни за пешеходци, ако паркираш на тротоар", "ЗДвП чл. 94", ""],
      ["30 м", "Триъгълник при повреда; на магистрала – 100 м", "ЗДвП чл. 97", ""],
      ["150 м", "Най-късно тук сменяш дълги с къси при разминаване", "ЗДвП чл. 70", ""],
      ["50 м", "Без дълги зад кола; задна мъгла само при видимост под 50 м", "ЗДвП чл. 70, 74", ""],
      ["2 м", "Спираш пред първата релса на прелез без бариери (1 м пред бариера)", "ЗДвП чл. 51", "А33"],
      ["1 м", "Зад трамвай, спрял на спирка, ако го доближаваш отдясно", "ЗДвП чл. 66", ""],
    ],
    numbers: [
      ["0,5 ‰", "Над тази граница алкохолът е забранен (над 1,2 ‰ – престъпление)", "ЗДвП чл. 5", ""],
      ["150 см", "Под този ръст детето пътува в столче или седалка", "ЗДвП чл. 137в", ""],
      ["4 мм", "Протектор от 15 ноември до 1 март (или зимни гуми)", "ЗДвП чл. 139", ""],
      ["2,5 т", "Максимум за паркиране на тротоар (само на определени места)", "ЗДвП чл. 94", ""],
      ["12 г.", "Деца до тази възраст слизат откъм тротоара", "ЗДвП чл. 95", ""],
      ["112", "Спешен номер", "", ""],
    ],
    priority: [
      ["1", "Регулировчик → светофар → знаци → маркировка", "ЗДвП чл. 7", ""],
      ["2", "Без знаци – пропусни идващите отдясно. Трамваят минава пръв", "ЗДвП чл. 48", "А25"],
      ["3", "Завиваш наляво – пропусни насрещните", "ЗДвП чл. 37", ""],
      ["4", "Излизаш от имот, паркинг или черен път – пропусни всички", "ЗДвП чл. 37, 49", ""],
      ["5", "Пешеходци на пътеката и тези, които сигнализират с ръка – пропусни", "ЗДвП чл. 119", "Д17"],
      ["6", "Кръгово: решават знаците на входа – обикновено Б1, пропускаш колите в кръга", "ППЗДвП чл. 46, 52", "Г12"],
    ],
    gear: [
      ["✓", "Триъгълник, аптечка, светлоотразителна жилетка, пожарогасител", "ЗДвП чл. 139", ""],
      ["✓", "Денем – светлини за движение през деня или къси; в тунел – къси", "ЗДвП чл. 63, 70", ""],
      ["✓", "Телефон – само без ръце или през системата на колата", "ЗДвП чл. 104а", ""],
      ["✓", "Коланът е задължителен на всички седалки", "ЗДвП чл. 137а", ""],
    ],
  };
  const factList = (rows) => `<div class="list facts">${rows.map(([v, t, ref, sign]) => `<div class="fact">${sign ? signSVG(sign, "") : `<span class="fv">${v}</span>`}<div><span class="ft">${sign ? `<b>${v}</b> · ` : ""}${t}</span>${ref ? `<span class="fr">${ref}</span>` : ""}</div></div>`).join("")}</div>`;

  function today() {
    const done = readCount();
    const pct = Math.round((done / chapters.length) * 100);
    const nextCh = chapters.find((c) => !isRead(c.id));
    const pool = SIGNDATA.SIGNS.filter((s) => "АБВГД".includes(s.g));
    const sotd = pool[dayIndex() % pool.length];
    const allFacts = [...FACTS.distances, ...FACTS.numbers];
    const start = (dayIndex() * 3) % allFacts.length;
    const dayFacts = [0, 1, 2].map((k) => allFacts[(start + k) % allFacts.length]);
    const dateStr = new Date().toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" });

    const page = h(`<div class="today">
      <header class="large">${themeToggle()}<span class="eyebrow">${dateStr}</span><h1>Днес</h1><p class="lede">Шофьорски опреснителен курс · категория B · по ЗДвП 2025</p></header>
      <div class="hero-card">${ring(pct)}<div>${nextCh
        ? `<b>${done ? `Продължи с „${nextCh.title}“` : "Започни с „Основни правила“"}</b><p>${done ? `Прегледани ${done} от ${chapters.length} глави.` : nextCh.short}</p><a class="btn primary small" href="#${nextCh.id}">${done ? "Продължи" : "Започни"}</a>`
        : `<b>Прегледа всички глави</b><p>Освежи паметта с „Накратко“ – всичко важно на един екран.</p><a class="btn primary small" href="#nakratko">Накратко</a>`}</div></div>
      <div class="tiles">
        <div><h2 class="section-title">Знак на деня</h2><div class="card"><div class="sotd"><img src="${sotd.f}" alt="${sotd.c}"><div style="display:grid;gap:6px"><h3>${sotd.c} · ${sotd.n}</h3><p>${sotd.d}</p></div></div><div class="sx-mnem"><span>Как да запомниш</span><p>${sotd.m}</p></div><a class="btn small" href="#znaci" style="justify-self:start">Всички знаци</a></div></div>
        <div><h2 class="section-title">Числа за помнене</h2>${factList(dayFacts)}<a class="btn small" href="#nakratko" style="margin-top:10px">Всички на един екран</a></div>
      </div>
      <div class="tiles">
        <div><h2 class="section-title">Кой минава първи?</h2><div class="card t-inter"></div></div>
        <div><h2 class="section-title">Намери двойката</h2><div class="card t-match"></div></div>
      </div>
      <div class="t-sit"></div>
      <h2 class="section-title">Глави</h2>
      <div class="list">${chapters.map((c) => chapterRow(c, "")).join("")}</div>
    </div>`);
    matchGame(page.querySelector(".t-match"));
    const sits = window.BGScenarios || [];
    if (sits.length) {
      const x = sits[(dayIndex() * 7) % sits.length];
      let pic = "";
      try { pic = x.svg(); } catch (e) { pic = ""; }
      page.querySelector(".t-sit").appendChild(h(`<div><h2 class="section-title">Ситуация на деня</h2><article class="rule has-il sit-card"><figure class="rule-il">${pic}</figure><div class="rule-text"><h4>${x.title}</h4><p class="sit-q">${x.q}</p><ol class="sit-steps">${x.steps.map((t) => `<li>${t}</li>`).join("")}</ol><span class="lawref">${x.ref}</span><a class="btn small" href="#situacii" style="align-self:flex-start;margin-top:4px">Всички ситуации</a></div></article></div>`));
    }
    miniIntersection(page.querySelector(".t-inter"));
    return page;
  }

  // ---------- Cheat sheet ----------
  function nakratko() {
    return h(`<div>
      <header class="large">${themeToggle()}<span class="eyebrow">Всичко важно на един екран</span><h1>Накратко</h1><p class="lede">Числата и правилата, които най-лесно се забравят. Подробностите са в главите.</p></header>
      <h2 class="section-title">Скорости · категория B · km/h <a href="#skorosti" class="sec-link">Всички ситуации ›</a></h2>
      <div class="speed-strip">${FACTS.speeds.map(([v, t, , sign]) => `<div class="sp">${sign ? signSVG(sign, "") : `<span class="sp-road"></span>`}<b>${v}</b><span>${t}</span></div>`).join("")}</div>
      <h2 class="section-title">Разстояния</h2>${factList(FACTS.distances)}
      <h2 class="section-title">Числа</h2>${factList(FACTS.numbers)}
      <h2 class="section-title">Кой минава пръв</h2>${factList(FACTS.priority)}
      <h2 class="section-title">В колата</h2>${factList(FACTS.gear)}
      <nav class="pager"><a href="#glavi">Към главите<span>›</span></a></nav>
    </div>`);
  }

  // ---------- Chapters list ----------
  function chaptersPage() {
    return h(`<div>
      <header class="large">${themeToggle()}<span class="eyebrow">Прегледани ${readCount()} от ${chapters.length}</span><h1>Глави</h1><p class="lede">Всяка глава има интерактивен модел, илюстрации и правилата с членовете от закона.</p></header>
      <div class="list">${chapters.map((c) => chapterRow(c, "")).join("")}</div>
      <h2 class="section-title">Настройки</h2>
      <div class="card settings"><div class="set-row"><span>Тема</span><div data-theme-seg>${themeSeg()}</div></div></div>
    </div>`);
  }

  // ---------- Chapter ----------
  function chapter(c) {
    const n = CATS.indexOf(c);
    const page = h(`<div>
      <header class="large">${themeToggle()}<span class="eyebrow">Глава ${n + 1} от ${chapters.length}${c.law ? ` · ${c.law}` : ""}</span><div class="row-h">${signSVG(c.sign, "")}<h1>${c.title}</h1></div><p class="lede">${c.lede}</p></header>
      <div class="w-slot"></div>
      <div class="r-slot"></div>
      <div class="done-card"></div>
      <nav class="pager" aria-label="Съседни глави"></nav>
    </div>`);
    if (W[c.id]) {
      page.querySelector(".w-slot").appendChild(h(`<h2 class="section-title">${c.id === "situacii" ? "Пусни анимацията" : "Опитай"}</h2>`));
      W[c.id](page.querySelector(".w-slot"));
    }
    const rules = RULES[c.id] || [];
    if (rules.length) {
      const r = page.querySelector(".r-slot");
      r.appendChild(h(`<h2 class="section-title">Правилата</h2>`));
      const list = h(`<div class="rules"></div>`);
      rules.forEach((x) => {
        const il = x.il && window.BGIllustrations[x.il] ? `<figure class="rule-il">${window.BGIllustrations[x.il]()}</figure>` : "";
        list.appendChild(h(`<article class="rule ${x.k || ""} ${il ? "has-il" : ""}">${il}<div class="rule-text"><h4>${x.t}</h4><div class="body">${x.b}</div><span class="lawref">${x.ref}</span></div></article>`));
      });
      r.appendChild(list);
    }
    const doneCard = page.querySelector(".done-card");
    const drawDone = () => {
      const read = isRead(c.id);
      doneCard.innerHTML = `<div class="card done ${read ? "is-read" : ""}"><div><b>${read ? "Главата е прегледана" : "Прегледа ли главата?"}</b><p>${read ? "Ще я отбележим с ✓ в списъка. Можеш да се върнеш по всяко време." : "Отбележи я, за да знаеш докъде си стигнал."}</p></div><button type="button" class="btn ${read ? "" : "primary"} small">${read ? "Отмени" : "Прегледах я"}</button></div>`;
      doneCard.querySelector("button").addEventListener("click", () => {
        if (isRead(c.id)) delete progress.read[c.id]; else progress.read[c.id] = true;
        save(); renderNav(current); drawDone();
      });
    };
    drawDone();
    const pager = page.querySelector(".pager");
    const prev = chapters[n - 1], next = chapters[n + 1];
    if (next) pager.appendChild(h(`<a href="#${next.id}">Следваща: ${next.title}<span>›</span></a>`));
    else pager.appendChild(h(`<a href="#nakratko">Накратко – всичко на един екран<span>›</span></a>`));
    if (prev) pager.appendChild(h(`<a href="#${prev.id}">Предишна: ${prev.title}<span>‹</span></a>`));
    return page;
  }

  // ---------- router ----------
  const main = document.getElementById("main");
  let current = "nachalo";
  function route() {
    const id = (location.hash || "#nachalo").slice(1);
    const c = CATS.find((x) => x.id === id);
    current = c ? c.id : ["glavi", "nakratko", "skorosti"].includes(id) ? id : "nachalo";
    main.innerHTML = "";
    main.appendChild(current === "glavi" ? chaptersPage() : current === "nakratko" ? nakratko() : current === "skorosti" ? window.BGSpeeds.page(themeToggle()) : !c ? today() : chapter(c));
    renderNav(current);
    syncTheme();
    window.scrollTo({ top: 0 });
  }

  window.addEventListener("hashchange", route);
  route();
})();
