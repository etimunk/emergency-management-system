import api from '../../../services/api';

export const loginUser = async (tz, password) => {
  const tzText = String(tz ?? '').trim();
  if (!/^\d{5,12}$/.test(tzText)) {
    throw new Error('יש להזין ת"ז תקינה (ספרות בלבד).');
  }
  if (!String(password ?? '').trim()) {
    throw new Error('יש להזין סיסמה.');
  }

  const response = await api.post('/auth/login', {
    tz: tzText,
    password: String(password),
  });
  return response.data;
};