import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

const fmt = n => `₹${Math.abs(parseFloat(n)||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

const GROUP_COLORS = [
  { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' },
  { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', text: '#a855f7' },
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)', text: '#ec4899' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      <Sidebar />
      <div className="main-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:32, height:32, border:'2px solid rgba(16,185,129,0.3)', borderTop:'2px solid #10b981', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      </div>
    </>
  );

  const net = parseFloat(data?.totalBalance || 0);
  const name = data?.currentUser?.name || '';
  const firstName = name.split(' ')[0];

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">

        {/* ─── Top bar ─────────────────────────────────────────── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 28px',
          borderBottom:'1px solid rgba(255,255,255,0.05)',
          background:'rgba(13,17,23,0.8)', backdropFilter:'blur(12px)',
          position:'sticky', top:0, zIndex:10,
        }}>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <span style={{ color:'#6b7280', fontSize:11 }}>Good day 👋</span>
            <span style={{ color:'#f1f5f9', fontSize:16, fontWeight:700 }}>{firstName}</span>
          </div>

          <input className="search-bar" placeholder="Search expenses or groups…" />

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button style={{
              width:36, height:36, borderRadius:9,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
              color:'#6b7280', fontSize:14, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>🔔</button>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background:'rgba(16,185,129,0.12)', border:'2px solid rgba(16,185,129,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#10b981', fontWeight:700, fontSize:14,
            }}>
              {name[0] || 'U'}
            </div>
          </div>
        </div>

        {/* ─── Page content ─────────────────────────────────────── */}
        <div style={{ padding:'28px 28px 48px', display:'flex', flexDirection:'column', gap:28 }}>

          {/* ─── Three stat cards ──────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            {/* Net balance */}
            <div className="card" style={{
              padding:'24px 24px',
              background:'linear-gradient(135deg,rgba(16,185,129,0.1) 0%,rgba(16,185,129,0.02) 100%)',
              borderColor:'rgba(16,185,129,0.2)',
              display:'flex', flexDirection:'column', gap:10,
            }}>
              <p style={{ color:'#6b7280', fontSize:11, fontWeight:600, letterSpacing:'0.08em' }}>NET BALANCE</p>
              <p style={{ fontSize:30, fontWeight:800, letterSpacing:'-1px', color: net>=0?'#10b981':'#f87171' }}>
                {net>=0?'+':'-'}{fmt(net)}
              </p>
              <span style={{
                alignSelf:'flex-start',
                background: net>=0?'rgba(16,185,129,0.15)':'rgba(248,113,113,0.15)',
                color: net>=0?'#10b981':'#f87171',
                fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20,
              }}>
                {net>=0?'↑ You are owed':'↓ You owe'}
              </span>
            </div>

            {/* You owe */}
            <div className="card" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:10 }}>
              <p style={{ color:'#6b7280', fontSize:11, fontWeight:600, letterSpacing:'0.08em' }}>YOU OWE</p>
              <p style={{ fontSize:30, fontWeight:800, letterSpacing:'-1px', color:'#f87171' }}>{fmt(data?.totalOwe)}</p>
              <span style={{ color:'#4b5563', fontSize:12 }}>Outstanding debts</span>
            </div>

            {/* You are owed */}
            <div className="card" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:10 }}>
              <p style={{ color:'#6b7280', fontSize:11, fontWeight:600, letterSpacing:'0.08em' }}>YOU ARE OWED</p>
              <p style={{ fontSize:30, fontWeight:800, letterSpacing:'-1px', color:'#10b981' }}>{fmt(data?.totalOwed)}</p>
              <span style={{ color:'#4b5563', fontSize:12 }}>Pending collections</span>
            </div>
          </div>

          {/* ─── Bottom: Groups (left) + Activity (right) ──────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24, alignItems:'start' }}>

            {/* Groups */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h2 style={{ color:'#f1f5f9', fontSize:15, fontWeight:700 }}>Your Groups</h2>
                <Link to="/groups" style={{ color:'#10b981', fontSize:12, fontWeight:500, textDecoration:'none' }}>View all →</Link>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:14 }}>
                {data?.groupBalances?.map((g, idx) => {
                  const b = parseFloat(g.balance||0);
                  const c = GROUP_COLORS[idx % GROUP_COLORS.length];
                  return (
                    <Link key={g.groupId} to={`/groups/${g.groupId}`} style={{ textDecoration:'none' }}>
                      <div className="card" style={{ padding:'20px', cursor:'pointer', transition:'all 0.18s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor=c.border; e.currentTarget.style.transform='translateY(-3px)'; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                          <div style={{ width:42, height:42, borderRadius:12, background:c.bg, border:`1.5px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:c.text, fontWeight:800, fontSize:17 }}>
                            {g.groupName?.[0]?.toUpperCase()}
                          </div>
                          <span style={{
                            fontSize:10, fontWeight:700, letterSpacing:'0.04em', padding:'3px 8px', borderRadius:20,
                            background: b>0?'rgba(16,185,129,0.12)': b<0?'rgba(248,113,113,0.12)':'rgba(255,255,255,0.06)',
                            color: b>0?'#10b981': b<0?'#f87171':'#6b7280',
                          }}>
                            {b>0?'OWED': b<0?'OWES':'SETTLED'}
                          </span>
                        </div>
                        <p style={{ color:'#e2e8f0', fontWeight:600, fontSize:14, marginBottom:4 }}>{g.groupName}</p>
                        <p style={{ color:'#4b5563', fontSize:11, marginBottom:10 }}>Your balance</p>
                        <p style={{ fontWeight:800, fontSize:18, color: b>=0?'#10b981':'#f87171' }}>
                          {b>=0?'+':'-'}{fmt(b)}
                        </p>
                      </div>
                    </Link>
                  );
                })}

                {/* Empty state */}
                {data?.groupBalances?.length === 0 && (
                  <div className="card" style={{ gridColumn:'1/-1', padding:'36px 24px', textAlign:'center' }}>
                    <p style={{ fontSize:32, marginBottom:10 }}>🏖️</p>
                    <p style={{ color:'#6b7280', fontSize:14, marginBottom:4 }}>No groups yet</p>
                    <Link to="/groups/new" style={{ color:'#10b981', fontSize:13 }}>Create your first group →</Link>
                  </div>
                )}

                {/* New group */}
                <Link to="/groups/new" style={{ textDecoration:'none' }}>
                  <div className="card" style={{
                    padding:'20px', cursor:'pointer', minHeight:158,
                    border:'1.5px dashed rgba(255,255,255,0.1)',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    gap:10, color:'#4b5563', transition:'all 0.18s',
                  }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(16,185,129,0.4)'; e.currentTarget.style.color='#10b981'; e.currentTarget.style.background='rgba(16,185,129,0.03)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#4b5563'; e.currentTarget.style.background=''; }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', border:'1.5px dashed currentColor', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>+</div>
                    <p style={{ fontSize:13, fontWeight:500 }}>New Group</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h2 style={{ color:'#f1f5f9', fontSize:15, fontWeight:700 }}>Activity</h2>
                <Link to="/activity" style={{ color:'#10b981', fontSize:12, fontWeight:500, textDecoration:'none' }}>See all →</Link>
              </div>

              <div className="card" style={{ overflow:'hidden' }}>
                {(!data?.recentActivity || data.recentActivity.length === 0) && (
                  <div style={{ padding:'32px 20px', textAlign:'center' }}>
                    <p style={{ fontSize:24, marginBottom:8 }}>💤</p>
                    <p style={{ color:'#4b5563', fontSize:13 }}>No activity yet</p>
                  </div>
                )}

                {data?.recentActivity?.map((a, i) => {
                  const dotColor = a.type==='SETTLEMENT_CREATED'?'#10b981': a.type?.includes('DELETED')?'#f87171':'#3b82f6';
                  return (
                    <div key={i} style={{
                      padding:'14px 16px',
                      borderBottom: i<data.recentActivity.length-1?'1px solid rgba(255,255,255,0.04)':'none',
                      display:'flex', gap:12, alignItems:'flex-start',
                      transition:'background 0.15s',
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{
                        width:8, height:8, borderRadius:'50%', marginTop:5, flexShrink:0,
                        background:dotColor,
                        boxShadow:`0 0 8px ${dotColor}66`,
                      }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color:'#d1d5db', fontSize:12, lineHeight:1.5, wordBreak:'break-word' }}>{a.description}</p>
                        <p style={{ color:'#374151', fontSize:10, marginTop:4 }}>
                          {new Date(a.createdAt).toLocaleDateString('en-IN',{ day:'numeric', month:'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
