/* Play button for animated pictures. Every SVG with SMIL animation starts paused on its first frame
   and gets a small ▶ button; tapping it plays or pauses the animation.
   Next to it ⏮ / ⏭ play the picture step by step: the steps are the moments where something in the
   animation stops, starts or changes (read from the keyTimes / values of its animations). */
(function () {
  const ANIM = "animate, animateTransform, animateMotion";
  const SKIP = ".xanim, .zoom, .widget-stage, [data-no-play]";
  const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>`;
  const PAUSE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>`;

  function setState(btn, svg, playing) {
    if (playing) svg.unpauseAnimations(); else svg.pauseAnimations();
    btn.innerHTML = playing ? PAUSE : PLAY;
    btn.setAttribute("aria-label", playing ? "Пауза" : "Пусни анимацията");
    btn.setAttribute("aria-pressed", String(playing));
    btn.parentElement.classList.toggle("is-playing", playing);
  }

  const secs = (v) => (!v ? 0 : /ms$/.test(v) ? parseFloat(v) / 1000 : parseFloat(v) || 0);
  // the key moments of the main loop, in seconds: [0, …, D]
  function marksOf(svg) {
    const anims = [...svg.querySelectorAll(ANIM)].filter((a) => secs(a.getAttribute("dur")) >= 1.5);
    if (!anims.length) return null;
    const D = Math.max(...anims.map((a) => secs(a.getAttribute("dur"))));
    const set = [];
    anims.forEach((a) => {
      const d = secs(a.getAttribute("dur")), begin = secs(a.getAttribute("begin"));
      const kt = a.getAttribute("keyTimes"), vals = a.getAttribute("values");
      let list = null;
      if (kt) list = kt.split(";").map(Number);
      else if (vals && vals.split(";").length > 2) { const n = vals.split(";").length; list = Array.from({ length: n }, (_, i) => i / (n - 1)); }
      if (!list) return;
      for (let rep = 0; rep * d < D; rep++) list.forEach((k) => { const t = begin + (rep + k) * d; if (t > 0.3 && t < D - 0.3) set.push(t); });
    });
    set.sort((a, b) => a - b);
    const m = [0];
    set.forEach((t) => { if (t - m[m.length - 1] >= 0.6) m.push(t); });
    if (D - m[m.length - 1] < 0.6) m[m.length - 1] = D; else m.push(D);
    // at most 6 steps: merge the shortest ones
    while (m.length > 7) {
      let bi = 1, bl = Infinity;
      for (let i = 1; i < m.length - 1; i++) { const l = m[i + 1] - m[i - 1]; if (l < bl) { bl = l; bi = i; } }
      m.splice(bi, 1);
    }
    return m.length < 3 ? [0, D / 3, (2 * D) / 3, D] : m;
  }

  function addSteps(svg, host, btn) {
    const marks = marksOf(svg);
    if (!marks || host.closest("[data-own-steps]")) return null;
    const total = marks.length - 1;
    // steps only where there is something to step through
    if (total < 3 || host.closest(".mark-card, [data-no-steps]")) return null;
    const st = document.createElement("div");
    st.className = "step-ctl";
    st.innerHTML = `<button type="button" class="step-prev" aria-label="Предишна стъпка">⏮</button><span class="step-no" aria-live="polite">0/${total}</span><button type="button" class="step-next" aria-label="Следваща стъпка">⏭</button>`;
    host.appendChild(st);
    host.classList.add("has-steps");
    const no = st.querySelector(".step-no");
    let k = -1, timer = 0;
    function go(n) {
      k = Math.max(0, Math.min(total - 1, n));
      clearTimeout(timer);
      const a = marks[k], b = marks[k + 1];
      no.textContent = `${k + 1}/${total}`;
      svg.setCurrentTime(a);
      const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { svg.setCurrentTime(Math.max(a, b - 0.03)); setState(btn, svg, false); return; }
      setState(btn, svg, true);
      timer = setTimeout(() => { setState(btn, svg, false); svg.setCurrentTime(Math.max(a, b - 0.03)); }, (b - a) * 1000);
    }
    st.addEventListener("click", (e) => e.stopPropagation());
    st.querySelector(".step-next").addEventListener("click", () => go(k + 1 >= total ? 0 : k + 1));
    st.querySelector(".step-prev").addEventListener("click", () => go(k - 1));
    return () => { clearTimeout(timer); k = -1; no.textContent = `0/${total}`; };
  }

  function attach(svg) {
    if (svg.dataset.play || !svg.querySelector(ANIM) || svg.closest(SKIP)) return;
    // a still picture: freeze it on its first frame, no buttons
    if (svg.closest("[data-still]")) { svg.dataset.play = "still"; try { svg.pauseAnimations(); svg.setCurrentTime(0); } catch (e) { /* ignore */ } return; }
    const host = svg.parentElement;
    if (!host) return;
    svg.dataset.play = "1";
    try { svg.pauseAnimations(); svg.setCurrentTime(0); } catch (e) { return; }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "play-btn";
    host.classList.add("has-play");
    host.appendChild(btn);
    setState(btn, svg, false);
    const clearSteps = addSteps(svg, host, btn);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (clearSteps) clearSteps();
      setState(btn, svg, svg.animationsPaused());
    });
  }

  const scan = (root) => (root.querySelectorAll ? root.querySelectorAll("svg") : []).forEach((s) => {
    // only top-level SVGs (not nested icons inside another SVG)
    if (s.parentElement && s.parentElement.closest("svg")) return;
    attach(s);
  });
  new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.tagName.toLowerCase() === "svg" ? attach(n) : scan(n))))).observe(document.documentElement, { childList: true, subtree: true });
  scan(document);
  // bring the ▶ / ⏸ button in line after something else paused or started the SVG
  function sync(svg) {
    const btn = svg.parentElement && svg.parentElement.querySelector(":scope > .play-btn");
    if (btn) setState(btn, svg, !svg.animationsPaused());
  }
  window.BGPlay = { attach, scan, sync };
})();
