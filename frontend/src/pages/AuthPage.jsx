import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Compass,
  Plane
} from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Login form state
  const [loginForm, setLoginForm] = useState({
    login: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    age: 28,
    phone: '',
    wheelchair: false,
    foodService: false
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(loginForm);
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from === '/auth' ? '/' : from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!registerForm.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await register(registerForm);
      setSuccess('Account created successfully! Welcome to VYOMIRA.');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Username or email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (role) => {
    setError('');
    setIsLogin(true);
    if (role === 'admin') {
      setLoginForm({ login: 'admin@airline.com', password: 'AdminPassword@123' });
    } else {
      setLoginForm({ login: 'passenger@vyomira.in', password: 'Pass@123' });
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 16px',
      overflow: 'hidden'
    }}>
      {/* Background Animated Sky Canvas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 10%, rgba(56, 169, 245, 0.18) 0%, rgba(16, 42, 102, 0.28) 50%, transparent 80%)'
      }}>
        {/* Floating Clouds Layer 1 */}
        <svg
          className="animated-cloud-slow"
          style={{ position: 'absolute', top: '12%', left: '8%', width: 280, opacity: 0.22 }}
          viewBox="0 0 100 40"
          fill="none"
        >
          <path d="M20 30h60a12 12 0 0 0 0-24 18 18 0 0 0-34-4 14 14 0 0 0-26 12 10 10 0 0 0 0 16z" fill="#38A9F5" />
        </svg>

        {/* Floating Clouds Layer 2 */}
        <svg
          className="animated-cloud-medium"
          style={{ position: 'absolute', top: '28%', right: '10%', width: 340, opacity: 0.18 }}
          viewBox="0 0 100 40"
          fill="none"
        >
          <path d="M20 30h60a12 12 0 0 0 0-24 18 18 0 0 0-34-4 14 14 0 0 0-26 12 10 10 0 0 0 0 16z" fill="#7054D8" />
        </svg>

        {/* Smoothly Soaring Aircraft with Contrail */}
        <div
          className="animated-plane"
          style={{
            position: 'absolute',
            top: '22%',
            left: '12%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            filter: 'drop-shadow(0 4px 12px rgba(56, 169, 245, 0.6))'
          }}
        >
          <div style={{
            width: 70,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8))',
            borderRadius: 2
          }} />
          <Plane size={32} color="#FFFFFF" style={{ transform: 'rotate(25deg)' }} />
        </div>
      </div>

      {/* Main Glassmorphic Card */}
      <div
        className="glass-panel fade-in"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 480,
          padding: '36px 32px',
          borderRadius: '24px',
          background: 'rgba(16, 42, 102, 0.45)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 169, 245, 0.28)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 169, 245, 0.15)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 24px rgba(56, 169, 245, 0.35)',
            marginBottom: 12
          }}>
            <img
              src="/vyomira-logo.png"
              alt="VYOMIRA Logo"
              style={{ height: 48, width: 48, objectFit: 'contain' }}
            />
          </div>
          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            margin: '0 0 4px 0',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #38A9F5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            VYOMIRA
          </h1>
          <p style={{
            color: 'var(--vyomira-lavender)',
            fontSize: '0.9rem',
            fontWeight: 500,
            margin: 0,
            letterSpacing: '0.04em'
          }}>
            Connecting Earth and Sky.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: 24,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            id="tab-signin"
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: '9px',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              background: isLogin ? 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)' : 'transparent',
              color: isLogin ? '#FFFFFF' : 'var(--text-muted)',
              boxShadow: isLogin ? '0 4px 14px rgba(56, 169, 245, 0.4)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-register"
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: '9px',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              background: !isLogin ? 'linear-gradient(135deg, #7054D8 0%, #38A9F5 100%)' : 'transparent',
              color: !isLogin ? '#FFFFFF' : 'var(--text-muted)',
              boxShadow: !isLogin ? '0 4px 14px rgba(112, 84, 216, 0.4)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Form Content */}
        {isLogin ? (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--vyomira-lavender)' }}>
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="login-username-input"
                  required
                  className="form-control"
                  placeholder="admin@airline.com or passenger username"
                  value={loginForm.login}
                  onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                  style={{
                    paddingLeft: 38,
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderColor: 'rgba(56, 169, 245, 0.3)',
                    color: '#fff'
                  }}
                />
                <User size={18} color="#38A9F5" style={{ position: 'absolute', left: 12, top: 12 }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 22 }}>
              <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--vyomira-lavender)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  required
                  className="form-control"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{
                    paddingLeft: 38,
                    paddingRight: 40,
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderColor: 'rgba(56, 169, 245, 0.3)',
                    color: '#fff'
                  }}
                />
                <KeyRound size={18} color="#38A9F5" style={{ position: 'absolute', left: 12, top: 12 }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 10,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #102A66 0%, #38A9F5 100%)',
                boxShadow: '0 6px 20px rgba(56, 169, 245, 0.4)'
              }}
            >
              <LogIn size={18} />
              {loading ? 'Authenticating...' : 'Sign In to Vyomira'}
            </button>

            {/* Quick Demo Credentials Autofill */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p style={{
                fontSize: '0.74rem',
                color: 'var(--vyomira-lavender)',
                marginBottom: 10,
                textAlign: 'center',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                Quick Access Logins (One-Click Fill)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  id="btn-quick-admin"
                  onClick={() => fillQuickCredentials('admin')}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 10px',
                    borderColor: 'rgba(112, 84, 216, 0.4)'
                  }}
                >
                  <ShieldCheck size={14} color="#7054D8" />
                  Admin
                </button>
                <button
                  type="button"
                  id="btn-quick-passenger"
                  onClick={() => fillQuickCredentials('passenger')}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 10px',
                    borderColor: 'rgba(56, 169, 245, 0.4)'
                  }}
                >
                  <User size={14} color="#38A9F5" />
                  Passenger
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Create Account Form */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Rahul Sharma"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  style={{
                    paddingLeft: 36,
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderColor: 'rgba(112, 84, 216, 0.3)'
                  }}
                />
                <User size={16} color="#7054D8" style={{ position: 'absolute', left: 12, top: 12 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="rahuls"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
                  Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="9876543210"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    style={{ paddingLeft: 32, background: 'rgba(15, 23, 42, 0.65)' }}
                  />
                  <Phone size={14} color="#7054D8" style={{ position: 'absolute', left: 10, top: 13 }} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="rahul@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  style={{
                    paddingLeft: 36,
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderColor: 'rgba(112, 84, 216, 0.3)'
                  }}
                />
                <Mail size={16} color="#7054D8" style={{ position: 'absolute', left: 12, top: 12 }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
                Password (min. 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="form-control"
                  placeholder="Create a strong password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  style={{
                    paddingLeft: 36,
                    paddingRight: 40,
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderColor: 'rgba(112, 84, 216, 0.3)'
                  }}
                />
                <KeyRound size={16} color="#7054D8" style={{ position: 'absolute', left: 12, top: 12 }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 10,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--vyomira-lavender)' }}>
                  Age
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  className="form-control"
                  value={registerForm.age}
                  onChange={(e) => setRegisterForm({ ...registerForm, age: Number(e.target.value) })}
                  style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, paddingTop: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={registerForm.wheelchair}
                    onChange={(e) => setRegisterForm({ ...registerForm, wheelchair: e.target.checked })}
                    style={{ accentColor: '#38A9F5' }}
                  />
                  Wheelchair Assistance
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={registerForm.foodService}
                    onChange={(e) => setRegisterForm({ ...registerForm, foodService: e.target.checked })}
                    style={{ accentColor: '#38A9F5' }}
                  />
                  In-Flight Meal Service
                </label>
              </div>
            </div>

            <button
              type="submit"
              id="btn-register-submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #7054D8 0%, #38A9F5 100%)',
                boxShadow: '0 6px 20px rgba(112, 84, 216, 0.4)'
              }}
            >
              <UserPlus size={18} />
              {loading ? 'Creating Account...' : 'Complete Passenger Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
