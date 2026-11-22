import test from 'node:test';
import assert from 'node:assert/strict';
import { onPageLoad } from '../src/lib/page-lifecycle.ts';

test('navigation disposes old page resources once and initializes each new page', () => {
  const original = globalThis.document;
  globalThis.document = new EventTarget();
  try {
    let setups = 0;
    let cleanups = 0;
    onPageLoad(() => { setups++; return () => cleanups++; });
    document.dispatchEvent(new Event('astro:page-load'));
    assert.equal(setups, 1);
    document.dispatchEvent(new Event('astro:before-swap'));
    document.dispatchEvent(new Event('astro:before-swap'));
    assert.equal(cleanups, 1);
    document.dispatchEvent(new Event('astro:page-load'));
    assert.equal(setups, 2);
    assert.equal(cleanups, 1);
    document.dispatchEvent(new Event('astro:page-load'));
    assert.equal(setups, 3);
    assert.equal(cleanups, 2);
  } finally {
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  }
});
