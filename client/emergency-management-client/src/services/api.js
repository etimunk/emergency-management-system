import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8082/api', // פורט תואם ל-application.properties (server.port=8082)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: מזריק אוטומטית את הטוקן לכל בקשה במידה והוא קיים ב-LocalStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// טוקן לא תקף / פג תוקף — מנקה session ומחזיר להתחברות
// שגיאות עסקיות (403/400) לא אמורות לנתק את המשתמש
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? '');
    // ננתק רק על 401 (Unauthorized) — טוקן לא תקף
    if (status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      localStorage.removeItem('orgType');
      localStorage.removeItem('tz');
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;