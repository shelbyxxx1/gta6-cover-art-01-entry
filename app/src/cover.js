// Golden Hour Cover Studio — draws the multi-panel GTA-style cover onto a canvas.
// One state object in, one finished poster out: photo panels with crop/zoom, a sunset
// or neon colour grade, drawn decorations (retro sun, palms, stars) and bold lettering.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

const GRADES = {
  golden: {
    filter: 'saturate(1.28) contrast(1.08) brightness(1.02)',
    wash: ['rgba(255,122,40,0.10)', 'rgba(232,30,110,0.24)'],
    washMode: 'soft-light',
    vignette: 0.30,
  },
  neon: {
    filter: 'saturate(1.38) contrast(1.12) hue-rotate(-8deg)',
    wash: ['rgba(0,229,255,0.14)', 'rgba(255,46,136,0.26)'],
    washMode: 'overlay',
    vignette: 0.34,
  },
  heat: {
    filter: 'saturate(1.55) contrast(1.26) sepia(0.28)',
    wash: ['rgba(255,90,0,0.20)', 'rgba(200,20,60,0.30)'],
    washMode: 'overlay',
    vignette: 0.26,
  },
  noir: {
    filter: 'saturate(0.82) contrast(1.16) brightness(0.96)',
    wash: ['rgba(0,120,140,0.20)', 'rgba(255,150,60,0.12)'],
    washMode: 'soft-light',
    vignette: 0.40,
  },
};

const FRAME = '#14082b';
const GUTTER = 10;

