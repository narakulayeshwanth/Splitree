import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup } from '../api/groups';
import { createExpense } from '../api/expenses';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

const SPLIT_TYPES = [
  { value: 'EQUAL', label: 'Equal', desc: 'Split evenly', icon: '=' },
  { value: 'UNEQUAL', label: 'Unequal', desc: 'Enter amounts', icon: '≠' },
  { value: 'PERCENTAGE', label: 'Percentage', desc: 'By percent', icon: '%' },
  { value: 'SHARE', label: 'Shares', desc: 'Proportional', icon: '#' },
];

const STEPS = ['Details', 'Participants', 'Split', 'Review'];

export default function ExpenseCreate() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: '', paidBy: user?.id || '', splitType: 'EQUAL',
    expenseDate: new Date().toISOString().split('T')[0], notes: '',
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [splitValues, setSplitValues] = useState({});

  useEffect(() => {
    getGroup(groupId).then(r => {
      setGroup(r.data);
      const ids = r.data.members.map(m => m.id);
      setSelectedMembers(ids);
      const vals = {};
      ids.forEach(id => { vals[id] = { amount: '', percentage: '', shareValue: '1' }; });
      setSplitValues(vals);
      if (user?.id) setForm(f => ({ ...f, paidBy: user.id }));
    });
  }, [groupId]);

  const total = parseFloat(form.amount) || 0;
  const n = selectedMembers.length;
  const equalShare = n > 0 && total > 0 ? (total / n).toFixed(2) : '0.00';

  const getParticipants = () => selectedMembers.map(uid => ({
    userId: uid,
    amount: parseFloat(splitValues[uid]?.amount) || 0,
    percentage: parseFloat(splitValues[uid]?.percentage) || 0,
    shareValue: parseFloat(splitValues[uid]?.shareValue) || 1,
  }));

  const handleSubmit = async () => {
    if (!total || total <= 0) { toast.error('Enter a valid amount'); return; }
    if (selectedMembers.length === 0) { toast.error('Select at least one participant'); return; }
    setLoading(true);
    try {
      await createExpense(groupId, {
        ...form, amount: total,
        expenseDate: new Date(form.expenseDate).toISOString(),
        participants: getParticipants(),
      });
      toast.success('Expense added!');
      navigate(`/groups/${groupId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
      setStep(3);
    } finally { setLoading(false); }
  };

  const updateSplit = (uid, key, val) => setSplitValues(prev => ({ ...prev, [uid]: { ...prev[uid], [key]: val } }));

  if (!group) return (
    <div style={{ display: 'flex' }}><Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    </div>
  );

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(`/groups/${groupId}`)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s' }}>← Back</button>
            <div style={{ height: 16, width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <p style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>{form.title || 'New Expense'}</p>
              {form.expenseDate && <p style={{ color: '#4b5563', fontSize: 12 }}>📅 {new Date(form.expenseDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {total > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#4b5563', fontSize: 11 }}>Total Expense</p>
                <p style={{ color: '#10b981', fontWeight: 800, fontSize: 18 }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className={`step-dot ${i + 1 < step ? 'done' : i + 1 === step ? 'active' : 'pending'}`} />
                </div>
              ))}
              <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 6 }}>Step {step} of {STEPS.length}</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 28px' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            {step === 1 && 'Expense Details'}
            {step === 2 && 'Select Participants'}
            {step === 3 && 'Choose Split Method'}
            {step === 4 && 'Review & Submit'}
          </h2>

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>EXPENSE TITLE</label>
                  <input id="exp-title" type="text" required placeholder="Dinner at Sushi Bar" className="input-field"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>AMOUNT (₹)</label>
                    <input id="exp-amount" type="number" min="0.01" step="0.01" required placeholder="0.00" className="input-field"
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>DATE</label>
                    <input id="exp-date" type="date" className="input-field"
                      value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>PAID BY</label>
                  <select id="exp-paidby" className="input-field" value={form.paidBy} onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))}>
                    {group.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>NOTES <span style={{ color: '#374151' }}>(optional)</span></label>
                  <input type="text" placeholder="Any notes..." className="input-field"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Participants */}
          {step === 2 && (
            <div className="card" style={{ padding: 24 }}>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Select who is involved in this expense.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.members.map(m => {
                  const checked = selectedMembers.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => setSelectedMembers(prev => checked ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${checked ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, background: checked ? 'rgba(16,185,129,0.05)' : '#161d2e', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? '#10b981' : '#374151'}`, background: checked ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {checked && <span style={{ color: '#0d1117', fontSize: 11, fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                        {m.name?.[0]}
                      </div>
                      <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                      {m.id === user?.id && <span style={{ color: '#4b5563', fontSize: 12 }}>(you)</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Split type & values */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {SPLIT_TYPES.map(st => (
                  <div key={st.value} className={`split-card ${form.splitType === st.value ? 'selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, splitType: st.value }))}>
                    <div className="split-icon">{st.icon}</div>
                    <p style={{ color: form.splitType === st.value ? '#10b981' : '#e2e8f0', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{st.label}</p>
                    <p style={{ color: '#4b5563', fontSize: 11 }}>{st.desc}</p>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ color: '#6b7280', fontSize: 12, fontWeight: 600 }}>SPLIT DISTRIBUTION</p>
                  {form.splitType === 'EQUAL' && <p style={{ color: '#10b981', fontSize: 12 }}>Total: ₹{total.toFixed(2)}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedMembers.map(uid => {
                    const m = group.members.find(x => x.id === uid);
                    if (!m) return null;
                    const sv = splitValues[uid] || {};
                    return (
                      <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {m.name?.[0]}
                        </div>
                        <span style={{ color: '#e2e8f0', fontSize: 13, flex: 1 }}>{m.name}</span>
                        {form.splitType === 'EQUAL' && (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>₹{equalShare}</span>
                        )}
                        {form.splitType === 'UNEQUAL' && (
                          <input type="number" min="0" step="0.01" placeholder="₹0.00" className="input-field" style={{ width: 120, textAlign: 'right' }}
                            value={sv.amount} onChange={e => updateSplit(uid, 'amount', e.target.value)} />
                        )}
                        {form.splitType === 'PERCENTAGE' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="number" min="0" max="100" step="0.1" className="input-field" style={{ width: 80, textAlign: 'right' }}
                              value={sv.percentage} onChange={e => updateSplit(uid, 'percentage', e.target.value)} />
                            <span style={{ color: '#6b7280', fontSize: 13 }}>%</span>
                          </div>
                        )}
                        {form.splitType === 'SHARE' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="number" min="1" step="1" className="input-field" style={{ width: 80, textAlign: 'right' }}
                              value={sv.shareValue} onChange={e => updateSplit(uid, 'shareValue', e.target.value)} />
                            <span style={{ color: '#6b7280', fontSize: 13 }}>shares</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Title', value: form.title },
                  { label: 'Amount', value: `₹${parseFloat(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                  { label: 'Paid by', value: group.members.find(m => m.id === form.paidBy)?.name || '' },
                  { label: 'Split type', value: form.splitType },
                  { label: 'Participants', value: selectedMembers.map(uid => group.members.find(m => m.id === uid)?.name).join(', ') },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>{r.label}</span>
                    <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            {step > 1
              ? <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>Back</button>
              : <button className="btn-ghost" onClick={() => navigate(`/groups/${groupId}`)}>Cancel</button>
            }
            {step < STEPS.length
              ? <button id="exp-next" className="btn-primary" onClick={() => {
                  if (step === 1 && (!form.title || !form.amount)) { toast.error('Fill in title and amount'); return; }
                  setStep(s => s + 1);
                }}>Next →</button>
              : <button id="exp-submit" className="btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? <div className="spinner" /> : 'Add Expense ✓'}
                </button>
            }
          </div>
        </div>
      </div>
    </>
  );
}
