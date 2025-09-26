const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'FreshMart' },
  supportEmail: { type: String, default: 'support@freshmart.com' },
  deliveryFee: { type: Number, default: 40 },
  taxRate: { type: Number, default: 5 },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  contactPhone: { type: String, default: '+91 1800-123-4567' },
  addressLine1: { type: String, default: '123 Market Street' },
  addressLine2: { type: String, default: 'Mumbai, Maharashtra 400001' },
  addressCountry: { type: String, default: 'India' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);


