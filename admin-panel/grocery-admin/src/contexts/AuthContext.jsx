import { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Profile fetch failed');
        const data = await res.json();
        const profileUser = data?.user;
        if (!profileUser?.isAdmin) {
          // Non-admins are not allowed in admin panel
          localStorage.removeItem('admin_token');
          setToken(null);
          setUser(null);
        } else {
          setUser(profileUser);
        }
      } catch (e) {
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }
      const loginUser = data?.user;
      if (!loginUser?.isAdmin) {
        return { success: false, message: 'Admin access required' };
      }
      if (!data.token) {
        return { success: false, message: 'Token missing in response' };
      }
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setUser({ _id: loginUser._id, name: loginUser.name, email: loginUser.email, isAdmin: loginUser.isAdmin });
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

