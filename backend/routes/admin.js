const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/dashboard', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const products = await Product.countDocuments();
    const orders = await Order.countDocuments();
    const totalSales = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
    res.json({ users, products, orders, totalSales: totalSales[0]?.total || 0 });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// List users (basic info)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('_id name email isActive isAdmin createdAt');
    res.json({ data: users });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Toggle user active
router.patch('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ _id: user._id, isActive: user.isActive });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// List orders (basic)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email');
    res.json({ data: orders });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ $or: [ { _id: req.params.id }, { orderNumber: req.params.id } ] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.statusHistory.push({ status });
    await order.save();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Cancel order
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findOne({ $or: [ { _id: req.params.id }, { orderNumber: req.params.id } ] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.statusHistory.push({ status: 'Cancelled' });
    await order.save();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
