import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeeklyFlavors, readProducts, storefrontUrl } from './catalog.ts';

test('uses current box modifiers, not archived flavors or shipping boxes', () => {
  const flavors = getWeeklyFlavors([
    { id: 'archive', name: 'Last month special' },
    { id: 'box', name: '6 cookie box', modifierSets: [{ modifiers: [
      { id: 'today', name: 'Current special', thisWeekOnly: true },
      { id: 'out', name: 'Sold out special', soldOut: true },
    ] }] },
    { id: 'shipping', name: 'Shipping box', isBox: true, modifierSets: [{ modifiers: [{ id: 'ship', name: 'Shipping only' }] }] },
  ]);
  assert.deepEqual(flavors.map(flavor => flavor.id), ['today']);
  assert.equal(flavors[0].thisWeekOnly, true);
});

test('rejects invalid API responses', () => {
  assert.throws(() => readProducts({ error: 'Unavailable' }));
  assert.throws(() => readProducts([null]));
  assert.deepEqual(readProducts([]), []);
});

test('shop links cannot navigate to other hosts or script URLs', () => {
  assert.equal(storefrontUrl('/rewards'), 'https://chunkichip.com/rewards');
  assert.throws(() => storefrontUrl('//example.com/checkout'));
  assert.throws(() => storefrontUrl('javascript:alert(1)'));
});
