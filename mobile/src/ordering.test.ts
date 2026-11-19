import test from 'node:test';
import assert from 'node:assert/strict';
import { boxPrice, selectionIssue, checkoutItems, readBag, paymentUrl } from './ordering.ts';
const product = { id: 'box', name: '2 cookie box', priceAmount: 900, variationId: 'variation', modifierSets: [{ modifiers: [{ id: 'a', name: 'Chunki Chip', priceAmount: 0 }, { id: 'b', name: 'Special', priceAmount: 50 }, { id: 'gone', name: 'Sold out', soldOut: true }] }] };
test('a full box supports repeats and modifier prices', () => {
 assert.equal(selectionIssue(product, ['a','a']), null);
 assert.equal(boxPrice(product, ['a','b']), 950);
 assert.ok(selectionIssue(product, ['a']));
 assert.ok(selectionIssue(product, ['gone','a']));
 assert.ok(selectionIssue(product, ['unknown','a']));
});
test('checkout revalidates availability and sends catalog IDs and repeated selections', () => {
 const bag = [{ key: 'key', productId:'box', flavors:['a','a'], quantity:2 }];
 const items = checkoutItems(bag, [product]);
 assert.equal(items[0].variationId, 'variation');
 assert.deepEqual(items[0].selectedFlavors.map(f => f.id), ['a','a']);
 assert.throws(() => checkoutItems(bag, []));
 assert.throws(() => checkoutItems(bag, [{ ...product, modifierSets: [{modifiers: [{id:'a', name:'Chunki Chip', soldOut:true}]}] }]));
});
test('restored bags discard invalid quantities and malformed selections', () => {
 assert.deepEqual(readBag([{key:'x',productId:'box',flavors:['a','a'],quantity:-1}]), []);
 assert.deepEqual(readBag({}), []);
});
test('only expected secure payment hosts are accepted', () => {
 assert.equal(paymentUrl('https://square.link/u/example'), 'https://square.link/u/example');
 assert.equal(paymentUrl('/checkout#token'), 'https://chunkichip.com/checkout#token');
 for (const url of ['https://square.link.evil.com/x','javascript:alert(1)','https://evil.com','http://square.link/u/x','https://user:password@square.link/x']) assert.throws(() => paymentUrl(url));
});
