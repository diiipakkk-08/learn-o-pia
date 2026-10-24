import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, X } from 'lucide-react';
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
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Return Home Link */}
      <div className="max-w-md w-full mx-auto mb-4">
        <button
          onClick={() => setCurrentView && setCurrentView('landing')}
          className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto rounded-xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-modal space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <span className="font-editorial text-3xl tracking-tight block">
            Learn-O-Pia
          </span>
          <p className="text-xs font-mono-tabular text-text-muted uppercase">
            {isLogin ? 'STUDENT WORKSPACE SIGN IN' : 'CREATE FREE STUDENT ACCOUNT'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3 rounded-lg border border-[#F8C8C8] bg-accent-danger-bg text-accent-danger text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg border border-[#C2DEC9] bg-accent-forest-bg text-accent-forest text-xs flex items-start gap-2">
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
          className="w-full py-2.5 px-4 rounded-lg border border-border-strong bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary flex items-center justify-center gap-2.5 transition-colors"
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Connecting...' : isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border-subtle w-full" />
          <span className="bg-surface px-3 text-[10px] uppercase font-mono-tabular text-text-muted absolute">
            OR WITH EMAIL
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Deepak Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1 font-mono-tabular">
              Student Email
            </label>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
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
                  className="text-xs text-text-muted hover:text-text-primary font-medium"
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
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="flex items-start gap-2 pt-1 text-xs text-text-secondary">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-border-strong text-accent-ink"
              />
              <label htmlFor="agreeTerms">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="font-semibold underline text-text-primary"
                >
                  Terms of Service & Academic Code
                </button>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Create Free Account'}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <div className="text-center pt-2 border-t border-border-subtle text-xs text-text-secondary">
          {isLogin ? "Don't have an account yet?" : 'Already registered?'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className="ml-1.5 font-semibold text-text-primary underline"
          >
            {isLogin ? 'Create one now' : 'Sign in here'}
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <span className="font-editorial text-2xl tracking-tight block">
                  Reset Password
                </span>
                <span className="text-xs text-text-muted font-mono-tabular">STEP {resetStep} OF 3</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
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
                <p className="text-xs text-text-secondary">
                  Enter your registered student email address. A 6-digit recovery code will be generated.
                </p>
                <input
                  type="email"
                  placeholder="student@university.edu"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
                >
                  Generate Recovery Code
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Your verification code is: <strong className="font-mono-tabular text-sm text-text-primary">{generatedCode}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
                >
                  Verify Code
                </button>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handlePerformReset} className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Create a new password for your account.
                </p>
                <input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none font-mono-tabular"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
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
