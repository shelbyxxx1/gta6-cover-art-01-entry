// Golden Hour Cover Studio — wires the editor: photos, panel crop, words, size, look, export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { SIZES, layoutPanels, drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

const state = {
  size: '1920x1080',
  layout: 'poster',
  grade: 'golden',
  kicker: 'SOLMAR BAY',
  title: 'GOLDEN HOUR',
  tagline: 'every street is a stage',
  onePhoto: false,
  decor: { sun: true, palms: true, stars: true },
  panels: [
    { photo: null, zoom: 1, ox: 0, oy: 0 },
    { photo: null, zoom: 1, ox: -0.15, oy: 0 },
    { photo: null, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selected = 0;
let redrawQueued = false;

function queueRedraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(() => {
    redrawQueued = false;
    const { w, h } = SIZES[state.size];
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    drawCover(canvas, state);
  });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads the three bundled sample photos into the panels. */
export async function loadSamplePhotos() {
  const [hero, pier, neon] = await Promise.all([
    loadImage('samples/hero-woman.jpg'),
    loadImage('samples/pier-man.jpg'),
    loadImage('samples/neon-street.jpg'),
  ]);
  state.panels[0].photo = hero;
  state.panels[1].photo = pier;
  state.panels[2].photo = neon;
  queueRedraw();
}

function syncPanelControls() {
  const p = state.panels[selected];
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('shiftX').value = p.ox;
  document.getElementById('shiftY').value = p.oy;
  document.querySelectorAll('#panelPick button').forEach((b) => {
    b.classList.toggle('on', Number(b.dataset.panel) === selected);
  });
}

function selectPanel(i) {
  selected = i;
  syncPanelControls();
}

/** Which panel (by photo index) sits under a point on the canvas, if any. */
export function panelAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const { cells } = layoutPanels(state.size, state.layout);
  const hit = cells.find((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
  return hit ? hit.photo : -1;
}

document.getElementById('loadSamples').addEventListener('click', async () => {
  status.textContent = 'Loading sample photos…';
  await loadSamplePhotos();
  status.textContent = 'Sample photos loaded.';
});
document.getElementById('onePhoto').addEventListener('change', (e) => {
  state.onePhoto = e.target.checked;
  queueRedraw();
});
[0, 1, 2].forEach((i) => {
  document.getElementById(`photo${i}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.panels[i].photo = await loadImage(URL.createObjectURL(file));
    selectPanel(i);
    queueRedraw();
    status.textContent = `Photo ${i + 1} loaded.`;
  });
});
document.querySelectorAll('#panelPick button').forEach((b) => {
  b.addEventListener('click', () => selectPanel(Number(b.dataset.panel)));
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selected].zoom = Number(e.target.value);
  queueRedraw();
});
document.getElementById('shiftX').addEventListener('input', (e) => {
  state.panels[selected].ox = Number(e.target.value);
  queueRedraw();
});
document.getElementById('shiftY').addEventListener('input', (e) => {
  state.panels[selected].oy = Number(e.target.value);
  queueRedraw();
});
document.getElementById('kicker').addEventListener('input', (e) => {
  state.kicker = e.target.value;
  queueRedraw();
});
document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  queueRedraw();
});
document.getElementById('tagline').addEventListener('input', (e) => {
  state.tagline = e.target.value;
  queueRedraw();
});
document.getElementById('sizePick').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-size]');
  if (!b) return;
  state.size = b.dataset.size;
  document.querySelectorAll('#sizePick button').forEach((x) => x.classList.toggle('on', x === b));
  queueRedraw();
});
document.getElementById('layoutPick').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-layout]');
  if (!b) return;
  state.layout = b.dataset.layout;
  document.querySelectorAll('#layoutPick button').forEach((x) => x.classList.toggle('on', x === b));
  queueRedraw();
});
document.getElementById('gradePick').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-grade]');
  if (!b) return;
  state.grade = b.dataset.grade;
  document.querySelectorAll('#gradePick button').forEach((x) => x.classList.toggle('on', x === b));
  queueRedraw();
});
document.getElementById('decorSun').addEventListener('change', (e) => {
  state.decor.sun = e.target.checked;
  queueRedraw();
});
document.getElementById('decorPalms').addEventListener('change', (e) => {
  state.decor.palms = e.target.checked;
  queueRedraw();
});
document.getElementById('decorStars').addEventListener('change', (e) => {
  state.decor.stars = e.target.checked;
  queueRedraw();
});

// Drag on the canvas pans the selected panel's photo; the wheel zooms it.
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAtPoint(e.clientX, e.clientY);
  if (hit >= 0) selectPanel(hit);
  dragging = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const p = state.panels[selected];
  p.ox += ((e.clientX - dragging.x) / rect.width) * (canvas.width / rect.width) * 0.5;
  p.oy += ((e.clientY - dragging.y) / rect.height) * (canvas.height / rect.height) * 0.5;
  p.ox = Math.max(-0.5, Math.min(0.5, p.ox));
  p.oy = Math.max(-0.5, Math.min(0.5, p.oy));
  dragging = { x: e.clientX, y: e.clientY };
  syncPanelControls();
  queueRedraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[selected];
  p.zoom = Math.max(1, Math.min(3, p.zoom - e.deltaY * 0.0015));
  syncPanelControls();
  queueRedraw();
}, { passive: false });

/** Exports the cover at its full size as a PNG download. */
export function exportCoverPNG() {
  const { w, h } = SIZES[state.size];
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `golden-hour-cover-${w}x${h}.png`;
      a.click();
      status.textContent = `Saved golden-hour-cover-${w}x${h}.png`;
      resolve(a.download);
    }, 'image/png');
  });
}
document.getElementById('export').addEventListener('click', exportCoverPNG);

// Boot: wait for the display fonts, load the samples, then paint the first cover.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
async function boot() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('40px Anton'),
        document.fonts.load('40px Pacifico'),
        document.fonts.ready,
      ]),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch { /* fall back to system fonts */ }
  if (shot) {
    await runShot(shot, params, { state, loadSamplePhotos, selectPanel, queueRedraw, exportCoverPNG });
  } else {
    await loadSamplePhotos();
    selectPanel(0);
  }
}
boot();
