import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    getSubtotal, 
    getDeliveryCharges, 
    getTax, 
    getTotal, 
    formatPrice 
  } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link to="/products">
            <Button size="lg">
              Start Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cart Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.product._id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <img
                    src={item.product.images[0]?.url || '/placeholder-product.jpg'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.product.quantity} {item.product.unit} • {item.product.brand}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(
                          item.product.discount > 0 
                            ? item.product.discountedPrice 
                            : item.product.price
                        )}
                      </span>
                      {item.product.discount > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(item.product.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(
                        (item.product.discount > 0 
                          ? item.product.discountedPrice 
                          : item.product.price) * item.quantity
                      )}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.product._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(getSubtotal())}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charges</span>
                <span className="font-medium">
                  {getDeliveryCharges() === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatPrice(getDeliveryCharges())
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (GST 5%)</span>
                <span className="font-medium">{formatPrice(getTax())}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(getTotal())}</span>
              </div>

              {getSubtotal() < 500 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Add {formatPrice(500 - getSubtotal())} more for free delivery!
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {isAuthenticated ? (
                  <Link to="/checkout" className="block">
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" state={{ from: { pathname: '/checkout' } }} className="block">
                    <Button className="w-full" size="lg">
                      Login to Checkout
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                )}
                
                <Link to="/products" className="block">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Delivery Info */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Delivery Information</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Free delivery on orders above ₹500</li>
                  <li>• Same day delivery available</li>
                  <li>• Fresh products guaranteed</li>
                  <li>• Easy returns & refunds</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;

