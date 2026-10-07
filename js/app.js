/* App shell for design 10: Today, Chapters, chapter pages, Speeds, Cheat sheet. Hash routing; remembers the last opened chapter. */
(function () {
  const { CATS, RULES } = window.BGData;
  const { signSVG, DATA: SIGNDATA } = window.BGSigns;
  const W = window.BGWidgets;

  // ---------- last opened chapter (so "Днес" can offer to continue) ----------
  const LAST_KEY = "bg-driving-refresher.last";
  let lastChapter = null;
  try { lastChapter = localStorage.getItem(LAST_KEY); } catch (e) { /* storage unavailable */ }
  const rememberChapter = (id) => { lastChapter = id; try { localStorage.setItem(LAST_KEY, id); } catch (e) { /* ignore */ } };

  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const chapters = CATS.filter((c) => c.id !== "izpit");
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

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
  // menu icons: one per topic, drawn as white line icons on a coloured tile (dark ink on yellow)
  const TOPIC = {
    skorosti: ["#007aff", `<path d="M3.5 17.5a8.5 8.5 0 1 1 17 0"/><path d="M12 15l4.5-5"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/>`],
    nakratko: ["#ff9500", `<path d="M13 2.5 4.8 13.5H11l-1 8 8.2-11H12z" fill="currentColor" stroke="none"/>`],
    osnovni: ["#5856d6", `<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 7.5h6M9 11h4"/>`],
    znaci: ["#ff3b30", `<path d="M12 3.2 20.5 17H3.5z"/><path d="M12 8.5v4"/><circle cx="12" cy="14.6" r=".4" fill="currentColor"/><path d="M12 17v4"/>`],
    markirovka: ["#636366", `<path d="M8.5 3 4 21M15.5 3 20 21"/><path d="M12 3.5v3M12 10v3.5M12 17v3.5"/>`],
    svetofar: ["#34c759", `<rect x="8" y="2.5" width="8" height="16" rx="2.5"/><circle cx="12" cy="6.6" r="1.4" fill="currentColor"/><circle cx="12" cy="10.5" r="1.4" fill="currentColor"/><circle cx="12" cy="14.4" r="1.4" fill="currentColor"/><path d="M12 18.5V22"/>`],
    regulirovchik: ["#1d3f72", `<circle cx="12" cy="6.4" r="2.1"/><path d="M9.3 3.9h5.4"/><path d="M12 8.8v6.2M12 15l-2.4 6M12 15l2.4 6M12 10.2l5.5-5.2M12 10.2 7.2 13"/>`],
    predimstvo: ["#ffcc00", `<path d="M12 2.8 21.2 12 12 21.2 2.8 12z"/><path d="M12 7.5 16.5 12 12 16.5 7.5 12z" fill="currentColor"/>`, "#3a2f00"],
    krugovo: ["#30b0c7", `<path d="M19 9.5A7.5 7.5 0 0 0 6 6.8"/><path d="M5 14.5a7.5 7.5 0 0 0 13 2.7"/><path d="M6.5 3v4h4M17.5 21v-4h-4"/>`],
    parkirane: ["#0a84ff", `<path d="M8 21V3.5h5.5a4.8 4.8 0 0 1 0 9.6H8"/>`],
    ogledala: ["#af52de", `<path d="M4 9.5C4 7.5 5.6 6 8 6h9c2 0 3.2 1.6 3.2 3.6v2.6c0 2-1.5 3.6-3.6 3.6H8c-2.4 0-4-1.6-4-3.6z"/><path d="M8.5 15.8 7 20.5"/><path d="M9 10.5h7" opacity=".6"/>`],
    tablo: ["#ff9f0a", `<circle cx="12" cy="12" r="5.6"/><path d="M12 9.2v3.4"/><circle cx="12" cy="14.9" r=".5" fill="currentColor"/><path d="M4.6 7.4a9 9 0 0 0 0 9.2M19.4 7.4a9 9 0 0 1 0 9.2"/>`],
    vreme: ["#5ac8fa", `<path d="M7 15a4 4 0 1 1 .9-7.9A5.2 5.2 0 0 1 17.6 9a3 3 0 0 1-.2 6z"/><path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5"/>`],
    kola: ["#00a37a", `<rect x="5" y="3.5" width="14" height="17.5" rx="2"/><path d="M9 3.5V2.5h6v1"/><path d="M8.5 9.5l1.5 1.5 3-3M8.5 15l1.5 1.5 3-3"/><path d="M15 10h1.5M15 15.5h1.5"/>`],
    novo: ["#ff375f", `<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" fill="currentColor" stroke="none"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="currentColor" stroke="none"/>`],
    podobni: ["#c4161c", `<circle cx="7.5" cy="12" r="5"/><rect x="13" y="7" width="9.5" height="10" rx="1.5"/><path d="M7.5 14.5v-5M5.6 11.4l1.9-1.9 1.9 1.9M17.75 14.5v-5M15.9 11.4l1.85-1.9 1.85 1.9"/>`],
    magistrala: ["#1f8a4c", `<path d="M9 3 5 21M15 3l4 18"/><path d="M12 4v2.5M12 10v3M12 16.5v3.5"/>`],
    kolela: ["#32ade6", `<circle cx="6" cy="16" r="3.6"/><circle cx="18" cy="16" r="3.6"/><path d="M6 16l4-7h5l3 7M10 9 8.5 6.5H7M15 9l-1.6-3H16"/>`],
    avtomat: ["#5e5ce6", `<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10 7h4M10 10.5h4M10 14h4M10 17.5h4"/><circle cx="12" cy="17.5" r="1.4" fill="currentColor"/>`],
    pomosht: ["#e5484d", `<path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" fill="currentColor" stroke="none"/>`],
    globi: ["#b25000", `<path d="M6 2.8h12v18.4l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 7.5h6M9 11h6M9 14.5h3.5"/>`],
    chuzhbina: ["#0071a4", `<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2M12 3.2c2.6 2.4 3.9 5.4 3.9 8.8s-1.3 6.4-3.9 8.8c-2.6-2.4-3.9-5.4-3.9-8.8S9.4 5.6 12 3.2z"/>`],
    situacii: ["#ff2d55", `<path d="M5.5 15.5v-4l2-5h9l2 5v4"/><path d="M4 11.5h16v4.5H4z"/><circle cx="7.6" cy="13.8" r=".9" fill="currentColor"/><circle cx="16.4" cy="13.8" r=".9" fill="currentColor"/><path d="M6.5 16v2.5M17.5 16v2.5"/>`],
  };
  const topicIcon = (id) => { const t = TOPIC[id]; return t ? `<span class="tico" style="--c:${t[0]};color:${t[2] || "#fff"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t[1]}</svg></span>` : ""; };

  const ROOTS = ["nachalo", "glavi", "znaci", "nakratko", "skorosti", "tarsene"];
  const ROOT_TITLE = { nachalo: "Днес", glavi: "Глави", znaci: "Пътни знаци", nakratko: "Накратко", skorosti: "Скорости", tarsene: "Търсене" };
  const TABS = [["nachalo", "Днес"], ["glavi", "Глави"], ["znaci", "Знаци"], ["skorosti", "Скорости"], ["nakratko", "Накратко"]];

  function chapterRow(c, active) {
    return `<a class="row" href="#${c.id}" ${active === c.id ? 'aria-current="page"' : ""}>${topicIcon(c.id) || signSVG(c.sign, "")}<span class="t">${c.title}</span><small>${c.short}</small><span class="count"></span></a>`;
  }
  const SEARCH_LINK = `<a href="#tarsene" class="nav-srch" aria-label="Търсене"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg></a>`;
  function renderNav(active) {
    nav.innerHTML = `
      <div class="list"><a class="row" href="#skorosti" ${active === "skorosti" ? 'aria-current="page"' : ""}>${topicIcon("skorosti")}<span class="t">Скорости</span><small>Град, магистрала, дъжд, мъгла…</small><span class="count"></span></a><a class="row" href="#nakratko" ${active === "nakratko" ? 'aria-current="page"' : ""}>${topicIcon("nakratko")}<span class="t">Накратко</span><small>Всички числа на един екран</small><span class="count"></span></a></div>
      <div class="list">${chapters.map((c) => chapterRow(c, active)).join("")}</div>`;
    const tabOf = ["nachalo", "znaci", "nakratko", "skorosti"].includes(active) ? active : active === "tarsene" ? "" : "glavi";
    tabbar.innerHTML = TABS.map(([id, label]) => `<a href="#${id}" ${tabOf === id ? 'aria-current="page"' : ""}>${ICON[id]}<span>${label}</span></a>`).join("");
    // phone: an app-style top bar. Root tabs show only the title once the large title scrolls away;
    // chapters get a back button. (Hidden on desktop by CSS.)
    const isRoot = ROOTS.includes(active);
    const c = CATS.find((x) => x.id === active);
    navbar.hidden = false;
    navbar.classList.toggle("root", isRoot);
    navbar.innerHTML = isRoot
      ? `<span></span><span class="nt">${ROOT_TITLE[active] || ""}</span><span class="nav-r">${active === "tarsene" ? "" : SEARCH_LINK}${themeToggle()}</span>`
      : `<a href="#glavi" class="back">Глави</a><span class="nt">${c ? c.title : ""}</span><span class="nav-r">${SEARCH_LINK}${themeToggle()}</span>`;
  }

  // ---------- "install the app" card (phones, not yet installed) ----------
  let installEvent = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; document.querySelectorAll(".install-card [data-install]").forEach((b) => (b.hidden = false)); });
  const INSTALL_KEY = "bg-install-dismissed";
  function installCard(page) {
    let dismissed = false;
    try { dismissed = localStorage.getItem(INSTALL_KEY) === "1"; } catch (e) { /* ignore */ }
    const phone = window.matchMedia("(max-width: 899px)").matches;
    const installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (!phone || installed || dismissed || window.top !== window) return;
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
    const card = h(`<div class="install-card"><img src="assets/app/icon-192.png" alt=""><div><b>Сложи го на телефона като приложение</b><p>${ios ? "В Safari натисни <span class=\"ios-share\" aria-label=\"Сподели\">⬆︎</span> „Сподели“ и после „Добави към началния екран“." : "Отваря се на цял екран, като истинско приложение. В Chrome: меню ⋮ → „Инсталиране на приложението“."}</p><div class="install-btns"><button type="button" class="btn primary small" data-install ${installEvent ? "" : "hidden"}>Инсталирай</button><button type="button" class="btn small" data-close>Не сега</button></div></div></div>`);
    card.querySelector("[data-install]").addEventListener("click", async () => { if (!installEvent) return; installEvent.prompt(); await installEvent.userChoice.catch(() => {}); installEvent = null; card.remove(); });
    card.querySelector("[data-close]").addEventListener("click", () => { try { localStorage.setItem(INSTALL_KEY, "1"); } catch (e) { /* ignore */ } card.remove(); });
    page.querySelector(".large").after(card);
  }

  // ---------- Today ----------
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
      ["20", "Жилищна зона", "ЗДвП чл. 62, т. 2", "Д15"],
      ["30", "„Зона 30“ в населено място", "ЗДвП чл. 62а", ""],
      ["50", "Населено място", "ЗДвП чл. 21", "Д11"],
      ["90", "Извън населено място", "ЗДвП чл. 21", ""],
      ["120", "Скоростен път", "ЗДвП чл. 21", "Д7а"],
      ["140", "Автомагистрала", "ЗДвП чл. 21", "Д5"],
    ],
    distances: [
      ["5 м", "Без спиране на и пред пешеходна пътека и от кръстовище", "ЗДвП чл. 98, ал. 1, т. 5, 6", "Д17"],
      ["3 м", "Минимум между спряната кола и непрекъсната линия", "ЗДвП чл. 98, ал. 1, т. 7", ""],
      ["2 м", "Свободни за пешеходци, ако паркираш на тротоар", "ЗДвП чл. 94, ал. 3", ""],
      ["30 м", "Триъгълник при повреда; на магистрала и на път с разрешени над 90 km/h – 100 м", "ЗДвП чл. 97, ал. 4", ""],
      ["150 м", "Най-късно тук сменяш дълги с къси при разминаване", "ЗДвП чл. 70", ""],
      ["50 м", "Без дълги зад кола; задна мъгла само при видимост под 50 м", "ЗДвП чл. 70, ал. 2; чл. 74, ал. 2", ""],
      ["2 м", "Спираш пред първата релса на прелез без бариери (1 м пред бариера)", "ЗДвП чл. 51, ал. 4", "А33"],
      ["1 м", "Зад трамвай, спрял на спирка, ако го доближаваш отдясно", "ЗДвП чл. 66, ал. 1", ""],
    ],
    numbers: [
      ["0,5 ‰", "Над тази граница алкохолът е забранен (над 1,2 ‰ – престъпление)", "ЗДвП чл. 5, ал. 3, т. 1; чл. 174; НК чл. 343б", ""],
      ["150 см", "Под този ръст детето пътува в столче или седалка", "ЗДвП чл. 137в, ал. 2", ""],
      ["4 мм", "Протектор от 15 ноември до 1 март (или зимни гуми)", "ЗДвП чл. 139, ал. 1, т. 4", ""],
      ["2,5 т", "Максимум за паркиране на тротоар (само на определени места)", "ЗДвП чл. 94, ал. 3", ""],
      ["12 г.", "Деца до тази възраст слизат и се качват откъм тротоара или банкета", "ЗДвП чл. 95, ал. 2", ""],
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
      ["✓", "Триъгълник, аптечка, светлоотразителна жилетка и пожарогасител с валиден стикер за обслужване", "ЗДвП чл. 139, ал. 2, 8, 11", ""],
      ["✓", "Денем – светлини за движение през деня или къси; в тунел – къси", "ЗДвП чл. 63, 70", ""],
      ["✓", "Телефон – само без ръце или през системата на колата", "ЗДвП чл. 104а", ""],
      ["✓", "Коланът е задължителен на всички седалки", "ЗДвП чл. 137а", ""],
    ],
  };
  const factList = (rows) => `<div class="list facts">${rows.map(([v, t, ref, sign]) => `<div class="fact">${sign ? signSVG(sign, "") : `<span class="fv">${v}</span>`}<div><span class="ft">${sign ? `<b>${v}</b> · ` : ""}${t}</span>${ref ? `<span class="fr">${ref}</span>` : ""}</div></div>`).join("")}</div>`;

  function today() {
    const last = chapters.find((c) => c.id === lastChapter);
    const nextCh = last ? chapters[(chapters.indexOf(last) + 1) % chapters.length] : chapters[0];
    const pool = SIGNDATA.SIGNS.filter((s) => "АБВГД".includes(s.g));
    const sotd = pool[dayIndex() % pool.length];
    const allFacts = [...FACTS.distances, ...FACTS.numbers];
    const start = (dayIndex() * 3) % allFacts.length;
    const dayFacts = [0, 1, 2].map((k) => allFacts[(start + k) % allFacts.length]);
    const dateStr = new Date().toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" });

    const page = h(`<div class="today">
      <header class="large">${themeToggle()}<span class="eyebrow">${dateStr}</span><h1>Днес</h1><p class="lede">Как да врум-врум · категория B · по ЗДвП 2025</p></header>
      <div class="hero-card">${signSVG((last || nextCh).sign, "")}<div>${last
        ? `<b>Последно отвори „${last.title}“</b><p>Следваща глава: „${nextCh.title}“ – ${nextCh.short.toLowerCase()}.</p><div class="hero-btns"><a class="btn primary small" href="#${nextCh.id}">Към „${nextCh.title}“</a><a class="btn small" href="#${last.id}">Обратно към „${last.title}“</a></div>`
        : `<b>Започни с „${nextCh.title}“</b><p>${nextCh.short}</p><a class="btn primary small" href="#${nextCh.id}">Започни</a>`}</div></div>
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
    installCard(page);
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
  // the heaviest everyday fines, if the fines chapter is loaded
  function topFines() {
    const f = ((window.BGData.MORE || {}).globi || {}).fines || [];
    if (!f.length) return "";
    const pick = f.filter((x) => x.points || x.extra).slice(0, 10);
    return `<h2 class="section-title">Глоби, които си струва да помниш <a href="#globi" class="sec-link">Всички ›</a></h2><div class="card nk-fines">${pick.map((x) => `<div><span>${x.t}</span><b>${x.fine}${x.points ? ` · −${x.points} т.` : ""}</b></div>`).join("")}</div>`;
  }
  function nakratko() {
    return h(`<div>
      <header class="large">${themeToggle()}<span class="eyebrow">Всичко важно на един екран</span><h1>Накратко</h1><p class="lede">Числата и правилата, които най-лесно се забравят. Подробностите са в главите.</p><button type="button" class="btn small print-btn" onclick="window.print()">🖨 Отпечатай или запази като PDF</button></header>
      <div class="print-only print-head"><b>Как да врум-врум</b> · категория B · по ЗДвП с изм. ДВ бр. 64/2025 · спешен номер 112</div>
      <h2 class="section-title">Скорости · категория B · km/h <a href="#skorosti" class="sec-link">Всички ситуации ›</a></h2>
      <div class="speed-strip">${FACTS.speeds.map(([v, t, , sign]) => `<div class="sp">${sign ? signSVG(sign, "") : `<span class="sp-road"></span>`}<b>${v}</b><span>${t}</span></div>`).join("")}</div>
      <h2 class="section-title">Разстояния</h2>${factList(FACTS.distances)}
      <h2 class="section-title">Числа</h2>${factList(FACTS.numbers)}
      <h2 class="section-title">Кой минава пръв</h2>${factList(FACTS.priority)}
      <h2 class="section-title">В колата</h2>${factList(FACTS.gear)}
      ${topFines()}
      <nav class="pager"><a href="#glavi">Към главите<span>›</span></a></nav>
    </div>`);
  }

  // ---------- Search ----------
  const plain = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const norm = (t) => String(t).toLowerCase().replace(/ё/g, "е").replace(/^([abvgdet])(\d)/, (m, c, d) => ({ a: "а", b: "б", v: "в", g: "г", d: "д", e: "е", t: "т" })[c] + d);
  let searchIndex = null;
  function buildIndex() {
    const out = [];
    const MORE = window.BGData.MORE || {};
    chapters.forEach((c) => {
      out.push({ kind: "Глава", t: c.title, x: c.short, href: `#${c.id}` });
      (RULES[c.id] || []).forEach((r, i) => out.push({ kind: c.title, t: r.t, x: plain(r.b), href: `#${c.id}:r${i}` }));
    });
    SIGNDATA.SIGNS.forEach((sg) => out.push({ kind: "Знак", t: `${sg.c} ${sg.n}`, x: `${sg.d} ${sg.m || ""}`, href: "#znaci", sign: sg.c, img: sg.f }));
    (window.BGData.DASH || []).forEach((d) => out.push({ kind: "Лампа на таблото", t: d.name, x: `${d.what} ${d.act}`, href: "#tablo" }));
    (window.BGScenarios || []).forEach((sc) => out.push({ kind: "Ситуация", t: sc.title, x: `${sc.q} ${sc.steps.join(" ")}`, href: `#situacii:sit-${sc.id}` }));
    ((MORE.globi && MORE.globi.fines) || []).forEach((f) => out.push({ kind: "Глоба", t: f.t, x: `${f.fine} ${f.extra || ""}`, href: "#globi" }));
    ((MORE.novo && MORE.novo.changes) || []).forEach((n) => out.push({ kind: "Ново", t: n.t, x: `${n.before} ${n.now}`, href: "#novo" }));
    out.forEach((e) => { e.nt = norm(e.t); e.nx = norm(e.x); });
    return out;
  }
  function searchPage() {
    const page = h(`<div class="srch">
      <header class="large">${themeToggle()}<span class="eyebrow">Знаци, правила, глоби, ситуации</span><h1>Търсене</h1></header>
      <label class="srch-box"><span class="visually-hidden">Търси</span><input type="search" placeholder="Напр. В27, мъгла, телефон, 0,5 ‰, кръгово" autocomplete="off"></label>
      <div class="srch-out" aria-live="polite"></div>
    </div>`);
    const input = page.querySelector("input"), out = page.querySelector(".srch-out");
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const mark = (t, words) => { let r = esc(t); words.forEach((w) => { if (w.length > 1) r = r.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>"); }); return r; };
    function run() {
      const q = norm(input.value.trim());
      try { sessionStorage.setItem("bg-search", input.value); } catch (e) { /* private mode */ }
      if (q.length < 2) { out.innerHTML = `<p class="srch-hint">Напиши поне две букви. Търси се в главите, правилата, всички 182 знака, лампите на таблото, ситуациите и глобите.</p>`; return; }
      searchIndex = searchIndex || buildIndex();
      const words = q.split(/\s+/).filter(Boolean);
      const hits = searchIndex.map((e) => {
        let score = 0;
        for (const w of words) {
          if (e.nt.includes(w)) score += e.nt.startsWith(w) ? 6 : 4;
          else if (e.nx.includes(w)) score += 1;
          else return null;
        }
        return { e, score };
      }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 60);
      if (!hits.length) { out.innerHTML = `<p class="srch-hint">Нищо не намерих за „${esc(input.value)}“.</p>`; return; }
      out.innerHTML = `<p class="srch-count">${hits.length === 60 ? "Първите 60" : hits.length} резултата</p><div class="list srch-list">${hits.map(({ e }) => {
        const i = e.nx.indexOf(words[0]);
        const snip = e.x ? (i > 40 ? "…" : "") + e.x.slice(Math.max(0, i - 40), Math.max(0, i - 40) + 150) + (e.x.length > 150 ? "…" : "") : "";
        return `<a class="row srch-row" href="${e.href}"${e.sign ? ` data-sign="${esc(e.sign)}"` : ""}>${e.img ? `<img src="${e.img}" alt="" class="srch-img" loading="lazy">` : `<span class="srch-kind">${esc(e.kind).slice(0, 1)}</span>`}<span class="t">${mark(e.t, words)}</span><small>${esc(e.kind)} · ${mark(snip, words)}</small></a>`;
      }).join("")}</div>`;
      out.querySelectorAll("[data-sign]").forEach((a) => a.addEventListener("click", () => { window.BGOpenSign = a.dataset.sign; }));
    }
    input.addEventListener("input", run);
    try { input.value = sessionStorage.getItem("bg-search") || ""; } catch (e) { /* ignore */ }
    run();
    setTimeout(() => input.focus(), 50);
    return page;
  }

  // ---------- Chapters list ----------
  function chaptersPage() {
    return h(`<div>
      <header class="large">${themeToggle()}<span class="eyebrow">${chapters.length} глави</span><h1>Глави</h1><p class="lede">Всяка глава има интерактивен модел, илюстрации и правилата с членовете от закона.</p></header>
      <div class="list">${chapters.map((c) => chapterRow(c, "")).join("")}</div>
      <h2 class="section-title">Настройки</h2>
      <div class="card settings"><div class="set-row"><span>Тема</span><div data-theme-seg>${themeSeg()}</div></div></div>
    </div>`);
  }

  // ---------- Chapter ----------
  function chapter(c) {
    const n = CATS.indexOf(c);
    const page = h(`<div>
      <header class="large">${themeToggle()}<span class="eyebrow">Глава ${n + 1} от ${chapters.length}${c.law ? ` · ${c.law}` : ""}</span><div class="row-h">${c.icon ? topicIcon(c.id) : signSVG(c.sign, "")}<h1>${c.title}</h1></div><p class="lede">${c.lede}</p></header>
      <div class="w-slot"></div>
      <div class="r-slot"></div>
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
      rules.forEach((x, i) => {
        const still = window.BGStill && window.BGStill.has(x.il) ? " data-still" : "";
        const il = x.il && window.BGIllustrations[x.il] ? `<figure class="rule-il"${still}>${window.BGIllustrations[x.il]()}</figure>` : "";
        list.appendChild(h(`<article class="rule ${x.k || ""} ${il ? "has-il" : ""}" id="r-${c.id}-${i}">${il}<div class="rule-text"><h4>${x.t}</h4><div class="body">${x.b}</div><span class="lawref">${x.ref}</span></div></article>`));
      });
      r.appendChild(list);
    }
    rememberChapter(c.id);
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
  // ---------- app feel on phones: transitions, remembered scroll, collapsing title, swipe back ----------
  const isPhone = () => window.matchMedia("(max-width: 899px)").matches;
  const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (standalone()) root.classList.add("standalone");
  const depth = (id) => (ROOTS.includes(id) ? 0 : 1);
  const scrollMemo = {};
  let titleObserver = null;
  function watchTitle() {
    if (titleObserver) titleObserver.disconnect();
    navbar.classList.remove("titled");
    const h1 = main.querySelector(".large h1");
    if (!h1 || !("IntersectionObserver" in window)) { navbar.classList.add("titled"); return; }
    titleObserver = new IntersectionObserver(([e]) => navbar.classList.toggle("titled", !e.isIntersecting && e.boundingClientRect.top < 80), { rootMargin: "-56px 0px 0px 0px" });
    titleObserver.observe(h1);
  }
  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 4);
  window.addEventListener("scroll", onScroll, { passive: true });

  // scripts only some pages need are loaded when such a page is first opened, so the first load is lighter
  const LAZY = { skorosti: ["js/speeds.js"], kola: ["js/docs.js", "js/car.js"], parkirane: ["js/parking.js"] };
  const loadedJS = new Set();
  const loadScript = (src) => new Promise((res, rej) => { const el = document.createElement("script"); el.src = src; el.onload = res; el.onerror = rej; document.body.appendChild(el); });
  function ensureScripts(id) {
    const need = (LAZY[id] || []).filter((src) => !loadedJS.has(src));
    if (!need.length) return null;
    return need.reduce((p, src) => p.then(() => loadScript(src)).then(() => loadedJS.add(src)), Promise.resolve());
  }
  function route() {
    const pending = ensureScripts((location.hash || "#nachalo").slice(1).split(":")[0]);
    if (pending) { main.setAttribute("aria-busy", "true"); pending.then(route, route).finally(() => main.removeAttribute("aria-busy")); return; }
    const prev = current;
    if (prev) scrollMemo[prev] = window.scrollY;
    const [id, anchor] = (location.hash || "#nachalo").slice(1).split(":");
    const c = CATS.find((x) => x.id === id);
    current = c ? c.id : ["glavi", "nakratko", "skorosti", "znaci", "tarsene"].includes(id) ? id : "nachalo";
    main.innerHTML = "";
    main.appendChild(current === "tarsene" ? searchPage() : current === "glavi" ? chaptersPage() : current === "nakratko" ? nakratko() : current === "skorosti" ? window.BGSpeeds.page(themeToggle()) : !c ? today() : chapter(c));
    renderNav(current);
    syncTheme();
    // push (deeper), pop (back) or a tab switch
    const dir = !routed ? "" : depth(current) > depth(prev) ? "push" : depth(current) < depth(prev) ? "pop" : current === prev ? "" : "fade";
    const keep = (dir === "pop" || dir === "fade") && scrollMemo[current] != null;
    window.scrollTo({ top: keep ? scrollMemo[current] : 0 });
    // deep link from the search: scroll to the rule or situation and flash it
    const target = anchor && document.getElementById(anchor.startsWith("r") && !anchor.startsWith("r-") ? `r-${current}-${anchor.slice(1)}` : anchor);
    if (target) { setTimeout(() => { target.scrollIntoView({ block: "center" }); target.classList.add("flash"); setTimeout(() => target.classList.remove("flash"), 2200); }, 60); }
    if (dir && isPhone()) {
      main.classList.remove("enter-push", "enter-pop", "enter-fade");
      void main.offsetWidth;
      main.classList.add("enter-" + dir);
    }
    routed = true;
    onScroll();
    watchTitle();
  }
  let routed = false;
  main.addEventListener("animationend", () => main.classList.remove("enter-push", "enter-pop", "enter-fade"));
  // tapping the tab you are on scrolls to the top, like in native apps
  tabbar.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.getAttribute("href") === "#" + current) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });
  // swipe from the left edge to go back (installed app only – browsers already have this gesture)
  let swipe = null;
  document.addEventListener("touchstart", (e) => {
    if (!standalone() || depth(current) === 0 || e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX < 24) swipe = { x: t.clientX, y: t.clientY, dx: 0 };
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!swipe) return;
    const t = e.touches[0];
    swipe.dx = Math.max(0, t.clientX - swipe.x);
    if (Math.abs(t.clientY - swipe.y) > 60 && swipe.dx < 30) { main.style.transform = ""; swipe = null; return; }
    main.style.transform = `translateX(${swipe.dx}px)`;
  }, { passive: true });
  document.addEventListener("touchend", () => {
    if (!swipe) return;
    const go = swipe.dx > 90;
    main.style.transition = "transform .2s ease";
    main.style.transform = go ? "translateX(100%)" : "";
    setTimeout(() => {
      main.style.transition = ""; main.style.transform = "";
      if (go) { if (history.length > 1) history.back(); else location.hash = "#glavi"; }
    }, 200);
    swipe = null;
  });

  window.addEventListener("hashchange", route);
  route();

  // no offline mode: remove a service worker left over from an earlier version
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
  }
})();
