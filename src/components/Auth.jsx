import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

// Google "G" logo SVG
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Auth() {
  const { login, loginWithGoogle, registerUser } = useDatabase();

  const [isLogin, setIsLogin] = useState(true);
  const isSupabaseLive = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const [success, setSuccess] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password || (!isLogin && !name)) { setError('Please fill in all required fields.'); return; }
    setLoading(true);
    try {
      if (isLogin) { 
        await login(email, password); 
      } else { 
        const result = await registerUser(email, name, password); 
        if (result && result.requiresConfirmation) {
          setSuccess('Account registered successfully! A confirmation link has been sent to your email address. Please check your inbox and verify your email before logging in.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      console.error('[Learnopia Auth Error]', err);
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || 'An unexpected authentication error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth — fetches userinfo from Google using the access token
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const profile = await res.json();
      await loginWithGoogle({
        name: profile.name,
        email: profile.email,
        picture: profile.picture
      });
    } catch (err) {
      setError('Google Sign-In failed: ' + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-In was cancelled or failed.')
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.card} className="glass-panel">

        {/* Logo Brand */}
        <div style={styles.brand}>
          <div style={styles.logoCircle}>
            <GraduationCap size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: '12px 0 4px 0' }}>Learn-o-pia</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '14px' }}>
            {isLogin ? 'Sign in to access courses and resources' : 'Register a new learning account'}
          </p>
          <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, background: isSupabaseLive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: isSupabaseLive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.25)', color: isSupabaseLive ? '#10b981' : '#f59e0b' }}>
            {isSupabaseLive ? '● Connected to Supabase' : '○ Local Mock Storage'}
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, borderBottomColor: isLogin ? 'var(--primary)' : 'transparent', color: isLogin ? '#ffffff' : 'var(--text-muted)' }}
            onClick={() => { setIsLogin(true); setError(null); }}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, borderBottomColor: !isLogin ? 'var(--primary)' : 'transparent', color: !isLogin ? '#ffffff' : 'var(--text-muted)' }}
            onClick={() => { setIsLogin(false); setError(null); }}
          >
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div style={styles.successAlert}>
            <CheckCircle size={14} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* ── Google Sign-In Button (always visible) ── */}
        <button
          type="button"
          onClick={async () => {
            const isSupabaseLive = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (isSupabaseLive) {
              setGoogleLoading(true);
              try {
                await loginWithGoogle();
              } catch (err) {
                setError('Google redirect failed: ' + err.message);
                setGoogleLoading(false);
              }
            } else {
              if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
                setError('Google Sign-In needs setup. Add VITE_GOOGLE_CLIENT_ID to your .env file.');
                return;
              }
              googleLogin();
            }
          }}
          disabled={googleLoading}
          style={styles.googleBtn}
        >
          {googleLoading ? (
            <span style={styles.spinner} />
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or sign in with email</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. John Doe"
                  style={{ paddingLeft: '42px' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="student@university.edu"
                style={{ paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? <span style={styles.spinner} /> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)', padding: '20px'
  },
  card: {
    width: '100%', maxWidth: '440px', padding: '36px',
    borderRadius: '20px', display: 'flex', flexDirection: 'column'
  },
  brand: { textAlign: 'center', marginBottom: '24px' },
  logoCircle: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
  },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' },
  tab: {
    flex: 1, padding: '12px', background: 'transparent', border: 'none',
    borderBottom: '2px solid transparent', cursor: 'pointer',
    fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s'
  },
  errorAlert: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '10px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px',
    lineHeight: '1.4', textAlign: 'left'
  },
  successAlert: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px',
    background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '10px', color: '#a7f3d0', fontSize: '0.85rem', marginBottom: '16px',
    lineHeight: '1.4', textAlign: 'left'
  },
  googleBtn: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    transition: 'all 0.2s', marginBottom: '4px'
  },
  googleSetupNote: {
    padding: '10px 14px', background: 'rgba(139,92,246,0.06)',
    border: '1px dashed rgba(139,92,246,0.25)', borderRadius: '10px',
    marginBottom: '4px', textAlign: 'center'
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0 12px 0'
  },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' },
  dividerText: { fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  form: { display: 'flex', flexDirection: 'column', gap: '4px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' },
  eyeBtn: {
    position: 'absolute', right: '12px', background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  quickFillContainer: { marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' },
  quickFillGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  quickFillBtn: {
    padding: '8px 4px', fontSize: '0.75rem', borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
    textAlign: 'center', fontFamily: 'var(--font-heading)'
  },
  spinner: {
    display: 'inline-block', width: '18px', height: '18px',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
  }
};
