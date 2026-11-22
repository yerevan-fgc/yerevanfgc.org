/** Initialize swapped DOM on every navigation and release old listeners/observers. */
export function onPageLoad(setup: () => (() => void) | void) {
  let cleanup: (() => void) | void;
  const dispose = () => { cleanup?.(); cleanup = undefined; };
  document.addEventListener('astro:before-swap', dispose);
  document.addEventListener('astro:page-load', () => {
    dispose();
    cleanup = setup();
  });
}
