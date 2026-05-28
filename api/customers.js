import express from 'express';
import { randomUUID } from 'crypto';
import { customersApi } from './square.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
      });
    }

    const response =
      await customersApi.createCustomer({
        idempotencyKey: randomUUID(),
        emailAddress: email,
      });

    res.json({
      success: true,
      customer: response.result.customer,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to create customer',
    });
  }
});

export default router;