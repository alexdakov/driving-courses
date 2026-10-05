/* Play button for animated pictures. Every SVG with SMIL animation starts paused on its first frame
   and gets a small ▶ button; tapping it plays or pauses the animation. */
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

  function attach(svg) {
    if (svg.dataset.play || !svg.querySelector(ANIM) || svg.closest(SKIP)) return;
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
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
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
  window.BGPlay = { attach, scan };
})();
