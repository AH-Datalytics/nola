import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const USERS = {
  admin: { password: 'nola-admin', role: 'admin', name: 'Administrator' },
  viewer: { password: 'nola-viewer', role: 'viewer', name: 'Viewer' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    const userData = USERS[username];
    if (userData && userData.password === password) {
      setUser({ username, role: userData.role, name: userData.name });
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
