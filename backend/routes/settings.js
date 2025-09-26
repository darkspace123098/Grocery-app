const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/auth');
const Settings = require('../models/Settings');

const router = express.Router();

// Ensure one settings document exists
const getSettingsDoc = async () => {
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create({});
  }
  return doc;
};

// Get settings
router.get('/', async (req, res) => {
  try {
    const doc = await getSettingsDoc();
    res.json(doc);
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
    body('currencySymbol').optional().isString().isLength({ min: 1, max: 5 }),
    body('contactPhone').optional().isString().trim(),
    body('addressLine1').optional().isString().trim(),
    body('addressLine2').optional().isString().trim(),
    body('addressCountry').optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const doc = await getSettingsDoc();
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          doc[key] = req.body[key];
        }
      });
      await doc.save();
      res.json(doc);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
