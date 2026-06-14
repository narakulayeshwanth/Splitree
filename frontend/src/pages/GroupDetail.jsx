import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGroup, addMember, removeMember, getBalances } from '../api/groups';
import { getExpenses } from '../api/expenses';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

function fmt(n) {
  const num = parseFloat(n) || 0;
  return `₹${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Group expenses by date string
function groupByDate(expenses) {
  const groups = {};
  expenses.forEach(e => {
    const d = new Date(e.expenseDate);
    const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups);
}

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [tab, setTab] = useState('expenses');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const loadAll = () => {
    return Promise.all([getGroup(id), getExpenses(id), getBalances(id)])
      .then(([g, e, b]) => { setGroup(g.data); setExpenses(e.data); setBalances(b.data); })
      .catch(() => toast.error('Failed to load group'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await addMember(id, email);
      toast.success('Member added!');
      setEmail('');
      const g = await getGroup(id);
      setGroup(g.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeMember(id, userId);
      toast.success('Done');
      const g = await getGroup(id);
      setGroup(g.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading || !group) return (
    <div style={{ display: 'flex' }}><Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    </div>
  );

  const isCreator = group.createdBy === user?.id;
  const netBalance = parseFloat(balances?.userBalance || 0);
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const groupedExpenses = groupByDate(expenses);

  const TABS = ['expenses', 'balances', 'members'];

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input className="search-bar" placeholder="Search expenses..." />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ width: 36, height: 36, borderRadius: 8, background: '#1a2236', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280', fontSize: 16, cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>🔔</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: 14 }}>
              {user?.name?.[0]}
            </div>
          </div>
        </div>

        {/* Group banner */}
        <div style={{ position: 'relative', height: 160, background: 'linear-gradient(135deg, #0d1117 0%, #1a2236 40%, #0f2318 100%)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '20px 28px' }}>
          {/* Grid decoration */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(16,185,129,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.8), transparent)' }} />
          <div style={{ position: 'relative', flex: 1 }}>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{group.name}</h1>
            {group.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{group.description}</p>}
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
            <Link to={`/groups/${id}/settle`} className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13 }}>Settle Up</Link>
            <Link to={`/groups/${id}/expenses/new`} className="btn-primary" style={{ textDecoration: 'none', fontSize: 13 }}>+ Add Expense</Link>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.04)', margin: '0 0 0 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { label: 'TOTAL EXPENSES', value: fmt(totalExpenses), color: '#e2e8f0' },
            { label: 'MEMBERS', value: group.members?.length, color: '#e2e8f0' },
            { label: 'OUTSTANDING BALANCE', value: (netBalance >= 0 ? '+' : '') + fmt(netBalance), color: netBalance >= 0 ? '#10b981' : '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ padding: '18px 28px', background: '#0d1117' }}>
              <p style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 28px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '10px 20px', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize', color: tab === t ? '#10b981' : '#6b7280', borderBottom: tab === t ? '2px solid #10b981' : '2px solid transparent', transition: 'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>

          {/* EXPENSES */}
          {tab === 'expenses' && (
            <div>
              {groupedExpenses.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: '#4b5563' }}>
                  No expenses yet. <Link to={`/groups/${id}/expenses/new`} style={{ color: '#10b981' }}>Add one →</Link>
                </div>
              )}
              {groupedExpenses.map(([date, exps]) => (
                <div key={date} style={{ marginBottom: 20 }}>
                  <p style={{ color: '#4b5563', fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#1a2236', padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>{date}</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exps.map(exp => {
                      const mySplit = exp.splits?.find(s => s.userId === user?.id);
                      const myAmt = parseFloat(mySplit?.amount || 0);
                      const iPaid = exp.paidBy === user?.id;
                      return (
                        <Link key={exp.id} to={`/groups/${id}/expenses/${exp.id}`} className="expense-row" style={{ textDecoration: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#1a2236', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                              💳
                            </div>
                            <div>
                              <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{exp.title}</p>
                              <p style={{ color: '#4b5563', fontSize: 12 }}>Paid by {exp.payer?.name}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{fmt(exp.amount)}</p>
                            <p style={{ fontSize: 11, color: iPaid ? '#10b981' : '#f87171' }}>
                              {iPaid ? 'you paid' : `your share: ${fmt(myAmt)}`}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BALANCES */}
          {tab === 'balances' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {balances?.balances?.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: '#10b981', fontSize: 15, fontWeight: 600 }}>🎉 All settled up!</div>
              )}
              {balances?.balances?.map(b => (
                <div key={b.userId} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a2236', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                      {b.userName?.[0]}
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{b.userName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {b.theyOwe > 0 && (
                      <>
                        <span style={{ color: '#10b981', fontSize: 14, fontWeight: 600 }}>owes you {fmt(b.theyOwe)}</span>
                        <Link to={`/groups/${id}/settle?payerId=${b.userId}&receiverId=${user?.id}&amount=${b.theyOwe}`}
                          className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', textDecoration: 'none' }}>Settle</Link>
                      </>
                    )}
                    {b.youOwe > 0 && (
                      <>
                        <span style={{ color: '#f87171', fontSize: 14, fontWeight: 600 }}>you owe {fmt(b.youOwe)}</span>
                        <Link to={`/groups/${id}/settle?payerId=${user?.id}&receiverId=${b.userId}&amount=${b.youOwe}`}
                          className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', textDecoration: 'none' }}>Pay</Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MEMBERS */}
          {tab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isCreator && (
                <div className="card" style={{ padding: 16 }}>
                  <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 10 }}>
                    <input type="email" placeholder="Add member by email" value={email} required
                      onChange={e => setEmail(e.target.value)} className="input-field" style={{ flex: 1 }} />
                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }} disabled={addingMember}>
                      {addingMember ? '...' : 'Add'}
                    </button>
                  </form>
                </div>
              )}
              {group.members?.map(m => (
                <div key={m.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: 14 }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>
                        {m.name} {m.id === group.createdBy && <span style={{ color: '#10b981', fontSize: 11 }}> creator</span>}
                      </p>
                      <p style={{ color: '#4b5563', fontSize: 12 }}>{m.email}</p>
                    </div>
                  </div>
                  {isCreator && m.id !== user?.id && (
                    <button onClick={() => handleRemoveMember(m.id)}
                      style={{ color: '#f87171', background: 'none', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                      Remove
                    </button>
                  )}
                  {!isCreator && m.id === user?.id && (
                    <button onClick={() => handleRemoveMember(m.id)}
                      style={{ color: '#6b7280', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                      Leave
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
