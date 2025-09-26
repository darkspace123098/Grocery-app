const axios = require('axios');
// simple test
const API_BASE = 'http://localhost:5000/api';

// Test API endpoints
async function testAPIs() {
  console.log('🧪 Testing FreshMart APIs...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000');
    console.log('✅ Server is running:', healthResponse.data.message);

    // Test 2: Get products
    console.log('\n2. Testing products endpoint...');
    const productsResponse = await axios.get(`${API_BASE}/products`);
    console.log('✅ Products endpoint working. Found', productsResponse.data.pagination?.totalProducts || 0, 'products');

    // Test 3: Get categories
    console.log('\n3. Testing categories endpoint...');
    const categoriesResponse = await axios.get(`${API_BASE}/products/categories/list`);
    console.log('✅ Categories endpoint working. Found', categoriesResponse.data.data?.length || 0, 'categories');

    // Test 4: User registration (demo)
    console.log('\n4. Testing user registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '9876543210',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });
      console.log('✅ User registration working');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('✅ User registration working (user already exists)');
      } else {
        console.log('❌ User registration failed:', error.response?.data?.message || error.message);
      }
    }

    // Test 5: User login
    console.log('\n5. Testing user login...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ User login working');
      
      // Test 6: Protected route (user profile)
      console.log('\n6. Testing protected route...');
      const token = loginResponse.data.token;
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Protected routes working');
      
    } catch (error) {
      console.log('❌ User login failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running on port 5000');
      console.log('   Run: cd backend && npm start');
    }
  }
}

// Run tests
testAPIs();

