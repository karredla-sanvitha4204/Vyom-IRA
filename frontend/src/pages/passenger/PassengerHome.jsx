import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  Plane, 
  MapPin, 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Armchair, 
  Sparkles,
  AlertCircle,
  Tag,
  Compass
} from 'lucide-react';

export const PassengerHome = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search filters
  const [sourceFilter, setSourceFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.flights.getAll();
      setFlights(data);
    } catch (err) {
      setError(err.message || 'Could not load flights. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };


  // Unique sources and destinations for quick dropdown selection
  const sources = [...new Set(flights.map(f => f.source))].sort();
  const destinations = [...new Set(flights.map(f => f.destination))].sort();

  const filteredFlights = flights.filter(f => {
    const matchSource = !sourceFilter || f.source.toLowerCase().includes(sourceFilter.toLowerCase());
    const matchDest = !destFilter || f.destination.toLowerCase().includes(destFilter.toLowerCase());
    return matchSource && matchDest;
  });

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: 44, padding: '36px 16px' }} className="fade-in">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 18px',
          background: 'rgba(56, 169, 245, 0.12)',
          border: '1px solid rgba(56, 169, 245, 0.35)',
          borderRadius: 30,
          color: 'var(--vyomira-sky)',
          fontSize: '0.88rem',
          fontWeight: 600,
          marginBottom: 20
        }}>
          <Sparkles size={16} />
          <span>VYOMIRA Aviation Network — Connecting Earth and Sky.</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.3rem, 5.5vw, 3.8rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #38A9F5 60%, #7054D8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Seamless Journeys. Unrivaled Luxury.
        </h1>

        <p style={{
          fontSize: '1.12rem',
          color: 'var(--vyomira-lavender)',
          maxWidth: 680,
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          Explore scheduled domestic & international flights across India. Choose from Economy, Premium Economy, Business Class, or First Class with guaranteed seat availability and transparent fares.
        </p>

        {/* Flight Search Widget Card */}
        <div className="glass-panel" style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '24px 28px',
          borderRadius: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          alignItems: 'flex-end',
          textAlign: 'left',
          background: 'rgba(16, 42, 102, 0.35)',
          borderColor: 'rgba(56, 169, 245, 0.25)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)'
        }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--vyomira-lavender)', fontSize: '0.85rem' }}>
              <MapPin size={15} color="#38A9F5" />
              Departure City (Origin)
            </label>
            <select 
              id="filter-source"
              className="form-control"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.7)', color: '#fff' }}
            >
              <option value="">All Departure Cities</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--vyomira-lavender)', fontSize: '0.85rem' }}>
              <Plane size={15} color="#7054D8" />
              Arrival City (Destination)
            </label>
            <select 
              id="filter-destination"
              className="form-control"
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.7)', color: '#fff' }}
            >
              <option value="">All Destinations</option>
              {destinations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              type="button" 
              id="btn-reset-filter"
              onClick={() => { setSourceFilter(''); setDestFilter(''); setDateFilter(''); }}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px 12px' }}
            >
              Reset
            </button>
            <button 
              type="button" 
              id="btn-search-flights"
              onClick={fetchFlights}
              className="btn btn-primary"
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)',
                boxShadow: '0 4px 14px rgba(56, 169, 245, 0.35)'
              }}
            >
              <Search size={16} />
              Search Flights
            </button>
          </div>
        </div>
      </section>

      {/* Available Flights Section */}
      <section style={{ marginBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.7rem', marginBottom: 4, letterSpacing: '-0.01em' }}>Scheduled Flights</h2>
            <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.9rem' }}>
              Showing {filteredFlights.length} available flight routes ({sources.length} origins connected)
            </p>
          </div>
          <button onClick={fetchFlights} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Refresh Schedules
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{
              width: 44,
              height: 44,
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--vyomira-sky)',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin 0.8s linear infinite'
            }} />
            Loading real-time flight inventory...
          </div>
        ) : filteredFlights.length === 0 ? (
          <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
            <Plane size={48} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.5 }} />
            <h3>No flights match your search criteria</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              Try clearing the origin or destination filters above to view all scheduled flights.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
            {filteredFlights.map((flight) => {
              const startingFare = flight.fare >= 1000 ? flight.fare : 3500;
              const sourceCode = flight.sourceCode || flight.source.substring(0, 3).toUpperCase();
              const destCode = flight.destinationCode || flight.destination.substring(0, 3).toUpperCase();
              const flightNum = flight.flightNumber || `VY-${flight.flightId}`;

              return (
                <div 
                  key={flight._id} 
                  className="glass-panel fade-in" 
                  style={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    borderRadius: 18,
                    background: 'rgba(16, 42, 102, 0.32)',
                    borderColor: 'rgba(56, 169, 245, 0.22)',
                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(56, 169, 245, 0.5)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 42, 102, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(56, 169, 245, 0.22)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    {/* Card Top: Airline & Starting Fare */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="badge" style={{ background: 'rgba(56, 169, 245, 0.2)', color: '#38A9F5', fontWeight: 700 }}>
                            {flightNum}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--vyomira-lavender)', fontWeight: 500 }}>
                            {flight.duration || '2h 15m'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                          {flight.company}
                        </h3>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Starting From
                        </span>
                        <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--vyomira-sky)' }}>
                          ₹{startingFare.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Route Timeline with Airport Codes */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 14,
                      marginBottom: 16,
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', display: 'block' }}>
                          {sourceCode}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)', display: 'block' }}>
                          {flight.source}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--vyomira-sky)', marginTop: 4, display: 'block' }}>
                          {flight.departure}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 12px' }}>
                        <Plane size={18} color="#38A9F5" style={{ transform: 'rotate(45deg)', marginBottom: 4 }} />
                        <div style={{ width: 80, height: 2, background: 'linear-gradient(to right, transparent, #38A9F5, transparent)' }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--vyomira-lavender)', marginTop: 4, fontWeight: 600 }}>
                          Direct Non-Stop
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', display: 'block' }}>
                          {destCode}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)', display: 'block' }}>
                          {flight.destination}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--vyomira-sky)', marginTop: 4, display: 'block' }}>
                          {flight.arrival}
                        </span>
                      </div>
                    </div>

                    {/* Available Classes Pill Bar */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {['Economy', 'Premium Economy', 'Business Class', 'First Class'].map(cls => (
                        <span
                          key={cls}
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: cls === 'First Class' ? 'rgba(112, 84, 216, 0.25)' : cls === 'Business Class' ? 'rgba(56, 169, 245, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            color: cls === 'First Class' ? '#c4b5fd' : cls === 'Business Class' ? '#93c5fd' : 'var(--text-muted)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          {cls}
                        </span>
                      ))}
                    </div>

                    {/* Flight Specs */}
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Armchair size={14} color="#38A9F5" /> Total Seats: {flight.totalSeats || 60}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={14} color="#7054D8" /> Gate {(flight.flightId % 20 === 0 ? 20 : flight.flightId % 20)}
                      </span>
                    </div>
                  </div>

                  {/* Booking Action Button */}
                  <button
                    id={`btn-book-flight-${flight.flightId}`}
                    onClick={() => navigate(`/book/${flight.flightId}`)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      marginTop: 10,
                      background: 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)',
                      boxShadow: '0 4px 14px rgba(56, 169, 245, 0.35)'
                    }}
                  >
                    <span>Select Travel Class & Seats</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Brand Value Pillars (2 Unified Experiences) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 40 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <ShieldCheck size={32} color="#10b981" style={{ marginBottom: 12 }} />
          <h4 style={{ marginBottom: 6, fontSize: '1.15rem' }}>Authoritative Seat Concurrency</h4>
          <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', lineHeight: 1.55 }}>
            MongoDB compound partial indexes guarantee real-time seat lock safety. Duplicate seat bookings are rejected at the database level.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <Tag size={32} color="#38A9F5" style={{ marginBottom: 12 }} />
          <h4 style={{ marginBottom: 6, fontSize: '1.15rem' }}>4 Travel Classes & Authoritative Fares</h4>
          <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', lineHeight: 1.55 }}>
            Select from Economy, Premium Economy, Business Class, and First Class. Every ticket fare is verified by our backend pricing engine and guaranteed $\ge$ ₹1,000.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <Sparkles size={32} color="#7054D8" style={{ marginBottom: 12 }} />
          <h4 style={{ marginBottom: 6, fontSize: '1.15rem' }}>Instant Admin Booking Alerts</h4>
          <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', lineHeight: 1.55 }}>
            Every passenger confirmation instantly notifies airline operations with complete passenger, seat, class, and fare details for full visibility.
          </p>
        </div>
      </section>

    </div>
  );
};
