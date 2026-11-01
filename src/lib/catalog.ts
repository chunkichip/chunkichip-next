export type FulfillmentProduct = {
  name: string;
  description?: string;
  isBox?: boolean;
};

export function isInPersonCookieBox(product: FulfillmentProduct) {
  return /^\d+\s+cookie\s+box$/i.test(product.name.trim());
}

export function isInternalPackaging(product: FulfillmentProduct) {
  return /^extra\s+box$/i.test(product.name.trim());
}

export function isShippingOnlyProduct(product: FulfillmentProduct) {
  if (isInPersonCookieBox(product) || isInternalPackaging(product)) return false;
  return Boolean(product.isBox || /\bbox\b/i.test(`${product.name} ${product.description || ''}`));
}
