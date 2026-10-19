import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Authenticating...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: 32, textAlign: 'center' }} className="glass-panel fade-in">
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2 style={{ marginBottom: 12 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Your current account role (<strong>{user.role}</strong>) does not have authorization to view this operational portal.
        </p>
        <a href="/" className="btn btn-primary">Return to Passenger Portal</a>
      </div>
    );
  }

  return children;
};
