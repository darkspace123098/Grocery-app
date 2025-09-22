import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const initialOrders = [
  { id: 'ORD001', customer: 'John Doe', total: 1250, status: 'Pending' },
  { id: 'ORD002', customer: 'Jane Smith', total: 890, status: 'Shipped' },
  { id: 'ORD003', customer: 'Bob Johnson', total: 2100, status: 'Processing' },
  { id: 'ORD004', customer: 'Alice Brown', total: 560, status: 'Delivered' },
];

const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const Orders = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        // Expecting an array of orders; gracefully map minimal fields
        const mapped = (Array.isArray(data?.data) ? data.data : data).map((o) => ({
          id: o.orderNumber || o._id,
          customer: o.user?.name || o.user?.email || 'Customer',
          total: o.totalPrice ?? 0,
          status: o.statusHistory?.[o.statusHistory.length - 1]?.status || 'Pending',
        }));
        if (mapped.length) setOrders(mapped);
      } catch (e) {
        setError(e.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesQuery = q
        ? [o.id, o.customer].some((v) => v.toLowerCase().includes(q))
        : true;
      const matchesStatus = statusFilter === 'All' ? true : o.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const updateStatus = async (id, nextStatus) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (e) {
      setOrders(prev);
    }
  };

  const cancelOrder = async (id) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, status: 'Cancelled' } : o)));
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to cancel order');
    } catch (e) {
      setOrders(prev);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600">Manage customer orders and fulfillment</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orders</CardTitle>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search by order # or customer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-600">Loading orders...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell className="text-right">₹{o.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => cancelOrder(o.id)} disabled={o.status === 'Cancelled'}>
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Orders {orders === initialOrders ? '(demo)' : ''}</TableCaption>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;

