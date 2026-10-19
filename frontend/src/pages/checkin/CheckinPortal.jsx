import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  QrCode, 
  Search, 
  Plane, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Armchair, 
  Ticket,
  HeartHandshake,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';

export const CheckinPortal = () => {
  const { user } = useAuth();
  const [ticketInput, setTicketInput] = useState('');
  const [flightInput, setFlightInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [boardingAction, setBoardingAction] = useState(false);

  const isAdmin = user && user.role === 'admin';

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) {
      setError('Please enter a valid ticket number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setTicketDetails(null);

    try {
      const data = await api.checkin.lookup(ticketInput.trim(), flightInput.trim());
      setTicketDetails(data);
    } catch (err) {
      setError(err.message || 'Ticket not found in the airline database.');
    } finally {
      setLoading(false);
    }
  };

  const handleBoardPassenger = async () => {
    if (!ticketDetails || !isAdmin) return;

    setBoardingAction(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.checkin.boardPassenger(ticketDetails.bookingId);
      setSuccess(res.message);
      setTicketDetails(prev => ({
        ...prev,
        status: 'BOARDED'
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBoardingAction(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px' }} className="fade-in">
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #102A66, #38A9F5)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          boxShadow: '0 8px 20px rgba(56, 169, 245, 0.35)'
        }}>
          <QrCode size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: 6 }}>Ticket & Gate Status Lookup</h1>
        <p style={{ color: 'var(--vyomira-lavender)', maxWidth: 580, margin: '0 auto', fontSize: '0.95rem' }}>
          Real-time ticket verification, assigned gate status, and boarding pass lookup powered by VYOMIRA.
        </p>
      </div>

      {/* Search verification card */}
      <div className="glass-panel" style={{
        padding: 28,
        marginBottom: 32,
        borderRadius: 20,
        background: 'rgba(16, 42, 102, 0.35)',
        borderColor: 'rgba(56, 169, 245, 0.25)'
      }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
          <Search size={18} color="#38A9F5" />
          Verify Ticket or Gate Assignment
        </h3>

        <form onSubmit={handleLookup} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.84rem', color: 'var(--vyomira-lavender)' }}>
              Ticket Number *
            </label>
            <input
              type="number"
              required
              placeholder="e.g. 1001"
              className="form-control"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.7)' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.84rem', color: 'var(--vyomira-lavender)' }}>
              Flight Number (Optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 101"
              className="form-control"
              value={flightInput}
              onChange={(e) => setFlightInput(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.7)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '11px 20px',
              background: 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)',
              boxShadow: '0 4px 14px rgba(56, 169, 245, 0.35)'
            }}
          >
            {loading ? 'Searching Database...' : 'Lookup Ticket'}
          </button>
        </form>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.18)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          padding: '14px 18px',
          borderRadius: 12,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }} className="fade-in">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#6ee7b7',
          padding: '14px 18px',
          borderRadius: 12,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }} className="fade-in">
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Ticket Verification Result Card */}
      {ticketDetails && (
        <div className="glass-panel fade-in" style={{
          padding: 32,
          border: '2px solid rgba(56, 169, 245, 0.4)',
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(16, 42, 102, 0.95), rgba(15, 23, 42, 0.95))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
        }}>
          
          {/* Status Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--vyomira-lavender)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                VERIFIED TICKET RECORD
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#38A9F5', margin: '2px 0 0 0' }}>
                Ticket #{ticketDetails.ticketNumber}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`badge ${ticketDetails.status === 'CONFIRMED' ? 'badge-confirmed' : ticketDetails.status === 'BOARDED' ? 'badge-boarded' : 'badge-cancelled'}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                {ticketDetails.status}
              </span>
            </div>
          </div>

          {/* Passenger & Flight Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 20,
            borderRadius: 16,
            marginBottom: 24
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)' }}>PASSENGER NAME</span>
              <p style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 4, color: '#fff' }}>{ticketDetails.passengerName}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)' }}>FLIGHT</span>
              <p style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 4, color: '#fff' }}>
                #{ticketDetails.flightId} ({ticketDetails.flightCompany || 'IndiGo'})
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)' }}>ASSIGNED GATE</span>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38A9F5', marginTop: 2 }}>
                GATE {ticketDetails.gateNumber}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)' }}>ASSIGNED SEAT</span>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7054D8', marginTop: 2 }}>
                SEAT #{ticketDetails.seatNumber}
              </p>
            </div>
          </div>

          {/* Route & Times */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 22px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 14,
            marginBottom: 24,
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>{ticketDetails.source}</span>
              <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--vyomira-sky)', fontWeight: 600 }}>
                Dep: {ticketDetails.departure}
              </span>
            </div>
            <Plane size={20} color="#38A9F5" style={{ transform: 'rotate(45deg)' }} />
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>{ticketDetails.destination}</span>
              <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--vyomira-sky)', fontWeight: 600 }}>
                Arr: {ticketDetails.arrival}
              </span>
            </div>
          </div>

          {/* Assistance flags */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {ticketDetails.wheelchair && (
              <span className="badge badge-boarded" style={{ padding: '6px 14px' }}>
                <HeartHandshake size={14} /> Priority Wheelchair Mobility Assistance Required
              </span>
            )}
            {ticketDetails.foodService && (
              <span className="badge badge-primary" style={{ padding: '6px 14px' }}>
                <UtensilsCrossed size={14} /> In-Flight Catering Included
              </span>
            )}
          </div>

          {/* Admin Operational Action: Mark Boarded */}
          {isAdmin && (
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20 }}>
              {ticketDetails.status === 'CONFIRMED' ? (
                <button
                  onClick={handleBoardPassenger}
                  disabled={boardingAction}
                  className="btn btn-success"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                >
                  <CheckCircle2 size={18} />
                  {boardingAction ? 'Recording Boarding in Database...' : 'Authorize & Mark Passenger as BOARDED'}
                </button>
              ) : ticketDetails.status === 'BOARDED' ? (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16,185,129,0.15)', borderRadius: 10, color: '#34d399', fontWeight: 700 }}>
                  ✓ Passenger is marked as BOARDED at Gate {ticketDetails.gateNumber}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(239,68,68,0.15)', borderRadius: 10, color: '#f87171', fontWeight: 700 }}>
                  Ticket is CANCELLED. Boarding prohibited.
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