/** Panel rectangles for a size + layout, as fractions of the photo area above the caption band. */
export function layoutPanels(sizeKey, layout) {
  const { w, h } = SIZES[sizeKey];
  const bandH = Math.round(h * 0.17);
  const top = h - bandH;
  const g = GUTTER;
  const px = (x, y, pw, ph, photo) => ({ x, y, w: pw, h: ph, photo });
  if (layout === 'grid') {
    return {
      bandH,
      cells: [
        px(g, g, (w - 3 * g) / 2, (top - 3 * g) / 2, 0),
        px(g * 2 + (w - 3 * g) / 2, g, (w - 3 * g) / 2, (top - 3 * g) / 2, 1),
        px(g, g * 2 + (top - 3 * g) / 2, (w - 3 * g) / 2, (top - 3 * g) / 2, 2),
        px(g * 2 + (w - 3 * g) / 2, g * 2 + (top - 3 * g) / 2, (w - 3 * g) / 2, (top - 3 * g) / 2, 0),
      ],
    };
  }
  if (layout === 'strip') {
    const heroH = Math.round(top * 0.55);
    const rowH = top - heroH - 2 * g;
    const cw = (w - 4 * g) / 3;
    return {
      bandH,
      cells: [
        px(g, g, w - 2 * g, heroH - g, 0),
        px(g, heroH + g, cw, rowH, 0),
        px(g * 2 + cw, heroH + g, cw, rowH, 1),
        px(g * 3 + cw * 2, heroH + g, cw, rowH, 2),
      ],
    };
  }
  // poster: one hero panel + two stacked panels beside (or below) it.
  if (w >= h) {
    const heroW = Math.round(w * 0.60);
    const sideW = w - heroW - 3 * g;
    const halfH = (top - 3 * g) / 2;
    return {
      bandH,
      cells: [
        px(g, g, heroW, top - 2 * g, 0),
        px(heroW + 2 * g, g, sideW, halfH, 1),
        px(heroW + 2 * g, g * 2 + halfH, sideW, halfH, 2),
      ],
    };
  }
  const heroH = Math.round(top * 0.58);
  const halfW = (w - 3 * g) / 2;
  return {
    bandH,
    cells: [
      px(g, g, w - 2 * g, heroH - g, 0),
      px(g, heroH + g, halfW, top - heroH - 2 * g, 1),
      px(g * 2 + halfW, heroH + g, halfW, top - heroH - 2 * g, 2),
    ],
  };
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and shift. */
export function drawPhotoPanel(ctx, photo, rect, crop) {
  if (!photo || !photo.naturalWidth) {
    ctx.fillStyle = '#2b1838';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const zoom = crop?.zoom ?? 1;
  const dw = photo.naturalWidth * base * zoom;
  const dh = photo.naturalHeight * base * zoom;
  const dx = rect.x + (rect.w - dw) / 2 + (crop?.ox ?? 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (crop?.oy ?? 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/** Sunset / neon colour grade: a warm wash, halftone dots and a vignette over one panel. */
export function applyGrade(ctx, rect, gradeKey) {
  const grade = GRADES[gradeKey] ?? GRADES.golden;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.globalCompositeOperation = grade.washMode;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  drawHalftone(ctx, rect, 0.05);
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.42,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.72,
  );
  vig.addColorStop(0, 'rgba(16,4,36,0)');
  vig.addColorStop(1, `rgba(16,4,36,${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** A light halftone dot screen across the lower half of a panel. */
export function drawHalftone(ctx, rect, alpha) {
  const step = 9;
  const startY = rect.y + rect.h * 0.55;
  ctx.fillStyle = `rgba(20,4,40,${alpha})`;
  for (let y = startY; y < rect.y + rect.h; y += step) {
    for (let x = rect.x + step / 2; x < rect.x + rect.w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Retro striped sun disc, drawn in the corner of the hero panel. */
export function drawRetroSun(ctx, cx, cy, r) {
  // Stripes are cut on an offscreen canvas so they erase only the sun, never the photo.
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 2) + 2;
  off.height = Math.ceil(r * 2) + 2;
  const o = off.getContext('2d');
  const grad = o.createLinearGradient(0, 0, 0, off.height);
  grad.addColorStop(0, '#ffe45e');
  grad.addColorStop(0.55, '#ff7a18');
  grad.addColorStop(1, '#ff2e88');
  o.fillStyle = grad;
  o.beginPath();
  o.arc(off.width / 2, off.height / 2, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = off.height / 2 + r * 0.05;
  let gap = r * 0.07;
  while (y < off.height) {
    o.fillRect(0, y, off.width, gap);
    y += gap * 2.4;
    gap *= 1.25;
  }
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
}

/** One palm silhouette: a curved trunk with five short fronds. */
export function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  ctx.strokeStyle = FRAME;
  ctx.fillStyle = FRAME;
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(5, -42, 18, -70);
  ctx.stroke();
  const fronds = [[-46, -56], [-30, -76], [-5, -83], [24, -78], [44, -58]];
  ctx.lineWidth = 6;
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(18, -70);
    ctx.quadraticCurveTo(18 + fx * 0.55, -70 + fy * 0.62, 18 + fx, -70 + fy);
    ctx.stroke();
  }
  ctx.restore();
}

/** A row of small gold stars. */
export function drawStarRow(ctx, x, y, size, count) {
  ctx.fillStyle = '#ffd23e';
  for (let i = 0; i < count; i++) {
    drawStar(ctx, x + i * size * 1.7, y, size);
  }
}

export function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** Round "VOL. 01" stamp in the hero panel's corner. */
export function drawVolumeStamp(ctx, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.fillStyle = 'rgba(20,8,43,0.55)';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(r * 0.42)}px Anton, sans-serif`;
  ctx.fillText('VOL.', cx, cy - r * 0.2);
  ctx.fillText('01', cx, cy + r * 0.28);
  ctx.restore();
}

/** The caption band: sunset gradient, kicker, huge title, script tagline, palms, stars. */
export function drawCaptionBand(ctx, w, h, bandH, state) {
  const y0 = h - bandH;
  const band = ctx.createLinearGradient(0, y0, 0, h);
  band.addColorStop(0, '#d61e7e');
  band.addColorStop(0.55, '#ff5e1f');
  band.addColorStop(1, '#ffb300');
  ctx.fillStyle = band;
  ctx.fillRect(0, y0, w, bandH);
  ctx.fillStyle = 'rgba(20,8,43,0.18)';
  ctx.fillRect(0, y0, w, 3);
  if (state.decor.palms) {
    drawPalm(ctx, w * 0.045, h - 4, bandH / 200, -0.12);
    drawPalm(ctx, w * 0.955, h - 4, bandH / 230, 0.14);
  }
  const cx = w / 2;
  const kicker = (state.kicker || '').trim().toUpperCase().split('').join(' ');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (kicker) {
    ctx.font = `${Math.round(bandH * 0.15)}px Anton, sans-serif`;
    ctx.fillStyle = '#ffe45e';
    ctx.fillText(`★ ${kicker} ★`, cx, y0 + bandH * 0.22);
  }
  drawCoverTitle(ctx, (state.title || '').trim().toUpperCase(), cx, y0 + bandH * 0.66, w * 0.88, bandH * 0.46);
  if (state.decor.stars) drawStarRow(ctx, w - w * 0.115, y0 + bandH * 0.20, bandH * 0.055, 5);
  const tagline = (state.tagline || '').trim();
  if (tagline) {
    ctx.font = `${Math.round(bandH * 0.19)}px Pacifico, cursive`;
    ctx.fillStyle = '#c8f4ff';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = bandH * 0.10;
    ctx.fillText(tagline, cx, y0 + bandH * 0.90);
    ctx.shadowBlur = 0;
  }
}

/** Huge condensed title with a dark outline and a warm gradient fill, auto-fit to the width. */
export function drawCoverTitle(ctx, text, cx, baselineY, maxWidth, maxSize) {
  if (!text) return;
  let size = maxSize;
  ctx.font = `${Math.round(size)}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${Math.round(size)}px Anton, sans-serif`;
  }
  const grad = ctx.createLinearGradient(0, baselineY - size, 0, baselineY);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#ffe9a8');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.13);
  ctx.strokeStyle = FRAME;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = size * 0.07;
  ctx.shadowOffsetY = size * 0.05;
  ctx.strokeText(text, cx, baselineY);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, baselineY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/** Draws the whole cover for the given state onto the canvas (already sized to the export size). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.golden;
  ctx.filter = 'none';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = FRAME;
  ctx.fillRect(0, 0, w, h);
  const { bandH, cells } = layoutPanels(state.size, state.layout);
  const photos = state.panels.map((p) => (state.onePhoto ? state.panels[0].photo : p.photo));
  cells.forEach((cell) => {
    const panel = state.panels[cell.photo];
    ctx.filter = grade.filter;
    drawPhotoPanel(ctx, photos[cell.photo], cell, panel);
    ctx.filter = 'none';
    applyGrade(ctx, cell, state.grade);
  });
  if (state.decor.sun && cells[0]) {
    const hero = cells[0];
    const r = Math.min(hero.w, hero.h) * 0.11;
    ctx.save();
    ctx.beginPath();
    ctx.rect(hero.x, hero.y, hero.w, hero.h);
    ctx.clip();
    drawRetroSun(ctx, hero.x + hero.w - r * 1.5, hero.y + r * 1.5, r);
    ctx.restore();
    drawVolumeStamp(ctx, hero.x + r * 1.6, hero.y + r * 1.6, r * 0.85);
  }
  drawCaptionBand(ctx, w, h, bandH, state);
}
