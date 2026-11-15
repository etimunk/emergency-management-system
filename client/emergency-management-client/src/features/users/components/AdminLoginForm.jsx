import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateTz } from '../../../utils/validators';

// MUI imports (safe addition)
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function AdminLoginForm() {
  const { login, logout } = useAuth();
  const navigate = useNavigate(); // 2. יצירת פונקציית הניווט
  const [tz, setTz] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const tzValidation = validateTz(tz);
    if (!tzValidation.valid) {
      setError(tzValidation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await login(tz, password);
      if (data?.role !== 'ADMIN') {
        logout();
        setError('מסך זה מיועד למנהלים בלבד.');
        return;
      }
      // 3. ניווט אוטומטי למסך החפ"ק הראשי למנהלים
      navigate('/dashboard');
    } catch (err) {
      const errorData = err?.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || err?.message || 'פרטי התחברות שגויים, אנא נסה שנית.');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    
    <div className="login-card" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>מערכת ניהול אירועי חירום - כניסת מנהל</h2>
      <Button 
        onClick={() => navigate('/login')}
        size="small"
        variant="outlined"
        sx={{ alignSelf: 'flex-start', fontSize: '12px' }}
      >
        כניסת משתמשים ←
      </Button>
      
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <TextField
          label="תעודת זהות"
          type="text"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          placeholder="הזן תעודת זהות"
          required
          fullWidth
          size="small"
        />

        <TextField
          label="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="הזן סיסמה"
          required
          fullWidth
          size="small"
        />

        <Button 
          type="submit" 
          variant="contained" 
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'מתחבר...' : 'התחבר למערכת'}
        </Button>
      </form>
    </div>
  );
}

export default AdminLoginForm;