import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../api/groups';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

export default function GroupCreate() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await createGroup(form);
      toast.success('Group created!');
      navigate(`/groups/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create group');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Sidebar />
      <div className="main-content fade-up">
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700 }}>Create Group</h1>
          <p style={{ color: '#4b5563', fontSize: 13, marginTop: 4 }}>Start splitting expenses with your friends</p>
        </div>

        <div style={{ padding: '28px', maxWidth: 520 }}>
          <div className="card" style={{ padding: '28px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>GROUP NAME</label>
                <input id="group-name" type="text" required placeholder="Goa Trip 2024"
                  className="input-field"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  DESCRIPTION <span style={{ color: '#374151', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea id="group-desc" placeholder="Weekend trip to Goa..."
                  rows={3} className="input-field" style={{ resize: 'none' }}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <button id="group-submit" type="submit" disabled={loading} className="btn-primary"
                style={{ padding: '12px', fontSize: 14, marginTop: 4 }}>
                {loading
                  ? <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #0d1117', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
