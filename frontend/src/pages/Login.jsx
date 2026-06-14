import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginApi(form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* LEFT — image/hero panel */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px',
      }}>
        {/* Floating expense cards decoration */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <div style={{ background: '#1a2236', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: 14 }}>↑</div>
            <div>
              <p style={{ color: '#6b7280', fontSize: 11 }}>SPLIT</p>
              <p style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>+₹500</p>
            </div>
          </div>
          <div style={{ background: '#161d2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#10b981', fontSize: 13 }}>⊕</span>
            <span style={{ color: '#9ca3af', fontSize: 12 }}>Goa Trip Balance</span>
            <span style={{ color: '#10b981', fontWeight: 600, fontSize: 13, marginLeft: 'auto' }}>₹200</span>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, color: '#fff', marginBottom: 16 }}>
            Split expenses.<br />
            <span style={{ color: '#10b981' }}>Stay friends.</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, maxWidth: 360, marginBottom: 32 }}>
            The premium way to manage shared finances with elegance and precision.
            Seamlessly split any bill without the awkwardness.
          </p>
          <p style={{ color: '#374151', fontSize: 12, letterSpacing: '0.05em' }}>TRUSTED BY 20+ USERS</p>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div style={{
        width: 420, background: '#111827',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, background: '#10b981', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#0d1117', fontWeight: 800, fontSize: 13 }}>S</span>
          </div>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>Splitree</span>
        </div>

        <h2 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome back</h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>Access your premium expense dashboard</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5563', fontSize: 14 }}>✉</span>
              <input id="login-email" type="email" required placeholder="name@company.com"
                style={{ background: '#1a2236', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px 10px 36px', width: '100%', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>PASSWORD</label>
              <span style={{ color: '#10b981', fontSize: 12, cursor: 'pointer' }}>FORGOT?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5563', fontSize: 14 }}>🔒</span>
              <input id="login-password" type={showPw ? 'text' : 'password'} required placeholder="••••••••"
                style={{ background: '#1a2236', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 40px 10px 36px', width: '100%', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button id="login-submit" type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginBottom: 20 }}>
            {loading ? <div className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ color: '#4b5563', fontSize: 12 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {['🌐 Google', '🍎 Apple'].map(p => (
            <button key={p} className="btn-ghost" style={{ fontSize: 13, padding: '10px' }}>{p}</button>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
          New to Splitree?{' '}
          <Link to="/register" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Create an account</Link>
        </p>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: 11, marginTop: 32 }}>
          Demo: alice@test.com / password123
        </p>
      </div>
    </div>
  );
}
