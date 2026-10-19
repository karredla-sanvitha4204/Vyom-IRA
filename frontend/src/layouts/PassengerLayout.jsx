import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PassengerLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user && user.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Quick-Switch Notification Pill for logged-in Administrators */}
      {isAdmin && (
        <div style={{
          background: 'linear-gradient(90deg, #102A66 0%, #7054D8 100%)',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.84rem',
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(56, 169, 245, 0.4)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="#38A9F5" />
            <span>
              Signed in as <strong>{user.name || user.username}</strong> (Enterprise Administrator)
            </span>
          </div>
          <Link
            to="/admin/dashboard"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.8rem',
              transition: 'background 0.2s'
            }}
          >
            <span>Open Dedicated Admin Operations Console</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Consumer Aviation Navbar */}
      <Navbar />

      {/* Main Passenger Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Global Consumer Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '28px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.86rem',
        background: 'rgba(10, 19, 41, 0.96)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/vyomira-logo.png" alt="VYOMIRA Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>VYOMIRA</span>
            <span style={{ color: 'var(--vyomira-sky)', fontSize: '0.82rem' }}>— Connecting Earth and Sky.</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--vyomira-lavender)' }}>
            <span>Passenger Flight Search</span>
            <span>•</span>
            <span>4 Travel Classes</span>
            <span>•</span>
            <span>Verified Seat Safety</span>
            {isAdmin && (
              <>
                <span>•</span>
                <Link to="/admin/dashboard" style={{ color: 'var(--vyomira-sky)', textDecoration: 'none', fontWeight: 600 }}>
                  Admin Operations Console
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
