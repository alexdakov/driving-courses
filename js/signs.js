/* Road signs come from the verified official images in assets/signs (see docs/sverka-znaci.md).
   Codes may be written with a Latin prefix (B1, V27) or in Cyrillic (Б1, В27). Dashboard lamps are drawn here. */
(function () {
  const DATA = window.BGSignData;
  const LAT = { A: "А", B: "Б", V: "В", G: "Г", D: "Д", E: "Е", T: "Т" };
  const toCyr = (code) => code.replace(/^[ABVGDET]/, (c) => LAT[c]).replace(/a$/, "а").replace(/b$/, "б");
  const byCode = (code) => DATA.SIGNS.find((s) => s.c === toCyr(code));
  const esc = (t) => String(t).replace(/"/g, "&quot;");

  // <img> for HTML contexts
  const signSVG = (code, cls = "sign") => {
    const s = byCode(code);
    if (!s) return "";
    return `<img class="${cls}" src="${s.f}" alt="${esc(s.c + " " + s.n)}" loading="lazy" decoding="async">`;
  };
  // <image> for use inside an <svg> scene
  const signImage = (code, x, y, size) => {
    const s = byCode(code);
    return s ? `<image href="${s.f}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"><title>${s.c} ${s.n}</title></image>` : "";
  };
  const signLabel = (code) => toCyr(code);

  // ---------- Dashboard lamps (24-style icons in a 48 box) ----------
  const ic = (inner, extra = "") =>
    `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
  const t = (x, y, s, size, w = 800) =>
    `<text x="${x}" y="${y}" fill="currentColor" stroke="none" font-family="Arial, sans-serif" font-size="${size}" font-weight="${w}" text-anchor="middle" dominant-baseline="central">${s}</text>`;
  const brackets = `<path d="M10 12 a17 17 0 0 0 0 24 M38 12 a17 17 0 0 1 0 24"/>`;
  const lamp = `<path d="M27 12 C36 12 42 17 42 24 C42 31 36 36 27 36 C25 30 25 18 27 12 Z"/>`;

  const ICONS = {
    engine: ic(`<path d="M9 20 H13 V16 H19 V13 H29 V16 H33 L36 20 H39 V17 H42 V33 H39 V30 H36 L32 35 H17 L13 31 H9 Z"/><path d="M4 21 V31 M4 26 H9"/>`),
    oil: ic(`<path d="M8 20 H18 L21 17 H28 L31 20 L43 17 L32 31 H12 Z"/><path d="M24 17 V13 M20 13 H28"/><path d="M42 25 c1.5 3 1.5 5 0 6 c-1.5 -1 -1.5 -3 0 -6 z" fill="currentColor"/>`),
    battery: ic(`<rect x="6" y="15" width="36" height="23" rx="2"/><path d="M12 15 V11 H18 V15 M30 15 V11 H36 V15 M12 26 H18 M30 26 H36 M33 23 V29"/>`),
    coolant: ic(`<path d="M24 6 V27"/><circle cx="24" cy="31" r="4.5"/><path d="M24 10 H30 M24 16 H30 M24 22 H30"/><path d="M5 41 q4.5 -3.5 9 0 t9 0 t9 0 t9 0"/>`),
    brake: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24, 24.5, "!", 16)}`),
    abs: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24, 24.5, "ABS", 9)}`),
    esp: ic(`<path d="M11 25 L14 17 H34 L37 25 V31 H11 Z"/><path d="M15 31 V34 M33 31 V34"/><path d="M11 41 q3 -3 6 0 t6 0 M26 41 q3 -3 6 0 t6 0"/>`),
    airbag: ic(`<circle cx="15" cy="9" r="3.5"/><path d="M15 15 L17 28 H27 L31 40 M11 41 H21"/><path d="M15 21 L22 22"/><circle cx="33" cy="20" r="7" fill="currentColor" stroke="none"/>`),
    belt: ic(`<circle cx="24" cy="10" r="4.5"/><path d="M13 43 V30 a11 11 0 0 1 22 0 V43"/><path d="M17 22 L33 40"/><rect x="29" y="38" width="7" height="5" fill="currentColor"/>`),
    tpms: ic(`<path d="M13 37 C6 31 7 14 24 12 C41 14 42 31 35 37"/><path d="M11 41 H37 M13 37 L11 41 M35 37 L37 41"/>${t(24, 25, "!", 15)}`),
    fuel: ic(`<rect x="9" y="8" width="17" height="33" rx="2"/><rect x="13" y="12" width="9" height="8"/><path d="M26 17 H30 L34 21 V35 a3 3 0 0 0 6 0 V18 L36 14"/><path d="M6 41 H29"/>`),
    lowbeam: ic(`${lamp}<path d="M5 15 L19 19 M5 23 L19 27 M5 31 L19 35"/>`),
    highbeam: ic(`${lamp}<path d="M5 16 H20 M5 24 H20 M5 32 H20"/>`),
    fogfront: ic(`${lamp}<path d="M4 15 L19 19 M4 24 L19 28 M4 33 L19 37"/><path d="M12 10 q-3 4 0 8 t0 8 t0 8 t0 8"/>`),
    fogrear: ic(`<path d="M21 12 C12 12 6 17 6 24 C6 31 12 36 21 36 C23 30 23 18 21 12 Z"/><path d="M28 16 H44 M28 24 H44 M28 32 H44"/><path d="M36 10 q-3 4 0 8 t0 8 t0 8 t0 8"/>`),
    blinkers: ic(`<path d="M3 24 L14 14 V20 H21 V28 H14 V34 Z M45 24 L34 14 V20 H27 V28 H34 V34 Z" fill="currentColor" stroke="none"/>`),
    parkbrake: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24.5, 24.5, "P", 16)}`),
    autohold: ic(`<circle cx="24" cy="24" r="12"/>${brackets}${t(24, 24.5, "A", 16)}`),
    steering: ic(`<circle cx="22" cy="24" r="14"/><circle cx="22" cy="24" r="4"/><path d="M8 24 H18 M26 24 H36 M22 28 V38"/>${t(42, 10, "!", 13)}`),
    glow: ic(`<path d="M4 24 H10 q2.5 -8 5 0 q2.5 8 5 0 q2.5 -8 5 0 q2.5 8 5 0 q2.5 -8 5 0 H44"/><path d="M8 14 V34 M40 14 V34"/>`),
    frost: ic(`<path d="M24 5 V43 M7.5 14.5 L40.5 33.5 M7.5 33.5 L40.5 14.5"/><path d="M19 9 L24 13 L29 9 M19 39 L24 35 L29 39"/>`),
    service: ic(`<path d="M30 8 a9 9 0 0 0 -8 12 L8 34 a3.5 3.5 0 0 0 5 5 L27 25 a9 9 0 0 0 12 -8 l-6 2 l-4 -4 l2 -6 z"/>`),
    door: ic(`<path d="M7 31 L11 21 H37 L41 31 V37 H7 Z"/><path d="M12 37 V40 M36 37 V40"/><path d="M24 21 L15 11" stroke-width="3.5"/>`),
    washer: ic(`<path d="M6 36 Q24 20 42 36"/><path d="M24 30 V24"/><circle cx="18" cy="14" r="1.6" fill="currentColor"/><circle cx="24" cy="11" r="1.6" fill="currentColor"/><circle cx="30" cy="14" r="1.6" fill="currentColor"/><circle cx="14" cy="20" r="1.6" fill="currentColor"/><circle cx="34" cy="20" r="1.6" fill="currentColor"/>`),
    cruise: ic(`<path d="M8 34 a17 17 0 1 1 32 0"/><path d="M24 30 L32 18"/><circle cx="24" cy="31" r="2.5" fill="currentColor"/><path d="M38 6 l4 4 l-4 4"/>`),
  };

  window.BGSigns = { signSVG, signImage, signLabel, byCode, toCyr, ICONS, DATA };
})();
