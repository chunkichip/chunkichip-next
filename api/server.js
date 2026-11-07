require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { SquareClient, SquareEnvironment } = require('square');
const configuredModifierDescriptions = require('./modifierDescriptions.json');

const normalizeCatalogName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const modifierDescriptions = Object.fromEntries(
  Object.entries(configuredModifierDescriptions).map(([name, description]) => [normalizeCatalogName(name), description]),
);

async function loadManagedFlavorDescriptions() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return {};
  try {
    const response = await fetch(`${url}/rest/v1/site_content?select=id,value&id=like.weekly-flavor-*`, {
      headers: { apikey: key }, signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error('Description lookup unavailable');
    const rows = await response.json();
    return Object.fromEntries(rows.filter(row => typeof row.value === 'string' && row.value.trim())
      .map(row => [row.id.slice('weekly-flavor-'.length), row.value]));
  } catch {
    console.warn('Managed flavor descriptions unavailable; using catalog descriptions.');
    return {};
  }
}

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((v) => v.trim()) : true }));
app.use(express.json({ limit: '1mb' }));

const square = process.env.SQUARE_ACCESS_TOKEN ? new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
}) : null;
const money = (amount) => `$${(Number(amount || 0) / 100).toFixed(2)}`;
app.use('/api/benefits', require('./customerBenefits')());

