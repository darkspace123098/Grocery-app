import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailToAdd, setEmailToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (token) fetchAdmins();
  }, [token]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch admins');
      const data = await res.json();
      const mapped = (Array.isArray(data?.data) ? data.data : data).map((a) => ({
        id: a._id,
        userId: a.user?._id || a.user,
        name: a.name || a.user?.name,
        email: a.email || a.user?.email,
        active: a.user?.isActive !== false,
      }));
      setAdmins(mapped);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => `${a.name} ${a.email}`.toLowerCase().includes(q));
  }, [admins, query]);

  const addAdmin = async () => {
    if (!emailToAdd.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailToAdd.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Failed to add admin');
      }
      setEmailToAdd('');
      await fetchAdmins();
    } catch (e) {
      setError(e.message || 'Failed to add admin');
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (admin) => {
    const ok = window.confirm(`Remove admin access for ${admin.email}?`);
    if (!ok) return;
    const prev = admins;
    setAdmins((cur) => cur.filter((a) => a.id !== admin.id));
    try {
      const res = await fetch(`${API_BASE}/api/admin/admins/${admin.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove admin');
      await fetchAdmins();
    } catch (e) {
      setAdmins(prev);
      setError(e.message || 'Failed to remove admin');
    }
  };

  const migrateAdmins = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/admins/migrate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to migrate admins');
      await fetchAdmins();
    } catch (e) {
      setError(e.message || 'Failed to migrate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
          <p className="text-gray-600">Manage administrator accounts</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admins</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-600">Loading admins...</div>
          ) : (
            <>
              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Input
                  type="email"
                  placeholder="Enter user email to promote"
                  value={emailToAdd}
                  onChange={(e) => setEmailToAdd(e.target.value)}
                  className="w-80"
                />
                <Button onClick={addAdmin} disabled={saving || !emailToAdd.trim()}>
                  {saving ? 'Adding...' : 'Add Admin'}
                </Button>
                <Button variant="outline" onClick={migrateAdmins} disabled={saving}>
                  Migrate Existing
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${a.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                          {a.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => removeAdmin(a)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Admins management</TableCaption>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admins;
