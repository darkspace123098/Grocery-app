import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const initialUsers = [
  { id: 'U001', name: 'John Doe', email: 'john@example.com', active: true },
  { id: 'U002', name: 'Jane Smith', email: 'jane@example.com', active: true },
  { id: 'U003', name: 'Bob Johnson', email: 'bob@example.com', active: false },
];

const Users = () => {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        const mapped = (Array.isArray(data?.data) ? data.data : data).map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          active: u.isActive !== false,
        }));
        if (mapped.length) setUsers(mapped);
      } catch (e) {
        setError(e.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchUsers();
  }, [token]);

  const reload = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const mapped = (Array.isArray(data?.data) ? data.data : data).map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        active: u.isActive !== false,
      }));
      setUsers(mapped);
    } catch (_) {}
  };

  // Debounce query to reduce frequent filtering and avoid transient single-character behavior
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => clearTimeout(id);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debouncedQuery;
    if (!q) return users;
    return users.filter((u) => {
      const haystack = `${u?.name || ''} ${u?.email || ''} ${u?.id || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, debouncedQuery]);

  const toggleActive = async (id) => {
    const prev = users;
    setUsers((cur) => cur.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update user');
      await reload();
    } catch (e) {
      setUsers(prev);
    }
  };

  const deleteUser = async (id) => {
    const ok = window.confirm('Delete this user? This action cannot be undone.');
    if (!ok) return;
    const prev = users;
    setUsers((cur) => cur.filter((u) => u.id !== id));
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await reload();
    } catch (e) {
      setUsers(prev);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600">Manage customer accounts and permissions</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <CardTitle>Users</CardTitle>
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-600">Loading users...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant={u.active ? 'destructive' : 'default'} onClick={() => toggleActive(u.id)}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      {!u.active && (
                        <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Users {users === initialUsers ? '(demo)' : ''}</TableCaption>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;