function parseShippoPackages() {
  if (!process.env.SHIPPO_PACKAGES_JSON) return {};
  try {
    const parsed = JSON.parse(process.env.SHIPPO_PACKAGES_JSON);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function cleanShippingAddress(value = {}) {
  const clean = (input, max = 100) => typeof input === 'string' ? input.trim().slice(0, max) : '';
  return {
    name: clean(value.name, 120),
    phone: clean(value.phone, 40),
    street1: clean(value.street1, 120),
    street2: clean(value.street2, 120),
    city: clean(value.city, 80),
    state: clean(value.state, 2).toUpperCase(),
    zip: clean(value.zip, 16),
    country: clean(value.country || 'US', 2).toUpperCase(),
  };
}

function shippingAddressIsComplete(address) {
  return Boolean(address.street1 && address.city && address.state && address.zip && address.country === 'US');
}

function signShippingQuote(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.SHIPPO_API_TOKEN).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyShippingQuote(token) {
  if (typeof token !== 'string' || !process.env.SHIPPO_API_TOKEN) return null;
  const [encoded, suppliedSignature] = token.split('.');
  if (!encoded || !suppliedSignature) return null;
  const expectedSignature = crypto.createHmac('sha256', process.env.SHIPPO_API_TOKEN).update(encoded).digest();
  let actualSignature;
  try {
    actualSignature = Buffer.from(suppliedSignature, 'base64url');
  } catch {
    return null;
  }
  if (actualSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(actualSignature, expectedSignature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function shippingItemsFingerprint(items) {
  const compact = items.map((item) => ({
    variationId: String(item.variationId || ''),
    quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
    selectedFlavorIds: (Array.isArray(item.selectedFlavors) ? item.selectedFlavors : []).map((modifier) => String(modifier?.id || '')).filter(Boolean).sort(),
  })).sort((a, b) => a.variationId.localeCompare(b.variationId));
  return crypto.createHash('sha256').update(JSON.stringify(compact)).digest('hex');
}

async function catalogShippingBoxes() {
  const catalogItems = await searchCatalog(['ITEM']);
  const byVariation = new Map();
  for (const item of catalogItems) {
    const itemData = item.itemData || {};
    const name = String(itemData.name || '').trim();
    const description = itemData.descriptionPlaintext || itemData.description || '';
    const isInPerson = /^\d+\s+cookie\s+box$/i.test(name) || /^extra\s+box$/i.test(name);
    const isBox = !isInPerson && /\bbox\b/i.test(`${name} ${description}`);
    if (!isBox) continue;
    const match = name.match(/\b(1|2|4|6|12)\b/);
    if (!match) continue;
    const variation = selectedVariation(item);
    if (variation?.id) byVariation.set(variation.id, { name, boxSize: match[1], isArchived: Boolean(itemData.isArchived) });
  }
  return byVariation;
}

async function squareShipFromAddress(locationId) {
  const response = await square.locations.get({ locationId });
  const location = response.location;
  const address = location?.address || {};
  const shipFrom = {
    name: location?.businessName || location?.name || 'Chunki Chip',
    street1: address.addressLine1 || '',
    street2: address.addressLine2 || '',
    city: address.locality || '',
    state: address.administrativeDistrictLevel1 || '',
    zip: address.postalCode || '',
    country: address.country || 'US',
    ...(location?.phoneNumber ? { phone: location.phoneNumber } : {}),
  };
  if (!shipFrom.street1 || !shipFrom.city || !shipFrom.state || !shipFrom.zip) throw new Error('Add a complete street address to this Square shipping location before requesting rates.');
  return shipFrom;
}

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

function configuredLocations() {
  return [
    {
      id: 'milford',
      name: 'Milford',
      address: 'Amherst Street · Milford, NH',
      squareLocationId: process.env.SQUARE_LOCATION_ID_MILFORD || process.env.SQUARE_LOCATION_ID,
    },
    {
      id: 'nashua',
      name: 'Nashua',
      address: 'Somerset Plaza · Nashua, NH',
      squareLocationId: process.env.SQUARE_LOCATION_ID_NASHUA,
    },
  ].filter((location) => Boolean(location.squareLocationId));
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  squareConfigured: Boolean(square),
  shippoConfigured: Boolean(process.env.SHIPPO_API_TOKEN),
  shippingPackagesConfigured: Object.keys(parseShippoPackages()).length > 0,
}));

app.get('/api/locations', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300').json(
    configuredLocations().map(({ id, name, address }) => ({ id, name, address })),
  );
});

app.get('/api/products', async (_req, res) => {
  if (!requireSquare(res)) return;
  try {
    const [items, modifierLists, managedDescriptions] = await Promise.all([
      searchCatalog(['ITEM']),
      searchCatalog(['MODIFIER_LIST']),
      loadManagedFlavorDescriptions(),
    ]);
    const listById = new Map(modifierLists.map((o) => [o.id, o]));
    const visible = items.filter((item) => item.itemData && !item.itemData.isArchived && item.itemData.ecomVisibility !== 'UNAVAILABLE');
    const itemDescriptions = new Map(visible.map((item) => [
      normalizeCatalogName(item.itemData.name),
      item.itemData.descriptionPlaintext || item.itemData.description || '',
    ]));
    const modifierImageIds = visible.flatMap((item) =>
      (item.itemData.modifierListInfo || [])
        .filter((ref) => ref.enabled !== false)
        .flatMap((ref) => listById.get(ref.modifierListId)?.modifierListData?.modifiers || [])
        .map((modifier) => modifier.modifierData?.imageId),
    );
    const imageUrls = await getImageUrls([
      ...visible.map((item) => item.itemData.imageIds?.[0]),
      ...modifierImageIds,
    ]);
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
              const locationOverrides = m.modifierData?.locationOverrides || [];
              return {
                id: m.id,
                name: m.modifierData?.name || 'Option',
                description: managedDescriptions[normalizeCatalogName(m.modifierData?.name)]
                  || modifierDescriptions[normalizeCatalogName(m.modifierData?.name)]
                  || itemDescriptions.get(normalizeCatalogName(m.modifierData?.name))
                  || '',
                imageUrl: m.modifierData?.imageId ? imageUrls[m.modifierData.imageId] || null : null,
                priceAmount: modifierAmount,
                price: rawAmount === undefined || rawAmount === null ? '' : money(modifierAmount),
                // Square exposes manual modifier availability as a location override.
                // A sold-out flavor must not be selectable on the storefront.
                soldOut: locationOverrides.some((override) => override.soldOut === true),
              };
            }),
          };
        });
      return {
        id: item.id,
        name: item.itemData.name,
        description: managedDescriptions[normalizeCatalogName(item.itemData.name)] || item.itemData.descriptionPlaintext || item.itemData.description || '',
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
    res.set('Cache-Control', 'no-store').json(products);
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
    await square.customers.create({ idempotencyKey: crypto.randomUUID(), emailAddress: email, givenName: 'Drop List', note: 'Consented to Chunki Chip marketing emails through homepage signup' });
    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(502).json({ error: 'Could not join the drop list right now.' });
  }
});

