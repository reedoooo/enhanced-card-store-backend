// src/middleware/handleStripePayment.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY);

const handleStripePayment = async (req, res, next) => {
  try {
    const { amount, currency, source } = req.body;
    const charge = await stripe.charges.create({
      amount,
      currency,
      source,
      description: "Example charge",
    });
    res.status(200).json(charge);
  } catch (error) {
    next(error); // Forward to error handling middleware
  }
};

module.exports = handleStripePayment;
