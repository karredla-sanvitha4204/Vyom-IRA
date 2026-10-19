import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  ShieldCheck, 
  Plane, 
  Users, 
  Ticket, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RefreshCw,
  Bell,
  Eye,
  Check,
  CheckCheck,
  Crown,
  Briefcase,
  Armchair,
  MapPin,
  Clock,
  Calendar,
  X,
  UserPlus
} from 'lucide-react';

export const AdminDashboard = ({ activeSection }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeBookingId } = useParams();

  const [activeTab, setActiveTab] = useState(activeSection || 'overview');
  const [stats, setStats] = useState(null);
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Synchronize active section with URL
  useEffect(() => {
    if (activeSection) {
      setActiveTab(activeSection);
    } else {
      if (location.pathname.includes('/flights')) setActiveTab('flights');
      else if (location.pathname.includes('/bookings')) setActiveTab('bookings');
      else if (location.pathname.includes('/passengers')) setActiveTab('passengers');
      else if (location.pathname.includes('/notifications')) setActiveTab('notifications');
      else if (location.pathname.includes('/users')) setActiveTab('users');
      else setActiveTab('overview');
    }
  }, [activeSection, location.pathname]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    navigate(tabId === 'overview' ? '/admin/dashboard' : `/admin/${tabId}`);
  };

  // Toast for newest incoming notification
  const [liveToast, setLiveToast] = useState(null);
  const seenNotificationIdsRef = useRef(new Set());

  // Modal: Inspect complete booking
  const [inspectBooking, setInspectBooking] = useState(null);

  // Modal: Flight CRUD & Class Fares
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [flightForm, setFlightForm] = useState({
    flightId: '',
    flightNumber: '',
    company: 'IndiGo',
    source: '',
    sourceCode: 'DEL',
    destination: '',
    destinationCode: 'BOM',
    departure: '10:00',
    arrival: '12:15',
    duration: '2h 15m',
    fare: 3500,
    totalSeats: 60,
    classes: {
      'Economy': { fare: 3500, totalSeats: 30 },
      'Premium Economy': { fare: 5500, totalSeats: 12 },
      'Business Class': { fare: 12000, totalSeats: 12 },
      'First Class': { fare: 25000, totalSeats: 6 }
    }
  });

  // Modal: Admin account
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'admin'
  });

  // Search filter for bookings
  const [bookingSearch, setBookingSearch] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Real-time Notification Polling (every 4 seconds)
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const notifs = await api.admin.getNotifications();
        if (Array.isArray(notifs)) {
          // Check for new notifications to trigger toast
          notifs.forEach(n => {
            if (!seenNotificationIdsRef.current.has(n._id)) {
              seenNotificationIdsRef.current.add(n._id);
              if (!n.isRead && seenNotificationIdsRef.current.size > notifs.length) {
                // New incoming notification
                setLiveToast(n);
                setTimeout(() => setLiveToast(null), 6000);
              }
            }
          });
          setNotifications(notifs);
        }
      } catch (err) {
        // Silently catch polling error
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, flightsData, bookingsData, passData, usersData, notifsData] = await Promise.all([
        api.admin.getStats(),
        api.flights.getAll(),
        api.bookings.getAll(),
        api.passengers.getAll(),
        api.admin.getUsers(),
        api.admin.getNotifications().catch(() => [])
      ]);
      setStats(statsData);
      setFlights(flightsData);
      setBookings(bookingsData);
      setPassengers(passData);
      setUsers(usersData);
      setNotifications(Array.isArray(notifsData) ? notifsData : []);
      // Populate seen IDs
      if (Array.isArray(notifsData)) {
        notifsData.forEach(n => seenNotificationIdsRef.current.add(n._id));
      }
    } catch (err) {
      setError('Failed to load administrative records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.admin.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.admin.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setSuccess('All booking notifications marked as read.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Inspect Booking helper
  const handleInspectBooking = (booking) => {
    setInspectBooking(booking);
  };

  // Flight CRUD Handlers
  const handleOpenAddFlight = () => {
    setEditingFlight(null);
    setFlightForm({
      flightId: '',
      flightNumber: '',
      company: 'IndiGo',
      source: '',
      sourceCode: 'HYD',
      destination: '',
      destinationCode: 'DEL',
      departure: '06:00',
      arrival: '08:15',
      duration: '2h 15m',
      fare: 3500,
      totalSeats: 60,
      classes: {
        'Economy': { fare: 3500, totalSeats: 30 },
        'Premium Economy': { fare: 5500, totalSeats: 12 },
        'Business Class': { fare: 12000, totalSeats: 12 },
        'First Class': { fare: 25000, totalSeats: 6 }
      }
    });
    setShowFlightModal(true);
  };

  const handleOpenEditFlight = (f) => {
    setEditingFlight(f);
    const baseFare = Math.max(Number(f.fare) || 3500, 1000);
    setFlightForm({
      flightId: f.flightId,
      flightNumber: f.flightNumber || `VY-${f.flightId}`,
      company: f.company,
      source: f.source,
      sourceCode: f.sourceCode || f.source.substring(0, 3).toUpperCase(),
      destination: f.destination,
      destinationCode: f.destinationCode || f.destination.substring(0, 3).toUpperCase(),
      departure: f.departure,
      arrival: f.arrival,
      duration: f.duration || '2h 15m',
      fare: baseFare,
      totalSeats: f.totalSeats || 60,
      classes: f.classes || {
        'Economy': { fare: baseFare, totalSeats: 30 },
        'Premium Economy': { fare: Math.round(baseFare * 1.55), totalSeats: 12 },
        'Business Class': { fare: Math.max(baseFare * 3, 12000), totalSeats: 12 },
        'First Class': { fare: Math.max(baseFare * 6, 25000), totalSeats: 6 }
      }
    });
    setShowFlightModal(true);
  };

  const handleSaveFlight = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Ensure fares are >= 1000
    const baseFare = Math.max(Number(flightForm.fare), 1000);
    const payload = {
      flightNumber: flightForm.flightNumber || `VY-${flightForm.flightId}`,
      company: flightForm.company,
      source: flightForm.source,
      sourceCode: flightForm.sourceCode,
      destination: flightForm.destination,
      destinationCode: flightForm.destinationCode,
      departure: flightForm.departure,
      arrival: flightForm.arrival,
      duration: flightForm.duration,
      fare: baseFare,
      totalSeats: Number(flightForm.totalSeats) || 60,
      classes: {
        'Economy': { fare: Math.max(Number(flightForm.classes['Economy']?.fare) || baseFare, 1000), totalSeats: Number(flightForm.classes['Economy']?.totalSeats) || 30 },
        'Premium Economy': { fare: Math.max(Number(flightForm.classes['Premium Economy']?.fare) || Math.round(baseFare * 1.55), 1000), totalSeats: Number(flightForm.classes['Premium Economy']?.totalSeats) || 12 },
        'Business Class': { fare: Math.max(Number(flightForm.classes['Business Class']?.fare) || 12000, 1000), totalSeats: Number(flightForm.classes['Business Class']?.totalSeats) || 12 },
        'First Class': { fare: Math.max(Number(flightForm.classes['First Class']?.fare) || 25000, 1000), totalSeats: Number(flightForm.classes['First Class']?.totalSeats) || 6 }
      }
    };

    try {
      if (editingFlight) {
        await api.flights.update(flightForm.flightId, payload);
        setSuccess(`Flight #${flightForm.flightId} (${flightForm.company}) updated successfully.`);
      } else {
        await api.flights.create({
          flightId: Number(flightForm.flightId),
          ...payload
        });
        setSuccess(`Flight #${flightForm.flightId} created successfully.`);
      }
      setShowFlightModal(false);
      loadAllAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFlight = async (flightId) => {
    if (!window.confirm(`Are you sure you want to delete Flight #${flightId}?`)) return;
    try {
      await api.flights.delete(flightId);
      setSuccess(`Flight #${flightId} deleted.`);
      loadAllAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  // User Account Management
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.admin.createUser(userForm);
      setSuccess(`Account ${userForm.username} (${userForm.role}) created.`);
      setShowUserModal(false);
      setUserForm({ username: '', email: '', password: '', name: '', role: 'admin' });
      loadAllAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user ${username}?`)) return;
    try {
      await api.admin.deleteUser(userId);
      setSuccess(`User ${username} deleted.`);
      loadAllAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Booking Status Update
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.bookings.updateStatus(bookingId, newStatus);
      setSuccess(`Booking status updated to ${newStatus}.`);
      loadAllAdminData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    if (!bookingSearch) return true;
    const term = bookingSearch.toLowerCase();
    const ref = (b.bookingReference || `VY-${b.ticketNumber}`).toLowerCase();
    const passName = (b.passenger?.name || '').toLowerCase();
    const flightIdStr = String(b.flightId);
    return ref.includes(term) || passName.includes(term) || flightIdStr.includes(term);
  });

  return (
    <div style={{ maxWidth: 1340, margin: '0 auto', padding: '28px 20px' }} className="fade-in">
      
      {/* Real-time Incoming Booking Toast */}
      {liveToast && (
        <div
          onClick={() => {
            handleInspectBooking(liveToast);
            setLiveToast(null);
          }}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            maxWidth: 420,
            background: 'linear-gradient(135deg, rgba(16, 42, 102, 0.96), rgba(112, 84, 216, 0.96))',
            border: '2px solid #38A9F5',
            borderRadius: 16,
            padding: '16px 20px',
            color: '#fff',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(56, 169, 245, 0.5)',
            cursor: 'pointer',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 800, color: '#38A9F5' }}>
              <Bell size={16} /> NEW PASSENGER BOOKING
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>Just Now</span>
          </div>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700 }}>
            {liveToast.passengerName} confirmed {liveToast.travelClass}
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
            Flight #{liveToast.flightNumber} ({liveToast.origin} → {liveToast.destination}) • Seat #{liveToast.seatNumber} • ₹{liveToast.fare?.toLocaleString('en-IN')}
          </p>
          <span style={{ display: 'block', marginTop: 8, fontSize: '0.75rem', color: '#38A9F5', textDecoration: 'underline' }}>
            Click to inspect full booking details →
          </span>
        </div>
      )}

      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#38A9F5', fontSize: '0.86rem', fontWeight: 700, marginBottom: 4 }}>
            <ShieldCheck size={16} /> VYOMIRA ENTERPRISE OPERATIONS
          </div>
          <h1 style={{ fontSize: '2.2rem', margin: 0, letterSpacing: '-0.01em' }}>
            Administrative Control Center
          </h1>
          <p style={{ color: 'var(--vyomira-lavender)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            Authoritative fleet logistics, passenger records, class pricing rules, and real-time booking alerts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadAllAdminData} className="btn btn-secondary">
            <RefreshCw size={15} /> Refresh All Records
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 14, marginBottom: 28, overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Dashboard & Reports', icon: TrendingUp },
          { id: 'notifications', label: `Booking Alerts (${unreadNotifsCount})`, icon: Bell, badge: unreadNotifsCount },
          { id: 'flights', label: `Fleet Flights (${flights.length})`, icon: Plane },
          { id: 'bookings', label: `Master Bookings (${bookings.length})`, icon: Ticket },
          { id: 'passengers', label: `Passenger Records (${passengers.length})`, icon: Users },
          { id: 'users', label: `Admin Accounts (${users.length})`, icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-admin-${tab.id}`}
              onClick={() => switchTab(tab.id)}
              className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.88rem',
                padding: '9px 18px',
                whiteSpace: 'nowrap',
                position: 'relative',
                background: isSelected ? 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)' : 'rgba(255,255,255,0.06)'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--vyomira-sky)', borderRadius: '50%', margin: '0 auto 16px auto', animation: 'spin 0.8s linear infinite' }} />
          Synchronizing enterprise airline records...
        </div>
      ) : (
        <>
          {/* ==================================================== */}
          {/* TAB 1: OVERVIEW METRICS                              */}
          {/* ==================================================== */}
          {activeTab === 'overview' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div className="glass-panel" style={{ padding: 24, borderRadius: 18, background: 'rgba(16, 42, 102, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: 'var(--vyomira-lavender)', fontSize: '0.85rem' }}>TOTAL SCHEDULED FLIGHTS</span>
                    <Plane size={24} color="#38A9F5" />
                  </div>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {stats?.totalFlights || flights.length}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'block', marginTop: 6 }}>
                    23+ Active Demonstration Routes
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: 24, borderRadius: 18, background: 'rgba(16, 42, 102, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: 'var(--vyomira-lavender)', fontSize: '0.85rem' }}>TOTAL PASSENGER BOOKINGS</span>
                    <Ticket size={24} color="#7054D8" />
                  </div>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {stats?.totalBookings || bookings.length}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--vyomira-sky)', display: 'block', marginTop: 6 }}>
                    {bookings.filter(b => b.status === 'CONFIRMED').length} Confirmed Active
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: 24, borderRadius: 18, background: 'rgba(16, 42, 102, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: 'var(--vyomira-lavender)', fontSize: '0.85rem' }}>REGISTERED PASSENGERS</span>
                    <Users size={24} color="#06b6d4" />
                  </div>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {stats?.totalPassengers || passengers.length}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'block', marginTop: 6 }}>
                    Active Traveler Profiles
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: 24, borderRadius: 18, background: 'rgba(16, 42, 102, 0.35)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: 'var(--vyomira-lavender)', fontSize: '0.85rem' }}>AUTHORITATIVE REVENUE</span>
                    <DollarSign size={24} color="#10b981" />
                  </div>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981', margin: 0 }}>
                    ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--vyomira-lavender)', display: 'block', marginTop: 6 }}>
                    From Class-Specific Validated Fares
                  </span>
                </div>
              </div>

              {/* Recent Notifications & Quick Actions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
                <div className="glass-panel" style={{ padding: 24, borderRadius: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Live Booking Stream</h3>
                    <button onClick={() => setActiveTab('notifications')} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                      View All ({notifications.length})
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
                      No booking alerts logged yet. New passenger bookings will appear here instantly.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {notifications.slice(0, 5).map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleInspectBooking(n)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: n.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(56, 169, 245, 0.12)',
                            border: `1px solid ${n.isRead ? 'rgba(255,255,255,0.06)' : 'rgba(56, 169, 245, 0.3)'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{n.passengerName}</strong>
                              <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(112, 84, 216, 0.25)', color: '#c4b5fd' }}>
                                {n.travelClass || 'Economy'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--vyomira-lavender)' }}>
                              Ref: {n.bookingReference || `VY-${n.bookingId}`} • Seat #{n.seatNumber} • {n.origin} → {n.destination}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem', display: 'block' }}>
                              ₹{n.fare?.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-panel" style={{ padding: 24, borderRadius: 18 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Operational Quick Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button onClick={handleOpenAddFlight} className="btn btn-primary" style={{ padding: 14 }}>
                      <Plus size={16} /> Create New Flight Route with 4-Class Pricing
                    </button>
                    <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary" style={{ padding: 14 }}>
                      <Ticket size={16} /> Inspect Master Passenger Bookings
                    </button>
                    <button onClick={handleMarkAllNotificationsRead} className="btn btn-secondary" style={{ padding: 14 }}>
                      <CheckCheck size={16} /> Mark All Booking Alerts as Read
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: BOOKING NOTIFICATIONS                         */}
          {/* ==================================================== */}
          {activeTab === 'notifications' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Administrator Booking Notifications</h2>
                  <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                    Instant audit stream of all passenger reservations recorded by the database.
                  </p>
                </div>
                {unreadNotifsCount > 0 && (
                  <button onClick={handleMarkAllNotificationsRead} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <CheckCheck size={15} /> Mark All as Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="glass-panel" style={{ padding: 48, textAlign: 'center', borderRadius: 18 }}>
                  <Bell size={44} color="var(--vyomira-lavender)" style={{ marginBottom: 12, opacity: 0.5 }} />
                  <h3>No Booking Notifications Yet</h3>
                  <p style={{ color: 'var(--vyomira-lavender)' }}>
                    Whenever a passenger reserves a flight, the details and audit record will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notifications.map(n => (
                    <div
                      key={n._id}
                      className="glass-panel"
                      style={{
                        padding: '18px 24px',
                        borderRadius: 14,
                        background: n.isRead ? 'rgba(16, 42, 102, 0.22)' : 'rgba(16, 42, 102, 0.45)',
                        borderColor: n.isRead ? 'rgba(255, 255, 255, 0.08)' : 'rgba(56, 169, 245, 0.35)',
                        borderLeft: `4px solid ${n.isRead ? 'rgba(255, 255, 255, 0.2)' : '#38A9F5'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                            {n.passengerName}
                          </span>
                          <span className="badge" style={{ background: 'rgba(56, 169, 245, 0.2)', color: '#38A9F5', fontWeight: 700 }}>
                            Ref: {n.bookingReference || `VY-${n.bookingId}`}
                          </span>
                          <span className="badge" style={{ background: 'rgba(112, 84, 216, 0.25)', color: '#c4b5fd' }}>
                            {n.travelClass || 'Economy'}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--vyomira-lavender)' }}>
                          <strong>Flight #{n.flightNumber} ({n.airline || 'IndiGo'})</strong>: {n.origin} → {n.destination} • Seat #{n.seatNumber} • Fare: <strong style={{ color: '#10b981' }}>₹{n.fare?.toLocaleString('en-IN')}</strong>
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                          Booked at: {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => handleInspectBooking(n)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                        >
                          <Eye size={14} /> Inspect Booking Details
                        </button>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkNotificationRead(n._id)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                            title="Mark as Read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: FLEET FLIGHTS & FARES MANAGEMENT             */}
          {/* ==================================================== */}
          {activeTab === 'flights' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Fleet Flights & Fares Management</h2>
                  <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                    Configure routes, carriers, schedule timings, and travel-class pricing tiers.
                  </p>
                </div>
                <button onClick={handleOpenAddFlight} className="btn btn-primary" style={{ fontSize: '0.88rem' }}>
                  <Plus size={16} /> Add Flight Route
                </button>
              </div>

              <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: 18 }}>
                <div className="table-container">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Flight #</th>
                        <th>Carrier</th>
                        <th>Route</th>
                        <th>Timings</th>
                        <th>Starting Fare</th>
                        <th>Class Capacities & Fares</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flights.map(f => {
                        const baseFare = Math.max(Number(f.fare) || 3500, 1000);
                        const sourceCode = f.sourceCode || f.source.substring(0, 3).toUpperCase();
                        const destCode = f.destinationCode || f.destination.substring(0, 3).toUpperCase();

                        return (
                          <tr key={f._id}>
                            <td>
                              <strong style={{ color: '#38A9F5' }}>{f.flightNumber || `VY-${f.flightId}`}</strong>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {f.flightId}</span>
                            </td>
                            <td><strong>{f.company}</strong></td>
                            <td>
                              <span style={{ fontWeight: 700 }}>{sourceCode} → {destCode}</span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--vyomira-lavender)' }}>
                                {f.source} to {f.destination}
                              </span>
                            </td>
                            <td>
                              <span>{f.departure} - {f.arrival}</span>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.duration || '2h 15m'}</span>
                            </td>
                            <td>
                              <span style={{ color: '#10b981', fontWeight: 800 }}>₹{baseFare.toLocaleString('en-IN')}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(56,169,245,0.15)', borderRadius: 4, color: '#93c5fd' }}>
                                  E: ₹{(f.classes?.['Economy']?.fare || baseFare).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(6,182,212,0.15)', borderRadius: 4, color: '#67e8f9' }}>
                                  PE: ₹{(f.classes?.['Premium Economy']?.fare || Math.round(baseFare * 1.55)).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(112,84,216,0.15)', borderRadius: 4, color: '#c4b5fd' }}>
                                  B: ₹{(f.classes?.['Business Class']?.fare || Math.max(baseFare * 3, 12000)).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(245,158,11,0.15)', borderRadius: 4, color: '#fcd34d' }}>
                                  F: ₹{(f.classes?.['First Class']?.fare || Math.max(baseFare * 6, 25000)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  id={`btn-edit-flight-${f.flightId}`}
                                  onClick={() => handleOpenEditFlight(f)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                  title="Edit Flight & Fares"
                                >
                                  <Edit2 size={13} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFlight(f.flightId)}
                                  className="btn btn-danger"
                                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                  title="Delete Flight"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: MASTER BOOKINGS MANAGEMENT                    */}
          {/* ==================================================== */}
          {activeTab === 'bookings' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Master Passenger Bookings</h2>
                  <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                    Showing {filteredBookings.length} of {bookings.length} persistent bookings.
                  </p>
                </div>
                <div style={{ width: 280 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by ref, passenger, flight..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    style={{ background: 'rgba(15, 23, 42, 0.7)' }}
                  />
                </div>
              </div>

              <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: 18 }}>
                <div className="table-container">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Booking Ref</th>
                        <th>Passenger</th>
                        <th>Flight</th>
                        <th>Travel Class</th>
                        <th>Seat</th>
                        <th>Fare</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => {
                        const ref = b.bookingReference || `VY-${b.ticketNumber}`;
                        const fareAmount = b.fare || b.flight?.fare || 3500;
                        const travelClass = b.travelClass || 'Economy';

                        return (
                          <tr key={b._id}>
                            <td>
                              <strong style={{ color: '#38A9F5' }}>{ref}</strong>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Ticket #{b.ticketNumber}
                              </span>
                            </td>
                            <td>
                              <strong>{b.passenger?.name || 'Passenger'}</strong>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--vyomira-lavender)' }}>
                                {b.passenger?.phone || b.passenger?.email || '—'}
                              </span>
                            </td>
                            <td>
                              <span>Flight #{b.flightId}</span>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {b.flight?.company || 'Carrier'}
                              </span>
                            </td>
                            <td>
                              <span className="badge" style={{
                                background: travelClass === 'First Class' ? 'rgba(245, 158, 11, 0.2)' : travelClass === 'Business Class' ? 'rgba(112, 84, 216, 0.2)' : 'rgba(56, 169, 245, 0.2)',
                                color: travelClass === 'First Class' ? '#fcd34d' : travelClass === 'Business Class' ? '#c4b5fd' : '#93c5fd',
                                fontSize: '0.72rem'
                              }}>
                                {travelClass}
                              </span>
                            </td>
                            <td>
                              <strong>#{b.seatNumber}</strong>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gate {b.gateNumber}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#10b981' }}>₹{fareAmount.toLocaleString('en-IN')}</strong>
                            </td>
                            <td>
                              <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-confirmed' : b.status === 'BOARDED' ? 'badge-boarded' : 'badge-cancelled'}`}>
                                {b.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                  onClick={() => handleInspectBooking(b)}
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                                  title="Inspect Complete Details"
                                >
                                  <Eye size={13} /> Details
                                </button>
                                <select
                                  value={b.status}
                                  onChange={(e) => handleUpdateBookingStatus(b._id, e.target.value)}
                                  style={{
                                    background: 'rgba(15,23,42,0.8)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    padding: '4px 6px',
                                    borderRadius: 6,
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <option value="CONFIRMED">CONFIRMED</option>
                                  <option value="BOARDED">BOARDED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: PASSENGERS                                   */}
          {/* ==================================================== */}
          {activeTab === 'passengers' && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.6rem', marginBottom: 20 }}>Registered Passenger Profiles</h2>
              <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: 18 }}>
                <div className="table-container">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Passenger Name</th>
                        <th>Age</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Assistance Preference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map(p => (
                        <tr key={p._id}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.age}</td>
                          <td>{p.email || '—'}</td>
                          <td>{p.phone || '—'}</td>
                          <td>
                            {p.wheelchair ? (
                              <span className="badge badge-boarded" style={{ fontSize: '0.7rem' }}>Wheelchair</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: ADMIN ACCOUNTS                                */}
          {/* ==================================================== */}
          {activeTab === 'users' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Administrator System Accounts</h2>
                  <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                    Authoritative accounts with access to fleet management, fares, and passenger records.
                  </p>
                </div>
                <button onClick={() => setShowUserModal(true)} className="btn btn-primary" style={{ fontSize: '0.88rem' }}>
                  <UserPlus size={16} /> Create Administrator
                </button>
              </div>

              <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: 18 }}>
                <div className="table-container">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td><strong>{u.username}</strong></td>
                          <td>{u.name || '—'}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge badge-primary">{u.role}</span>
                          </td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(u._id, u.username)}
                              disabled={u.username === 'admin'}
                              className="btn btn-danger"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: INSPECT COMPLETE BOOKING DETAILS            */}
      {/* ==================================================== */}
      {inspectBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div className="glass-panel fade-in" style={{
            maxWidth: 620,
            width: '100%',
            padding: 32,
            borderRadius: 24,
            border: '2px solid rgba(56, 169, 245, 0.35)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            background: 'linear-gradient(135deg, rgba(16, 42, 102, 0.96), rgba(15, 23, 42, 0.96))'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56, 169, 245, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={20} color="#38A9F5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Complete Booking Audit</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)' }}>
                    Ref: {inspectBooking.bookingReference || `VY-${inspectBooking.ticketNumber || inspectBooking.bookingId}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectBooking(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, fontSize: '0.88rem' }}>
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block' }}>PASSENGER NAME</span>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>
                  {inspectBooking.passengerName || inspectBooking.passenger?.name || 'Passenger'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Account ID: {inspectBooking.userId || inspectBooking.user?._id || 'Standard'}
                </span>
              </div>

              <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block' }}>TRAVEL CLASS</span>
                <strong style={{ fontSize: '1rem', color: '#38A9F5' }}>
                  {inspectBooking.travelClass || 'Economy'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Status: {inspectBooking.status}
                </span>
              </div>

              <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block' }}>FLIGHT & CARRIER</span>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>
                  Flight #{inspectBooking.flightNumber || inspectBooking.flightId}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)', display: 'block' }}>
                  {inspectBooking.airline || inspectBooking.flight?.company || 'IndiGo'}
                </span>
              </div>

              <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block' }}>ROUTE & TIMING</span>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>
                  {inspectBooking.origin || inspectBooking.flight?.source} → {inspectBooking.destination || inspectBooking.flight?.destination}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Dep: {inspectBooking.departureTime || inspectBooking.flight?.departure || 'Scheduled'}
                </span>
              </div>

              <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block' }}>SEAT & GATE</span>
                <strong style={{ fontSize: '1rem', color: '#7054D8' }}>
                  Seat #{inspectBooking.seatNumber}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Gate {inspectBooking.gateNumber || 'Assigned'}
                </span>
              </div>

              <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block' }}>CONFIRMED FARE PAID</span>
                <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>
                  ₹{(inspectBooking.fare || inspectBooking.flight?.fare || 3500).toLocaleString('en-IN')}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  INR (Validated)
                </span>
              </div>
            </div>

            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, marginBottom: 20, fontSize: '0.8rem', color: 'var(--vyomira-lavender)' }}>
              <span>Created Timestamp: {new Date(inspectBooking.createdAt || inspectBooking.bookingDate).toLocaleString()}</span>
              {inspectBooking.wheelchair && <span style={{ display: 'block', color: '#38A9F5', marginTop: 4 }}>✓ Wheelchair / Mobility Assistance Requested</span>}
              {inspectBooking.foodService && <span style={{ display: 'block', color: '#38A9F5', marginTop: 2 }}>✓ In-Flight Meal Service Included</span>}
            </div>

            <button
              onClick={() => setInspectBooking(null)}
              className="btn btn-primary"
              style={{ width: '100%', padding: 12 }}
            >
              Close Inspection
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: FLIGHT ROUTE & CLASS PRICING CONFIG         */}
      {/* ==================================================== */}
      {showFlightModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div className="glass-panel fade-in" style={{
            maxWidth: 680,
            width: '100%',
            padding: 30,
            borderRadius: 22,
            border: '2px solid rgba(56, 169, 245, 0.35)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem' }}>
                {editingFlight ? `Edit Flight #${flightForm.flightId}` : 'Add New Scheduled Flight Route'}
              </h3>
              <button onClick={() => setShowFlightModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFlight}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Flight ID (Numeric) *</label>
                  <input
                    type="number"
                    required
                    disabled={!!editingFlight}
                    className="form-control"
                    value={flightForm.flightId}
                    onChange={(e) => setFlightForm({ ...flightForm, flightId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Airline Carrier *</label>
                  <select
                    className="form-control"
                    value={flightForm.company}
                    onChange={(e) => setFlightForm({ ...flightForm, company: e.target.value })}
                  >
                    <option value="IndiGo">IndiGo</option>
                    <option value="Air India">Air India</option>
                    <option value="Vistara">Vistara</option>
                    <option value="SpiceJet">SpiceJet</option>
                    <option value="Akasa Air">Akasa Air</option>
                    <option value="Emirates">Emirates</option>
                    <option value="Singapore Airlines">Singapore Airlines</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Departure City (Origin) *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Hyderabad"
                    value={flightForm.source}
                    onChange={(e) => setFlightForm({ ...flightForm, source: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Origin Airport Code</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    className="form-control"
                    placeholder="HYD"
                    value={flightForm.sourceCode}
                    onChange={(e) => setFlightForm({ ...flightForm, sourceCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Arrival City (Destination) *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Delhi"
                    value={flightForm.destination}
                    onChange={(e) => setFlightForm({ ...flightForm, destination: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Destination Code</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    className="form-control"
                    placeholder="DEL"
                    value={flightForm.destinationCode}
                    onChange={(e) => setFlightForm({ ...flightForm, destinationCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Departure Time</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="06:00"
                    value={flightForm.departure}
                    onChange={(e) => setFlightForm({ ...flightForm, departure: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Arrival Time</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="08:15"
                    value={flightForm.arrival}
                    onChange={(e) => setFlightForm({ ...flightForm, arrival: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Base Fare (Min ₹1,000)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    className="form-control"
                    value={flightForm.fare}
                    onChange={(e) => setFlightForm({ ...flightForm, fare: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* 4 Travel Classes Fare & Capacity Config */}
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 14, marginBottom: 20 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--vyomira-lavender)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                  Configurable Travel-Class Fares (INR)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#93c5fd' }}>Economy (₹)</label>
                    <input
                      type="number"
                      min={1000}
                      className="form-control"
                      value={flightForm.classes['Economy']?.fare || 3500}
                      onChange={(e) => setFlightForm({
                        ...flightForm,
                        classes: {
                          ...flightForm.classes,
                          'Economy': { ...flightForm.classes['Economy'], fare: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#67e8f9' }}>Prem. Econ (₹)</label>
                    <input
                      type="number"
                      min={1000}
                      className="form-control"
                      value={flightForm.classes['Premium Economy']?.fare || 5500}
                      onChange={(e) => setFlightForm({
                        ...flightForm,
                        classes: {
                          ...flightForm.classes,
                          'Premium Economy': { ...flightForm.classes['Premium Economy'], fare: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#c4b5fd' }}>Business (₹)</label>
                    <input
                      type="number"
                      min={1000}
                      className="form-control"
                      value={flightForm.classes['Business Class']?.fare || 12000}
                      onChange={(e) => setFlightForm({
                        ...flightForm,
                        classes: {
                          ...flightForm.classes,
                          'Business Class': { ...flightForm.classes['Business Class'], fare: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#fcd34d' }}>First Class (₹)</label>
                    <input
                      type="number"
                      min={1000}
                      className="form-control"
                      value={flightForm.classes['First Class']?.fare || 25000}
                      onChange={(e) => setFlightForm({
                        ...flightForm,
                        classes: {
                          ...flightForm.classes,
                          'First Class': { ...flightForm.classes['First Class'], fare: Number(e.target.value) }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowFlightModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  {editingFlight ? 'Update Flight & Fares' : 'Save New Flight Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: CREATE ADMIN USER                           */}
      {/* ==================================================== */}
      {showUserModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div className="glass-panel fade-in" style={{
            maxWidth: 480,
            width: '100%',
            padding: 30,
            borderRadius: 22,
            border: '2px solid rgba(56, 169, 245, 0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Create System Administrator</h3>
              <button onClick={() => setShowUserModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>Username *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="admin.ops"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Operations Lead"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="lead@airline.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontSize: '0.84rem' }}>Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-control"
                  placeholder="Min. 6 characters"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
