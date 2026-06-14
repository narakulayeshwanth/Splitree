import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(16,185,129,0.3)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return <div className="app-shell">{children}</div>;
}

