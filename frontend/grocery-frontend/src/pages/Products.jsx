import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Star, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { productsAPI } from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, formatPrice } = useCart();
  const { isAuthenticated } = useAuth();

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    page: parseInt(searchParams.get('page')) || 1
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams);
      const response = await productsAPI.getProducts(params);
      const fetched = response.data.data || [];
      setProducts(fetched);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      toast.warning('Please login to your account to add items to cart');
      return;
    }
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  const FilterSidebar = ({ className = '' }) => (
    <div className={`space-y-6 ${className}`}>
      <div>
        <Label className="text-base font-semibold">Search</Label>
        <Input
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-base font-semibold">Category</Label>
        <div className="mt-2 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-categories"
              checked={!filters.category}
              onCheckedChange={() => updateFilters({ category: '' })}
            />
            <Label htmlFor="all-categories">All Categories</Label>
          </div>
          {categories.map((category) => (
            <div key={category._id} className="flex items-center space-x-2">
              <Checkbox
                id={category._id}
                checked={filters.category === category._id}
                onCheckedChange={() => 
                  updateFilters({ 
                    category: filters.category === category._id ? '' : category._id 
                  })
                }
              />
              <Label htmlFor={category._id} className="text-sm">
                {category._id} ({category.count})
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">Price Range</Label>
        <div className="mt-2 space-y-2">
          <Input
            placeholder="Min price"
            type="number"
            value={filters.minPrice}
            onChange={(e) => updateFilters({ minPrice: e.target.value })}
          />
          <Input
            placeholder="Max price"
            type="number"
            value={filters.maxPrice}
            onChange={(e) => updateFilters({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">Sort By</Label>
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-');
            updateFilters({ sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <FilterSidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">
                {pagination.totalProducts} products found
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Filter products by category, price, and more
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {products.map((product) => (
                <Card key={product._id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className={viewMode === 'grid' ? 'p-0' : 'p-4'}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className="relative">
                          <Link to={`/products/${product._id}`}>
                            <img
                              src={product.images[0]?.url || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                          </Link>
                          {product.discount > 0 && (
                            <Badge className="absolute top-2 left-2 bg-red-500">
                              {product.discount}% OFF
                            </Badge>
                          )}
                        </div>
                        <div className="p-4">
                          <Link to={`/products/${product._id}`}>
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-green-600">
                              {product.name}
                            </h3>
                          </Link>
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
                              {product.stock === 0 ? 'Out of Stock' : 'Add'}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex space-x-4">
                        <div className="relative flex-shrink-0">
                          <Link to={`/products/${product._id}`}>
                            <img
                              src={product.images[0]?.url || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          </Link>
                          {product.discount > 0 && (
                            <Badge className="absolute -top-2 -left-2 bg-red-500 text-xs">
                              {product.discount}% OFF
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1">
                          <Link to={`/products/${product._id}`}>
                            <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600">
                              {product.name}
                            </h3>
                          </Link>
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;

