const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Provide sane defaults for local development
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'devsecret-change-me';
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded images
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// MongoDB connection
const connectDB = async () => {
  try {
    // Use a local MongoDB connection string for development
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Seed default admin user for local development
const seedAdminUser = async () => {
  try {
    const User = require('./models/User');
    const existing = await User.findOne({ email: 'admin@demo.com' });
    if (!existing) {
      await User.create({
        name: 'Admin',
        email: 'admin@demo.com',
        password: 'admin123',
        isAdmin: true,
      });
      console.log('Seeded default admin user: admin@demo.com / admin123');
    } else if (!existing.isAdmin) {
      existing.isAdmin = true;
      await existing.save();
      console.log('Ensured existing user is admin: admin@demo.com');
    }
  } catch (e) {
    console.warn('Admin seed skipped due to error:', e?.message);
  }
};

seedAdminUser();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));

// Seed some demo products if none exist
const Product = require('./models/Product');
const seedProductsIfEmpty = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany([
        { name: 'Fresh Apples', description: 'Crisp and juicy apples', price: 180, category: 'Fruits', stock: 50 },
        { name: 'Bananas', description: 'Sweet ripe bananas', price: 60, category: 'Fruits', stock: 100 },
        { name: 'Whole Wheat Bread', description: 'Healthy whole wheat bread', price: 45, category: 'Bakery', stock: 30 },
      ]);
      console.log('Seeded demo products');
    }
  } catch (e) {
    console.warn('Product seed skipped due to error:', e?.message);
  }
};
seedProductsIfEmpty();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Grocery Ecommerce API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