app.post('/api/shipping-rates', async (req, res) => {
  if (!requireSquare(res)) return;
  if (!process.env.SHIPPO_API_TOKEN) return res.status(503).json({ error: 'Shippo live rates are not configured on this server yet.' });
  const { items, address: rawAddress, locationId } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 20) return res.status(400).json({ error: 'Choose a valid shipping box before requesting rates.' });
  const address = cleanShippingAddress(rawAddress);
  if (!shippingAddressIsComplete(address)) return res.status(400).json({ error: 'Enter a complete U.S. shipping address.' });
  const locations = configuredLocations();
  const location = locationId ? locations.find((candidate) => candidate.id === locationId) : locations[0];
  if (!location) return res.status(400).json({ error: 'Choose an available Chunki Chip shipping location.' });
  const packagesBySize = parseShippoPackages();
  if (!Object.keys(packagesBySize).length) return res.status(503).json({ error: 'Shipping box dimensions and packed weights still need to be configured.' });

  try {
    const catalogBoxes = await catalogShippingBoxes();
    const parcels = [];
    for (const item of items) {
      const box = catalogBoxes.get(String(item?.variationId || ''));
      if (!box || box.isArchived) return res.status(400).json({ error: 'Only active shipping box items can be shipped.' });
      const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
      const packageInfo = packagesBySize[box.boxSize];
      if (!packageInfo) return res.status(503).json({ error: `Shipping package details for the ${box.boxSize}-cookie box have not been configured.` });
      for (let index = 0; index < quantity; index += 1) {
        const length = Number(packageInfo.length);
        const width = Number(packageInfo.width);
        const height = Number(packageInfo.height);
        const weight = Number(packageInfo.weight);
        if (![length, width, height, weight].every((value) => Number.isFinite(value) && value > 0)) {
          return res.status(503).json({ error: `Shipping package details for the ${box.boxSize}-cookie box are incomplete.` });
        }
        parcels.push({
          length: String(length),
          width: String(width),
          height: String(height),
          distance_unit: packageInfo.distanceUnit || 'in',
          weight: String(weight),
          mass_unit: packageInfo.massUnit || 'lb',
        });
      }
    }
    if (!parcels.length || parcels.length > 10) return res.status(400).json({ error: 'This order has too many separate shipping boxes for an online rate quote.' });

    const addressFrom = await squareShipFromAddress(location.squareLocationId);
    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address_from: addressFrom, address_to: address, parcels, async: false }),
    });
    const shipment = await response.json();
    if (!response.ok || shipment.status !== 'SUCCESS') {
      console.error('Shippo rate request failed:', shipment.messages || shipment.detail || shipment.status || response.status);
      return res.status(422).json({ error: 'Shippo could not quote that address and box combination. Check the address or try again.' });
    }

    const fingerprint = shippingItemsFingerprint(items);
    const addressFingerprint = crypto.createHash('sha256').update(JSON.stringify(address)).digest('hex');
    const rates = (shipment.rates || [])
      .filter((rate) => rate.object_id && rate.currency === 'USD' && Number.isFinite(Number(rate.amount)) && Number(rate.amount) >= 0)
      .map((rate) => {
        const amountCents = Math.round(Number(rate.amount) * 100);
        const carrier = String(rate.provider || 'Carrier').slice(0, 60);
        const service = String(rate.servicelevel?.name || rate.servicelevel_name || 'Shipping').slice(0, 100);
        const token = signShippingQuote({
          rateId: rate.object_id,
          amountCents,
          carrier,
          service,
          locationId: location.id,
          itemsFingerprint: fingerprint,
          addressFingerprint,
          exp: Date.now() + 10 * 60 * 1000,
        });
        return {
          quoteToken: token,
          carrier,
          service,
          amountCents,
          amount: money(amountCents),
          estimatedDays: Number(rate.estimated_days) || null,
          duration: String(rate.duration_terms || '').slice(0, 180),
        };
      })
      .sort((a, b) => a.amountCents - b.amountCents);

    if (!rates.length) return res.status(422).json({ error: 'No Shippo carrier rates were returned for this address and box.' });
    res.json({ rates });
  } catch (err) {
    console.error('Shippo rate request error:', err?.message || err);
    res.status(502).json({ error: err instanceof Error && err.message.includes('Square shipping location') ? err.message : 'Could not get shipping rates right now. Please try again.' });
  }
});

