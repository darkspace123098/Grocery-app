import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../utils/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    storeName: 'FreshMart',
    supportEmail: 'support@freshmart.com',
    deliveryFee: 40,
    taxRate: 5,
    currency: 'INR',
    currencySymbol: '₹'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Listen for settings updates from admin panel
    const handleStorageChange = (e) => {
      if (e.key === 'settings_updated') {
        fetchSettings();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      setSettings(response.data);
      // Store in localStorage for cart calculations
      localStorage.setItem('settings', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings if fetch fails
      localStorage.setItem('settings', JSON.stringify(settings));
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = () => {
    fetchSettings();
  };

  const value = {
    settings,
    loading,
    fetchSettings,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
