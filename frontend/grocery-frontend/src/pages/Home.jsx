import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Clock, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { productsAPI } from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, formatPrice } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsAPI.getProducts({ featured: true, limit: 8 }),
        productsAPI.getCategories()
      ]);

      const fetched = productsResponse.data.data || [];
      const fallback = [
        { _id: 'p1', name: 'Fresh Apples', quantity: 1, unit: 'kg', brand: 'FarmFresh', ratings: { average: 4.5, count: 120 }, price: 180, discount: 10, discountedPrice: 162, stock: 10, images: [{ url: '/placeholder-product.jpg' }] },
        { _id: 'p2', name: 'Bananas', quantity: 1, unit: 'dozen', brand: 'HealthyFarm', ratings: { average: 4.3, count: 98 }, price: 60, discount: 0, discountedPrice: 60, stock: 25, images: [{ url: '/placeholder-product.jpg' }] },
        { _id: 'p3', name: 'Whole Wheat Bread', quantity: 400, unit: 'g', brand: 'BakeHouse', ratings: { average: 4.1, count: 76 }, price: 45, discount: 0, discountedPrice: 45, stock: 0, images: [{ url: '/placeholder-product.jpg' }] },
      ];
      setFeaturedProducts(fetched.length ? fetched : fallback);
      setCategories(categoriesResponse.data.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      setFeaturedProducts([
        { _id: 'p1', name: 'Fresh Apples', quantity: 1, unit: 'kg', brand: 'FarmFresh', ratings: { average: 4.5, count: 120 }, price: 180, discount: 10, discountedPrice: 162, stock: 10, images: [{ url: '/placeholder-product.jpg' }] },
        { _id: 'p2', name: 'Bananas', quantity: 1, unit: 'dozen', brand: 'HealthyFarm', ratings: { average: 4.3, count: 98 }, price: 60, discount: 0, discountedPrice: 60, stock: 25, images: [{ url: '/placeholder-product.jpg' }] },
        { _id: 'p3', name: 'Whole Wheat Bread', quantity: 400, unit: 'g', brand: 'BakeHouse', ratings: { average: 4.1, count: 76 }, price: 45, discount: 0, discountedPrice: 45, stock: 0, images: [{ url: '/placeholder-product.jpg' }] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      toast.warning('Please login to your account to add items to cart');
      return;
    }
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fresh Groceries
              <br />
              <span className="text-green-200">Delivered Daily</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Get fresh fruits, vegetables, and daily essentials delivered to your doorstep
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button size="lg" variant="secondary" className="text-green-700">
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Delivery</h3>
              <p className="text-gray-600">Free delivery on orders above ₹500</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quality Assured</h3>
              <p className="text-gray-600">Fresh and quality products guaranteed</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quick Delivery</h3>
              <p className="text-gray-600">Same day delivery available</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Customer support available anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-lg text-gray-600">Explore our wide range of fresh products</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${encodeURIComponent(category._id)}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                      <span className="text-2xl">🥬</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{category._id}</h3>
                    <p className="text-sm text-gray-600">{category.count} items</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-lg text-gray-600">Handpicked fresh products just for you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product._id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={product.images[0]?.url || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    {product.discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        {product.discount}% OFF
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {product.quantity} {product.unit} • {product.brand}
                    </p>
                    <div className="flex items-center mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {product.ratings.average.toFixed(1)} ({product.ratings.count})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(product.discount > 0 ? product.discountedPrice : product.price)}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/products">
              <Button size="lg">
                View All Products
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

