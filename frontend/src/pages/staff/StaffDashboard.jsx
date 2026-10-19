import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  ClipboardList, 
  Plane, 
  Users, 
  HeartHandshake, 
  UtensilsCrossed, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Armchair, 
  RefreshCw,
  Search
} from 'lucide-react';

export const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [flights, setFlights] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [manifestData, setManifestData] = useState(null);
  const [wheelchairList, setWheelchairList] = useState([]);
  const [foodServiceList, setFoodServiceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStaffOverview();
  }, []);

  const loadStaffOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const [flightsData, assistanceData, foodData] = await Promise.all([
        api.staff.getFlights(),
        api.staff.getAssistanceList(),
        api.staff.getFoodServiceList()
      ]);
      setFlights(flightsData);
      setWheelchairList(assistanceData);
      setFoodServiceList(foodData);

      // Default select first flight for manifest if available
      if (flightsData.length > 0 && !selectedFlightId) {
        setSelectedFlightId(flightsData[0].flightId);
        loadManifest(flightsData[0].flightId);
      }
    } catch (err) {
      setError('Failed to load operational staff data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadManifest = async (flightId) => {
    setManifestLoading(true);
    try {
      const data = await api.staff.getManifest(flightId);
      setManifestData(data);
    } catch (err) {
      setError(`Failed to load manifest for Flight #${flightId}: ` + err.message);
    } finally {
      setManifestLoading(false);
    }
  };

  const handleSelectFlight = (flightId) => {
    setSelectedFlightId(flightId);
    loadManifest(flightId);
  };

  const handleMarkBoarded = async (bookingId, ticketNumber) => {
    setError('');
    setSuccess('');
    try {
      await api.checkin.boardPassenger(bookingId);
      setSuccess(`Ticket #${ticketNumber} has been boarded successfully.`);
      if (selectedFlightId) {
        loadManifest(selectedFlightId);
      }
      // Refresh summaries
      const [flightsData, assistanceData, foodData] = await Promise.all([
        api.staff.getFlights(),
        api.staff.getAssistanceList(),
        api.staff.getFoodServiceList()
      ]);
      setFlights(flightsData);
      setWheelchairList(assistanceData);
      setFoodServiceList(foodData);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 20px' }} className="fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#c084fc', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>
            <ClipboardList size={16} /> AIRLINE GROUND & CABIN STAFF PORTAL
          </div>
          <h1 style={{ fontSize: '2.2rem' }}>Airport Operations Console</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time flight boarding queues, passenger manifests, and special assistance management.</p>
        </div>
        <button onClick={loadStaffOverview} className="btn btn-secondary">
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 24, overflowX: 'auto' }}>
        {[
          { id: 'flights', label: `Scheduled Flights (${flights.length})`, icon: Plane },
          { id: 'manifest', label: 'Passenger Manifest', icon: Users },
          { id: 'assistance', label: `Wheelchair Requests (${wheelchairList.length})`, icon: HeartHandshake },
          { id: 'catering', label: `Meal Services (${foodServiceList.length})`, icon: UtensilsCrossed }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.88rem', padding: '8px 16px', whiteSpace: 'nowrap' }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px auto', animation: 'spin 0.8s linear infinite' }} />
          Loading airport operational data...
        </div>
      ) : (
        <>
          {/* ==================================================== */}
          {/* TAB 1: SCHEDULED FLIGHTS                             */}
          {/* ==================================================== */}
          {activeTab === 'flights' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {flights.map(f => (
                  <div key={f._id} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-primary">Flight #{f.flightId}</span>
                      <div style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.2)', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, color: '#a5b4fc' }}>
                        GATE {f.gateNumber}
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: 2 }}>{f.company}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{f.source} ➔ {f.destination}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'rgba(15,23,42,0.5)', padding: 12, borderRadius: 10, fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Departure:</span>
                        <p style={{ fontWeight: 700 }}>{f.departure}</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Arrival:</span>
                        <p style={{ fontWeight: 700 }}>{f.arrival}</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Booked / Total:</span>
                        <p style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{f.bookedSeats} / {f.totalSeats}</p>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Boarded:</span>
                        <p style={{ fontWeight: 700, color: '#f59e0b' }}>{f.boardedSeats}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, fontSize: '0.78rem' }}>
                      {f.wheelchairRequests > 0 && (
                        <span className="badge badge-boarded" style={{ padding: '4px 8px' }}>
                          <HeartHandshake size={12} /> {f.wheelchairRequests} Wheelchair
                        </span>
                      )}
                      {f.foodRequests > 0 && (
                        <span className="badge badge-primary" style={{ padding: '4px 8px' }}>
                          <UtensilsCrossed size={12} /> {f.foodRequests} Meals
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        handleSelectFlight(f.flightId);
                        setActiveTab('manifest');
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <Users size={15} /> View Flight Manifest
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PASSENGER MANIFEST                           */}
          {/* ==================================================== */}
          {activeTab === 'manifest' && (
            <div className="fade-in">
              {/* Flight selector bar */}
              <div className="glass-panel" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Plane size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 700 }}>Select Flight:</span>
                  <select
                    className="form-control"
                    value={selectedFlightId || ''}
                    onChange={(e) => handleSelectFlight(Number(e.target.value))}
                    style={{ width: 'auto', minWidth: 200 }}
                  >
                    {flights.map(f => (
                      <option key={f.flightId} value={f.flightId}>
                        Flight #{f.flightId} ({f.company}: {f.source} ➔ {f.destination})
                      </option>
                    ))}
                  </select>
                </div>

                {manifestData && (
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.88rem' }}>
                    <span>Gate: <strong style={{ color: 'var(--accent-cyan)' }}>{manifestData.gateNumber}</strong></span>
                    <span>Total Booked: <strong style={{ color: '#fff' }}>{manifestData.totalBookings}</strong></span>
                  </div>
                )}
              </div>

              {manifestLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  Loading manifest...
                </div>
              ) : !manifestData || manifestData.manifest.length === 0 ? (
                <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
                  <Users size={44} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: 12 }} />
                  <h3>No passengers booked on this flight yet</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>All {flights.find(f => f.flightId === selectedFlightId)?.totalSeats || 60} seats are currently available.</p>
                </div>
              ) : (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                  <div className="table-container">
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th>Seat</th>
                          <th>Ticket #</th>
                          <th>Passenger Name</th>
                          <th>Age</th>
                          <th>Assistance Required</th>
                          <th>Catering</th>
                          <th>Status</th>
                          <th>Operational Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manifestData.manifest.map(m => (
                          <tr key={m._id}>
                            <td><strong style={{ color: 'var(--accent-purple)', fontSize: '1rem' }}>Seat #{m.seatNumber}</strong></td>
                            <td><strong style={{ color: 'var(--accent-cyan)' }}>#{m.ticketNumber}</strong></td>
                            <td><strong>{m.passenger?.name || 'Passenger'}</strong></td>
                            <td>{m.passenger?.age || '—'}</td>
                            <td>
                              {m.wheelchair ? (
                                <span className="badge badge-boarded" style={{ fontSize: '0.7rem' }}>
                                  <HeartHandshake size={12} /> Wheelchair
                                </span>
                              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td>
                              {m.foodService ? (
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                  <UtensilsCrossed size={12} /> Meal
                                </span>
                              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td>
                              <span className={`badge ${m.status === 'CONFIRMED' ? 'badge-confirmed' : m.status === 'BOARDED' ? 'badge-boarded' : 'badge-cancelled'}`}>
                                {m.status}
                              </span>
                            </td>
                            <td>
                              {m.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleMarkBoarded(m._id, m.ticketNumber)}
                                  className="btn btn-success"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                >
                                  <CheckCircle2 size={13} /> Mark Boarded
                                </button>
                              )}
                              {m.status === 'BOARDED' && (
                                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>✓ On Board</span>
                              )}
                              {m.status === 'CANCELLED' && (
                                <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Released</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: WHEELCHAIR ASSISTANCE QUEUE                   */}
          {/* ==================================================== */}
          {activeTab === 'assistance' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3>Wheelchair & Mobility Assistance Priority Queue</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Passengers requiring escort to boarding gates and aircraft cabin.</p>
                </div>
                <span className="badge badge-boarded" style={{ padding: '6px 12px' }}>
                  {wheelchairList.length} Active Requests
                </span>
              </div>

              {wheelchairList.length === 0 ? (
                <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
                  <HeartHandshake size={48} color="#10b981" style={{ marginBottom: 12, opacity: 0.7 }} />
                  <h3>No pending wheelchair assistance requests</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>All current active bookings are standard mobility.</p>
                </div>
              ) : (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                  <div className="table-container">
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th>Passenger Name</th>
                          <th>Flight #</th>
                          <th>Seat</th>
                          <th>Gate</th>
                          <th>Ticket #</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wheelchairList.map(w => (
                          <tr key={w._id}>
                            <td><strong>{w.passenger?.name || 'Passenger'}</strong></td>
                            <td>Flight #{w.flightId}</td>
                            <td>Seat #{w.seatNumber}</td>
                            <td>Gate {w.gateNumber}</td>
                            <td>#{w.ticketNumber}</td>
                            <td>
                              <span className={`badge ${w.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-boarded'}`}>
                                {w.status}
                              </span>
                            </td>
                            <td>
                              {w.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleMarkBoarded(w._id, w.ticketNumber)}
                                  className="btn btn-success"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                >
                                  <CheckCircle2 size={13} /> Mark Boarded
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: FOOD SERVICE & CATERING                       */}
          {/* ==================================================== */}
          {activeTab === 'catering' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3>In-Flight Catering & Meal Service Summary</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Confirmed meal requests for galley prep and cabin service.</p>
                </div>
                <span className="badge badge-primary" style={{ padding: '6px 12px' }}>
                  {foodServiceList.length} Meals Requested
                </span>
              </div>

              {foodServiceList.length === 0 ? (
                <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
                  <UtensilsCrossed size={48} color="var(--primary)" style={{ marginBottom: 12, opacity: 0.7 }} />
                  <h3>No special meal requests</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>No passengers have selected complimentary in-flight meals yet.</p>
                </div>
              ) : (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                  <div className="table-container">
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th>Passenger Name</th>
                          <th>Flight #</th>
                          <th>Seat</th>
                          <th>Gate</th>
                          <th>Ticket #</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foodServiceList.map(f => (
                          <tr key={f._id}>
                            <td><strong>{f.passenger?.name || 'Passenger'}</strong></td>
                            <td>Flight #{f.flightId}</td>
                            <td>Seat #{f.seatNumber}</td>
                            <td>Gate {f.gateNumber}</td>
                            <td>#{f.ticketNumber}</td>
                            <td>
                              <span className={`badge ${f.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-boarded'}`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
};
