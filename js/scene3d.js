/* Tiny 3D helper for the "3D" views: a perspective camera that projects map coordinates
   (x → east, y → south, z → up) to SVG, near-plane clipping, and simple shaded boxes.
   Everything is drawn back to front (painter's algorithm), so callers collect items with a depth. */
(function () {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const f1 = (n) => n.toFixed(1);

  // eye/target: [x, y, z]; f: focal length in px; (cx, cy): screen centre; mirror: flip left-right (mirror views)
  function camera({ eye, target, f = 420, cx = 170, cy = 170, near = 4, mirror = false }) {
    const fwd = norm(sub(target, eye));
    // y points south, so the screen-right vector is up × forward
    const right = norm(cross([0, 0, 1], fwd));
    const up = cross(fwd, right);
    const toCam = (p) => { const v = sub(p, eye); return [dot(v, right), dot(v, up), dot(v, fwd)]; };
    const proj = (c) => [cx + (mirror ? -1 : 1) * (f * c[0]) / c[2], cy - (f * c[1]) / c[2]];
    const P = (x, y, z = 0) => { const c = toCam([x, y, z]); return c[2] < near ? null : proj(c); };
    const depth = (x, y, z = 0) => toCam([x, y, z])[2];
    const scale = (x, y, z = 0) => { const d = depth(x, y, z); return d < near ? 0 : f / d; };
    // polygon in world space → clipped screen points
    function polyPts(pts) {
      let cs = pts.map((p) => toCam(p));
      const out = [];
      for (let i = 0; i < cs.length; i++) {
        const a = cs[i], b = cs[(i + 1) % cs.length];
        const ain = a[2] >= near, bin = b[2] >= near;
        if (ain) out.push(a);
        if (ain !== bin) {
          const t = (near - a[2]) / (b[2] - a[2]);
          out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, near]);
        }
      }
      return out.map(proj);
    }
    const poly = (pts, attrs = "") => {
      const s = polyPts(pts);
      return s.length < 3 ? "" : `<polygon points="${s.map((p) => f1(p[0]) + "," + f1(p[1])).join(" ")}" ${attrs}/>`;
    };
    // open polyline on the ground or in the air (points behind the camera are dropped)
    const line = (pts, attrs = "") => {
      const s = pts.map((p) => P(p[0], p[1], p[2] || 0)).filter(Boolean);
      return s.length < 2 ? "" : `<polyline points="${s.map((p) => f1(p[0]) + "," + f1(p[1])).join(" ")}" fill="none" ${attrs}/>`;
    };
    // world-space segment with a world-space thickness (gets thinner with distance)
    const seg = (a, b, w, col, extra = "") => {
      const pa = P(...a), pb = P(...b);
      if (!pa || !pb) return "";
      const k = (scale(...a) + scale(...b)) / 2;
      return `<line x1="${f1(pa[0])}" y1="${f1(pa[1])}" x2="${f1(pb[0])}" y2="${f1(pb[1])}" stroke="${col}" stroke-width="${f1(Math.max(1, w * k))}" stroke-linecap="round" ${extra}/>`;
    };
    const ball = (c, r, fill, extra = "") => {
      const p = P(...c);
      return p ? `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(Math.max(1, r * scale(...c)))}" fill="${fill}" ${extra}/>` : "";
    };
    return { eye, fwd, right, up, P, depth, scale, poly, polyPts, line, seg, ball, mirror };
  }

  // ground circle / ring as polygon points
  const circle = (cx, cy, r, z = 0, n = 48) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a), z]; });

  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.min(255, Math.max(0, v * k))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };

  // oriented box: centre (x, y) on the ground at height z0, length l along heading `yaw` (degrees, 0 = east, 90 = south),
  // width w, height h. faces: optional colours per face {top, front, back, left, right}. Returns {d, s}.
  function box(cam, { x, y, z0 = 0, l, w, h, yaw = 0, col = "#2f6fdc", faces = {}, stroke = "rgba(0,0,0,.35)" }) {
    const a = (yaw * Math.PI) / 180, ux = [Math.cos(a), Math.sin(a)], vx = [-Math.sin(a), Math.cos(a)];
    const pt = (s, t, z) => [x + ux[0] * s + vx[0] * t, y + ux[1] * s + vx[1] * t, z];
    const L = l / 2, Wd = w / 2, z1 = z0 + h;
    const F = {
      top: { p: [pt(-L, -Wd, z1), pt(L, -Wd, z1), pt(L, Wd, z1), pt(-L, Wd, z1)], n: [0, 0, 1], k: 1.12 },
      front: { p: [pt(L, -Wd, z0), pt(L, Wd, z0), pt(L, Wd, z1), pt(L, -Wd, z1)], n: [ux[0], ux[1], 0], k: 0.92 },
      back: { p: [pt(-L, Wd, z0), pt(-L, -Wd, z0), pt(-L, -Wd, z1), pt(-L, Wd, z1)], n: [-ux[0], -ux[1], 0], k: 0.8 },
      right: { p: [pt(L, Wd, z0), pt(-L, Wd, z0), pt(-L, Wd, z1), pt(L, Wd, z1)], n: [vx[0], vx[1], 0], k: 0.72 },
      left: { p: [pt(-L, -Wd, z0), pt(L, -Wd, z0), pt(L, -Wd, z1), pt(-L, -Wd, z1)], n: [-vx[0], -vx[1], 0], k: 0.86 },
    };
    let s = "";
    for (const [name, fc] of Object.entries(F)) {
      const c = fc.p.reduce((m, p) => [m[0] + p[0] / 4, m[1] + p[1] / 4, m[2] + p[2] / 4], [0, 0, 0]);
      if (dot(fc.n, sub(cam.eye, c)) <= 0) continue; // back-face
      const fill = faces[name] || shade(col, fc.k);
      s += cam.poly(fc.p, `fill="${fill}" stroke="${stroke}" stroke-width=".6" stroke-linejoin="round"`);
    }
    return { d: cam.depth(x, y, z0 + h / 2), s };
  }

  // a simple car: wheels, body, glasshouse and lights. blink = "L" | "R" | null (lit indicator side)
  function car(cam, { x, y, yaw = 0, col = "#2f6fdc", scale = 1, blink = null, label = "" }) {
    const k = scale;
    const a = (yaw * Math.PI) / 180, ux = [Math.cos(a), Math.sin(a)], vx = [-Math.sin(a), Math.cos(a)];
    const at = (s, t) => [x + ux[0] * s * k + vx[0] * t * k, y + ux[1] * s * k + vx[1] * t * k];
    const parts = [];
    let s = cam.poly([[...at(-21, -11.5), 0], [...at(21, -11.5), 0], [...at(21, 11.5), 0], [...at(-21, 11.5), 0]], `fill="rgba(0,0,0,.25)"`);
    // wheels
    for (const [ws, wt] of [[13, -9.6], [13, 9.6], [-13, -9.6], [-13, 9.6]]) {
      const [wx, wy] = at(ws, wt);
      parts.push(box(cam, { x: wx, y: wy, z0: 0, l: 7 * k, w: 3 * k, h: 6 * k, yaw, col: "#202428", stroke: "none" }));
    }
    const body = box(cam, { x, y, z0: 2.5 * k, l: 40 * k, w: 19 * k, h: 7 * k, yaw, col });
    const [cx2, cy2] = at(-3, 0);
    const glass = box(cam, { x: cx2, y: cy2, z0: 9.5 * k, l: 21 * k, w: 16 * k, h: 5.5 * k, yaw, col: "#9fc6ea", faces: { top: shade(col, 1.08) } });
    s += parts.map((p) => p.s).join("") + body.s + glass.s;
    const lamp = (sx, sy, z, fill) => cam.ball([...at(sx, sy), z * k], 2 * k, fill);
    const amber = "#ffb21a";
    s += lamp(20.5, -6.5, 7, blink === "L" ? amber : "#fff6c2") + lamp(20.5, 6.5, 7, blink === "R" ? amber : "#fff6c2");
    s += lamp(-20.5, -6.5, 7, blink === "L" ? amber : "#e0352b") + lamp(-20.5, 6.5, 7, blink === "R" ? amber : "#e0352b");
    if (blink) s += lamp(4, blink === "L" ? -9.8 : 9.8, 7.5, amber);
    if (label) {
      const p = cam.P(x, y, 30 * k);
      if (p) s += `<g><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="10" fill="#fff" stroke="#1f2933" stroke-width="1.4"/><text x="${f1(p[0])}" y="${f1(p[1] + 0.5)}" font-size="11" font-weight="800" fill="#1f2933" text-anchor="middle" dominant-baseline="central">${label}</text></g>`;
    }
    return { d: cam.depth(x, y, 6 * k), s };
  }

  // draw items sorted far → near
  const paint = (items) => items.filter(Boolean).sort((p, q) => q.d - p.d).map((i) => i.s).join("");

  window.BG3D = { camera, circle, box, car, paint, shade };
})();
