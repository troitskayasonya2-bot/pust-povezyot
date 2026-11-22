const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const controls = 'a.arcade-button, a.hotspot, a.game-link, .footer a, button.arcade-button, button.capsule-action, button.vending-dial, button.sound-toggle';
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
  let shell = null;
  try {
    if (window.parent !== window) shell = window.parent.pustPovezyot ?? null;
  } catch {
    // Embedded in another site: behave as an ordinary page.
  }
  if (navigate && (shell || motion.matches)) {
    event.preventDefault();
    navigationPending = true;
    const follow = () => (shell ? shell.go(control.href) : location.assign(control.href));
    setTimeout(follow, motion.matches ? pressTime : 0);
    // A lost connection must not leave every button dead.
    setTimeout(() => {
      navigationPending = false;
      control.removeAttribute('data-pressed');
    }, 4000);
  } else {
    setTimeout(() => control.removeAttribute('data-pressed'), pressTime);
  }
}, { capture: true });

window.addEventListener('pageshow', () => {
  navigationPending = false;
  for (const control of document.querySelectorAll('[data-pressed]')) control.removeAttribute('data-pressed');
});
