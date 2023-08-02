const express = require('express');
const router = express.Router();
const productController = require('../../controllers/ProductController');

router.get('/', async (req, res) => {
  try {
    const products = await productController.getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await productController.getProductById(req.params.id);
    if (product === null) {
      return res.status(404).json({ message: 'Cannot find product' });
    }
    res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await productController.createProduct(req.body);
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await productController.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await productController.deleteProduct(req.params.id);
    if (product === null) {
      return res.status(404).json({ message: 'Cannot find product' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
