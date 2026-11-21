const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const controls = 'a.arcade-button, a.hotspot, a.game-link, .footer a, button.arcade-button, button.capsule-action, button.vending-dial';
const pressTime = 120;
let navigationPending = false;

document.addEventListener('click', event => {
  const control = event.target.closest(controls);
  if (!control || control.disabled || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const navigate = control instanceof HTMLAnchorElement && (!control.target || control.target === '_self') &&
    control.origin === location.origin && !control.hasAttribute('download');
  if (navigate && navigationPending) {
    event.preventDefault();
    return;
  }

  control.setAttribute('data-pressed', '');
  if (navigate && motion.matches) {
    event.preventDefault();
    navigationPending = true;
    setTimeout(() => location.assign(control.href), pressTime);
  } else {
    setTimeout(() => control.removeAttribute('data-pressed'), pressTime);
  }
}, { capture: true });

window.addEventListener('pageshow', () => {
  navigationPending = false;
  for (const control of document.querySelectorAll('[data-pressed]')) control.removeAttribute('data-pressed');
});
