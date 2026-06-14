import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

export default function Activity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setActivity(r.data?.recentActivity || []))
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setLoading(false));
  }, []);

  const typeColor = (type) => {
    if (!type) return '#6b7280';
    if (type.includes('SETTLEMENT')) return '#10b981';
    if (type.includes('DELETED')) return '#f87171';
    return '#3b82f6';
  };

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input className="search-bar" placeholder="Search activity..." />
        </div>

        <div style={{ padding: '28px', maxWidth: 720 }}>
          <h1 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Activity Feed</h1>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}

          {!loading && activity.length === 0 && (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
              <p style={{ color: '#4b5563', fontSize: 14 }}>No activity yet. Add an expense to get started!</p>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            {activity.length > 0 && (
              <div style={{ position: 'absolute', left: 19, top: 24, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', position: 'relative' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${typeColor(a.type)}15`, border: `1px solid ${typeColor(a.type)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor(a.type) }} />
                  </div>
                  <div className="card" style={{ flex: 1, padding: '14px 18px' }}>
                    <p style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1.5 }}>{a.description}</p>
                    <p style={{ color: '#4b5563', fontSize: 12, marginTop: 6 }}>
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
