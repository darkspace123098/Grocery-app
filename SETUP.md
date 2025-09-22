# FreshMart Setup Guide

This guide will help you set up and run the FreshMart grocery ecommerce application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)
- **Git** (optional) - [Download here](https://git-scm.com/)

## Quick Start

### 1. Extract the Project
Extract the `grocery-ecommerce.zip` file to your desired location.

### 2. Install MongoDB (if not already installed)

#### Option A: Local MongoDB
1. Download and install MongoDB Community Server
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **macOS**: `brew services start mongodb/brew/mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in `backend/.env`

### 3. Backend Setup

1. Open terminal and navigate to the backend directory:
   ```bash
   cd grocery-ecommerce/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify the `.env` file exists with these settings:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/grocery-ecommerce
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

   You should see:
   ```
   Server is running on port 5000
   MongoDB Connected: localhost
   ```

### 4. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd grocery-ecommerce/frontend/grocery-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at: http://localhost:5173

### 5. Admin Panel Setup

1. Open another terminal and navigate to the admin panel directory:
   ```bash
   cd grocery-ecommerce/admin-panel/grocery-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the admin panel development server:
   ```bash
   npm run dev
   ```

   The admin panel will be available at: http://localhost:5174

## Testing the Application

### 1. Test Backend APIs
Run the API test script:
```bash
cd grocery-ecommerce
node test-api.js
```

### 2. Access the Applications

#### Customer Frontend
- URL: http://localhost:5173
- Demo User: user@demo.com / password123

#### Admin Panel
- URL: http://localhost:5174
- Demo Admin: admin@demo.com / admin123

## Adding Sample Data

To add sample products and test the application:

1. Login to the admin panel
2. Navigate to Products section
3. Add sample grocery products
4. Test the customer frontend with the new products

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
- **Error**: `MongoDB connection error`
- **Solution**: 
  - Ensure MongoDB is running
  - Check the `MONGODB_URI` in `.env`
  - For Windows, start MongoDB service from Services

#### 2. Port Already in Use
- **Error**: `Port 5000 is already in use`
- **Solution**: 
  - Kill the process using the port: `npx kill-port 5000`
  - Or change the port in `backend/.env`

#### 3. Frontend Build Errors
- **Error**: Module not found errors
- **Solution**: 
  - Delete `node_modules` and `package-lock.json`
  - Run `npm install` again

#### 4. CORS Errors
- **Error**: Cross-origin request blocked
- **Solution**: 
  - Ensure backend is running on port 5000
  - Check that CORS is enabled in the backend

### Getting Help

If you encounter issues:

1. Check the console logs for error messages
2. Ensure all services are running (MongoDB, Backend, Frontend)
3. Verify all dependencies are installed
4. Check that ports 5000, 5173, and 5174 are available

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use a production MongoDB instance
3. Build the frontend: `npm run build`
4. Serve the built files with a web server
5. Use environment variables for sensitive data
6. Set up proper SSL certificates
7. Configure reverse proxy (nginx/Apache)

## Features Overview

### Customer Features
- User registration and login
- Browse products by categories
- Search and filter products
- Add items to cart
- Place orders
- Track order status
- User profile management

### Admin Features
- Admin dashboard with statistics
- Product management (CRUD)
- Order management
- User management
- Sales analytics

## Support

For technical support or questions about the application, please refer to the README.md file or contact the development team.

