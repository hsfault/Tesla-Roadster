// Route changes go through the smoke transition. Components call go('/specs') or go('/#wall').
let impl = null;

export function registerNavigator(fn) {
  impl = fn;
  return () => {
    if (impl === fn) impl = null;
  };
}

export function go(to) {
  if (impl) impl(to);
  else window.location.assign(to);
}

// Pages announce "your headline may play now" after the smoke has cleared.
export const PAGE_ENTER = 'rn:page-enter';
export function announcePageEnter() {
  window.dispatchEvent(new CustomEvent(PAGE_ENTER));
}
