import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGroups } from '../api/groups';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

function fmt(n) {
  const num = parseFloat(n) || 0;
  return `₹${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroups()
      .then(r => setGroups(r.data))
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input className="search-bar" placeholder="Search groups..." />
          <Link to="/groups/new" className="btn-primary" style={{ textDecoration: 'none' }}>+ New Group</Link>
        </div>

        <div style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>Your Groups</h1>
            <span style={{ color: '#4b5563', fontSize: 13 }}>{groups.length} group{groups.length !== 1 ? 's' : ''}</span>
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 16 }}>👥</p>
              <p style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No groups yet</p>
              <p style={{ color: '#4b5563', fontSize: 14, marginBottom: 24 }}>Create a group to start splitting expenses with friends</p>
              <Link to="/groups/new" className="btn-primary" style={{ textDecoration: 'none' }}>+ Create your first group</Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {groups.map(g => (
              <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(20,184,166,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 800, fontSize: 18 }}>
                      {g.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                      {g.memberCount || 0} members
                    </span>
                  </div>
                  <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{g.name}</p>
                  {g.description && <p style={{ color: '#4b5563', fontSize: 13, marginBottom: 12 }}>{g.description}</p>}
                  <p style={{ color: '#374151', fontSize: 12 }}>
                    Created {new Date(g.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}

            {/* New group card */}
            {!loading && (
              <Link to="/groups/new" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '20px', cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: 10, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px dashed rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: 22 }}>+</div>
                  <p style={{ color: '#4b5563', fontSize: 14 }}>Create new group</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
