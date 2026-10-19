import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Ticket, 
  Plane, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  HeartHandshake, 
  UtensilsCrossed, 
  Armchair,
  Tag,
  ShieldCheck
} from 'lucide-react';

export const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.passenger.getMyBookings();
      setBookings(data);
    } catch (err) {
      setError('Failed to load your bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, bookingRef) => {
    if (!window.confirm(`Are you sure you want to cancel Booking ${bookingRef}? Your seat reservation will be released immediately.`)) {
      return;
    }

    setCancellingId(bookingId);
    setError('');
    setSuccess('');
    try {
      await api.passenger.cancelBooking(bookingId);
      setSuccess(`Booking ${bookingRef} has been successfully cancelled and seat released.`);
      fetchMyBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 20px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: 4, letterSpacing: '-0.01em' }}>
            My Flight Bookings
          </h1>
          <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.95rem' }}>
            Inspect your issued e-tickets, class-specific fares, seat assignments, and travel status.
          </p>
        </div>
        <Link to="/" className="btn btn-primary" style={{
          fontSize: '0.9rem',
          background: 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)',
          boxShadow: '0 4px 14px rgba(56, 169, 245, 0.35)'
        }}>
          <Plane size={16} /> Book New Flight
        </Link>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.18)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#6ee7b7',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{
            width: 44,
            height: 44,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--vyomira-sky)',
            borderRadius: '50%',
            margin: '0 auto 16px auto',
            animation: 'spin 0.8s linear infinite'
          }} />
          Retrieving your verified passenger bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center', borderRadius: 20 }}>
          <Ticket size={48} color="var(--vyomira-lavender)" style={{ marginBottom: 16, opacity: 0.6 }} />
          <h3>No Active Bookings Found</h3>
          <p style={{ color: 'var(--vyomira-lavender)', margin: '8px 0 24px 0' }}>
            You haven't booked any flights with VYOMIRA yet. Search our scheduled network and reserve your seat!
          </p>
          <Link to="/" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)' }}>
            Explore Scheduled Flights
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {bookings.map((booking) => {
            const flight = booking.flight || {};
            const isCancelled = booking.status === 'CANCELLED';
            const isBoarded = booking.status === 'BOARDED';
            const bookingRef = booking.bookingReference || `VY-${booking.ticketNumber}`;
            const fareAmount = booking.fare || flight.fare || 3500;
            const travelClass = booking.travelClass || 'Economy';
            const sourceCode = flight.sourceCode || (flight.source ? flight.source.substring(0, 3).toUpperCase() : 'DEP');
            const destCode = flight.destinationCode || (flight.destination ? flight.destination.substring(0, 3).toUpperCase() : 'ARR');

            return (
              <div 
                key={booking._id} 
                className="glass-panel fade-in"
                style={{
                  padding: 24,
                  borderRadius: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  opacity: isCancelled ? 0.65 : 1,
                  background: 'rgba(16, 42, 102, 0.32)',
                  borderColor: isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 169, 245, 0.25)',
                  borderLeft: `5px solid ${isCancelled ? '#ef4444' : isBoarded ? '#f59e0b' : '#38A9F5'}`,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--vyomira-lavender)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        BOOKING REFERENCE
                      </span>
                      <span className="badge" style={{
                        background: travelClass === 'First Class' ? 'rgba(245, 158, 11, 0.2)' : travelClass === 'Business Class' ? 'rgba(112, 84, 216, 0.2)' : 'rgba(56, 169, 245, 0.2)',
                        color: travelClass === 'First Class' ? '#fcd34d' : travelClass === 'Business Class' ? '#c4b5fd' : '#93c5fd',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {travelClass}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--vyomira-sky)', margin: 0 }}>
                      {bookingRef} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Ticket #{booking.ticketNumber})</span>
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block' }}>CONFIRMED FARE</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>
                        ₹{fareAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className={`badge ${isCancelled ? 'badge-cancelled' : isBoarded ? 'badge-boarded' : 'badge-confirmed'}`} style={{ padding: '6px 12px' }}>
                      {booking.status}
                    </span>
                    {!isCancelled && !isBoarded && (
                      <button
                        id={`btn-cancel-booking-${booking._id}`}
                        onClick={() => handleCancelBooking(booking._id, bookingRef)}
                        disabled={cancellingId === booking._id}
                        className="btn btn-danger"
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      >
                        <XCircle size={14} />
                        {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Flight'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Flight Route Banner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '16px 22px',
                  borderRadius: 14,
                  flexWrap: 'wrap',
                  gap: 12,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                      {sourceCode}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--vyomira-lavender)' }}>
                      {flight.source || 'Origin'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--vyomira-sky)', fontWeight: 600 }}>
                      Time: {flight.departure || '--:--'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Plane size={18} color="#38A9F5" style={{ transform: 'rotate(45deg)' }} />
                    <span style={{ fontSize: '0.8rem', color: '#fff', marginTop: 4, fontWeight: 700 }}>
                      {flight.company || 'Carrier'} ({flight.flightNumber || `VY-${booking.flightId}`})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)' }}>
                      Direct Non-Stop
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                      {destCode}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--vyomira-lavender)' }}>
                      {flight.destination || 'Destination'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--vyomira-sky)', fontWeight: 600 }}>
                      Time: {flight.arrival || '--:--'}
                    </span>
                  </div>
                </div>

                {/* Footer Badges & Services */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.85rem', color: 'var(--vyomira-lavender)' }}>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Armchair size={15} color="#38A9F5" />
                      Seat: <strong style={{ color: '#fff' }}>#{booking.seatNumber}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={15} color="#7054D8" />
                      Gate: <strong style={{ color: '#fff' }}>{booking.gateNumber}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={15} />
                      Booked: {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {booking.wheelchair && (
                      <span className="badge badge-boarded" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                        <HeartHandshake size={12} /> Wheelchair Assist
                      </span>
                    )}
                    {booking.foodService && (
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                        <UtensilsCrossed size={12} /> Meal Included
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
