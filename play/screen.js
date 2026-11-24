import { createSound } from './sound.js?v=11';

// Inside index.html the sound and the transitions belong to the shell.
// A page opened by its own link works alone, with its own sound.
// The shell may still be arriving when this screen starts, so calls wait for it.
function findHost() {
  try {
    return window.parent !== window && window.parent.pustPovezyotBoot ? window.parent : null;
  } catch {
    return null;
  }
}

const host = findHost();
let shell = host?.pustPovezyot ?? null;
const shellReady = !host ? null : shell ? Promise.resolve(shell) : new Promise(resolve => {
  host.addEventListener('pust:ready', () => resolve(shell = host.pustPovezyot), { once: true });
});

function relay() {
  const later = (method, args) => shellReady.then(found => found.sound[method](...args));
  const call = method => (...args) => (shell ? shell.sound[method](...args) : later(method, args));
  return {
    unlock: call('unlock'), play: call('play'), settle: call('settle'), setMood: call('setMood'), setScene: call('setScene'),
    setMuted: call('setMuted'), preload: call('preload'), prepare: call('prepare'),
    get muted() { return shell ? shell.sound.muted : false; },
    get state() { return shell?.sound.state; },
    subscribe(listener) {
      let stop = null;
      let cancelled = false;
      const attach = found => { if (!cancelled) stop = found.sound.subscribe(listener); };
      if (shell) attach(shell);
      else shellReady.then(found => { attach(found); listener(found.sound.muted); });
      return () => { cancelled = true; stop?.(); };
    },
  };
}

export const sound = host ? relay() : createSound();

export function go(url) {
  if (!host) location.assign(url);
  else if (shell) shell.go(url);
  else shellReady.then(found => found.go(url));
}

if (host) {
  const report = () => shellReady.then(found => found.ready(window));
  if (document.readyState === 'complete') report();
  else document.addEventListener('DOMContentLoaded', report, { once: true });
}

export const shown = new Promise(resolve => {
  if (!host || document.documentElement.hasAttribute('data-shown')) resolve();
  else addEventListener('screen:shown', () => resolve(), { once: true });
});

// Waves and slash match the sound button of «Вагон аппетита».
const icon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 25H20L31 16C32.3 15 33 15.3 33 17V47C33 48.7 32.3 49 31 48L20 39H12C10.7 39 10 38.3 10 37V27C10 25.7 10.7 25 12 25Z" fill="currentColor"/><path class="sound-waves" d="M41 24C47 28 47 36 41 40M47 17C58 24 58 40 47 47" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/><path class="sound-slash" d="M14 13L51 51" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/></svg>`;

const buttons = [];
function paintButtons() {
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(sound.muted));
    button.setAttribute('aria-label', sound.muted ? 'Включить звук' : 'Выключить звук');
  }
}

function addButton(place, where = '') {
  if (!place) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `sound-toggle ${where}`.trim();
  button.innerHTML = icon;
  button.addEventListener('click', () => {
    sound.setMuted(!sound.muted);
    sound.play('tap');
  });
  place.append(button);
  buttons.push(button);
}

for (const header of document.querySelectorAll('.header, .compact-header')) addButton(header);
addButton(document.querySelector('#start .desktop'), 'sound-toggle-start');
addButton(document.querySelector('#prediction .desktop'), 'sound-toggle-result');
paintButtons();
const unsubscribe = sound.subscribe(paintButtons);
addEventListener('pagehide', event => {
  if (!event.persisted) unsubscribe();
});

// Audio may only be opened by a gesture, so any gesture will do.
for (const type of ['pointerup', 'touchend', 'keydown', 'click']) {
  document.addEventListener(type, () => sound.unlock(), { capture: true, passive: true });
}

document.addEventListener('click', event => {
  const control = event.target.closest('a, button');
  if (!control || control.disabled || control.matches('.sound-toggle, .capsule-action, .vending-dial, .vending-trigger')) return;
  // Only a link that starts the machine at once pays a coin; «Запустить автомат» just opens it.
  const spins = control.tagName === 'A' && control.pathname.endsWith('/capsule.html') && control.search.includes('spin=1');
  sound.play(spins ? 'coin' : 'tap');
}, { capture: true });

// The machine stands in a noisy mall; the start, the prediction and the raffle share one easy tune.
const atMachine = !!document.querySelector('.capsule-stage');
shown.then(() => {
  sound.setScene(atMachine ? 'mall' : 'calm');
  sound.setMood(atMachine ? 'machine' : 'calm');
});
if (document.readyState === 'complete') sound.preload();
else addEventListener('load', () => setTimeout(() => sound.preload(), 50), { once: true });
