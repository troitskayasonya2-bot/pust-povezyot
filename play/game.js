import { getOutcome } from './outcomes.js?v=11';
import { shown, sound } from './screen.js?v=1';

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
  shown.then(() => sound.play(`toy-${outcome.toy}`, { delay: .16 }));
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
    illustration.parentElement.style.setProperty('--prediction-shell', `url("${shell}")`);
    illustration.src = outcome.art;
  }
  for (const title of prediction.querySelectorAll('[data-outcome-title]')) title.textContent = outcome.title;
  for (const text of prediction.querySelectorAll('[data-outcome-text]')) text.textContent = outcome.text;
}

function loadDesktopInterface() {
  if (!wide.matches || vectorInterface.hasAttribute('src')) return;
  desktop.removeAttribute('data-layout-fallback');
  vectorInterface.src = vectorInterface.dataset.src;
  const buttons = [...desktop.querySelectorAll('.hotspot-art')];
  for (const image of buttons) image.loading = 'eager';
  Promise.all([vectorInterface.decode(), ...buttons.map(image => image.decode())])
    .then(() => desktop.setAttribute('data-ready', ''))
    .catch(() => {
      vectorInterface.removeAttribute('src');
      desktop.setAttribute('data-layout-fallback', '');
      if (!isPrediction) loadMachineIllustration(start.querySelector('.compact-machine'));
    });
}

function loadMachineIllustration(art) {
  const images = [...art.querySelectorAll('img')];
  if (images[0].hasAttribute('src')) return;
  for (const image of images) image.src = image.dataset.src;
  Promise.all(images.map(image => image.decode()))
    .then(() => art.setAttribute('data-loaded', ''))
    .catch(() => useFallback(images[0]));
}

function useFallback(illustration) {
  if (illustration.hasAttribute('data-fallback-active')) return;
  illustration.setAttribute('data-fallback-active', '');
  illustration.src = illustration.dataset.fallback;
  if (illustration.alt) illustration.alt = 'Капсула';
}

for (const illustration of scene.querySelectorAll('[data-fallback]')) {
  illustration.addEventListener('load', () => {
    illustration.removeAttribute('data-waiting');
  });
  illustration.addEventListener('error', () => useFallback(illustration));
  if (illustration.hasAttribute('src') && illustration.complete && !illustration.naturalWidth) useFallback(illustration);
}

// The next screen is fetched while the player reads this one.
function warmNextScreen() {
  if (navigator.connection?.saveData) return;
  for (const [href, as] of [
    ['capsule.html', 'document'], ['capsule.css?v=10', 'style'], ['capsule.js?v=12', 'script'],
    ['assets/vending-machine.svg', 'fetch'], ['assets/vending-background.svg', 'image'], ['assets/vending-rays.svg', 'image'],
  ]) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    if (as !== 'document') link.as = as;
    document.head.append(link);
  }
}
if (document.readyState === 'complete') setTimeout(warmNextScreen, 300);
else addEventListener('load', () => setTimeout(warmNextScreen, 300), { once: true });

wide.addEventListener('change', loadDesktopInterface);
loadDesktopInterface();

if (!isPrediction) {
  const loadArtworkForViewport = () => {
    loadMachineIllustration(start.querySelector(wide.matches ? '.desktop-hero' : '.compact-machine'));
  };
  wide.addEventListener('change', loadArtworkForViewport);
  loadArtworkForViewport();
}
