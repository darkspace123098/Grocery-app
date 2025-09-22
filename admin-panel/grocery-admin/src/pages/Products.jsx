import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: null,
  });

  const { token } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data.data || data); // Handle both response formats
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = query
    ? products.filter((p) =>
        [p.name, p.category, p.brand]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(query.toLowerCase()))
      )
    : products;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm((prev) => ({ ...prev, image: files && files[0] ? files[0] : null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: '', stock: '', image: null });
    setCreateError('');
  };

  const createProduct = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const body = new FormData();
      body.append('name', form.name);
      body.append('description', form.description);
      body.append('price', String(form.price));
      body.append('category', form.category);
      if (form.stock !== '') body.append('stock', String(form.stock));
      if (form.image) body.append('image', form.image);

      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Do NOT set Content-Type for FormData
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (data.errors && data.errors[0]?.msg) || 'Create failed');
      }
      // Refresh list
      setProducts((prev) => [data, ...prev]);
      setOpen(false);
      resetForm();
      
      // Also refresh the full list to ensure consistency
      const res2 = await fetch(`${API_BASE}/api/products`);
      if (res2.ok) {
        const updatedData = await res2.json();
        setProducts(updatedData.data || updatedData);
      }
    } catch (err) {
      setCreateError(err.message || 'Something went wrong');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
        <p className="text-gray-600">Manage your grocery products inventory</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>+ Add Product</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={createProduct} className="space-y-4">
                  {createError && (
                    <div className="text-sm text-red-600">{createError}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" value={form.description} onChange={handleChange} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input id="price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input id="stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" value={form.category} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Image</Label>
                    <Input id="image" name="image" type="file" accept="image/*" onChange={handleChange} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createLoading}>
                      {createLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-600">Loading products...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-600">No products found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p._id || p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-right">₹{Number(p.price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{p.stock ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Fetched from {`${API_BASE}/api/products`}</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;

