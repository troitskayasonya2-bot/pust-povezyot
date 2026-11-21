import { drawOutcome, saveOutcome } from './outcomes.js?v=3';

const stage = document.querySelector('.capsule-stage');
const screen = stage.closest('.capsule-screen');
const form = stage.querySelector('.capsule-form');
const status = stage.querySelector('.vending-status');
const frame = stage.querySelector('.vending-frame');
const machine = stage.querySelector('.vending-machine');
const machineArt = stage.querySelector('.vending-art');
const dial = stage.querySelector('.vending-dial');
const trigger = stage.querySelector('.vending-trigger');
const outlet = stage.querySelector('.vending-outlet');
const outletBall = outlet.querySelector('img');
const action = stage.querySelector('.capsule-action');
const ball = stage.querySelector('.capsule-roll');
const picture = stage.querySelector('.capsule-art');
const motion = matchMedia('(prefers-reduced-motion: no-preference)');

let knob;
let stock;
let pendingDraw;
const rewardPreview = new Image();
rewardPreview.decoding = 'async';
let gesture = null;
const query = new URLSearchParams(location.search);
const replay = query.get('spin') === '1';
stage.toggleAttribute('data-replay', replay);

if (query.get('state') === 'open') {
  form.elements.state.disabled = false;
  document.querySelector('.footer a').href = './?state=open';
}

const announcements = {
  ready: '',
  centering: 'Автомат запускается',
  turning: 'Автомат запущен',
  dispensing: 'Капсула появляется в лотке',
  presenting: 'Капсула выкатывается',
  available: 'Капсула готова. Открой её.',
  opening: 'Капсула открывается',
  error: 'Автомат не загрузился. Обнови страницу.',
};

function setPhase(phase) {
  stage.dataset.phase = phase;
  status.textContent = announcements[phase];
  dial.disabled = phase !== 'ready';
  trigger.disabled = phase !== 'ready';
  action.disabled = phase !== 'available';
  trigger.textContent = phase === 'error' ? 'Автомат не загрузился' : 'Крутить';
}

async function animate(element, frames, options) {
  if (!motion.matches) return;
  await element.animate(frames, options).finished.catch(() => {});
}

