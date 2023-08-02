const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/OrderController');

router.get('/', async (req, res) => {
  try {
    const orders = await orderController.getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await orderController.getOrderById(req.params.id);
    if (order === null) {
      return res.status(404).json({ message: 'Cannot find order' });
    }
    res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const order = await orderController.createOrder(req.body);
    res.status(201).send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const order = await orderController.updateOrder(req.params.id, req.body);
    res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const order = await orderController.deleteOrder(req.params.id);
    if (order === null) {
      return res.status(404).json({ message: 'Cannot find order' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
