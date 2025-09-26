const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../lib/cloudinary');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Use memory storage; we'll stream to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// Helper to upload image to Cloudinary if configured, otherwise save locally
const uploadImage = async (file) => {
  if (!file) return undefined;
  const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  if (hasCloudinary) {
    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'freshmart/products',
      resource_type: 'image',
    });
    return result.secure_url;
  }
  // Fallback: save to local uploads directory
  const uploadsPath = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
  const ext = path.extname(file.originalname) || (file.mimetype.includes('jpeg') ? '.jpg' : file.mimetype.includes('png') ? '.png' : '');
  const filename = `product-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(uploadsPath, filename), file.buffer);
  return `/uploads/${filename}`;
};

// List products with basic filters and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPriceRaw = req.query.minPrice;
    const maxPriceRaw = req.query.maxPrice;
    const minPrice = minPriceRaw !== undefined && minPriceRaw !== '' ? parseFloat(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw !== undefined && maxPriceRaw !== '' ? parseFloat(maxPriceRaw) : undefined;

    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    
    // Add price range filtering only when numeric
    const hasMin = typeof minPrice === 'number' && !Number.isNaN(minPrice);
    const hasMax = typeof maxPrice === 'number' && !Number.isNaN(maxPrice);
    if (hasMin || hasMax) {
      filter.price = {};
      if (hasMin) filter.price.$gte = minPrice;
      if (hasMax) filter.price.$lte = maxPrice;
    }

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      data: products.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        stock: p.stock,
        images: p.image ? [{ url: p.image }] : [{ url: '/placeholder-product.jpg' }],
        ratings: { average: 4.2, count: 10 },
        brand: 'FreshMart',
        quantity: 1,
        unit: 'pc',
        discount: 0,
        discountedPrice: p.price,
      })),
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        hasPrev: page > 1,
        hasNext: page * limit < totalProducts,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Product details
// Categories aggregation for filters (must be BEFORE ":id" route)
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ data: categories });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      images: p.image ? [{ url: p.image }] : [{ url: '/placeholder-product.jpg' }],
      ratings: { average: 4.2, count: 10 },
      brand: 'FreshMart',
      quantity: 1,
      unit: 'pc',
      discount: 0,
      discountedPrice: p.price,
    });
  } catch (e) {
    // Handle invalid ObjectId errors gracefully
    if (e?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, admin, upload.single('image'),
  [ body('name').notEmpty(), body('price').isNumeric(), body('category').notEmpty() ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0]?.msg || 'Validation failed', errors: errors.array() });

      const imageUrl = await uploadImage(req.file);
      const payload = {
        name: (req.body.name || '').trim(),
        description: (req.body.description || '').trim(),
        category: (req.body.category || '').trim(),
        price: req.body.price !== undefined ? Number(req.body.price) : undefined,
        stock: req.body.stock !== undefined && req.body.stock !== '' ? Number(req.body.stock) : undefined,
        image: imageUrl
      };
      const product = new Product(payload);
      await product.save();
      res.status(201).json(product);
    } catch (err) {
      console.error('Create product error:', err);
      res.status(500).json({ message: err?.message || 'Server error' });
    }
});

// Update product
router.put('/:id', protect, admin, upload.single('image'),
  [ body('price').optional().isNumeric() ],
  async (req, res) => {
    try {
      const imageUrl = await uploadImage(req.file);
      const updates = {
        ...(req.body.name !== undefined ? { name: req.body.name.trim() } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description.trim() } : {}),
        ...(req.body.category !== undefined ? { category: req.body.category.trim() } : {}),
        ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
        ...(req.body.stock !== undefined && req.body.stock !== '' ? { stock: Number(req.body.stock) } : {}),
      };
      if (imageUrl) updates.image = imageUrl;
      const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!updated) return res.status(404).json({ message: 'Product not found' });
      res.json(updated);
    } catch (e) {
      console.error('Update product error:', e);
      if (e?.name === 'CastError') return res.status(400).json({ message: 'Invalid product id' });
      res.status(500).json({ message: e?.message || 'Server error' });
    }
  }
);

// Delete product
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ ok: true });
  } catch (e) {
    if (e?.name === 'CastError') return res.status(400).json({ message: 'Invalid product id' });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
