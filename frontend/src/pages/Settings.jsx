import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Signed out');
  };

  const Section = ({ title, children }) => (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
      <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{title}</h3>
      {children}
    </div>
  );

  const Row = ({ label, value, badge, onClick, danger }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
      <span style={{ color: '#9ca3af', fontSize: 14 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {value && <span style={{ color: danger ? '#f87171' : '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{value}</span>}
        {badge}
        {onClick && <span style={{ color: '#4b5563', fontSize: 14 }}>›</span>}
      </div>
    </div>
  );

  const Toggle = ({ on }) => (
    <div style={{ width: 40, height: 22, borderRadius: 11, background: on ? '#10b981' : '#374151', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>Settings</h1>
        </div>

        <div style={{ padding: '28px', maxWidth: 640 }}>
          {/* Profile */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 800, fontSize: 22 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ color: '#e2e8f0', fontSize: 17, fontWeight: 700 }}>{user?.name}</p>
                <p style={{ color: '#4b5563', fontSize: 13 }}>{user?.email}</p>
                <p style={{ color: '#374151', fontSize: 11, marginTop: 4 }}>
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
            <button className="btn-ghost" style={{ fontSize: 13 }}>Edit Profile</button>
          </div>

          {/* Personal Info */}
          <Section title="Personal Information">
            <Row label="Full Name" value={user?.name} />
            <Row label="Email Address" value={user?.email} />
            <Row label="Phone Number" value="Not set" onClick={() => toast('Coming soon!')} />
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Dark Theme</p>
                <p style={{ color: '#4b5563', fontSize: 12 }}>Enabled by default</p>
              </div>
              <Toggle on={true} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Notifications</p>
                <p style={{ color: '#4b5563', fontSize: 12 }}>Get real-time expense alerts</p>
              </div>
              <Toggle on={true} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Currency</p>
                <p style={{ color: '#4b5563', fontSize: 12 }}>Indian Rupee (₹)</p>
              </div>
              <span style={{ color: '#e2e8f0', fontSize: 13 }}>₹ INR</span>
            </div>
          </Section>

          {/* Security */}
          <Section title="Security">
            <Row label="Change Password" onClick={() => toast('Coming soon!')} />
            <Row label="Two-Factor Authentication" badge={<span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>Active</span>} onClick={() => toast('2FA is active')} />
          </Section>

          {/* Danger zone */}
          <div className="card" style={{ padding: '20px 24px', border: '1px solid rgba(239,68,68,0.15)' }}>
            <h3 style={{ color: '#f87171', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Danger Zone</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Sign Out</p>
                <p style={{ color: '#4b5563', fontSize: 12 }}>Sign out of this device</p>
              </div>
              <button onClick={handleLogout} className="btn-ghost" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.2)', fontSize: 13 }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
