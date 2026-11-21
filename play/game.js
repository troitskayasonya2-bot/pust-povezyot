import { getOutcome } from './outcomes.js?v=3';

const params = new URLSearchParams(location.search);
const isPrediction = params.get('view') === 'prediction';
const openRaffle = params.get('state') === 'open';

const start = document.querySelector('#start');
const prediction = document.querySelector('#prediction');
start.hidden = isPrediction;
prediction.hidden = !isPrediction;
const scene = isPrediction ? prediction : start;
if (isPrediction) document.title = 'Предсказание · Пусть повезёт';

if (openRaffle) {
  for (const link of scene.querySelectorAll('[data-action]')) {
    const target = new URL(link.href);
    target.searchParams.set('state', 'open');
    link.href = target.href;
  }
}

const desktop = scene.querySelector('.desktop');
const vectorInterface = desktop.querySelector('.desktop-interface');
const wide = matchMedia('(min-width: 1000px) and (min-height: 640px) and (min-aspect-ratio: 5/4)');

if (isPrediction) {
  const outcome = getOutcome(params.get('prize'));
  for (const link of prediction.querySelectorAll('[data-action="again"]')) {
    const target = new URL(link.href);
    target.searchParams.set('after', outcome.id);
    link.href = target.href;
  }
  if (outcome.id !== 'ring') {
    vectorInterface.dataset.src = 'assets/desktop-result-frame.svg?v=6';
    desktop.querySelector('.desktop-outcome').classList.remove('sr-only');
  }

  const shell = outcome.shell ?? 'assets/open-capsule.svg';
  for (const illustration of prediction.querySelectorAll('[data-outcome-art]')) {
    illustration.alt = outcome.alt;
    illustration.dataset.waiting = '';
    illustration.dataset.fallback = shell;
    illustration.style.setProperty('--prediction-shell', `url("${shell}")`);
    illustration.src = outcome.art;
  }
  for (const title of prediction.querySelectorAll('[data-outcome-title]')) title.textContent = outcome.title;
  for (const text of prediction.querySelectorAll('[data-outcome-text]')) text.textContent = outcome.text;
}

function loadDesktopInterface() {
  if (!wide.matches || vectorInterface.hasAttribute('src')) return;
  vectorInterface.src = vectorInterface.dataset.src;
  vectorInterface.decode()
    .then(() => desktop.setAttribute('data-ready', ''))
    .catch(() => {
      vectorInterface.removeAttribute('src');
      if (!isPrediction) loadMachineIllustration(start.querySelector('.compact-machine'));
    });
}

function loadMachineIllustration(art) {
  const images = [...art.querySelectorAll('img')];
  if (images[0].hasAttribute('src')) return;
  for (const image of images) image.src = image.dataset.src;
  Promise.all(images.map(image => image.decode()))
    .then(() => art.setAttribute('data-loaded', ''))
    .catch(() => {});
}

for (const illustration of scene.querySelectorAll('[data-fallback]')) {
  illustration.addEventListener('load', () => {
    illustration.removeAttribute('data-waiting');
  });
  const useFallback = () => {
    if (illustration.hasAttribute('data-fallback-active')) return;
    illustration.setAttribute('data-fallback-active', '');
    illustration.src = illustration.dataset.fallback;
    if (illustration.alt) illustration.alt = 'Капсула';
  };
  illustration.addEventListener('error', useFallback);
  if (illustration.hasAttribute('src') && illustration.complete && !illustration.naturalWidth) useFallback();
}

wide.addEventListener('change', loadDesktopInterface);
loadDesktopInterface();

if (!isPrediction) {
  const loadArtworkForViewport = () => {
    loadMachineIllustration(start.querySelector(wide.matches ? '.desktop-hero' : '.compact-machine'));
  };
  wide.addEventListener('change', loadArtworkForViewport);
  loadArtworkForViewport();
}
