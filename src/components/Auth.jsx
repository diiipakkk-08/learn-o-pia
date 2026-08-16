import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle, KeyRound, ArrowLeft } from 'lucide-react';

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

export default function Auth({ setCurrentView }) {
  const { login, loginWithGoogle, registerUser, resetPasswordByEmail } = useDatabase();

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

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Enter email, 2: Set new password

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password || (!isLogin && !name)) { setError('Please fill in all required fields.'); return; }
    setLoading(true);
    try {
      if (isLogin) { 
        await login(email, password); 
        if (setCurrentView) setCurrentView('learning');
      } else { 
        const result = await registerUser(email, name, password); 
        if (result && result.requiresConfirmation) {
          setSuccess('Account registered successfully! A confirmation link has been sent to your email address. Please check your inbox and verify your email before logging in.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
        } else {
          if (setCurrentView) setCurrentView('learning');
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

  // Google OAuth
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
      if (setCurrentView) setCurrentView('learning');
    } catch (err) {
      console.error('[Google OAuth Error]', err);
      setError('Google Sign-In failed. Please try again or use standard email login.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLoginTrigger = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-In was cancelled or failed.')
  });

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (resetStep === 1) {
      if (!forgotInput.trim()) {
        setForgotError('Please enter your email address or username.');
        return;
      }
      setResetStep(2);
      return;
    }

    if (!newResetPassword || newResetPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    const res = await resetPasswordByEmail(forgotInput, newResetPassword);
    if (res.success) {
      setForgotSuccess(`Password reset successfully for ${res.email}! You can now log in.`);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetStep(1);
        setForgotInput('');
        setNewResetPassword('');
        setConfirmResetPassword('');
      }, 2500);
    } else {
      setForgotError(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass-panel animate-fade-in">
        <div style={styles.header}>
          <div style={styles.logoIcon}>
            <GraduationCap size={32} color="#ffffff" />
          </div>
          <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={styles.subtitle}>
            {isLogin ? 'Enter credentials or sign in with Google' : 'Join Learn-o-pia digital learning platform'}
          </p>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successBanner}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* 1-Click OneTap Google Authentication */}
        <button
          type="button"
          onClick={() => googleLoginTrigger()}
          disabled={googleLoading}
          style={styles.googleBtn}
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Connecting Google Account…' : isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>OR WITH EMAIL</span>
          <div style={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="e.g. Alex Carter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address or Username</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="you@example.com or @username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setResetStep(1);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={styles.submitBtn}
          >
            {loading ? 'Processing…' : isLogin ? 'Sign In Account' : 'Register Account'}
          </button>
        </form>

        <div style={styles.toggleRow}>
          <span>{isLogin ? "Don't have an account?" : 'Already registered?'}</span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            style={styles.toggleBtn}
          >
            {isLogin ? 'Create one now' : 'Sign in here'}
          </button>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox} className="glass-panel animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} color="var(--primary)" /> Reset Password
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {forgotError && (
              <div style={styles.errorBanner}>
                <AlertCircle size={15} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div style={styles.successBanner}>
                <CheckCircle size={15} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              {resetStep === 1 ? (
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Enter Email Address or Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. learner@learnopia.edu or @alex_carter"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Enter your account email or unique handle to verify and set a new password.
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Account Identified: {forgotInput}</label>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="At least 6 characters"
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Re-enter new password"
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                {resetStep === 2 ? (
                  <button type="button" className="btn btn-secondary" onClick={() => setResetStep(1)}>
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <div />
                )}
                <button type="submit" className="btn btn-primary">
                  {resetStep === 1 ? 'Verify Account' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 140px)',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '6px'
  },
  errorBanner: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    fontSize: '0.83rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'left'
  },
  successBanner: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '0.83rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'left'
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '11px 16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)'
  },
  dividerText: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 700,
    letterSpacing: '0.08em'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)'
  },
  input: {
    width: '100%',
    padding: '11px 14px 11px 42px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box'
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginTop: '6px'
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '0.83rem',
    color: 'var(--text-secondary)'
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'var(--font-body)',
    fontSize: '0.83rem'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalBox: {
    width: '100%',
    maxWidth: '440px',
    padding: '24px'
  }
};
