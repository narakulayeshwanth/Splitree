import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getGroup } from '../api/groups';
import { createSettlement } from '../api/settlements';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

export default function Settle() {
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    payerId: searchParams.get('payerId') || user?.id || '',
    receiverId: searchParams.get('receiverId') || '',
    amount: searchParams.get('amount') || '',
    settlementDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    getGroup(groupId).then(g => setGroup(g.data));
  }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSettlement(groupId, {
        ...form,
        amount: parseFloat(form.amount),
        settlementDate: new Date(form.settlementDate).toISOString(),
      });
      toast.success('Settlement recorded!');
      navigate(`/groups/${groupId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record settlement');
    } finally { setLoading(false); }
  };

  if (!group) return (
    <>
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    </>
  );

  const payer = group.members?.find(m => m.id === form.payerId);
  const receiver = group.members?.find(m => m.id === form.receiverId);

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => navigate(`/groups/${groupId}`)}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', marginBottom: 4 }}>
            ← Back to group
          </button>
          <h1 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>Settle Up</h1>
          <p style={{ color: '#4b5563', fontSize: 13, marginTop: 4 }}>Record a payment between members of <span style={{ color: '#10b981' }}>{group.name}</span></p>
        </div>

        <div style={{ padding: '28px', maxWidth: 520 }}>
          {/* Payer → Amount → Receiver visual */}
          {payer && receiver && (
            <div className="card" style={{ padding: '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 800, fontSize: 18, margin: '0 auto' }}>
                  {payer.name?.[0]}
                </div>
                <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginTop: 8 }}>{payer.name}</p>
                <p style={{ color: '#4b5563', fontSize: 11 }}>Pays</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ color: '#10b981', fontWeight: 800, fontSize: 22 }}>
                  ₹{parseFloat(form.amount || 0).toFixed(2)}
                </p>
                <p style={{ color: '#374151', fontSize: 18, marginTop: 2 }}>→</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 800, fontSize: 18, margin: '0 auto' }}>
                  {receiver.name?.[0]}
                </div>
                <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginTop: 8 }}>{receiver.name}</p>
                <p style={{ color: '#4b5563', fontSize: 11 }}>Receives</p>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'PAYER', key: 'payerId', options: group.members, exclude: null },
                { label: 'RECEIVER', key: 'receiverId', options: group.members?.filter(m => m.id !== form.payerId), exclude: form.payerId },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>{f.label}</label>
                  <select className="input-field" value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                    <option value="">Select {f.label.toLowerCase()}</option>
                    {f.options?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              ))}

              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>AMOUNT (₹)</label>
                <input type="number" min="0.01" step="0.01" required placeholder="0.00" className="input-field"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>DATE</label>
                <input type="date" className="input-field"
                  value={form.settlementDate} onChange={e => setForm(f => ({ ...f, settlementDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  NOTES <span style={{ color: '#374151', fontWeight: 400 }}>(optional)</span>
                </label>
                <input type="text" placeholder="e.g. Paid via UPI" className="input-field"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px', fontSize: 14, marginTop: 4 }}>
                {loading
                  ? <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #0d1117', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  : 'Confirm Settlement ✓'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