app.post('/api/create-checkout', async (req, res) => {
  if (!requireSquare(res)) return;
  const { items, checkoutMethod, locationId, deliveryType, shippingQuoteToken, address: rawAddress } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 50) return res.status(400).json({ error: 'Your bag is empty or contains too many items.' });
  if (!['pickup', 'curbside', 'shipping'].includes(checkoutMethod)) return res.status(400).json({ error: 'Choose a valid fulfillment method.' });
  const locations = configuredLocations();
  const location = locationId
    ? locations.find((candidate) => candidate.id === locationId)
    : locations[0];
  if (!location) return res.status(400).json({ error: 'Choose an available Chunki Chip location.' });
  if (items.some((item) => item?.shippingOnly === true) && checkoutMethod !== 'shipping') {
    return res.status(400).json({ error: 'This box is available for nationwide shipping only.' });
  }
  let verifiedShippingQuote = null;
  let shippingAddress = null;
  if (checkoutMethod === 'shipping') {
    if (!process.env.SHIPPO_API_TOKEN) return res.status(503).json({ error: 'Shippo live rates are not configured on this server yet.' });
    verifiedShippingQuote = verifyShippingQuote(shippingQuoteToken);
    shippingAddress = cleanShippingAddress(rawAddress);
    const addressFingerprint = crypto.createHash('sha256').update(JSON.stringify(shippingAddress)).digest('hex');
    if (!verifiedShippingQuote || verifiedShippingQuote.locationId !== location.id || verifiedShippingQuote.itemsFingerprint !== shippingItemsFingerprint(items) || verifiedShippingQuote.addressFingerprint !== addressFingerprint) {
      return res.status(400).json({ error: 'That shipping quote expired or no longer matches your order. Get a fresh rate to continue.' });
    }
  }
  try {
    const lineItems = items.map((item) => {
      const modifiers = Array.isArray(item.selectedFlavors) ? item.selectedFlavors.filter((m) => m?.id).map((m) => ({ catalogObjectId: m.id })) : [];
      return {
        ...(item.variationId ? { catalogObjectId: item.variationId } : { name: String(item.name || 'Chunki Chip order').slice(0, 100), basePriceMoney: { amount: BigInt(Math.max(0, Number(item.priceAmount) || 0)), currency: 'USD' } }),
        quantity: String(Math.max(1, Math.min(99, Number(item.quantity) || 1))),
        ...(modifiers.length ? { modifiers } : {}),
      };
    });
    const label = checkoutMethod === 'shipping'
      ? deliveryType === 'direct' ? 'Delivery' : 'Nationwide Shipping'
      : checkoutMethod === 'curbside' ? 'Curbside Pickup' : 'Carry Out';
    const result = await square.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: location.squareLocationId,
        lineItems,
        referenceId: `${location.name} · ${label}`,
        source: { name: 'Online Order' },
      },
      checkoutOptions: {
        enableLoyalty: true,
        redirectUrl: process.env.CHECKOUT_REDIRECT_URL || 'https://chunkichip.com/',
        askForShippingAddress: checkoutMethod === 'shipping',
        ...(verifiedShippingQuote ? {
          shippingFee: {
            name: `${verifiedShippingQuote.carrier} · ${verifiedShippingQuote.service}`.slice(0, 100),
            charge: { amount: BigInt(verifiedShippingQuote.amountCents), currency: 'USD' },
          },
        } : {}),
      },
      ...(shippingAddress ? {
        prePopulatedData: {
          buyerPhoneNumber: shippingAddress.phone || undefined,
          buyerAddress: {
            addressLine1: shippingAddress.street1,
            addressLine2: shippingAddress.street2 || undefined,
            locality: shippingAddress.city,
            administrativeDistrictLevel1: shippingAddress.state,
            postalCode: shippingAddress.zip,
            country: shippingAddress.country,
          },
        },
      } : {}),
      description: `Chunki Chip ${location.name} order — ${label}`,
      paymentNote: `Location: ${location.name}. Fulfillment method: ${label}${verifiedShippingQuote ? `. Shippo rate: ${verifiedShippingQuote.carrier} ${verifiedShippingQuote.service} (${money(verifiedShippingQuote.amountCents)})` : ''}`,
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
