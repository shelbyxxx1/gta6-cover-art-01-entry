// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the cover alone at its export size. window.__shotReady is set once painted.
// Query params: size (1080x1080 | 1080x1350 | 1920x1080), layout (poster | grid | strip),
// grade (golden | neon | heat | noir), title, kicker, tagline.
export async function runShot(shot, query, api) {
  const { state, loadSamplePhotos, selectPanel, queueRedraw } = api;
  if (query.get('size')) state.size = query.get('size');
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('title') !== null) {
    state.title = query.get('title');
    document.getElementById('title').value = state.title;
  }
  if (query.get('kicker') !== null) {
    state.kicker = query.get('kicker');
    document.getElementById('kicker').value = state.kicker;
  }
  if (query.get('tagline') !== null) {
    state.tagline = query.get('tagline');
    document.getElementById('tagline').value = state.tagline;
  }
  document.querySelectorAll('#sizePick button').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  document.querySelectorAll('#layoutPick button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradePick button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await loadSamplePhotos();
  selectPanel(0);
  queueRedraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
