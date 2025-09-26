const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect,
  [
    body('items').isArray({ min: 1 }),
    body('shippingAddress.firstName').isString().notEmpty(),
    body('shippingAddress.lastName').isString().notEmpty(),
    body('shippingAddress.email').isEmail(),
    body('shippingAddress.phone').isString().notEmpty(),
    body('shippingAddress.address').isString().notEmpty(),
    body('shippingAddress.city').isString().notEmpty(),
    body('shippingAddress.state').isString().notEmpty(),
    body('shippingAddress.zipCode').isString().notEmpty(),
    body('paymentMethod').optional().isString(),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { items, shippingAddress, paymentMethod, notes } = req.body;
      let total = 0;
      for (const it of items) {
        const product = await Product.findById(it.product);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.stock < it.quantity) return res.status(400).json({ message: 'Insufficient stock' });
        const effectivePrice = typeof it.price === 'number' ? it.price : product.price;
        total += effectivePrice * it.quantity;
        product.stock -= it.quantity;
        await product.save();
      }
      const order = await Order.create({
        user: req.user._id,
        orderNumber: 'ORD' + Date.now(),
        items,
        totalPrice: total,
        shippingAddress,
        paymentMethod: paymentMethod || 'cod',
        notes,
        statusHistory: [{ status: 'Pending' }],
        currentStatus: 'Pending'
      });
      res.status(201).json(order);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/myorders', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json(orders);
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Lightweight tracking endpoint to get current status timeline
router.get('/:id/track', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('orderNumber statusHistory updatedAt createdAt user');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      orderNumber: order.orderNumber,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      currentStatus: order.statusHistory[order.statusHistory.length - 1]?.status || 'Pending'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
