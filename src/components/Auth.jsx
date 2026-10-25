import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, X, Sparkles, ShieldCheck, RotateCw } from 'lucide-react';
import TermsModal from './TermsModal';
import { getRandomCuratedQuote, fetchRandomStudentQuote } from '../utils/studentQuotes';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const formatAuthError = (err) => {
  if (!err) return 'An unexpected authentication error occurred.';
  if (typeof err === 'string') {
    const lower = err.toLowerCase();
    if (lower.includes('suspended')) {
      return 'Your account is suspended. Please contact the administrator.';
    }
    if (lower.includes('not registered') || lower.includes('user not found') || lower.includes('no user matching') || lower.includes('email not registered')) {
      return 'This email is not registered. Please create an account first.';
    }
    if (lower.includes('already exists') || lower.includes('already registered') || lower.includes('user already exists')) {
      return 'This email address already exists. Please sign in instead.';
    }
    if (lower.includes('incorrect password') || lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'Incorrect password. Please verify your password or use forgot password.';
    }
    return err;
  }
  const msg = (err.message || err.error_description || err.msg || err.details || '').trim();
  const lower = msg.toLowerCase();

  if (lower.includes('suspended')) {
    return 'Your account is suspended. Please contact the administrator.';
  }
  if (lower.includes('not registered') || lower.includes('user not found') || lower.includes('no user matching') || lower.includes('email not registered')) {
    return 'This email is not registered. Please create an account first.';
  }
  if (lower.includes('already exists') || lower.includes('already registered') || lower.includes('user already exists')) {
    return 'This email address already exists. Please sign in instead.';
  }
  if (lower.includes('incorrect password') || lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect password. Please verify your password or use forgot password.';
  }
  if (msg && msg !== '{}') return msg;
  return 'Authentication failed. Please check your credentials or network connection.';
};

