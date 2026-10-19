import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plane, 
  MapPin, 
  Armchair, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Ticket, 
  Sparkles,
  HeartHandshake,
  UtensilsCrossed,
  ShieldCheck,
  Crown,
  Briefcase,
  Luggage,
  Calendar,
  Clock
} from 'lucide-react';

const CLASS_CONFIGS = [
  {
    name: 'Economy',
    icon: Armchair,
    tagline: 'Comfort & Value',
    perks: ['Standard Legroom (30")', '15 kg Check-in Baggage', 'In-Flight Entertainment', 'Standard Boarding'],
    rowRange: [6, 10], // Rows 6 to 10 (Seats 31-60)
    color: '#38A9F5'
  },
  {
    name: 'Premium Economy',
    icon: Briefcase,
    tagline: 'Extra Space & Comfort',
    perks: ['Extra Legroom (35")', '25 kg Check-in Baggage', 'Priority Boarding & Check-in', 'Premium Snack Box'],
    rowRange: [4, 5], // Rows 4 to 5 (Seats 19-30)
    color: '#06b6d4'
  },
  {
    name: 'Business Class',
    icon: Sparkles,
    tagline: 'Luxury & Productivity',
    perks: ['Wide Angle Lie-Flat Seating', '35 kg Check-in Baggage', 'Exclusive Airport Lounge Access', 'Multi-Course Gourmet Dining'],
    rowRange: [2, 3], // Rows 2 to 3 (Seats 7-18)
    color: '#7054D8'
  },
  {
    name: 'First Class',
    icon: Crown,
    tagline: 'The Pinnacle of Flight',
    perks: ['Private Enclosed Suite', '45 kg Check-in Baggage', 'Dedicated Chauffeur & Lounge', 'Champagne & Fine Caviar Service'],
    rowRange: [1, 1], // Row 1 (Seats 1-6)
    color: '#f59e0b'
  }
];

