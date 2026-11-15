import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateTz } from '../../../utils/validators';

// MUI imports (safe addition)
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

function UserLoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate(data?.role === 'ADMIN' ? '/dashboard' : '/operations');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('פרטי התחברות שגויים. נסי: ת"ז 200000001 (מנהל משאב) או 200000501 (פרמדיק), סיסמה user1234');
      } else {
        const errorData = err?.response?.data;
        const errorMessage = typeof errorData === 'string' 
          ? errorData 
          : (errorData?.message || err?.message || 'פרטי התחברות שגויים, אנא נסה שנית.');
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative', maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* כפתור בצד המעביר למסך מנהל המערכת */}
      <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
        <button 
          onClick={() => navigate('/admin-login')}
          style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          כניסת מנהל ←
        </button>
      </div>

      <h2 style={{ marginTop: '20px', textAlign: 'center' }}>מערכת חירום - כניסת צוותי שטח</h2>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>אין אפשרות להרשמה עצמית. הגישה לצוותים מורשים בלבד.</p>
      
      {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

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
          color="error"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'מבצע אימות...' : 'התחבר למערכת'}
        </Button>
      </form>
    </div>
  );
}

export default UserLoginForm;