import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, X, Sparkles, ShieldCheck } from 'lucide-react';
import TermsModal from './TermsModal';

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
  if (typeof err === 'string') return err;
  const msg = err.message || err.error_description || err.msg || err.details;
  if (msg && typeof msg === 'string' && msg.trim() !== '' && msg !== '{}') return msg;
  return 'Authentication failed. Please check your credentials or network connection.';
};

export default function Auth({ setCurrentView }) {
  const { users, login, loginWithGoogle, registerUser, setPasswordForUser, isSupabaseLive } = useDatabase();

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
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col lg:flex-row">
      {/* =========================================================================
          LEFT PANEL: Sleek Authentication Form (Full-width mobile, 45-50% desktop)
      ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 min-h-screen bg-canvas">
        {/* Top Header: Logo & Return Action */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-ink text-text-on-dark flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              L
            </div>
            <span className="font-editorial text-xl font-bold tracking-tight text-text-primary">
              Learn-O-Pia
            </span>
          </div>

          <button
            onClick={() => setCurrentView && setCurrentView('landing')}
            className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Center Auth Card Box */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {/* Headline & Subhead */}
          <div className="space-y-1.5">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {isLogin ? 'Sign in to workspace' : 'Create your student account'}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {isLogin
                ? 'Access your course syllabus, attendance ledger, and semester notes.'
                : 'Join peers and organize your entire academic schedule in one place.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-surface border border-border-subtle p-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-accent-ink text-text-on-dark shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Register Free
            </button>
          </div>

          {/* Notifications */}
          {error && (
            <div className="p-3 rounded-lg border border-[#F8C8C8] bg-accent-danger-bg text-accent-danger text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg border border-[#C2DEC9] bg-accent-forest-bg text-accent-forest text-xs flex items-start gap-2 animate-fade-in">
              <CheckCircle size={15} className="shrink-0 mt-0.5" />
              <span className="leading-snug">{success}</span>
            </div>
          )}

          {/* Google OAuth Button */}
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
            className="w-full py-2.5 px-4 rounded-xl border border-border-strong bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary flex items-center justify-center gap-2.5 transition-colors shadow-xs cursor-pointer"
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Connecting...' : isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-border-subtle w-full" />
            <span className="bg-canvas px-3 text-[10px] uppercase font-mono-tabular text-text-muted absolute">
              OR USE EMAIL & PASSWORD
            </span>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5 font-mono-tabular">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Deepak Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent-ink"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5 font-mono-tabular">
                Student Email
              </label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-strong text-xs sm:text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent-ink"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono-tabular">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setResetStep(1);
                    }}
                    className="text-xs text-text-muted hover:text-text-primary font-medium transition-colors cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border-strong text-xs sm:text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent-ink font-mono-tabular"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me / Terms Checkboxes */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-text-secondary select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-strong text-accent-ink focus:ring-0 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>

              {!isLogin && (
                <div className="flex items-center gap-1.5 text-text-secondary">
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
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Create Free Student Account'}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up Link */}
          <div className="text-center pt-3 border-t border-border-subtle text-xs text-text-secondary">
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
        <div className="pt-8 text-center sm:text-left text-[11px] text-text-muted flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border-subtle">
          <span>© 2026 Learn-O-Pia Academic OS</span>
          <button
            onClick={() => setShowTermsModal(true)}
            className="hover:text-text-primary underline cursor-pointer"
          >
            Academic Code & Terms of Service
          </button>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Editorial Showcase (Visible on desktop screens >= lg)
      ========================================================================= */}
      <div className="hidden lg:flex flex-1 bg-[#141413] text-[#F7F5F0] flex-col justify-between p-12 lg:p-16 relative overflow-hidden select-none border-l border-white/5">
        {/* Subtle geometric light rings */}
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Tag */}
        <div className="flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-mono-tabular tracking-wider uppercase text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACADEMIC OPERATING SYSTEM • 2026
          </div>
          <span className="text-[11px] font-mono-tabular text-white/40">CALCUTTA & BEYOND</span>
        </div>

        {/* Center Showcase */}
        <div className="max-w-lg space-y-8 my-auto relative z-10">
          <div className="space-y-4">
            <h2 className="font-editorial text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight text-white leading-[1.18]">
              A quiet, focused workspace for your college lectures, attendance, and campus gear.
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed font-light">
              Built specifically for students tired of messy WhatsApp folders, lost PDFs, and unexpected attendance shortages. Everything is stored directly in your browser with cloud-sync resilience.
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="text-xs font-semibold text-white">Pure YouTube Playlists</div>
              <div className="text-[11px] text-stone-400 leading-snug">Instant lecture player with auto-extract syllabus and zero ads</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="text-xs font-semibold text-white">75% Attendance Guard</div>
              <div className="text-[11px] text-stone-400 leading-snug">Real-time bunk margin and routine timetable tracking</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="text-xs font-semibold text-white">Campus Peer Exchange</div>
              <div className="text-[11px] text-stone-400 leading-snug">Buy & sell drafters, organizers, and verified lab kits</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="text-xs font-semibold text-white">Local-First Architecture</div>
              <div className="text-[11px] text-stone-400 leading-snug">Fast offline access with automatic Supabase sync</div>
            </div>
          </div>

          {/* Verified Student Quote */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-stone-300 italic leading-relaxed">
                “Learn-O-Pia replaced 5 separate messy tools for our batch. Having lecture syllabus and attendance bunk calculation in one tab is unmatched.”
              </p>
              <div className="text-[11px] font-mono-tabular text-stone-400 font-semibold">
                Verified B.Tech Engineering Batch '26
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono-tabular text-white/40 pt-6 border-t border-white/5 relative z-10">
          <span>STUDENT-LED INITIATIVE</span>
          <span>NO ADS • ZERO BLOAT</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-md my-auto rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-modal space-y-4">
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

      {/* Terms Modal */}
      {showTermsModal && (
        <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      )}
    </div>
  );
}
