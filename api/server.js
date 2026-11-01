require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { SquareClient, SquareEnvironment } = require('square');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((v) => v.trim()) : true }));
app.use(express.json({ limit: '1mb' }));

const square = process.env.SQUARE_ACCESS_TOKEN ? new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
}) : null;
const money = (amount) => `$${(Number(amount || 0) / 100).toFixed(2)}`;

function requireSquare(res) {
  if (square) return true;
  res.status(503).json({ error: 'Square catalog is not configured on this server.' });
  return false;
}

async function searchCatalog(objectTypes) {
  const objects = [];
  let cursor;
  do {
    const page = await square.catalog.search({ objectTypes, limit: 100, cursor });
    objects.push(...(page.objects || []));
    cursor = page.cursor;
  } while (cursor);
  return objects;
}

async function getImageUrls(imageIds) {
  const ids = [...new Set(imageIds.filter(Boolean))];
  if (!ids.length) return {};
  const result = await square.catalog.batchGet({ objectIds: ids });
  return Object.fromEntries((result.objects || []).map((image) => [image.id, image.imageData?.url || null]));
}

function selectedVariation(item) {
  const variations = item.itemData?.variations || [];
  return variations.find((v) => v.itemVariationData?.itemId === item.id) || variations[0];
}

app.get('/api/health', (_req, res) => res.json({ ok: true, squareConfigured: Boolean(square) }));

app.get('/api/products', async (_req, res) => {
  if (!requireSquare(res)) return;
  try {
    const [items, modifierLists] = await Promise.all([
      searchCatalog(['ITEM']),
      searchCatalog(['MODIFIER_LIST']),
    ]);
    const listById = new Map(modifierLists.map((o) => [o.id, o]));
    const visible = items.filter((item) => item.itemData && !item.itemData.isArchived && item.itemData.ecomVisibility !== 'UNAVAILABLE');
    const imageUrls = await getImageUrls(visible.map((i) => i.itemData.imageIds?.[0]));
    const products = visible.map((item) => {
      const variation = selectedVariation(item);
      const amount = Number(variation?.itemVariationData?.priceMoney?.amount || 0);
      const imageId = item.itemData.imageIds?.[0] || null;
      const modifierSets = (item.itemData.modifierListInfo || [])
        // Square keeps removed modifier-list associations on the item with enabled=false.
        // Ignore those historical links so the storefront only shows active choices.
        .filter((ref) => ref.enabled !== false)
        .map((ref) => ({ ref, list: listById.get(ref.modifierListId) }))
        .filter(({ list }) => Boolean(list))
        .map(({ ref, list }) => {
          const listData = list.modifierListData || {};
          const listMin = Number(listData.minSelectedModifiers);
          const listMax = Number(listData.maxSelectedModifiers);
          const itemMin = Number(ref.minSelectedModifiers);
          const itemMax = Number(ref.maxSelectedModifiers);
          const minSelected = Number.isFinite(itemMin) && itemMin >= 0
            ? itemMin
            : Number.isFinite(listMin) && listMin >= 0 ? listMin : 0;
          const maxSelected = Number.isFinite(itemMax) && itemMax >= 0
            ? itemMax
            : Number.isFinite(listMax) && listMax >= 0 ? listMax : 0;

          return {
            id: list.id,
            name: listData.name || 'Choose flavors',
            minSelected,
            maxSelected,
            modifiers: (listData.modifiers || []).filter((m) => !m.modifierData?.isArchived).map((m) => {
              const rawAmount = m.modifierData?.priceMoney?.amount;
              const modifierAmount = Number(rawAmount || 0);
              return {
                id: m.id,
                name: m.modifierData?.name || 'Option',
                priceAmount: modifierAmount,
                price: rawAmount === undefined || rawAmount === null ? '' : money(modifierAmount),
              };
            }),
          };
        });
      return {
        id: item.id,
        name: item.itemData.name,
        description: item.itemData.descriptionPlaintext || item.itemData.description || '',
        kitchenName: item.itemData.kitchenName || item.itemData.name,
        imageId,
        imageUrl: imageId ? imageUrls[imageId] : null,
        variationId: variation?.id || null,
        priceAmount: amount,
        price: money(amount),
        isBox: /box/i.test(item.itemData.name),
        boxSize: item.itemData.name.match(/\d+/)?.[0] || null,
        modifierSets,
      };
    });
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').json(products);
  } catch (err) {
    console.error('Square catalog error:', err);
    res.status(502).json({ error: 'Failed to load the Square catalog.' });
  }
});

app.post('/api/customers/subscribe', async (req, res) => {
  if (!requireSquare(res)) return;
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  try {
    await square.customers.create({ idempotencyKey: crypto.randomUUID(), emailAddress: email, givenName: 'Drop List', note: 'Joined Chunki Chip drop list from website popup' });
    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(502).json({ error: 'Could not join the drop list right now.' });
  }
});

app.post('/api/create-checkout', async (req, res) => {
  if (!requireSquare(res)) return;
  const { items, checkoutMethod } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 50) return res.status(400).json({ error: 'Your bag is empty or contains too many items.' });
  if (!['pickup', 'curbside', 'shipping'].includes(checkoutMethod)) return res.status(400).json({ error: 'Choose a valid fulfillment method.' });
  try {
    const lineItems = items.map((item) => {
      const modifiers = Array.isArray(item.selectedFlavors) ? item.selectedFlavors.filter((m) => m?.id).map((m) => ({ catalogObjectId: m.id })) : [];
      return {
        ...(item.variationId ? { catalogObjectId: item.variationId } : { name: String(item.name || 'Chunki Chip order').slice(0, 100), basePriceMoney: { amount: BigInt(Math.max(0, Number(item.priceAmount) || 0)), currency: 'USD' } }),
        quantity: String(Math.max(1, Math.min(99, Number(item.quantity) || 1))),
        ...(modifiers.length ? { modifiers } : {}),
      };
    });
    const label = checkoutMethod === 'shipping' ? 'Nationwide Shipping' : checkoutMethod === 'curbside' ? 'Curbside Pickup' : 'In-Store Pickup';
    const result = await square.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: { locationId: process.env.SQUARE_LOCATION_ID, lineItems, referenceId: label },
      checkoutOptions: { redirectUrl: process.env.CHECKOUT_REDIRECT_URL || 'https://chunkichip.com/', askForShippingAddress: checkoutMethod === 'shipping' },
      description: `Chunki Chip online order — ${label}`,
      paymentNote: `Fulfillment method: ${label}`,
    });
    const url = result.paymentLink?.url;
    if (!url) throw new Error('Square did not return a checkout URL.');
    res.json({ url });
  } catch (err) {
    console.error('Square checkout error:', err);
    res.status(502).json({ error: 'Could not start checkout. Please try again.' });
  }
});

const PORT = process.env.PORT || 3001;
if (require.main === module) app.listen(PORT, '0.0.0.0', () => console.log(`Chunki Chip API listening on ${PORT}`));
module.exports = app;
