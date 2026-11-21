import { drawOutcome, saveOutcome } from './outcomes.js?v=3';

const stage = document.querySelector('.capsule-stage');
const screen = stage.closest('.capsule-screen');
const form = stage.querySelector('.capsule-form');
const status = stage.querySelector('.vending-status');
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
  turning: 'Автомат запущен',
  dispensing: 'Капсула выпала',
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
  trigger.textContent = phase === 'error' ? 'Автомат не загрузился' : phase === 'ready' ? 'Крутить' : 'Крутим…';
}

async function animate(element, frames, options) {
  if (!motion.matches) return;
  await element.animate(frames, options).finished.catch(() => {});
}

function shakeStock(element, index, duration) {
  const direction = index % 2 === 0 ? 1 : -1;
  const height = 9 + (index % 4) * 5;
  const offset = index % 3 * .055;

  return animate(element, [
    { transform: 'none' },
    { transform: `translate(${10 * direction}px, ${-height}px) rotate(${12 * direction}deg)`, offset: .08 + offset },
    { transform: `translate(${-8 * direction}px, 6px) rotate(${-7 * direction}deg)`, offset: .24 + offset },
    { transform: `translate(${3 * direction}px, ${-height * .43}px) rotate(${4 * direction}deg)`, offset: .36 + offset },
    { transform: `translate(${-6 * direction}px, ${-height * .54}px) rotate(${-8 * direction}deg)`, offset: .59 + offset },
    { transform: `translate(${4 * direction}px, ${-height * .30}px) rotate(${5 * direction}deg)`, offset: .78 + offset },
    { transform: 'none' },
  ], { duration });
}

async function vend(start = 0, direction = 1) {
  if (stage.dataset.phase !== 'ready') return;
  gesture = null;
  const keyboard = dial.matches(':focus-visible') || trigger.matches(':focus-visible');
  const shakeDuration = 1450;
  screen.style.setProperty('--shake-time', `${shakeDuration}ms`);
  setPhase('turning');
  if (motion.matches && navigator.userActivation?.hasBeenActive !== false) {
    navigator.vibrate?.([55, 100, 80, 115, 75, 125, 90, 120, 70, 145, 55, 125, 75, 95, 80]);
  }

  pendingDraw = drawOutcome(query.get('after'));
  const { outcome } = pendingDraw;
  form.elements.prize.value = outcome.id;
  form.elements.prize.disabled = false;
  rewardPreview.src = outcome.art;
  rewardPreview.decode().catch(() => {});

  await Promise.all([
    animate(knob, [
      { transform: `rotate(${start}deg)` },
      { transform: `rotate(${direction * 360}deg)` },
    ], { duration: 680, easing: 'cubic-bezier(.2,.66,.36,1)' }),
    animate(machine, [
      { transform: 'none' },
      { transform: 'translateX(7px) rotate(2deg)', offset: .06 },
      { transform: 'translateX(-8px) rotate(-2.25deg)', offset: .14 },
      { transform: 'translateX(6px) rotate(1.5deg)', offset: .22 },
      { transform: 'translateX(-4px) rotate(-1.05deg)', offset: .30 },
      { transform: 'translateX(3px) rotate(.7deg)', offset: .39 },
      { transform: 'translateX(-5px) rotate(-1.15deg)', offset: .48 },
      { transform: 'translateX(5px) rotate(1.3deg)', offset: .57 },
      { transform: 'translateX(-5px) rotate(-1.25deg)', offset: .66 },
      { transform: 'translateX(3px) rotate(.7deg)', offset: .76 },
      { transform: 'translateX(-2px) rotate(-.45deg)', offset: .88 },
      { transform: 'none' },
    ], { duration: shakeDuration }),
    ...stock.map((element, index) => shakeStock(element, index, shakeDuration)),
  ]);
  knob.style.removeProperty('--turn');

  setPhase('dispensing');
  outlet.hidden = false;
  const dropOptions = { duration: 520, fill: 'forwards' };
  const peek = 'translateY(-72%) rotate(-12deg)';
  await Promise.all([
    animate(outletBall, [
      { transform: 'translateY(-105%) rotate(-16deg)', easing: 'ease-out' },
      { transform: peek, offset: .29 },
      { transform: peek, offset: .57, easing: 'cubic-bezier(.48,.04,.86,.54)' },
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
  ], { duration: 370, easing: 'cubic-bezier(.24,.64,.34,1)' });

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
