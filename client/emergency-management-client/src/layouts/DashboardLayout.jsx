import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

    const menuItems = [
    { label: 'מפת חפ"ק ראשית', path: '/dashboard' },
    { label: 'אירועים פתוחים', path: '/admin/incidents' },
    { label: 'פתיחת אירוע חדש', path: '/admin/create-incident' },
    { label: 'ניהול משאבים', path: '/admin/resources' },
    { label: 'ניהול משתמשים', path: '/admin/users' },
    { label: 'אישור שיוך פרמדיקים', path: '/admin/assignment-approvals' },
    { label: 'היסטוריית אירועים', path: '/admin/incident-history' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      
      {/* 1. סרגל עליון (Header) */}
      <header style={{ 
        height: '60px', backgroundColor: '#1e293b', color: 'white', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f1f5f9' }}>חפ"ק דיגיטלי</span>
          <span style={{ backgroundColor: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            מערכת חירום בזמן אמת
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>{user?.userName || 'משתמש מערכת'}</span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{user?.role} | {user?.orgType}</span>
          </div>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: '#334155', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            התנתק
          </button>
        </div>
      </header>

      {/* אזור התוכן המרכזי + סרגל הצד */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 2. סרגל ניווט צידי (Sidebar) */}
        <nav style={{ width: '220px', backgroundColor: '#0f172a', color: '#94a3b8', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '10px', color: 'white', fontWeight: 'bold', borderBottom: '1px solid #334155', marginBottom: '10px' }}>תפריט ניהול</div>

          {menuItems.map((item) => {
            const isActive = item.path
              ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
              : false;
            const isEnabled = Boolean(item.path);

            return (
              <button
                key={item.label}
                onClick={() => isEnabled && navigate(item.path)}
                disabled={!isEnabled}
                style={{
                  padding: '10px',
                  backgroundColor: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  width: '100%',
                  cursor: isEnabled ? 'pointer' : 'not-allowed',
                  textAlign: 'right',
                  opacity: isEnabled ? 1 : 0.55,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 3. תוכן העמוד המשתנה (Main Content Area) */}
        <main style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px', overflowY: 'auto' }}>
          {children}
        </main>

      </div>
    </div>
  );
}

export default DashboardLayout;