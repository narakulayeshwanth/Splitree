import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function Profile() {
  const { user } = useAuth();

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>Profile</h1>
        </div>

        <div style={{ padding: '28px', maxWidth: 560 }}>
          {/* Avatar card */}
          <div className="card" style={{ padding: '28px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#10b981', fontSize: 28, fontWeight: 800 }}>{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>{user?.name}</p>
              <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{user?.email}</p>
              <span style={{ display: 'inline-block', marginTop: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>Active member</span>
            </div>
          </div>

          {/* Details card */}
          <div className="card" style={{ padding: '8px 24px' }}>
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email Address', value: user?.email },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Account Status', value: 'Active' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>{row.label}</span>
                <span style={{ color: row.label === 'Account Status' ? '#10b981' : '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
