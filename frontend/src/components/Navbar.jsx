import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Plane, 
  ShieldCheck, 
  ClipboardList, 
  QrCode, 
  User, 
  LogOut, 
  LogIn, 
  Ticket
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      background: 'rgba(7, 13, 24, 0.85)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#fff' }}>
          <img 
            src="/vyomira-logo.png" 
            alt="VYOMIRA Logo" 
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 10, 
              objectFit: 'cover',
              border: '1px solid rgba(56, 169, 245, 0.4)',
              boxShadow: '0 4px 14px rgba(56, 169, 245, 0.3)'
            }} 
          />
          <div>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.05em', color: '#FFFFFF', display: 'block', lineHeight: 1.1 }}>
              VYOMIRA
            </span>
            <span style={{ fontSize: '0.68rem', display: 'block', color: 'var(--vyomira-sky)', fontWeight: 600, letterSpacing: '0.08em', marginTop: 2 }}>
              Connecting Earth and Sky.
            </span>
          </div>
        </Link>

        {/* Portal Nav Links — Only Passenger & Protected Admin */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Passenger Portal: Flights */}
          <Link 
            to="/" 
            className={`btn ${location.pathname === '/' || location.pathname.startsWith('/book') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '7px 16px' }}
          >
            <Plane size={15} />
            Search Flights
          </Link>

          {/* Passenger Portal: My Bookings */}
          {isAuthenticated && (
            <Link 
              to="/my-bookings" 
              className={`btn ${isActive('/my-bookings') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '7px 16px' }}
            >
              <Ticket size={15} />
              My Bookings
            </Link>
          )}

          {/* Passenger Ticket Lookup */}
          <Link 
            to="/checkin" 
            className={`btn ${isActive('/checkin') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '7px 16px' }}
          >
            <QrCode size={15} />
            Ticket & Gate Lookup
          </Link>

          {/* Protected Admin Dashboard (Admin Only) */}
          {user && user.role === 'admin' && (
            <Link 
              to="/admin" 
              className={`btn ${isActive('/admin') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                fontSize: '0.85rem', 
                padding: '7px 16px', 
                background: isActive('/admin') ? '#7054D8' : 'rgba(112, 84, 216, 0.2)', 
                color: isActive('/admin') ? '#fff' : '#E0D7FE', 
                borderColor: 'rgba(112, 84, 216, 0.4)' 
              }}
            >
              <ShieldCheck size={15} />
              Admin Dashboard
            </Link>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
                <User size={14} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name || user.username}</span>
                <span className={`badge ${user.role === 'admin' ? 'badge-cancelled' : user.role === 'staff' ? 'badge-boarded' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  {user.role}
                </span>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                title="Log Out"
                style={{ padding: '7px 10px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '0.88rem' }}>
              <LogIn size={15} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
