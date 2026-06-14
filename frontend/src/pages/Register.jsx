import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await registerApi(form);
      login(data.token, data.user);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-bold text-sm">S</span>
            </div>
            <span className="text-2xl font-bold text-white">Splitree</span>
          </div>
          <p className="text-slate-400 text-sm">Premium Expense Sharing</p>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-xl font-semibold text-white mb-6">Create your account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Full Name</label>
              <input id="reg-name" type="text" required placeholder="Alex Chen"
                className="input-field mt-1"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Email</label>
              <input id="reg-email" type="email" required placeholder="you@example.com"
                className="input-field mt-1"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Password</label>
              <input id="reg-password" type="password" required placeholder="Min. 6 characters"
                className="input-field mt-1"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button id="reg-submit" type="submit" disabled={loading}
              className="btn-primary w-full mt-2 py-2.5 flex items-center justify-center">
              {loading ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