export default function Auth({ setCurrentView }) {
  const { users, login, loginAsGuest, loginWithGoogle, registerUser, setPasswordForUser, isSupabaseLive } = useDatabase();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Guest / Recruiter Mode State
  const [showGuestModal, setShowGuestModal] = useState(false);

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

  // Terms & Conditions State
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const isDark = typeof document !== 'undefined' && (
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    document.body.classList.contains('cinema-mode') ||
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('learnopia_cinema_mode') === 'true'
  );

  // Tactile Student Motivational Quotes
  const [currentQuote, setCurrentQuote] = useState(() => getRandomCuratedQuote());
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchRandomStudentQuote().then((q) => {
      if (isMounted && q) setCurrentQuote(q);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Listen for external auth notices (e.g. account suspension on redirect) & read sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('learnopia_auth_notice');
      if (stored) {
        sessionStorage.removeItem('learnopia_auth_notice');
        const parsed = JSON.parse(stored);
        if (parsed?.message) {
          setError(parsed.message);
        }
      }
    } catch {}

    const handleAuthNotice = (e) => {
      if (e.detail?.message) {
        if (e.detail.type === 'success') {
          setSuccess(e.detail.message);
        } else {
          setError(e.detail.message);
        }
      }
    };
    window.addEventListener('learnopia_auth_notice', handleAuthNotice);
    return () => window.removeEventListener('learnopia_auth_notice', handleAuthNotice);
  }, []);

  // Auto-dismiss floating notifications after 5 seconds
  useEffect(() => {
    if (!error && !success) return;
    const timer = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);

  const handleCycleQuote = async () => {
    if (quoteLoading) return;
    setQuoteLoading(true);
    try {
      const fresh = await fetchRandomStudentQuote();
      setCurrentQuote(fresh);
    } catch {
      setCurrentQuote(getRandomCuratedQuote());
    } finally {
      setTimeout(() => setQuoteLoading(false), 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isLogin && !agreeTerms) {
      setError('You must accept the Terms of Service to register.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        if (setCurrentView) setCurrentView('my-learning');
      } else {
        const result = await registerUser(email, name, password);
        if (result && result.requiresConfirmation) {
          setSuccess('Account registered successfully! A confirmation link has been sent to your email.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
        } else {
          if (setCurrentView) setCurrentView('my-learning');
        }
      }
    } catch (err) {
      console.error('[Learnopia Auth Error]', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

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
      if (setCurrentView) setCurrentView('my-learning');
    } catch (err) {
      console.error('[Google OAuth Error]', err);
      setError(formatAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-In was cancelled or failed.')
  });

  const handleRequestCode = (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotInput.trim()) {
      setForgotError('Please enter your account email address.');
      return;
    }
    const q = forgotInput.trim().toLowerCase();
    const target = (users || []).find((u) => u.email.toLowerCase() === q);
    if (!target) {
      setForgotError('No user account matches that email address.');
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
      setForgotError('Invalid 6-digit verification code.');
      return;
    }
    setResetStep(3);
  };

  const handlePerformReset = (e) => {
    e.preventDefault();
    setForgotError('');
    if (!newResetPassword || newResetPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    if (setPasswordForUser && matchedUser) {
      setPasswordForUser(matchedUser.id, newResetPassword);
    }
    setForgotSuccess('Password updated successfully. You can now sign in.');
    setTimeout(() => {
      setShowForgotModal(false);
      setResetStep(1);
      setForgotInput('');
    }, 1800);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas text-text-primary flex flex-col lg:flex-row relative">
      {/* Floating Top Notification (Fixed overlay — zero layout shift, zero DOM height changes) */}
      {(error || success) && (
        <div
          role="alert"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[92%] sm:w-auto px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border transition-all pointer-events-auto ${
            error
              ? 'bg-red-50/95 dark:bg-[#251010]/95 border-red-300 dark:border-red-900/60 text-red-900 dark:text-red-200 shadow-red-500/10'
              : 'bg-emerald-50/95 dark:bg-[#0c2214]/95 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 shadow-emerald-500/10'
          }`}
        >
          {error ? (
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
          ) : (
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold leading-snug flex-1">
            {error || success}
          </span>
          <button
            type="button"
            onClick={() => { setError(null); setSuccess(null); }}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-current/60 hover:text-current transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* =========================================================================
          LEFT PANEL: Sleek Authentication Form (Full-width mobile, 45-50% desktop)
      ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between p-4 sm:p-6 lg:p-7 h-full bg-canvas">
        {/* Top Header: Logo & Return Action */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <img
              src={isDark ? '/learnopia-logo-dark-on.svg' : '/learnopia-logo-light-off.svg'}
              alt="Learnopia"
              className="w-7 h-7 object-contain shrink-0"
            />
            <span className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-text-primary">
              Learnopia
            </span>
          </div>

          <button
            onClick={() => setCurrentView && setCurrentView('landing')}
            className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Center Auth Card Box */}
        <div className="w-full max-w-md mx-auto my-auto space-y-3 sm:space-y-3.5">
          {/* Headline & Subhead */}
          <div className="space-y-1">
            <h1 className="font-editorial text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              {isLogin ? 'Sign in to workspace' : 'Create your student account'}
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              {isLogin
                ? 'Access your course syllabus, attendance ledger, and semester notes.'
                : 'Join peers and organize your entire academic schedule in one place.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-surface border border-border-subtle p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isLogin
                  ? 'bg-accent-ink text-text-on-dark shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-accent-ink text-text-on-dark shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Register Free
            </button>
          </div>

          {/* Quick Access Actions: Google OAuth & Guest Explorer */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setSuccess(null);
                setGoogleLoading(true);
                try {
                  if (isSupabaseLive) {
                    await loginWithGoogle();
                  } else {
                    googleLogin();
                  }
                } catch (err) {
                  console.error('[Google Login Error]', err);
                  setError(err?.message || 'Google Sign-In is unavailable. Please use email/password.');
                } finally {
                  setGoogleLoading(false);
                }
              }}
              disabled={googleLoading}
              className="w-full py-2 px-3 rounded-lg border border-border-strong bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <GoogleIcon />
              <span>{googleLoading ? 'Connecting...' : isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuestModal(true)}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-border-strong bg-surface hover:bg-surface-hover text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs group"
            >
              <Sparkles size={13} className="text-accent-forest group-hover:scale-110 transition-transform shrink-0" />
              <span>Explore as Guest / Recruiter (Instant Preview)</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="border-t border-border-subtle w-full" />
            <span className="bg-canvas px-2 text-[10px] uppercase font-mono-tabular text-text-muted absolute">
              OR USE EMAIL & PASSWORD
            </span>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Deepak Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent-ink"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Student Email
              </label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent-ink"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary font-mono-tabular">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setResetStep(1);
                    }}
                    className="text-[11px] text-text-muted hover:text-text-primary font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-border-strong text-xs sm:text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent-ink font-mono-tabular"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me / Terms Checkboxes */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-strong text-accent-ink focus:ring-0 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>

              {!isLogin && (
                <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-border-strong text-accent-ink cursor-pointer"
                  />
                  <label htmlFor="agreeTerms" className="cursor-pointer">
                    Agree to{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="font-semibold underline text-text-primary"
                    >
                      Terms
                    </button>
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Create Free Student Account'}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up Link */}
          <div className="text-center pt-2 border-t border-border-subtle text-xs text-text-secondary">
            {isLogin ? "Don't have an account yet?" : 'Already registered?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              className="ml-1.5 font-semibold text-text-primary underline cursor-pointer hover:text-accent-ink"
            >
              {isLogin ? 'Create one now' : 'Sign in here'}
            </button>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="pt-3 text-center sm:text-left text-[11px] text-text-muted flex flex-col sm:flex-row items-center justify-between gap-1.5 border-t border-border-subtle">
          <span>© 2026 Learnopia Academic OS</span>
          <button
            onClick={() => setShowTermsModal(true)}
            className="hover:text-text-primary underline cursor-pointer"
          >
            Academic Code & Terms of Service
          </button>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Minimalist Lined Copy-Page Notebook with Single Quote
      ========================================================================= */}
      <div className="hidden lg:flex flex-1 bg-[#ECE7DC] text-[#2C261E] h-full overflow-hidden flex-col justify-center items-center p-8 xl:p-14 relative select-none border-l border-[#DCD5C5]">
        {/* Subtle warm ambient lighting */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Clean Lined Notebook Copy-Page */}
        <div
          className="w-full max-w-lg rounded-xl overflow-hidden relative shadow-xl border border-[#DFD8C8]"
          style={{
            backgroundColor: '#FAF7F0',
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(175, 190, 205, 0.35) 32px)',
            boxShadow: '0 20px 40px -15px rgba(44, 38, 28, 0.2), 0 0 0 1px rgba(60, 50, 35, 0.06)'
          }}
        >
          {/* Classic Red Margin Line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-red-400/50 pointer-events-none z-10"
            style={{ left: '56px' }}
          />

          {/* Discreet Refresh Button */}
          <button
            type="button"
            onClick={handleCycleQuote}
            disabled={quoteLoading}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer z-20"
            title="Refresh quote"
          >
            <RotateCw size={13} className={quoteLoading ? 'animate-spin' : ''} />
          </button>

          {/* Simple Quote & Author on Lined Paper */}
          <div className="pl-20 pr-8 py-14 sm:py-16 space-y-4">
            <blockquote className="font-editorial text-2xl xl:text-3xl font-normal text-[#2C261E] leading-[1.38] tracking-tight italic">
              “{currentQuote?.quote}”
            </blockquote>

            <div className="pt-2 flex items-center gap-3">
              <div className="w-8 h-[1.5px] bg-stone-400" />
              <div className="text-sm font-semibold text-[#1C1917] font-sans">
                {currentQuote?.author}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PASSWORD RECOVERY MODAL
      ========================================================================= */}
      {showForgotModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForgotModal(false);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-4 overflow-y-auto bg-black/60 animate-fade-in"
        >
          <div className="w-full max-w-md mb-8 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <span className="font-editorial text-2xl font-bold tracking-tight block">
                  Reset Password
                </span>
                <span className="text-xs text-text-muted font-mono-tabular">STEP {resetStep} OF 3</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-lg border border-[#F8C8C8] bg-accent-danger-bg text-accent-danger text-xs">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="p-3 rounded-lg border border-[#C2DEC9] bg-accent-forest-bg text-accent-forest text-xs">
                {forgotSuccess}
              </div>
            )}

            {resetStep === 1 && (
              <form onSubmit={handleRequestCode} className="space-y-3">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Enter your registered student email address. A 6-digit recovery code will be generated for your account.
                </p>
                <input
                  type="email"
                  placeholder="student@university.edu"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none focus:ring-1 focus:ring-accent-ink"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Generate Recovery Code
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your verification code is: <strong className="font-mono-tabular text-sm text-text-primary">{generatedCode}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none focus:ring-1 focus:ring-accent-ink font-mono-tabular"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Verify Code
                </button>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handlePerformReset} className="space-y-3">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Create a new password for your account (minimum 6 characters).
                </p>
                <input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none focus:ring-1 focus:ring-accent-ink font-mono-tabular"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none focus:ring-1 focus:ring-accent-ink font-mono-tabular"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Set New Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Guest / Recruiter Mode Confirmation Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-8 sm:pt-14 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-forest/10 text-accent-forest flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-editorial text-base sm:text-lg font-bold text-text-primary">
                    Guest & Recruiter Explorer
                  </h3>
                  <p className="text-[11px] font-mono-tabular text-text-muted">
                    Static Demonstration & System Preview
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuestModal(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed bg-subtle/50 p-3.5 rounded-xl border border-border-subtle">
              <p className="font-medium text-text-primary">
                Explore Learnopia Academic OS without registering:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-text-muted text-[11.5px]">
                <li><strong className="text-text-primary">Interactive Preview:</strong> Browse full degree curricula, semester vaults, attendance ledger, and campus marketplace.</li>
                <li><strong className="text-text-primary">Read-Only Static Mode:</strong> Modifying folders or uploading local files will <span className="underline decoration-accent-danger text-accent-danger font-semibold">not</span> be written to the live Supabase database.</li>
                <li><strong className="text-text-primary">Recruiter Ready:</strong> Tailored for evaluation, technical interviews, and visiting faculty demonstrations.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGuestModal(false);
                  if (loginAsGuest) loginAsGuest();
                  if (setCurrentView) setCurrentView('my-learning');
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Enter Workspace as Guest</span>
                <Sparkles size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      )}
    </div>
  );
}
