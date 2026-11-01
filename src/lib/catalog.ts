export type FulfillmentProduct = {
  name: string;
  description?: string;
  isBox?: boolean;
};

export type CatalogFlavor = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  priceAmount?: number;
  price?: string;
};

export type CatalogFlavorProduct = FulfillmentProduct & {
  id: string;
  description?: string;
  imageUrl?: string | null;
  modifierSets?: { modifiers?: CatalogFlavor[] }[];
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

export function getWeeklyFlavors(products: CatalogFlavorProduct[]) {
  const cookieItems = products.filter((product) =>
    !product.isBox && !isShippingOnlyProduct(product) && !isInternalPackaging(product)
      && !/\b(chiptini|milk|drink|gift\s*card|catering)\b/i.test(product.name),
  );
  const uniqueFlavors = new Map<string, CatalogFlavor>();

  products.filter(isInPersonCookieBox).forEach((box) => {
    (box.modifierSets || []).forEach((set) => {
      (set.modifiers || []).forEach((modifier) => {
        const key = modifier.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!key || uniqueFlavors.has(key)) return;
        const matchingItem = cookieItems.find((item) =>
          item.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key,
        );
        uniqueFlavors.set(key, {
          ...modifier,
          description: modifier.description || matchingItem?.description || 'Fresh-baked, oversized 7.2 oz cookie. Made in small batches in Milford, New Hampshire.',
          imageUrl: modifier.imageUrl || matchingItem?.imageUrl || null,
        });
      });
    });
  });

  return [...uniqueFlavors.values()];
}
