import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Settings = () => {
  const [values, setValues] = useState({
    storeName: '',
    supportEmail: '',
    deliveryFee: '',
    taxRate: '',
    contactPhone: '',
    addressLine1: '',
    addressLine2: '',
    addressCountry: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setValues({
        storeName: data.storeName || '',
        supportEmail: data.supportEmail || '',
        deliveryFee: String(data.deliveryFee ?? ''),
        taxRate: String(data.taxRate ?? ''),
        contactPhone: data.contactPhone || '',
        addressLine1: data.addressLine1 || '',
        addressLine2: data.addressLine2 || '',
        addressCountry: data.addressCountry || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const toSave = {
        storeName: values.storeName.trim(),
        supportEmail: values.supportEmail.trim(),
        deliveryFee: Number(values.deliveryFee) || 0,
        taxRate: Number(values.taxRate) || 0,
        contactPhone: values.contactPhone.trim(),
        addressLine1: values.addressLine1.trim(),
        addressLine2: values.addressLine2.trim(),
        addressCountry: values.addressCountry.trim(),
      };

      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(toSave)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      // Trigger settings refresh across the application
      localStorage.setItem('settings_updated', Date.now().toString());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !saved) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure application settings and preferences</p>
        </div>
        <div className="py-10 text-center text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure application settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSave}>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store name</Label>
                <Input id="storeName" name="storeName" value={values.storeName} onChange={handleChange} placeholder="FreshMart" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support email</Label>
                <Input id="supportEmail" name="supportEmail" type="email" value={values.supportEmail} onChange={handleChange} placeholder="support@freshmart.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Delivery fee (₹)</Label>
                <Input id="deliveryFee" name="deliveryFee" type="number" min="0" step="0.01" value={values.deliveryFee} onChange={handleChange} placeholder="40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax rate (%)</Label>
                <Input id="taxRate" name="taxRate" type="number" min="0" step="0.01" value={values.taxRate} onChange={handleChange} placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input id="contactPhone" name="contactPhone" value={values.contactPhone} onChange={handleChange} placeholder="+91 1800-123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address line 1</Label>
                <Input id="addressLine1" name="addressLine1" value={values.addressLine1} onChange={handleChange} placeholder="123 Market Street" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address line 2</Label>
                <Input id="addressLine2" name="addressLine2" value={values.addressLine2} onChange={handleChange} placeholder="Mumbai, Maharashtra 400001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressCountry">Country</Label>
                <Input id="addressCountry" name="addressCountry" value={values.addressCountry} onChange={handleChange} placeholder="India" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save changes'}
              </Button>
              {saved && <span className="text-green-700 text-sm">Saved successfully!</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

