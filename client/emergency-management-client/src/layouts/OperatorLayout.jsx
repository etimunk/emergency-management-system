import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

function OperatorLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: 'מסך מפעיל', path: '/operations' },
    { label: 'דיווח פעולה', path: '/operations/action-log' },
    { label: 'ניהול פצועים', path: '/operations/casualties' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ height: '58px', backgroundColor: '#1f2937', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
        <strong>מסך מפעיל משאב</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px' }}>{user?.userName} | {user?.orgType}</span>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
            התנתק
          </button>
        </div>
      </header>
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: '220px', backgroundColor: '#0f172a', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  padding: '10px',
                  textAlign: 'right',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: active ? '#1e293b' : 'transparent',
                  color: active ? 'white' : '#94a3b8',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </aside>
        <main style={{ flex: 1, backgroundColor: '#f8fafc', padding: '16px' }}>{children}</main>
      </div>
    </div>
  );
}

export default OperatorLayout;