async function centerMachine() {
  if (replay) return;
  setPhase('centering');
  const from = frame.getBoundingClientRect();
  await animate(trigger, [
    { opacity: 1, scale: 1 },
    { opacity: 1, scale: .98, offset: .35 },
    { opacity: 0, scale: .95 },
  ], { duration: 205, easing: 'ease-out', fill: 'forwards' });

  stage.dataset.centered = '';
  const to = frame.getBoundingClientRect();
  await animate(frame, [
    { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` },
    { transform: 'none' },
  ], { duration: 545, easing: 'cubic-bezier(.22,1,.36,1)' });
}

const shakeDuration = 4100;
const shakeBeats = [
  [0, 0, 0], [.045, 4, .8], [.09, -7, -1.8], [.14, 7, 1.7],
  [.185, -5, -1.2], [.235, 3, .7], [.28, 0, 0], [.35, 0, 0],
  [.39, -4, -1.1], [.435, 8, 2], [.48, -9, -2.2], [.53, 7, 1.85],
  [.575, -5, -1.35], [.62, 4, 1], [.67, 0, 0], [.73, 0, 0],
  [.77, 3, .75], [.81, -5, -1.3], [.85, 5, 1.2], [.895, -3, -.7],
  [.94, 2, .4], [1, 0, 0],
];

function shakeStock(element, index) {
  const direction = index % 2 === 0 ? 1 : -1;
  const height = 10 + (index % 4) * 4;
  const delay = (index % 3) * .008;

  return animate(element, shakeBeats.map(([offset, x]) => {
    const y = x * direction > 0 ? -height : 4;
    return {
      offset: offset === 0 || offset === 1 ? offset : offset + delay,
      transform: `translate(${x * direction * 1.1}px, ${Math.abs(x) * y / 9}px) rotate(${x * direction * 1.25}deg)`,
    };
  }), { duration: shakeDuration });
}

async function vend(start = 0, direction = 1) {
  if (stage.dataset.phase !== 'ready') return;
  gesture = null;
  const keyboard = dial.matches(':focus-visible') || trigger.matches(':focus-visible');
  pendingDraw = drawOutcome(query.get('after'));
  const { outcome } = pendingDraw;
  form.elements.prize.value = outcome.id;
  form.elements.prize.disabled = false;
  rewardPreview.src = outcome.art;
  rewardPreview.decode().catch(() => {});

  await centerMachine();
  screen.style.setProperty('--shake-time', `${shakeDuration}ms`);
  setPhase('turning');
  if (motion.matches && navigator.userActivation?.hasBeenActive !== false) {
    navigator.vibrate?.([45, 130, 70, 130, 75, 150, 55, 260, 50, 130, 90, 115, 80, 115, 65, 430, 45, 140, 65, 140, 45]);
  }

  await Promise.all([
    animate(knob, [
      { transform: `rotate(${start}deg)` },
      { transform: `rotate(${direction * 360}deg)` },
    ], { duration: 680, easing: 'cubic-bezier(.2,.66,.36,1)' }),
    animate(machine, shakeBeats.map(([offset, x, tilt]) => ({
      offset, transform: `translateX(${x}px) rotate(${tilt}deg)`,
    })), { duration: shakeDuration }),
    ...stock.map(shakeStock),
  ]);
  knob.style.removeProperty('--turn');

  setPhase('dispensing');
  outlet.hidden = false;
  const dropOptions = { duration: 1450, fill: 'forwards' };
  await Promise.all([
    animate(outletBall, [
      { transform: 'translateY(-105%) rotate(-16deg)', easing: 'ease-out' },
      { transform: 'translateY(-68%) rotate(-12deg)', offset: .31 },
      { transform: 'translateY(-71%) rotate(-13deg)', offset: .52 },
      { transform: 'translateY(-66%) rotate(-11deg)', offset: .74, easing: 'cubic-bezier(.48,.04,.86,.54)' },
      { transform: 'translateY(14%) rotate(-8deg)' },
    ], dropOptions),
    animate(machine, [
      { transform: 'none' },
      { transform: 'scale(1.08)' },
    ], { ...dropOptions, easing: 'ease-out' }),
  ]);

  const from = outletBall.getBoundingClientRect();
  action.hidden = false;
  const to = action.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = from.width / to.width;
  outlet.hidden = true;
  stage.dataset.reveal = '';
  setPhase('presenting');

  await animate(ball, [
    { transform: `translate(${dx}px,${dy}px) scale(${scale}) rotate(-8deg)` },
    { transform: `translate(${dx * .23}px,${dy * .22 - 18}px) scale(.86) rotate(5deg)`, offset: .67 },
    { transform: 'translate(0,0) scale(1) rotate(0)' },
  ], { duration: 780, easing: 'cubic-bezier(.24,.64,.34,1)' });

  setPhase('available');
  if (keyboard) action.focus({ preventScroll: true });
}

function angleAt(event) {
  const box = dial.getBoundingClientRect();
  return Math.atan2(event.clientY - box.top - box.height / 2,
    event.clientX - box.left - box.width / 2) * 180 / Math.PI;
}

dial.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || stage.dataset.phase !== 'ready') return;
  gesture = { id: event.pointerId, previous: angleAt(event), rotation: 0 };
  dial.setPointerCapture(event.pointerId);
});

dial.addEventListener('pointermove', event => {
  if (gesture?.id !== event.pointerId) return;
  const angle = angleAt(event);
  const delta = (angle - gesture.previous + 540) % 360 - 180;
  gesture.previous = angle;
  gesture.rotation = Math.max(-160, Math.min(160, gesture.rotation + delta));
  if (motion.matches) knob.style.setProperty('--turn', `${gesture.rotation}deg`);
});

dial.addEventListener('pointerup', event => {
  if (gesture?.id !== event.pointerId) return;
  const { rotation } = gesture;
  if (Math.abs(rotation) >= 24) vend(rotation, Math.sign(rotation));
  else cancelTurn(event);
});

function cancelTurn(event) {
  if (gesture?.id !== event.pointerId) return;
  gesture = null;
  knob.style.removeProperty('--turn');
}

dial.addEventListener('pointercancel', cancelTurn);
dial.addEventListener('lostpointercapture', cancelTurn);
dial.addEventListener('click', () => vend());
dial.addEventListener('wheel', event => {
  if (stage.dataset.phase !== 'ready' || !event.deltaY || event.ctrlKey) return;
  event.preventDefault();
  vend(0, Math.sign(event.deltaY));
}, { passive: false });
trigger.addEventListener('click', () => vend());

form.addEventListener('submit', async event => {
  if (stage.dataset.phase !== 'available') {
    event.preventDefault();
    return;
  }
  if (pendingDraw) {
    saveOutcome(pendingDraw);
    pendingDraw = null;
  }
  if (!motion.matches) return;
  event.preventDefault();
  setPhase('opening');

  const options = { duration: 290, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' };
  await Promise.all([
    animate(stage.querySelector('.capsule-shell-top'), [
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: 'translate(-16%,-31%) rotate(-17deg)', opacity: .35 },
    ], options),
    animate(stage.querySelector('.capsule-shell-bottom'), [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(8%)', opacity: .35 },
    ], options),
  ]);
  form.submit();
});

window.addEventListener('pageshow', event => {
  if (!event.persisted || stage.dataset.phase !== 'opening') return;
  for (const shell of stage.querySelectorAll('.capsule-shell')) {
    for (const animation of shell.getAnimations()) animation.cancel();
  }
  setPhase('available');
});

window.addEventListener('pagehide', () => {
  if (stage.dataset.phase === 'turning') navigator.vibrate?.(0);
});

async function loadMachine() {
  const response = await fetch('assets/vending-machine.svg');
  if (!response.ok) throw new Error('Автомат не загрузился');
  const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  const svg = document.importNode(source.documentElement, true);
  knob = svg.querySelector('#vending-knob');
  stock = [...svg.querySelectorAll('[data-stock]')];
  if (!knob || stock.length === 0) throw new Error('В SVG отсутствуют детали автомата');
  machineArt.append(svg);
}

Promise.all([loadMachine(), picture.decode()])
  .then(() => {
    setPhase('ready');
    if (replay) {
      const url = new URL(location.href);
      url.searchParams.delete('spin');
      history.replaceState(history.state, '', url);
      vend();
    }
  })
  .catch(() => setPhase('error'))
  .finally(() => stage.setAttribute('aria-busy', 'false'));
