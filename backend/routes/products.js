const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { cloudinary } = require('../lib/cloudinary');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Use memory storage; we'll stream to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

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
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    
    // Add price range filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
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
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Categories aggregation for filters
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ data: categories });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', protect, admin, upload.single('image'),
  [ body('name').notEmpty(), body('price').isNumeric(), body('category').notEmpty() ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      let imageUrl;
      if (req.file) {
        // Upload buffer to Cloudinary as data URI
        const base64 = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'freshmart/products',
          resource_type: 'image',
        });
        imageUrl = result.secure_url;
      }
      const product = new Product({ ...req.body, image: imageUrl });
      await product.save();
      res.status(201).json(product);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
