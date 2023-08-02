
app.post('/create-payment-intent', async (req, res) => {
  const { items, currency } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: currency,
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

const calculateOrderAmount = (items) => {
  // Replace this with your calculation logic
  // You might want to call your pricing service, calculate the order amount based on the items and quantity
  // For the sake of simplicity of this example, let's return a fixed amount
  return 1400;
};