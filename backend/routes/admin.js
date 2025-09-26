const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const AdminModel = require('../models/Admin');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/dashboard', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const products = await Product.countDocuments();
    const orders = await Order.countDocuments();
    const totalSalesAgg = await Order.aggregate([
      { $match: { currentStatus: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    res.json({ users, products, orders, totalSales: totalSalesAgg[0]?.total || 0 });
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

// Delete user (only if deactivated and not admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete admin users' });
    if (user.isActive !== false) return res.status(400).json({ message: 'Deactivate user before deleting' });
    await user.deleteOne();
    res.json({ ok: true, userId: req.params.id });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// List orders (basic)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email');
    res.json({ data: orders });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Update order status (atomic push)
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending','Processing','Shipped','Delivered','Cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const filter = { $or: [ { _id: req.params.id }, { orderNumber: req.params.id } ] };
    const update = {
      $push: { statusHistory: { status, updatedAt: new Date() } },
      $set: { currentStatus: status }
    };
    const opts = { new: true };

    const order = await Order.findOneAndUpdate(filter, update, opts);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ok: true, orderId: order._id, currentStatus: status });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Cancel order (atomic push)
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const filter = { $or: [ { _id: req.params.id }, { orderNumber: req.params.id } ] };
    const update = {
      $push: { statusHistory: { status: 'Cancelled', updatedAt: new Date() } },
      $set: { currentStatus: 'Cancelled' }
    };
    const opts = { new: true };
    const order = await Order.findOneAndUpdate(filter, update, opts);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ok: true, orderId: order._id, currentStatus: 'Cancelled' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Delete order (admin only)
router.delete('/orders/:id', async (req, res) => {
  try {
    const filter = { $or: [ { _id: req.params.id }, { orderNumber: req.params.id } ] };
    const order = await Order.findOneAndDelete(filter);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ok: true, orderId: order._id });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// List admins
router.get('/admins', async (req, res) => {
  try {
    const admins = await AdminModel.find().populate('user', 'name email isActive');
    res.json({ data: admins });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Create admin for an existing user by email
router.post('/admins', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) {
      // ensure Admin doc exists
      const exists = await AdminModel.findOne({ user: user._id });
      if (!exists) await AdminModel.create({ user: user._id, name: user.name, email: user.email, createdBy: req.user._id });
      return res.status(200).json({ ok: true, userId: user._id });
    }

    user.isAdmin = true;
    await user.save();

    const exists = await AdminModel.findOne({ user: user._id });
    if (!exists) {
      await AdminModel.create({ user: user._id, name: user.name, email: user.email, createdBy: req.user._id });
    }

    res.status(201).json({ ok: true, userId: user._id });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Demote/remove admin by Admin doc id or user id
router.delete('/admins/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let adminDoc = await AdminModel.findById(id);
    if (!adminDoc) {
      // maybe id is user id
      adminDoc = await AdminModel.findOne({ user: id });
    }
    if (!adminDoc) return res.status(404).json({ message: 'Admin not found' });

    const user = await User.findById(adminDoc.user);
    if (user) {
      user.isAdmin = false;
      await user.save();
    }
    await adminDoc.deleteOne();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Migrate existing admin users from Users collection to Admin collection
router.post('/admins/migrate', async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true });
    let created = 0;
    for (const u of admins) {
      const exists = await AdminModel.findOne({ user: u._id });
      if (!exists) {
        await AdminModel.create({ user: u._id, name: u.name, email: u.email, createdBy: req.user._id });
        created += 1;
      }
    }
    res.json({ ok: true, migrated: created });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
