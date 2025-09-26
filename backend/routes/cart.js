const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart'); // legacy model (kept for backward compatibility)
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    // Prefer embedded cart on user document
    const user = await User.findById(req.user._id).populate('cart.product');
    if (user && Array.isArray(user.cart)) {
      return res.json({ user: req.user._id, items: user.cart });
    }

    // Fallback to legacy Cart collection if user.cart is missing
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart
router.post('/add', protect, [
  body('productId').isMongoId(),
  body('quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Work on raw document (not populated) to safely compare ObjectIds
    const user = await User.findById(req.user._id);
    if (!user.cart) user.cart = [];
    const existing = user.cart.find(ci => ci.product.toString() === String(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    await user.save();
    const populated = await User.findById(user._id).populate('cart.product');
    return res.json({ user: populated._id, items: populated.cart });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update item quantity
router.put('/update', protect, [
  body('productId').isMongoId(),
  body('quantity').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user.cart) user.cart = [];

    if (quantity === 0) {
      user.cart = user.cart.filter(item => item.product.toString() !== String(productId));
    } else {
      const item = user.cart.find(item => item.product.toString() === String(productId));
      if (!item) return res.status(404).json({ message: 'Item not found in cart' });
      item.quantity = quantity;
    }

    await user.save();
    const populated = await User.findById(user._id).populate('cart.product');
    return res.json({ user: populated._id, items: populated.cart });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const user = await User.findById(req.user._id);
    if (!user.cart) user.cart = [];
    user.cart = user.cart.filter(item => item.product.toString() !== String(productId));
    await user.save();
    const populated = await User.findById(user._id).populate('cart.product');
    return res.json({ user: populated._id, items: populated.cart });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear cart
router.delete('/clear', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    return res.json({ user: user._id, items: [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
