import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  TrendingUp,
  Plane,
  Ticket,
  Users,
  Bell,
  ShieldCheck,
  LogOut,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [liveToast, setLiveToast] = useState(null);
  const seenNotifsRef = useRef(new Set());

  // Real-time polling for notifications (every 4 seconds)
  useEffect(() => {
    const pollNotifs = async () => {
      try {
        const notifs = await api.admin.getNotifications();
        if (Array.isArray(notifs)) {
          notifs.forEach(n => {
            if (!seenNotifsRef.current.has(n._id)) {
              seenNotifsRef.current.add(n._id);
              if (!n.isRead && seenNotifsRef.current.size > notifs.length) {
                setLiveToast(n);
                setTimeout(() => setLiveToast(null), 5000);
              }
            }
          });
          setNotifications(notifs);
        }
      } catch (e) {
        // Silently proceed
      }
    };

    pollNotifs();
    const interval = setInterval(pollNotifs, 4000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard & Metrics', icon: TrendingUp },
    { to: '/admin/flights', label: 'Fleet Flights & Fares', icon: Plane },
    { to: '/admin/bookings', label: 'Master Bookings', icon: Ticket },
    { to: '/admin/passengers', label: 'Passenger Records', icon: Users },
    { to: '/admin/notifications', label: 'Booking Alerts', icon: Bell, badge: unreadCount },
    { to: '/admin/users', label: 'System Accounts', icon: ShieldCheck }
  ];

  // Helper for current section title
  const getSectionTitle = () => {
    if (location.pathname.includes('/flights')) return 'Fleet Flights & 4-Class Fare Management';
    if (location.pathname.includes('/bookings')) return 'Master Passenger Bookings';
    if (location.pathname.includes('/passengers')) return 'Registered Passenger Records';
    if (location.pathname.includes('/notifications')) return 'Real-Time Booking Notification Stream';
    if (location.pathname.includes('/users')) return 'Administrator System Accounts';
    return 'Operations Overview & Live Analytics';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070D18', color: '#fff' }}>
      
      {/* Floating Incoming Toast Notification */}
      {liveToast && (
        <div
          onClick={() => {
            navigate('/admin/notifications');
            setLiveToast(null);
          }}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 99999,
            maxWidth: 400,
            background: 'linear-gradient(135deg, rgba(16, 42, 102, 0.98), rgba(112, 84, 216, 0.98))',
            border: '2px solid #38A9F5',
            borderRadius: 16,
            padding: '14px 18px',
            color: '#fff',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 169, 245, 0.45)',
            cursor: 'pointer',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38A9F5', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={14} /> NEW BOOKING CONFIRMED
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>Just Now</span>
          </div>
          <strong style={{ fontSize: '0.92rem', display: 'block' }}>
            {liveToast.passengerName} reserved {liveToast.travelClass}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--vyomira-lavender)', display: 'block', marginTop: 2 }}>
            Flight #{liveToast.flightNumber} • Seat #{liveToast.seatNumber} • ₹{liveToast.fare?.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. DEDICATED ADMIN SIDEBAR NAVIGATION                */}
      {/* ==================================================== */}
      <aside style={{
        width: 270,
        background: 'linear-gradient(180deg, #091224 0%, #060b17 100%)',
        borderRight: '1px solid rgba(56, 169, 245, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50
      }}>
        {/* Brand Header */}
        <div>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/vyomira-logo.png"
                alt="VYOMIRA Logo"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  objectFit: 'contain',
                  border: '1px solid rgba(56, 169, 245, 0.35)',
                  boxShadow: '0 4px 14px rgba(56, 169, 245, 0.25)'
                }}
              />
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.06em', color: '#FFFFFF', display: 'block', lineHeight: 1.1 }}>
                  VYOMIRA
                </span>
                <span className="badge" style={{
                  background: 'rgba(112, 84, 216, 0.28)',
                  color: '#c4b5fd',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  marginTop: 4
                }}>
                  ADMIN CONSOLE
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to === '/admin/dashboard' && location.pathname === '/admin');

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  id={`admin-nav-${item.label.toLowerCase().replace(/[\s&]+/g, '-')}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    background: isActive ? 'linear-gradient(135deg, rgba(16, 42, 102, 0.85) 0%, rgba(56, 169, 245, 0.4) 100%)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--vyomira-lavender)',
                    border: isActive ? '1px solid rgba(56, 169, 245, 0.5)' : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(56, 169, 245, 0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon size={18} color={isActive ? '#38A9F5' : 'var(--vyomira-lavender)'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '2px 7px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 16px 20px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* User Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 12,
            marginBottom: 12,
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7054D8, #38A9F5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              {(user?.name || user?.username || 'A')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || user?.username}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                Administrator
              </span>
            </div>
          </div>

          {/* Quick Switch to Passenger Site */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 10,
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--vyomira-lavender)',
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 8,
              transition: 'background 0.2s'
            }}
          >
            <ExternalLink size={14} />
            <span>View Passenger Website</span>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 10,
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. ADMIN MAIN CONTAINER & TOP OPERATIONS HEADER      */}
      {/* ==================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        
        {/* Top Operations Header */}
        <header style={{
          height: 68,
          background: 'rgba(9, 18, 36, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(56, 169, 245, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--vyomira-lavender)' }}>
              <span>Console</span>
              <ChevronRight size={12} />
              <span style={{ color: '#38A9F5', fontWeight: 600 }}>{getSectionTitle()}</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', fontWeight: 800, color: '#fff' }}>
              {getSectionTitle()}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* System Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 20,
              fontSize: '0.78rem',
              color: '#34d399',
              fontWeight: 600
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>All Systems Operational</span>
            </div>

            {/* Notification Bell Button */}
            <Link
              to="/admin/notifications"
              id="admin-topbar-bell"
              style={{
                position: 'relative',
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                textDecoration: 'none'
              }}
              title="View Booking Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Admin Content Outlet */}
        <main style={{ flex: 1, padding: '28px 32px' }}>
          <Outlet context={{ notifications, setNotifications }} />
        </main>
      </div>

    </div>
  );
};
