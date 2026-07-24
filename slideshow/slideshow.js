const BUCKET = 'familia-fotos';
const SLIDE_MS = 4000;
const EMPTY_RETRY_MS = 15000;

const imgA = document.getElementById('imgA');
const imgB = document.getElementById('imgB');
const emptyEl = document.getElementById('empty');
const stageEl = document.getElementById('stage');

let showingA = true;
let photos = [];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function publicUrl(path) {
  return sbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function loadPhotos() {
  const { data, error } = await sbClient.from('familia_fotos').select('storage_path').order('ordem', { ascending: true });
  if (error) { console.error(error); return [] }
  return (data || []).map(p => publicUrl(p.storage_path));
}

function preload(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

async function displayPhoto(url) {
  await preload(url);
  const nextImg = showingA ? imgB : imgA;
  const curImg = showingA ? imgA : imgB;
  nextImg.src = url;
  nextImg.classList.add('visible');
  curImg.classList.remove('visible');
  showingA = !showingA;
}

function setEmpty(isEmpty) {
  emptyEl.classList.toggle('hidden', !isEmpty);
  stageEl.style.display = isEmpty ? 'none' : '';
}

async function loop() {
  while (true) {
    photos = await loadPhotos();
    if (!photos.length) {
      setEmpty(true);
      await sleep(EMPTY_RETRY_MS);
      continue;
    }
    setEmpty(false);
    for (let i = 0; i < photos.length; i++) {
      await displayPhoto(photos[i]);
      await sleep(SLIDE_MS);
    }
  }
}

loop();
