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
  let host = null;
  try {
    if (window.parent !== window && window.parent.pustPovezyotBoot) host = window.parent;
  } catch {
    // Embedded in another site: behave as an ordinary page.
  }
  if (navigate && (host || motion.matches)) {
    event.preventDefault();
    navigationPending = true;
    const follow = () => {
      if (!host) location.assign(control.href);
      else if (host.pustPovezyot) host.pustPovezyot.go(control.href);
      else host.addEventListener('pust:ready', () => host.pustPovezyot.go(control.href), { once: true });
    };
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
