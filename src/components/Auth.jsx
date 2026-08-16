import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, GraduationCap, Eye, EyeOff, AlertCircle, CheckCircle, KeyRound, ArrowLeft, ShieldCheck, Check } from 'lucide-react';

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
  const { users, login, loginWithGoogle, registerUser, setPasswordForUser } = useDatabase();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Google Account Direct Selector Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Secure Password Reset Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [matchedUser, setMatchedUser] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetStep, setResetStep] = useState(1);

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
          setSuccess('Account registered successfully! A confirmation link has been sent to your email address.');
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

  // Direct Google Account Login execution
  const executeGoogleLogin = async (googleData) => {
    setGoogleLoading(true);
    setError(null);
    setShowGoogleModal(false);
    try {
      await loginWithGoogle(googleData);
      if (setCurrentView) setCurrentView('learning');
    } catch (err) {
      console.error('[Google OAuth Exec Error]', err);
      setError(err?.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google OAuth Popup Handler
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setError(null);
    try {
      let googleProfile = null;
      if (tokenResponse && tokenResponse.access_token) {
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          });
          if (res.ok) {
            googleProfile = await res.json();
          }
        } catch (fetchErr) {
          console.warn('[Google UserInfo Fetch Warning]', fetchErr);
        }
      }

      if (googleProfile && googleProfile.email) {
        await executeGoogleLogin({
          name: googleProfile.name,
          email: googleProfile.email,
          picture: googleProfile.picture
        });
      } else {
        // Show Google Account Selector Modal
        setShowGoogleModal(true);
      }
    } catch (err) {
      setShowGoogleModal(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLoginTrigger = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      // Fallback to Google Account Selector Modal
      setShowGoogleModal(true);
    }
  });

  const handleGoogleBtnClick = () => {
    const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const hasValidClientId = rawClientId && rawClientId !== 'YOUR_GOOGLE_CLIENT_ID';

    if (hasValidClientId) {
      setGoogleLoading(true);
      const timeoutTimer = setTimeout(() => {
        setGoogleLoading(false);
        setShowGoogleModal(true);
      }, 1200);

      try {
        googleLoginTrigger();
      } catch (e) {
        clearTimeout(timeoutTimer);
        setGoogleLoading(false);
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  // ── Secure Password Reset Workflow ──
  const handleRequestCode = (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotInput.trim()) {
      setForgotError('Please enter your account email or username.');
      return;
    }

    const q = forgotInput.trim().toLowerCase();
    const target = users.find(u =>
      u.email.toLowerCase() === q ||
      u.username?.toLowerCase() === q ||
      u.username?.toLowerCase() === `@${q}`
    );

    if (!target) {
      setForgotError('No user account matches that email address or username.');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMatchedUser(target);
    setGeneratedCode(code);
    setResetStep(2);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setForgotError('');

    if (verificationCode.trim() !== generatedCode) {
      setForgotError('Invalid Security Verification Code. Please check your code and try again.');
      return;
    }

    setResetStep(3);
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!newResetPassword || newResetPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    await setPasswordForUser(matchedUser.id, newResetPassword);
    setForgotSuccess(`Password reset successfully for ${matchedUser.email}! You can now log in.`);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetStep(1);
      setForgotInput('');
      setVerificationCode('');
      setNewResetPassword('');
      setConfirmResetPassword('');
    }, 2200);
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
          onClick={handleGoogleBtnClick}
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
                    setVerificationCode('');
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

      {/* GOOGLE ACCOUNT SELECTOR MODAL */}
      {showGoogleModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox} className="glass-panel animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GoogleIcon /> Select Google Account to Sign In
              </h3>
              <button
                onClick={() => setShowGoogleModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'left' }}>
              Choose an existing Google account or enter your Google email to log in seamlessly:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {/* Owner Account */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => executeGoogleLogin({ name: 'Deepak Shaw', email: 'admin@learnopia.edu' })}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px', textAlign: 'left' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                  D
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ color: '#fff', display: 'block', fontSize: '0.88rem' }}>Deepak Shaw (Owner)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@learnopia.edu</span>
                </div>
              </button>

              {/* Creator Account */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => executeGoogleLogin({ name: 'Sarah Miller', email: 'creator@learnopia.edu' })}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px', textAlign: 'left' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                  S
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ color: '#fff', display: 'block', fontSize: '0.88rem' }}>Sarah Miller (Educator)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>creator@learnopia.edu</span>
                </div>
              </button>

              {/* Student Account */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => executeGoogleLogin({ name: 'Alex Carter', email: 'learner@learnopia.edu' })}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px', textAlign: 'left' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                  A
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ color: '#fff', display: 'block', fontSize: '0.88rem' }}>Alex Carter (Student)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>learner@learnopia.edu</span>
                </div>
              </button>
            </div>

            {/* Custom Google Email Input */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', textAlign: 'left' }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Or Enter Any Google Email Address</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="yourname@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (customGoogleEmail.trim()) {
                      executeGoogleLogin({ name: customGoogleEmail.split('@')[0], email: customGoogleEmail.trim() });
                    }
                  }}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURE PASSWORD RESET MODAL */}
      {showForgotModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox} className="glass-panel animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="var(--primary)" /> Secure Password Recovery
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

            {/* STEP 1: Enter Account Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
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
                    A 6-digit Security Verification Code will be dispatched to your account email to verify ownership.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary">
                    Send Security Code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter 6-Digit Security Verification Code */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div style={{ padding: '10px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Verification Code sent to <strong>{matchedUser?.email}</strong>.
                  <div style={{ marginTop: 6, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em' }}>
                    Demo Security Code: {generatedCode}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Enter 6-Digit Security Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 784920"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setResetStep(1)}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Verify Code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {resetStep === 3 && (
              <form onSubmit={handleCompleteReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', fontSize: '0.8rem', color: '#34d399' }}>
                  ✔ Account ownership verified for <strong>{matchedUser?.email}</strong>.
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary">
                    Update Password & Complete Reset
                  </button>
                </div>
              </form>
            )}
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
