import type { Product } from './catalog.ts';
import { isInPersonCookieBox, SITE } from './catalog.ts';

export type Flavor = { id: string; name: string; imageUrl?: string | null; soldOut?: boolean; priceAmount?: number; description?: string };
export type BagItem = { key: string; productId: string; flavors: string[]; quantity: number };
export const CART_KEY = 'chunki-mobile-bag-v1';
export const MAX_BOXES = 20;
export const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
export const boxSize = (product: Product) => isInPersonCookieBox(product) ? parseInt(product.name, 10) : 0;
export function boxFlavors(product: Product): Flavor[] {
  return (product.modifierSets || []).flatMap(set => set.modifiers || []);
}
export function selectionIssue(product: Product | undefined, selected: string[]): string | null {
  if (!product || !product.variationId || !Number.isSafeInteger(product.priceAmount) || product.priceAmount! < 0) return 'This box needs a fresh menu. Refresh and try again.';
  if (selected.length !== boxSize(product)) return `Choose ${boxSize(product)} cookies for this box.`;
  const options = boxFlavors(product);
  if (selected.some(id => !options.some(flavor => flavor.id === id && !flavor.soldOut))) return 'A selected flavor is unavailable. Edit this box to choose another.';
  return null;
}
export function boxPrice(product: Product, selected: string[]) {
  return (product.priceAmount || 0) + selected.reduce((total, id) => total + (boxFlavors(product).find(flavor => flavor.id === id)?.priceAmount || 0), 0);
}
export function readBag(value: unknown): BagItem[] {
  if (!Array.isArray(value) || value.length > MAX_BOXES) return [];
  return value.filter((item): item is BagItem => !!item && typeof item.key === 'string' && typeof item.productId === 'string' && Array.isArray(item.flavors) && item.flavors.length <= 12 && item.flavors.every((id: unknown) => typeof id === 'string') && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_BOXES).map(item => ({ key: item.key, productId: item.productId, flavors: [...item.flavors], quantity: item.quantity }));
}
export function checkoutItems(bag: BagItem[], products: Product[]) {
  if (!bag.length) throw new Error('Add a box to your bag first.');
  return bag.map(item => {
    const product = products.find(product => product.id === item.productId);
    const issue = selectionIssue(product, item.flavors);
    if (issue) throw new Error(issue);
    return { productId: product!.id, variationId: product!.variationId, name: product!.name, quantity: item.quantity, shippingOnly: false, selectedFlavors: item.flavors.map(id => ({ id, name: boxFlavors(product!).find(flavor => flavor.id === id)!.name })) };
  });
}
export function paymentUrl(value: unknown) {
  if (typeof value !== 'string' || !value) throw new Error('Payment link unavailable. Please try again.');
  const url = new URL(value, SITE);
  const allowed = ['chunkichip.com', 'square.link', 'squareup.com', 'checkout.square.site'];
  if (url.protocol !== 'https:' || url.username || url.password || !allowed.some(host => url.hostname === host || (host === 'squareup.com' && url.hostname.endsWith('.squareup.com')))) throw new Error('The payment link could not be verified. Please try again.');
  return url.href;
}