export const FlightBooking = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [flight, setFlight] = useState(null);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Selected Travel Class & Seat
  const [selectedClass, setSelectedClass] = useState('Economy');
  const [selectedSeat, setSelectedSeat] = useState(null);

  // Passenger form
  const [passengerForm, setPassengerForm] = useState({
    name: user?.name || '',
    age: 28,
    phone: '',
    email: user?.email || '',
    wheelchair: false,
    foodService: true
  });

  useEffect(() => {
    fetchFlightAndSeats();
  }, [flightId]);

  // Autofill if user profile loads
  useEffect(() => {
    if (user) {
      setPassengerForm(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const fetchFlightAndSeats = async () => {
    setLoading(true);
    setError('');
    try {
      const flightData = await api.flights.getById(flightId);
      setFlight(flightData);

      const bookingsData = await api.flights.getBookings(flightId);
      // Active bookings hold seats
      const activeOccupied = bookingsData.filter(b => b.status === 'CONFIRMED' || b.status === 'BOARDED');
      setExistingBookings(activeOccupied);
    } catch (err) {
      setError('Unable to load flight or seat availability: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const occupiedSeatNumbers = new Set(existingBookings.map(b => b.seatNumber));
  const totalSeats = flight?.totalSeats || 60;

  // Compute class fare based on authoritative flight schema
  const getClassFare = (className) => {
    if (!flight) return 3500;
    if (flight.classes && flight.classes[className]?.fare) {
      return flight.classes[className].fare;
    }
    // Fallback formula aligned with backend pricing service
    const base = Math.max(Number(flight.fare) || 3500, 1000);
    switch (className) {
      case 'First Class': return Math.max(Math.round(base * 6.5), 25000);
      case 'Business Class': return Math.max(Math.round(base * 3.2), 12000);
      case 'Premium Economy': return Math.max(Math.round(base * 1.55), 5500);
      case 'Economy':
      default: return Math.max(base, 1000);
    }
  };

  const activeFare = getClassFare(selectedClass);

  // Determine allowed seat range for selected class
  const activeClassConfig = CLASS_CONFIGS.find(c => c.name === selectedClass) || CLASS_CONFIGS[0];
  const startSeatForClass = (activeClassConfig.rowRange[0] - 1) * 6 + 1;
  const endSeatForClass = Math.min(activeClassConfig.rowRange[1] * 6, totalSeats);

  const handleClassChange = (className) => {
    setSelectedClass(className);
    // If current selected seat is outside the new class range, reset seat selection
    const config = CLASS_CONFIGS.find(c => c.name === className);
    const startS = (config.rowRange[0] - 1) * 6 + 1;
    const endS = Math.min(config.rowRange[1] * 6, totalSeats);
    if (selectedSeat && (selectedSeat < startS || selectedSeat > endS)) {
      setSelectedSeat(null);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedSeat) {
      setError(`Please select an available seat from the ${selectedClass} cabin section.`);
      return;
    }
    if (!passengerForm.name.trim()) {
      setError('Passenger full name is required.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Ensure passenger profile
      let passId = user?.passengerId ? (user.passengerId._id || user.passengerId) : null;
      if (!passId) {
        const passData = await api.passengers.create({
          name: passengerForm.name,
          age: Number(passengerForm.age) || 28,
          email: passengerForm.email,
          phone: passengerForm.phone,
          wheelchair: Boolean(passengerForm.wheelchair),
          foodService: Boolean(passengerForm.foodService)
        });
        passId = passData.passenger._id;
      }

      // 2. Submit booking with travelClass
      const bookingPayload = {
        flightId: Number(flightId),
        passengerId: passId,
        seatNumber: selectedSeat,
        travelClass: selectedClass,
        wheelchair: passengerForm.wheelchair,
        foodService: passengerForm.foodService
      };

      const result = await api.bookings.create(bookingPayload);
      setConfirmedBooking(result.booking);
    } catch (err) {
      setError(err.message || 'Booking reservation could not be completed. The seat may have been taken.');
      fetchFlightAndSeats();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--vyomira-sky)',
          borderRadius: '50%',
          margin: '0 auto 16px auto',
          animation: 'spin 0.8s linear infinite'
        }} />
        Loading flight cabin layout and class inventory...
      </div>
    );
  }

  if (!flight) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: 36, textAlign: 'center' }} className="glass-panel">
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2>Flight Not Found</h2>
        <p style={{ color: 'var(--vyomira-lavender)', margin: '12px 0 24px 0' }}>
          Flight #{flightId} could not be retrieved from the database.
        </p>
        <Link to="/" className="btn btn-primary">Return to Flights</Link>
      </div>
    );
  }

  // ==========================================
  // CONFIRMATION VIEW (OFFICIAL VYOMIRA BOARDING PASS)
  // ==========================================
  if (confirmedBooking) {
    const bookingRef = confirmedBooking.bookingReference || `VY-${confirmedBooking.ticketNumber}`;
    const confirmedFare = confirmedBooking.fare || activeFare;
    const bookingClass = confirmedBooking.travelClass || selectedClass;

    return (
      <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 20px' }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid #10b981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)'
          }}>
            <CheckCircle2 size={36} color="#10b981" />
          </div>
          <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: 4 }}>Booking Confirmed</h1>
          <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.95rem' }}>
            Your e-ticket and boarding credentials have been safely issued by VYOMIRA.
          </p>
        </div>

        {/* Boarding Pass Card */}
        <div className="glass-panel" style={{
          overflow: 'hidden',
          borderRadius: 24,
          border: '1px solid rgba(56, 169, 245, 0.3)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          background: 'linear-gradient(135deg, rgba(16, 42, 102, 0.95), rgba(15, 23, 42, 0.95))'
        }}>
          {/* Top Brand Bar */}
          <div style={{
            background: 'linear-gradient(90deg, #102A66 0%, #38A9F5 100%)',
            padding: '20px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/vyomira-logo.png" alt="VYOMIRA" style={{ height: 36, width: 36, objectFit: 'contain' }} />
              <div>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.08em', color: '#fff', display: 'block' }}>
                  VYOMIRA
                </span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.04em' }}>
                  Connecting Earth and Sky.
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge" style={{ background: '#fff', color: '#102A66', fontWeight: 800, fontSize: '0.75rem', padding: '5px 12px' }}>
                BOARDING PASS
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: 700 }}>
                {bookingRef}
              </span>
            </div>
          </div>

          {/* Ticket Body */}
          <div style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Passenger Name
                </span>
                <h3 style={{ fontSize: '1.35rem', color: '#fff', marginTop: 2, fontWeight: 700 }}>
                  {confirmedBooking.passenger?.name || passengerForm.name}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--vyomira-lavender)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Travel Class
                </span>
                <span className="badge" style={{
                  background: 'rgba(112, 84, 216, 0.25)',
                  color: '#c4b5fd',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginTop: 4,
                  display: 'inline-block'
                }}>
                  {bookingClass}
                </span>
              </div>
            </div>

            {/* Flight Route Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '18px 24px',
              borderRadius: 16,
              marginBottom: 24,
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', display: 'block' }}>
                  {flight.sourceCode || flight.source.substring(0, 3).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>{flight.source}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--vyomira-sky)', fontWeight: 600, display: 'block', marginTop: 4 }}>
                  Dep: {flight.departure}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Plane size={22} color="#38A9F5" style={{ transform: 'rotate(45deg)' }} />
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--vyomira-lavender)', marginTop: 4, fontWeight: 600 }}>
                  {flight.company} ({flight.flightNumber || `VY-${flight.flightId}`})
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Non-Stop ({flight.duration || '2h 15m'})
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', display: 'block' }}>
                  {flight.destinationCode || flight.destination.substring(0, 3).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>{flight.destination}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--vyomira-sky)', fontWeight: 600, display: 'block', marginTop: 4 }}>
                  Arr: {flight.arrival}
                </span>
              </div>
            </div>

            {/* 4-Column Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center', marginBottom: 24 }}>
              <div style={{ padding: '12px 8px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)' }}>SEAT</span>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38A9F5', margin: '4px 0 0 0' }}>
                  #{confirmedBooking.seatNumber}
                </p>
              </div>
              <div style={{ padding: '12px 8px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)' }}>GATE</span>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7054D8', margin: '4px 0 0 0' }}>
                  {confirmedBooking.gateNumber}
                </p>
              </div>
              <div style={{ padding: '12px 8px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)' }}>FARE PAID</span>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', margin: '4px 0 0 0' }}>
                  ₹{confirmedFare.toLocaleString('en-IN')}
                </p>
              </div>
              <div style={{ padding: '12px 8px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)' }}>STATUS</span>
                <p style={{ fontSize: '0.92rem', fontWeight: 800, color: '#34d399', margin: '6px 0 0 0' }}>
                  {confirmedBooking.status}
                </p>
              </div>
            </div>

            {/* In-Flight Services Badges */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {confirmedBooking.wheelchair && (
                <span className="badge badge-boarded" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  <HeartHandshake size={14} /> Wheelchair Assistance Requested
                </span>
              )}
              {confirmedBooking.foodService && (
                <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  <UtensilsCrossed size={14} /> In-Flight Meal Service Included
                </span>
              )}
            </div>

            {/* Simulated Aviation Barcode */}
            <div style={{
              height: 48,
              background: 'repeating-linear-gradient(90deg, #FFFFFF, #FFFFFF 2px, transparent 2px, transparent 6px, #FFFFFF 6px, #FFFFFF 9px, transparent 9px, transparent 13px)',
              borderRadius: 8,
              opacity: 0.85
            }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
          <Link to="/my-bookings" className="btn btn-primary" style={{ flex: 1, padding: 12 }}>
            <Ticket size={18} />
            View in My Bookings
          </Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, padding: 12 }}>
            Book Another Flight
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // BOOKING JOURNEY FORM VIEW
  // ==========================================
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }} className="fade-in">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--vyomira-lavender)', textDecoration: 'none', marginBottom: 20, fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back to Scheduled Flights
      </Link>

      {/* Flight Banner Header */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        borderRadius: 20,
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        background: 'rgba(16, 42, 102, 0.4)',
        borderColor: 'rgba(56, 169, 245, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="badge" style={{ background: 'rgba(56, 169, 245, 0.25)', color: '#38A9F5', fontWeight: 700 }}>
              {flight.flightNumber || `VY-${flight.flightId}`}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--vyomira-lavender)' }}>
              Non-Stop • {flight.duration || '2h 15m'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, fontWeight: 700 }}>
            {flight.company}
          </h2>
        </div>

        {/* Route Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', display: 'block' }}>
              {flight.sourceCode || flight.source.substring(0, 3).toUpperCase()}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--vyomira-lavender)' }}>{flight.source}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--vyomira-sky)', fontWeight: 600, display: 'block' }}>{flight.departure}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Plane size={18} color="#38A9F5" style={{ transform: 'rotate(45deg)' }} />
            <div style={{ width: 60, height: 2, background: 'rgba(56, 169, 245, 0.4)', margin: '4px 0' }} />
          </div>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', display: 'block' }}>
              {flight.destinationCode || flight.destination.substring(0, 3).toUpperCase()}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--vyomira-lavender)' }}>{flight.destination}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--vyomira-sky)', fontWeight: 600, display: 'block' }}>{flight.arrival}</span>
          </div>
        </div>
      </div>

      {/* STEP 1: TRAVEL CLASS SELECTION CARDS */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.35rem', color: '#fff', margin: '0 0 4px 0' }}>
            Step 1: Choose Your Travel Class
          </h3>
          <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.88rem', margin: 0 }}>
            Select your preferred cabin tier. Every ticket is subject to authoritative backend pricing verification.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {CLASS_CONFIGS.map(cls => {
            const Icon = cls.icon;
            const fare = getClassFare(cls.name);
            const isSelected = selectedClass === cls.name;

            return (
              <div
                key={cls.name}
                id={`class-card-${cls.name.toLowerCase().replace(' ', '-')}`}
                onClick={() => handleClassChange(cls.name)}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${cls.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(16, 42, 102, 0.65)' : 'rgba(15, 23, 42, 0.5)',
                  boxShadow: isSelected ? `0 8px 24px ${cls.color}35` : 'none',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
              >
                {isSelected && (
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: cls.color,
                    color: '#fff',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    ✓
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `${cls.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} color={cls.color} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>{cls.name}</h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--vyomira-lavender)' }}>{cls.tagline}</span>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--vyomira-lavender)', display: 'block', textTransform: 'uppercase' }}>
                    Authoritative Fare
                  </span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800, color: cls.color }}>
                    ₹{fare.toLocaleString('en-IN')}
                  </span>
                </div>

                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {cls.perks.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Step 2 (Seat Map) & Step 3 (Passenger Form + Summary) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
        
        {/* Left Column: Interactive Cabin Seat Map */}
        <div>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 2px 0' }}>
                  Step 2: Select Your Seat
                </h3>
                <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.82rem', margin: 0 }}>
                  Showing cabin section for <strong>{selectedClass}</strong> (Seats {startSeatForClass}-{endSeatForClass})
                </p>
              </div>
              <span className="badge badge-primary">
                {totalSeats - occupiedSeatNumbers.size} Available
              </span>
            </div>

            {/* Seat Legend */}
            <div style={{
              display: 'flex',
              gap: 14,
              fontSize: '0.78rem',
              color: 'var(--vyomira-lavender)',
              marginBottom: 20,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(56, 169, 245, 0.2)', border: '1px solid rgba(56, 169, 245, 0.4)' }} />
                <span>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: '#38A9F5', boxShadow: '0 0 8px rgba(56,169,245,0.8)' }} />
                <span>Selected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)' }} />
                <span>Occupied</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(255, 255, 255, 0.04)', border: '1px dashed rgba(255, 255, 255, 0.2)' }} />
                <span>Other Class</span>
              </div>
            </div>

            {/* Airplane Fuselage Graphic */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '2px solid rgba(56, 169, 245, 0.2)',
              borderRadius: 36,
              padding: '28px 16px',
              textAlign: 'center',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Cockpit Nose */}
              <div style={{
                width: 64,
                height: 22,
                borderTop: '3px solid rgba(56, 169, 245, 0.6)',
                borderRadius: '50% 50% 0 0',
                margin: '0 auto 20px auto'
              }} />

              {/* Rows of 6 seats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: Math.ceil(totalSeats / 6) }, (_, rowIndex) => {
                  const rowNum = rowIndex + 1;
                  const leftSeats = [1, 2, 3].map(n => rowIndex * 6 + n).filter(n => n <= totalSeats);
                  const rightSeats = [4, 5, 6].map(n => rowIndex * 6 + n).filter(n => n <= totalSeats);

                  // Determine which class this row belongs to
                  let rowClass = 'Economy';
                  if (rowNum === 1) rowClass = 'First Class';
                  else if (rowNum <= 3) rowClass = 'Business Class';
                  else if (rowNum <= 5) rowClass = 'Premium Economy';

                  const isRowActiveForClass = rowClass === selectedClass;

                  return (
                    <div key={rowIndex} style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      opacity: isRowActiveForClass ? 1 : 0.45,
                      transition: 'opacity 0.2s ease'
                    }}>
                      {/* Left 3 seats */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {leftSeats.map(seatNum => {
                          const isOccupied = occupiedSeatNumbers.has(seatNum);
                          const isSelected = selectedSeat === seatNum;
                          const isInClass = seatNum >= startSeatForClass && seatNum <= endSeatForClass;

                          return (
                            <button
                              key={seatNum}
                              type="button"
                              id={`seat-btn-${seatNum}`}
                              disabled={isOccupied || !isInClass}
                              onClick={() => setSelectedSeat(seatNum)}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                border: isSelected
                                  ? '2px solid #FFFFFF'
                                  : isOccupied
                                  ? '1px solid rgba(239, 68, 68, 0.4)'
                                  : isInClass
                                  ? '1px solid rgba(56, 169, 245, 0.4)'
                                  : '1px dashed rgba(255, 255, 255, 0.15)',
                                background: isSelected
                                  ? '#38A9F5'
                                  : isOccupied
                                  ? 'rgba(239, 68, 68, 0.25)'
                                  : isInClass
                                  ? 'rgba(56, 169, 245, 0.12)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                color: isSelected
                                  ? '#FFFFFF'
                                  : isOccupied
                                  ? '#fca5a5'
                                  : isInClass
                                  ? '#FFFFFF'
                                  : 'var(--text-muted)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: (isOccupied || !isInClass) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 0 14px rgba(56, 169, 245, 0.8)' : 'none'
                              }}
                              title={
                                isOccupied
                                  ? `Seat ${seatNum} is booked`
                                  : !isInClass
                                  ? `Seat ${seatNum} belongs to ${rowClass}`
                                  : `Seat ${seatNum} (${selectedClass})`
                              }
                            >
                              {seatNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Aisle label */}
                      <div style={{ width: 28, fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', userSelect: 'none' }}>
                        R{rowNum}
                      </div>

                      {/* Right 3 seats */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {rightSeats.map(seatNum => {
                          const isOccupied = occupiedSeatNumbers.has(seatNum);
                          const isSelected = selectedSeat === seatNum;
                          const isInClass = seatNum >= startSeatForClass && seatNum <= endSeatForClass;

                          return (
                            <button
                              key={seatNum}
                              type="button"
                              id={`seat-btn-${seatNum}`}
                              disabled={isOccupied || !isInClass}
                              onClick={() => setSelectedSeat(seatNum)}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                border: isSelected
                                  ? '2px solid #FFFFFF'
                                  : isOccupied
                                  ? '1px solid rgba(239, 68, 68, 0.4)'
                                  : isInClass
                                  ? '1px solid rgba(56, 169, 245, 0.4)'
                                  : '1px dashed rgba(255, 255, 255, 0.15)',
                                background: isSelected
                                  ? '#38A9F5'
                                  : isOccupied
                                  ? 'rgba(239, 68, 68, 0.25)'
                                  : isInClass
                                  ? 'rgba(56, 169, 245, 0.12)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                color: isSelected
                                  ? '#FFFFFF'
                                  : isOccupied
                                  ? '#fca5a5'
                                  : isInClass
                                  ? '#FFFFFF'
                                  : 'var(--text-muted)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: (isOccupied || !isInClass) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 0 14px rgba(56, 169, 245, 0.8)' : 'none'
                              }}
                              title={
                                isOccupied
                                  ? `Seat ${seatNum} is booked`
                                  : !isInClass
                                  ? `Seat ${seatNum} belongs to ${rowClass}`
                                  : `Seat ${seatNum} (${selectedClass})`
                              }
                            >
                              {seatNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Step 3 (Passenger Information & Live Order Summary) */}
        <div>
          <div className="glass-panel" style={{ padding: 26, borderRadius: 20 }}>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: 4 }}>
              Step 3: Passenger Details & Summary
            </h3>
            <p style={{ color: 'var(--vyomira-lavender)', fontSize: '0.84rem', marginBottom: 20 }}>
              Enter ticket holder details. Official e-ticket will be issued upon confirmation.
            </p>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontSize: '0.84rem', color: 'var(--vyomira-lavender)' }}>
                  Passenger Full Name *
                </label>
                <input
                  type="text"
                  id="passenger-name-input"
                  required
                  className="form-control"
                  placeholder="e.g. Akshay Reddy"
                  value={passengerForm.name}
                  onChange={(e) => setPassengerForm({ ...passengerForm, name: e.target.value })}
                  style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.84rem', color: 'var(--vyomira-lavender)' }}>
                    Age *
                  </label>
                  <input
                    type="number"
                    id="passenger-age-input"
                    required
                    min={1}
                    max={120}
                    className="form-control"
                    value={passengerForm.age}
                    onChange={(e) => setPassengerForm({ ...passengerForm, age: Number(e.target.value) })}
                    style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.84rem', color: 'var(--vyomira-lavender)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="passenger-phone-input"
                    className="form-control"
                    placeholder="9876543210"
                    value={passengerForm.phone}
                    onChange={(e) => setPassengerForm({ ...passengerForm, phone: e.target.value })}
                    style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontSize: '0.84rem', color: 'var(--vyomira-lavender)' }}>
                  Email Address (for Boarding Pass)
                </label>
                <input
                  type="email"
                  id="passenger-email-input"
                  className="form-control"
                  placeholder="passenger@example.com"
                  value={passengerForm.email}
                  onChange={(e) => setPassengerForm({ ...passengerForm, email: e.target.value })}
                  style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                />
              </div>

              {/* Special Services Add-ons */}
              <div style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                marginBottom: 20,
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--vyomira-lavender)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                  Special Services & Add-ons
                </span>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    id="chk-wheelchair"
                    checked={passengerForm.wheelchair}
                    onChange={(e) => setPassengerForm({ ...passengerForm, wheelchair: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#38A9F5' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HeartHandshake size={16} color="#7054D8" />
                    <span>Wheelchair / Mobility Assistance Required</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    id="chk-food-service"
                    checked={passengerForm.foodService}
                    onChange={(e) => setPassengerForm({ ...passengerForm, foodService: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#38A9F5' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UtensilsCrossed size={16} color="#38A9F5" />
                    <span>Complimentary In-Flight Meal Service</span>
                  </div>
                </label>
              </div>

              {/* Authoritative Live Booking Summary */}
              <div style={{
                padding: '18px',
                background: 'rgba(16, 42, 102, 0.5)',
                borderRadius: 14,
                marginBottom: 20,
                border: '1px solid rgba(56, 169, 245, 0.25)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--vyomira-lavender)' }}>Selected Class:</span>
                  <strong style={{ color: '#fff' }}>{selectedClass}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--vyomira-lavender)' }}>Selected Seat:</span>
                  <strong style={{ color: selectedSeat ? '#38A9F5' : '#ef4444' }}>
                    {selectedSeat ? `Seat #${selectedSeat}` : 'None Selected'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--vyomira-lavender)' }}>Flight Carrier:</span>
                  <strong style={{ color: '#fff' }}>{flight.company} ({flight.flightNumber || `VY-${flight.flightId}`})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '1.05rem' }}>
                  <span style={{ fontWeight: 700, color: '#fff' }}>Total Fare (INR):</span>
                  <strong style={{ fontSize: '1.35rem', color: 'var(--vyomira-sky)', fontWeight: 800 }}>
                    ₹{activeFare.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Booking Submission Button */}
              <button
                type="submit"
                id="btn-confirm-booking"
                disabled={submitting || !selectedSeat}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1.05rem',
                  background: 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)',
                  boxShadow: '0 6px 20px rgba(56, 169, 245, 0.4)'
                }}
              >
                {submitting ? 'Confirming with Airline Engine...' : `Confirm & Issue Ticket (₹${activeFare.toLocaleString('en-IN')})`}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
