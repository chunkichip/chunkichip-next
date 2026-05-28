require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { SquareClient, SquareEnvironment } = require('square');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json());

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENV === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

function money(amount) {
  return `$${(Number(amount || 0) / 100).toFixed(2)}`;
}

async function getImageUrls(imageIds) {
  if (!imageIds.length) return {};

  const result = await square.catalog.batchGet({
    objectIds: imageIds,
  });

  const images = result.objects || [];
  const map = {};

  for (const image of images) {
    map[image.id] = image.imageData?.url || null;
  }

  return map;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await square.catalog.search({
      objectTypes: ['ITEM'],
    });

    const items = result.objects || [];

    const visibleItems = items
      .filter((item) => item.itemData)
      .filter((item) => !item.itemData.isArchived)
      .filter((item) => item.itemData.ecomVisibility !== 'UNAVAILABLE');

    const imageIds = [
      ...new Set(
        visibleItems
          .map((item) => item.itemData.imageIds?.[0])
          .filter(Boolean)
      ),
    ];

    const imageUrls = await getImageUrls(imageIds);

    const products = visibleItems.map((item) => {
      const variation = item.itemData.variations?.[0];
      const priceAmount =
        variation?.itemVariationData?.priceMoney?.amount || 0;

      const imageId = item.itemData.imageIds?.[0] || null;

      return {
        id: item.id,
        name: item.itemData.name,
        description:
          item.itemData.descriptionPlaintext ||
          item.itemData.description ||
          '',
        kitchenName: item.itemData.kitchenName || item.itemData.name,
        imageId,
        imageUrl: imageId ? imageUrls[imageId] : null,
        variationId: variation?.id || null,
        priceAmount: priceAmount.toString(),
        price: money(priceAmount),
        isBox: /box/i.test(item.itemData.name),
        boxSize: item.itemData.name.match(/\d+/)?.[0] || null,
      };
    });

    res.json(products);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to load products',
    });
  }
});
app.post('/api/customers/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
      });
    }

    const result = await square.customers.create({
      idempotencyKey: crypto.randomUUID(),
      emailAddress: email,
      givenName: 'Drop List',
      note: 'Joined Chunki Chip drop list from website popup',
    });

    res.json({
      success: true,
      customer: result.customer,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to subscribe',
    });
  }
});
const PORT = 3001;
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const lineItems = items.map((item) => {
  const flavorText = item.selectedFlavors?.length
    ? item.selectedFlavors.map((flavor) => flavor.name).join(', ')
    : '';

  return {
    name: flavorText
      ? `${item.name} — ${flavorText}`
      : item.name,
    quantity: String(item.quantity || 1),
    basePriceMoney: {
      amount: BigInt(item.priceAmount),
      currency: 'USD',
    },
  };
});

    const result = await square.checkout.paymentLinks.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
      },
      checkoutOptions: {
        redirectUrl: 'http://localhost:3000/success',
      },
      description: 'Chunki Chip online order',
      paymentNote: 'Chunki Chip custom web checkout',
    });

    res.json({
      url: result.paymentLink?.url,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to create checkout',
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on ${PORT}`);
});