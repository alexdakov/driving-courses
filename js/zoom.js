/* Full-screen viewer for pictures: illustrations, signs, road markings, dashboard lamps.
   Tap a picture to open it. Zoom with +/−, the mouse wheel, pinch or double tap; drag to move. Esc closes. */
(function () {
  const SELECTOR = [
    ".rule-il",
    ".sx-detail-img img",
    ".sx-card img",
    ".sotd img",
    ".quiz-q img",
    ".mark-card svg",
    ".dash-detail .lamp",
    ".facts .fact img",
    ".speed-strip img",
  ].join(",");

  let overlay, stage, inner, scale = 1, x = 0, y = 0, lastFocus = null;
  const pointers = new Map();
  let pinchStart = null, dragStart = null;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "zoom";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Увеличен изглед");
    overlay.innerHTML = `
      <div class="zoom-bar">
        <button type="button" data-z="out" aria-label="Намали">−</button>
        <button type="button" data-z="reset" class="zoom-pct" aria-label="Върни размера">100%</button>
        <button type="button" data-z="in" aria-label="Увеличи">+</button>
        <button type="button" data-z="close" class="zoom-close" aria-label="Затвори">✕</button>
      </div>
      <div class="zoom-stage"><div class="zoom-inner"></div></div>
      <p class="zoom-hint">Щипни или превърти за увеличаване · влачи за местене</p>`;
    document.body.appendChild(overlay);
    stage = overlay.querySelector(".zoom-stage");
    inner = overlay.querySelector(".zoom-inner");
    overlay.addEventListener("click", (e) => {
      const b = e.target.closest("[data-z]");
      if (b) {
        const a = b.dataset.z;
        if (a === "close") close();
        else if (a === "reset") set(1, 0, 0);
        else zoomBy(a === "in" ? 1.5 : 1 / 1.5);
        return;
      }
      if (e.target === stage && scale === 1) close();
    });
    stage.addEventListener("wheel", (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener("dblclick", (e) => { if (scale > 1) set(1, 0, 0); else zoomBy(2.2, e.clientX, e.clientY); });
    stage.addEventListener("pointerdown", (e) => {
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), scale, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
        dragStart = null;
      } else dragStart = { px: e.clientX, py: e.clientY, x, y };
    });
    stage.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomTo(pinchStart.scale * (d / pinchStart.d), pinchStart.cx, pinchStart.cy);
      } else if (dragStart && scale > 1) {
        set(scale, dragStart.x + (e.clientX - dragStart.px), dragStart.y + (e.clientY - dragStart.py));
      }
    });
    const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinchStart = null; if (!pointers.size) dragStart = null; };
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") zoomBy(1.5);
      if (e.key === "-") zoomBy(1 / 1.5);
    });
  }

  function set(s, nx, ny) {
    scale = Math.min(6, Math.max(1, s));
    if (scale === 1) { nx = 0; ny = 0; }
    x = nx; y = ny;
    inner.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    overlay.querySelector(".zoom-pct").textContent = `${Math.round(scale * 100)}%`;
    stage.style.cursor = scale > 1 ? "grab" : "zoom-in";
  }
  // zoom keeping the point under (cx, cy) fixed
  function zoomTo(s, cx, cy) {
    const r = stage.getBoundingClientRect();
    const ox = (cx ?? r.left + r.width / 2) - (r.left + r.width / 2);
    const oy = (cy ?? r.top + r.height / 2) - (r.top + r.height / 2);
    const ns = Math.min(6, Math.max(1, s));
    const k = ns / scale;
    set(ns, ox - (ox - x) * k, oy - (oy - y) * k);
  }
  const zoomBy = (f, cx, cy) => zoomTo(scale * f, cx, cy);

  function open(el) {
    if (!overlay) build();
    lastFocus = document.activeElement;
    inner.innerHTML = "";
    let node;
    if (el.tagName === "IMG") {
      node = document.createElement("img");
      node.src = el.currentSrc || el.src;
      node.alt = el.alt || "";
      node.className = "zoom-img";
    } else {
      const svg = el.tagName.toLowerCase() === "svg" ? el : el.querySelector("svg");
      node = (svg || el).cloneNode(true);
      node.removeAttribute("style");
      node.classList.add("zoom-svg");
      if (!svg) node.classList.add("zoom-box");
    }
    const holder = document.createElement("div");
    holder.className = "zoom-paper" + (el.closest(".dash-detail") ? " dark" : "");
    holder.appendChild(node);
    inner.appendChild(holder);
    set(1, 0, 0);
    overlay.classList.add("open");
    document.documentElement.classList.add("zoom-lock");
    overlay.querySelector(".zoom-close").focus({ preventScroll: true });
  }
  function close() {
    overlay.classList.remove("open");
    document.documentElement.classList.remove("zoom-lock");
    inner.innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    if (overlay && overlay.contains(e.target)) return;
    const el = e.target.closest(SELECTOR);
    if (!el || e.target.closest("button:not(.sx-tile)") && !e.target.closest(".sx-detail-img")) return;
    open(el);
  });
  // keyboard access: make zoomable pictures focusable
  const mark = () => document.querySelectorAll(SELECTOR).forEach((el) => {
    if (el.dataset.zoomReady) return;
    el.dataset.zoomReady = "1";
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Увеличи картинката");
  });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(SELECTOR)) { e.preventDefault(); open(e.target); }
  });
  new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
  mark();

  window.BGZoom = { open, close };
})();
