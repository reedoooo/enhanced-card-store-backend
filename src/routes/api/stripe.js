// const stripe = require('stripe')(process.env.STRIPE_SECRET_TEST_KEY);
// const express = require('express');

// const router = express.Router();

// // This is your Stripe CLI webhook secret for testing your endpoint locally.
// // const endpointSecret = process.env.STRIPE_SECRET_TEST_KEY;

// router.post('/checkout', async (req, res) => {
//   logger.info('Request', req.body);
//   const { id, amount } = req.body;

//   // Check if id and amount are provided
//   if (!id || !amount) {
//     res.status(400).json({
//       message: 'Payment failed',
//       success: false,
//       reason: 'Missing necessary payment parameters',
//     });
//     return;
//   }

//   try {
//     const payment = await stripe.paymentIntents.create({
//       amount,
//       currency: 'USD',
//       description: 'Card Company Mock Website',
//       payment_method: id,
//       confirm: true,
//     });

//     logger.info('Payment', payment);

//     res.json({
//       message: 'Payment successful',
//       success: true,
//     });
//   } catch (error) {
//     logger.info('Error', error);

//     res.json({
//       message: 'Payment failed',
//       success: false,
//     });
//   }
// });

// module.exports = router;
