import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { X, LayoutDashboard, Package, ShoppingCart, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [storeName, setStoreName] = useState('FreshMart');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data?.storeName) setStoreName(data.storeName);
        }
      } catch (_) {}
    };

    fetchSettings();

    const onStorage = (e) => {
      if (e.key === 'settings_updated') fetchSettings();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Admins', href: '/admins', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const initial = (storeName || 'A').trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{initial}</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{storeName} Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 rounded-md mb-1 hover:bg-gray-100 ${location.pathname.startsWith(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
              onClick={onClose}
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;

