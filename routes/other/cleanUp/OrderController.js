const Order = require('../models/Order');

exports.getAllOrders = async () => {
  return await Order.find({});
};

exports.getOrderById = async (id) => {
  return await Order.findOne({ _id: id });
};

exports.createOrder = async (orderData) => {
  const order = new Order(orderData);
  return await order.save();
};

exports.updateOrder = async (id, updateData) => {
  return await Order.findOneAndUpdate(
    { _id: id },
    { products: updateData.products, totalCost: updateData.totalCost },
    { new: true },
  );
};

exports.deleteOrder = async (id) => {
  return await Order.findByIdAndDelete(id);
};
