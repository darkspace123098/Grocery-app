const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// In-memory settings store (in production, use a database)
let settings = {
  storeName: 'FreshMart',
  supportEmail: 'support@freshmart.com',
  deliveryFee: 40,
  taxRate: 5,
  currency: 'INR',
  currencySymbol: '₹'
};

// Get settings
router.get('/', async (req, res) => {
  try {
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings (admin only)
router.put('/', protect, admin,
  [
    body('storeName').optional().isString().trim(),
    body('supportEmail').optional().isEmail(),
    body('deliveryFee').optional().isNumeric().isFloat({ min: 0 }),
    body('taxRate').optional().isNumeric().isFloat({ min: 0, max: 100 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
    body('currencySymbol').optional().isString().isLength({ min: 1, max: 5 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Update settings
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        }
      });

      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
