import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    const primaryUrl = `${API_BASE}/api/products`;
    const fallbackUrl = `/api/products`;
    try {
      let res = await fetch(primaryUrl);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Request to ${primaryUrl} failed (${res.status}). ${text || ''}`.trim());
      }
      const data = await res.json();
      setProducts(data.data || data);
    } catch (primaryErr) {
      console.error('Primary products fetch error:', primaryErr);
      // Try fallback relative URL (useful if API_BASE is misconfigured and a dev proxy is present)
      try {
        let res2 = await fetch(fallbackUrl);
        if (!res2.ok) {
          const text2 = await res2.text().catch(() => '');
          throw new Error(`Request to ${fallbackUrl} failed (${res2.status}). ${text2 || ''}`.trim());
        }
        const data2 = await res2.json();
        setProducts(data2.data || data2);
      } catch (fallbackErr) {
        console.error('Fallback products fetch error:', fallbackErr);
        setProducts([]);
        setError(
          `Failed to fetch products. URL tried: ${primaryUrl} ` +
          `(${primaryErr.message}). Fallback: ${fallbackUrl} (${fallbackErr.message}).`
        );
      }
    } finally {
      setLoading(false);
    }
  };

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
    setEditingProduct(null);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '',
      stock: product.stock || '',
      image: null,
    });
    setOpen(true);
  };

  const createProduct = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    
    try {
      if (!token) {
        throw new Error('You must be logged in as an admin to add products');
      }
      
      // Validation
      if (!form.name.trim()) throw new Error('Product name is required');
      if (!form.description.trim()) throw new Error('Product description is required');
      if (!form.category.trim()) throw new Error('Product category is required');
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
        throw new Error('Please enter a valid price');
      }
      if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0)) {
        throw new Error('Please enter a valid stock value');
      }

      const body = new FormData();
      body.append('name', form.name.trim());
      body.append('description', form.description.trim());
      body.append('price', String(form.price));
      body.append('category', form.category.trim());
      if (form.stock !== '') body.append('stock', String(form.stock));
      if (form.image) body.append('image', form.image);

      const url = editingProduct ? `${API_BASE}/api/products/${editingProduct._id}` : `${API_BASE}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        const message = data?.message || (Array.isArray(data?.errors) && data.errors[0]?.msg) || 'Operation failed';
        throw new Error(message);
      }
      
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      
      // Refresh the products list
      await fetchProducts();
      setOpen(false);
      resetForm();
      
    } catch (err) {
      setCreateError(err.message || 'Something went wrong');
      console.error('Create/Update product error:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete product');
      }
      
      toast.success('Product deleted successfully');
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
      console.error('Delete product error:', err);
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
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
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
                      {createLoading ? (editingProduct ? 'Updating...' : 'Saving...') : (editingProduct ? 'Update' : 'Save')}
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
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p._id || p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-right">₹{Number(p.price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{p.stock ?? '-'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteProduct(p._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
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

