const ProductSchema = require('../models/Product');

exports.getAllProducts = async () => {
  return await ProductSchema.find({});
};

exports.getProductById = async (id) => {
  return await ProductSchema.findOne({ _id: id });
};

exports.createProduct = async (productData) => {
  const product = new ProductSchema(productData);
  return await product.save();
};

exports.updateProduct = async (id, updateData) => {
  return await ProductSchema.findOneAndUpdate(
    { _id: id },
    { inStock: updateData.inStock },
    { new: true },
  );
};

exports.deleteProduct = async (id) => {
  return await ProductSchema.findByIdAndDelete(id);
};
