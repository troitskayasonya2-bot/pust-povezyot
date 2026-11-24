import { createSound } from './sound.js?v=9';

// One document for the whole game: the sound survives every transition,
// and the next screen appears only when it is ready.
const root = new URL('../', import.meta.url);
const allowed = /^(play|raffle-light-v14)\//;
const sound = createSound();
const safeArea = document.querySelector('.safe-area');
let current = null;
let waiting = null;

function routeOf(value) {
  try {
    const url = new URL(value, root);
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return null;
    const path = url.pathname.slice(root.pathname.length);
    return allowed.test(path) ? path + url.search : null;
  } catch {
    return null;
  }
}

function passSafeArea(frame) {
  try {
    const style = getComputedStyle(safeArea);
    const target = frame.contentDocument.documentElement.style;
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) target.setProperty(`--safe-${side.toLowerCase()}`, style[`padding${side}`]);
  } catch {
    // The frame shows a browser error page.
  }
}

function present(frame) {
  if (frame !== waiting && frame !== current) return;
  passSafeArea(frame);
  if (frame === waiting) {
    const previous = current;
    waiting = null;
    current = frame;
    frame.removeAttribute('data-waiting');
    if (previous) {
      previous.inert = true;
      setTimeout(() => previous.remove(), 300);
    }
    frame.focus({ preventScroll: true });
  }
  try {
    const page = frame.contentDocument;
    document.title = page.title || 'Пусть повезёт';
    document.documentElement.style.backgroundColor = page.documentElement.style.backgroundColor;
    page.documentElement.setAttribute('data-shown', '');
    frame.contentWindow.dispatchEvent(new Event('screen:shown'));
  } catch {
    // The frame shows a browser error page.
  }
}

function adopt(frame) {
  waiting = frame;
  frame.addEventListener('load', () => present(frame));
  try {
    if (frame.contentDocument?.readyState === 'complete' && frame.contentWindow.location.href !== 'about:blank') present(frame);
  } catch {
    // A browser error page: the timer below shows it.
  }
  setTimeout(() => { if (frame === waiting) present(frame); }, 7000);
}

function show(route) {
  waiting?.remove();
  sound.settle();
  const frame = document.createElement('iframe');
  frame.className = 'screen-frame';
  frame.title = 'Пусть повезёт';
  frame.allow = 'autoplay';
  frame.setAttribute('data-waiting', '');
  frame.addEventListener('load', () => present(frame));
  frame.src = new URL(route, root).href;
  waiting = frame;
  document.body.append(frame);
  // A slow picture does not keep the player on the previous screen.
  setTimeout(() => {
    if (frame === waiting) present(frame);
  }, 7000);
}

function addressOf(route) {
  const url = new URL(route, root);
  url.searchParams.delete('spin');                 // Back and reload never spin by themselves.
  const clean = url.pathname.slice(root.pathname.length) + url.search;
  return clean === 'play/' ? location.pathname : `${location.pathname}#/${clean}`;
}

window.pustPovezyot = {
  sound,
  // The first screen appears as soon as it is laid out. Later ones wait briefly for their pictures.
  ready(view) {
    const frame = waiting;
    if (!frame || frame.contentWindow !== view) return;
    if (!current) present(frame);
    else setTimeout(() => { if (frame === waiting) present(frame); }, 450);
  },
  go(url) {
    const route = routeOf(url);
    if (!route) {
      location.assign(url);
      return;
    }
    history.pushState(null, '', addressOf(route));
    show(route);
  },
};

function routeFromAddress() {
  return (location.hash.startsWith('#/') && routeOf(location.hash.slice(2))) ||
    `play/${new URLSearchParams(location.search).get('state') === 'open' ? '?state=open' : ''}`;
}

addEventListener('popstate', () => show(routeFromAddress()));

addEventListener('resize', () => { if (current) passSafeArea(current); });
const first = document.querySelector('.screen-frame[data-route]');
if (first && first.dataset.route === routeFromAddress()) adopt(first);
else {
  first?.remove();
  show(routeFromAddress());
}
dispatchEvent(new Event('pust:ready'));
