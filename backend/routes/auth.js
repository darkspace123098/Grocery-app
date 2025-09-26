const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

const strongPassword = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('Password must contain at least one special character');

router.post('/register',
  [ body('name').notEmpty(), body('email').isEmail(), strongPassword ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'User already exists' });

      user = await User.create({ name, email, password });
      const token = generateToken(user._id);
      res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/login',
  [ body('email').isEmail(), body('password').exists() ],
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const ok = await user.matchPassword(password);
      if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = generateToken(user._id);
      return res.json({ token, user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/profile', protect, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user: updated });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', protect,
  [ body('currentPassword').isString().notEmpty(), strongPassword.customSanitizer(v => v) ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { currentPassword, password } = { currentPassword: req.body.currentPassword, password: req.body.password };
      const user = await User.findById(req.user._id).select('+password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      const ok = await user.matchPassword(currentPassword);
      if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
      user.password = password;
      await user.save();
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
  }
);

module.exports = router;
