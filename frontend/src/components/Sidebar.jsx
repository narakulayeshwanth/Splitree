import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', end: true, icon: '⊞', label: 'Dashboard' },
  { to: '/groups', end: false, icon: '⊕', label: 'Groups' },
  { to: '/activity', end: false, icon: '◎', label: 'Activity' },
  { to: '/profile', end: false, icon: '◯', label: 'Profile' },
  { to: '/settings', end: false, icon: '⚙', label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ padding: '4px 8px 20px' }}>
        <p style={{ color: '#10b981', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>Splitree</p>
        <p style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>Premium Expense Sharing</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* Add expense floating btn */}
      <button onClick={() => navigate('/groups')}
        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, width: '100%', transition: 'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}>
        + Add Expense
      </button>

      {/* User */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px 12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ color: '#4b5563', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="sidebar-link" style={{ width: '100%', color: '#ef4444', background: 'none', border: 'none' }}>
          ↩ Sign out
        </button>
      </div>
    </aside>
  );
}
