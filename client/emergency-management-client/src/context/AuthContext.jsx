import { createContext, useState, useContext, useEffect } from 'react';
import { loginUser } from '../features/users/services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // בדיקה בזמן טעינת האפליקציה אם המשתמש כבר מחובר (נשמר ב-LocalStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userName = localStorage.getItem('userName');
    const orgType = localStorage.getItem('orgType');
    const tz = localStorage.getItem('tz');

    if (token && role) {
      setUser({ token, role, userName, orgType, tz: tz ? Number(tz) : null });
    }
    setLoading(false);
  }, []);

  const login = async (tz, password) => {
    const data = await loginUser(tz, password);
    const tzText = String(tz ?? '').trim();
    const tzNumber = Number(tzText);
    
    // שמירה בדפדפן כדי שהחיבור יישאר גם בריפרש
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userName', data.userName);
    localStorage.setItem('orgType', data.orgType);
    localStorage.setItem('tz', tzText);

    setUser({
      token: data.token,
      role: data.role,
      userName: data.userName,
      orgType: data.orgType,
      tz: tzNumber
    });

    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'ADMIN' }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook נוח לשימוש מהיר ברכיבים
export const useAuth = () => useContext(AuthContext);