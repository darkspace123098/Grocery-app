import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, token } = useAuth();

  // Load cart from backend when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      // If there is a local cart, migrate it to backend once
      const savedCart = localStorage.getItem('cart');
      const migrate = async () => {
        let parsed = null;
        if (savedCart) {
          try {
            parsed = JSON.parse(savedCart);
            for (const it of parsed) {
              const productId = it?.product?._id;
              const quantity = it?.quantity || 1;
              if (productId) {
                try {
                  await cartAPI.addToCart(productId, quantity);
                } catch (e) {
                  // continue migrating other items
                }
              }
            }
            // Only clear local copy after attempting migration
            localStorage.removeItem('cart');
          } catch (_) {
            // ignore JSON parse/migration errors
          }
        }
        try {
          const response = await cartAPI.getCart();
          const cartItems = response.data.items.map(item => ({ product: item.product, quantity: item.quantity }));
          if (cartItems.length === 0 && parsed && Array.isArray(parsed) && parsed.length > 0) {
            // Keep local items visible if backend cart is empty post-migration
            setItems(parsed);
          } else {
            setItems(cartItems);
          }
        } catch (e) {
          // On fetch failure, keep local items if available
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
          }
        }
      };
      migrate();
    } else {
      // Load from localStorage when not authenticated
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      } else {
        setItems([]);
      }
    }
  }, [isAuthenticated, token]);

  // Persist guest cart changes to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      const cartItems = response.data.items.map(item => ({
        product: item.product,
        quantity: item.quantity
      }));
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (isAuthenticated && token) {
      try {
        await cartAPI.addToCart(product._id, quantity);
        await fetchCart(); // Refresh cart from backend
      } catch (error) {
        console.error('Failed to add to cart:', error);
        // Fallback to local storage if backend fails
        setItems(prevItems => {
          const existingItem = prevItems.find(item => item.product._id === product._id);
          const updatedItems = existingItem
            ? prevItems.map(item =>
                item.product._id === product._id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            : [...prevItems, { product, quantity }];
          localStorage.setItem('cart', JSON.stringify(updatedItems));
          return updatedItems;
        });
      }
    } else {
      // Local cart for non-authenticated users
      setItems(prevItems => {
        const existingItem = prevItems.find(item => item.product._id === product._id);
        
        if (existingItem) {
          const updatedItems = prevItems.map(item =>
            item.product._id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          localStorage.setItem('cart', JSON.stringify(updatedItems));
          return updatedItems;
        } else {
          const updatedItems = [...prevItems, { product, quantity }];
          localStorage.setItem('cart', JSON.stringify(updatedItems));
          return updatedItems;
        }
      });
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated && token) {
      try {
        await cartAPI.removeFromCart(productId);
        await fetchCart(); // Refresh cart from backend
      } catch (error) {
        console.error('Failed to remove from cart:', error);
        // Fallback to local
        setItems(prevItems => {
          const updatedItems = prevItems.filter(item => item.product._id !== productId);
          localStorage.setItem('cart', JSON.stringify(updatedItems));
          return updatedItems;
        });
      }
    } else {
      setItems(prevItems => {
        const updatedItems = prevItems.filter(item => item.product._id !== productId);
        localStorage.setItem('cart', JSON.stringify(updatedItems));
        return updatedItems;
      });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (isAuthenticated && token) {
      try {
        await cartAPI.updateCartItem(productId, quantity);
        await fetchCart(); // Refresh cart from backend
      } catch (error) {
        console.error('Failed to update cart:', error);
        // Fallback to local
        setItems(prevItems => {
          const updatedItems = prevItems.map(item =>
            item.product._id === productId
              ? { ...item, quantity }
              : item
          );
          localStorage.setItem('cart', JSON.stringify(updatedItems));
          return updatedItems;
        });
      }
    } else {
      setItems(prevItems => {
        const updatedItems = prevItems.map(item =>
          item.product._id === productId
            ? { ...item, quantity }
            : item
        );
        localStorage.setItem('cart', JSON.stringify(updatedItems));
        return updatedItems;
      });
    }
  };

  const clearCart = async () => {
    if (isAuthenticated && token) {
      try {
        await cartAPI.clearCart();
        await fetchCart(); // Refresh cart from backend
      } catch (error) {
        console.error('Failed to clear cart:', error);
        throw error;
      }
    } else {
      setItems([]);
      localStorage.removeItem('cart');
    }
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => {
      const price = item.product.discount > 0 
        ? item.product.discountedPrice 
        : item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const getDeliveryCharges = () => {
    const subtotal = getSubtotal();
    // Get delivery fee from settings or use default
    const deliveryFee = JSON.parse(localStorage.getItem('settings') || '{}').deliveryFee || 40;
    return subtotal >= 500 ? 0 : deliveryFee;
  };

  const getTax = () => {
    const subtotal = getSubtotal();
    // Get tax rate from settings or use default
    const taxRate = JSON.parse(localStorage.getItem('settings') || '{}').taxRate || 5;
    return Math.round(subtotal * (taxRate / 100));
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryCharges() + getTax();
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getDeliveryCharges,
    getTax,
    getTotal,
    formatPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

