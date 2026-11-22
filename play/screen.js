import { createSound } from './sound.js?v=1';

// Inside index.html the sound and the transitions belong to the shell.
// A page opened by its own link works alone, with its own sound.
function findShell() {
  try {
    return window.parent !== window ? window.parent.pustPovezyot ?? null : null;
  } catch {
    return null;
  }
}

const shell = findShell();
export const sound = shell?.sound ?? createSound();

export function go(url) {
  if (shell) shell.go(url);
  else location.assign(url);
}

if (shell) {
  const report = () => shell.ready(window);
  if (document.readyState === 'complete') report();
  else document.addEventListener('DOMContentLoaded', report, { once: true });
}

export const shown = new Promise(resolve => {
  if (!shell || document.documentElement.hasAttribute('data-shown')) resolve();
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
  const toMachine = control.tagName === 'A' && control.pathname.endsWith('/capsule.html');
  sound.play(toMachine ? 'coin' : 'tap');
}, { capture: true });

shown.then(() => sound.setMood(document.querySelector('.capsule-stage') ? 'machine' : 'calm'));
if (document.readyState === 'complete') sound.preload();
else addEventListener('load', () => setTimeout(() => sound.preload(), 500), { once: true });
