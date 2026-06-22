import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Amplify } from 'aws-amplify';
import { signUp, confirmSignUp, signIn, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

const userPoolId = import.meta.env?.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_NTT4B3WFb';

const userPoolClientId = import.meta.env?.VITE_COGNITO_CLIENT_ID || '4hg51l3srlfeq4kes57ruq5e6h';

try {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  });
} catch (e) {
  console.error('Amplify configure error:', e);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function syncUserWithBackend(idToken: string) {
  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to sync user: ${response.statusText}`);
  }
  return response.json();
}


interface SignupPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signup' | 'login';
  onAuthSuccess?: (user: { name: string; email: string }) => void;
}

const bars = [
  { animationDelay: '-1.2s', transform: 'rotate(.0001deg) translate(146%)' },
  { animationDelay: '-1.1s', transform: 'rotate(30deg) translate(146%)' },
  { animationDelay: '-1.0s', transform: 'rotate(60deg) translate(146%)' },
  { animationDelay: '-0.9s', transform: 'rotate(90deg) translate(146%)' },
  { animationDelay: '-0.8s', transform: 'rotate(120deg) translate(146%)' },
  { animationDelay: '-0.7s', transform: 'rotate(150deg) translate(146%)' },
  { animationDelay: '-0.6s', transform: 'rotate(180deg) translate(146%)' },
  { animationDelay: '-0.5s', transform: 'rotate(210deg) translate(146%)' },
  { animationDelay: '-0.4s', transform: 'rotate(240deg) translate(146%)' },
  { animationDelay: '-0.3s', transform: 'rotate(270deg) translate(146%)' },
  { animationDelay: '-0.2s', transform: 'rotate(300deg) translate(146%)' },
  { animationDelay: '-0.1s', transform: 'rotate(330deg) translate(146%)' }
];

const Spinner = ({ size = 20, color = '#fcf9f6' }: { size?: number; color?: string }) => {
  return (
    <div style={{ width: size, height: size }}>
      <style>
        {`
          @keyframes spin {
              0% { opacity: 0.15; }
              100% { opacity: 1; }
          }
        `}
      </style>
      <div className="relative top-1/2 left-1/2" style={{ width: size, height: size }}>
        {bars.map((item) => (
          <div
            key={item.transform}
            className="absolute h-[8%] w-[24%] -left-[10%] -top-[3.9%]"
            style={{ backgroundColor: color, animation: 'spin 1.2s linear infinite', ...item }}
          />
        ))}
      </div>
    </div>
  );
};

export function SignupPopup({ isOpen, onClose, initialMode = 'signup', onAuthSuccess }: SignupPopupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset form states on close/open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setStep('details');
      setMode(initialMode);
      setError('');
      setSuccess(false);
      setLoading(false);
      // Disable background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (step === 'details') {
        if (!name || !email || !password || !confirmPassword) {
          setError('All fields are required');
          return;
        }

        if (!validateEmail(email)) {
          setError('Please enter a valid email address');
          return;
        }

        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        setLoading(true);
        try {
          const result = await signUp({
            username: email,
            password,
            options: {
              userAttributes: {
                email,
                name,
              },
            },
          });
          console.log('Cognito SignUp Success - Result Details:', result);
          setStep('otp');
        } catch (err: any) {
          console.error('Cognito SignUp Error:', err);
          setError(err.message || String(err));
        } finally {
          setLoading(false);
        }
      } else {
        if (!otp) {
          setError('Verification code is required');
          return;
        }

        setLoading(true);
        try {
          const confirmResult = await confirmSignUp({
            username: email,
            confirmationCode: otp,
          });
          console.log('✅ Cognito OTP Verification Success:', confirmResult);
          console.log('📋 User Account Confirmed:', { name, email });

          // Auto sign-in with the same credentials right after confirmation
          console.log('🔐 Auto signing in after signup confirmation...');
          const signInResult = await signIn({
            username: email,
            password,
          });
          console.log('✅ Auto Sign-In Success:', signInResult);

          // Retrieve and log all tokens
          const session = await fetchAuthSession();
          const accessToken = session.tokens?.accessToken;
          const idToken = session.tokens?.idToken;

          console.group('🎟️ User Session Tokens');
          console.log('Access Token (JWT):', accessToken?.toString());
          console.log('ID Token (JWT):    ', idToken?.toString());
          console.groupEnd();

          // Sync user with backend db
          let dbName = name;
          let dbEmail = email;
          try {
            if (idToken) {
              const dbUser = await syncUserWithBackend(idToken.toString());
              if (dbUser && dbUser.name) {
                dbName = dbUser.name;
                dbEmail = dbUser.email;
              }
            }
          } catch (e) {
            console.error('Failed to sync user with backend:', e);
          }

          // Persist user data
          const userData = { name: dbName, email: dbEmail, accessToken: accessToken?.toString(), idToken: idToken?.toString() };
          localStorage.setItem('beacon_user', JSON.stringify(userData));

          setSuccess(true);
          setTimeout(() => {
            onClose();
            onAuthSuccess?.(userData);
          }, 1500);
        } catch (err: any) {
          console.error('❌ Cognito Error:', err);
          setError(err.message || String(err));
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Login mode
      if (!email || !password) {
        setError('Email and password are required');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      setLoading(true);
      try {
        const signInResult = await signIn({
          username: email,
          password,
        });
        console.log('✅ Cognito SignIn Success:', signInResult);

        // Retrieve and log all tokens
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken;
        const idToken = session.tokens?.idToken;

        console.group('🎟️ User Session Tokens');
        console.log('Access Token (JWT):', accessToken?.toString());
        console.log('ID Token (JWT):    ', idToken?.toString());
        console.groupEnd();

        // Let's get the user's name attribute from Cognito!
        let displayName = '';
        try {
          const attributes = await fetchUserAttributes();
          displayName = attributes.name || '';
        } catch (attrErr) {
          console.error('Failed to fetch user attributes:', attrErr);
        }

        if (!displayName) {
          displayName = email.split('@')[0];
        }

        // Sync user with backend db
        let dbName = displayName;
        let dbEmail = email;
        try {
          if (idToken) {
            const dbUser = await syncUserWithBackend(idToken.toString());
            if (dbUser && dbUser.name) {
              dbName = dbUser.name;
              dbEmail = dbUser.email;
            }
          }
        } catch (e) {
          console.error('Failed to sync user with backend:', e);
        }

        const userData = { name: dbName, email: dbEmail, accessToken: accessToken?.toString(), idToken: idToken?.toString() };
        localStorage.setItem('beacon_user', JSON.stringify(userData));

        setSuccess(true);
        setTimeout(() => {
          onClose();
          onAuthSuccess?.(userData);
        }, 1500);
      } catch (err: any) {
        console.error('❌ Cognito SignIn Error:', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop — blurs hackathon table, plain semi-transparent overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(2, 38, 23, 0.35)' }}
      />

      {/* Modal Container — mosaic pattern lives on the card itself */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative popup-card-bg border border-grid/20 p-8 md:p-10 w-full max-w-md z-10 shadow-2xl animate-fade-in"
      >
        {/* Corner Markers */}
        <div className="corner-marker corner-tl" />
        <div className="corner-marker corner-tr" />
        <div className="corner-marker corner-bl" />
        <div className="corner-marker corner-br" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center border border-grid/20 hover:bg-forest hover:text-white transition-all rounded-sm cursor-pointer"
          aria-label="Close modal"
        >
          <Icon icon="lucide:x" width={16} />
        </button>

        {/* Title */}
        <div className="mb-8 text-center">
          <span className="typography-technical-label text-grid">
            {mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </span>
          <h2 className="space-grotesk text-3xl font-bold mt-2 text-forest">
            {mode === 'signup' ? 'Join Beacon' : 'Welcome Back'}
          </h2>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-mint/10 border border-mint text-forest text-center jetbrains text-sm"
          >
            <div className="flex justify-center mb-3">
              <Icon icon="lucide:check-circle" className="text-mint" width={32} />
            </div>
            <p className="font-bold mb-1">
              {mode === 'signup' ? 'Registration Complete!' : 'Login Successful!'}
            </p>
            <p className="text-xs opacity-80 mb-3">
              {mode === 'signup' ? 'Welcome to Beacon.' : 'Welcome back to Beacon.'}
            </p>

          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' ? (
              step === 'details' ? (
                <>
                  <div>
                    <label htmlFor="signup-name" className="typography-technical-sm text-forest mb-2 block">
                      Name *
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-transparent border-b border-grid/20 px-0 py-2.5 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:opacity-50"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="typography-technical-sm text-forest mb-2 block">
                      Email Address *
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-transparent border-b border-grid/20 px-0 py-2.5 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="typography-technical-sm text-forest mb-2 block">
                      Password *
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-b border-grid/20 px-0 py-2.5 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-confirm-password" className="typography-technical-sm text-forest mb-2 block">
                      Confirm Password *
                    </label>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-b border-grid/20 px-0 py-2.5 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-2">
                    <p className="jetbrains text-xs text-grid">
                      We&apos;ve sent a verification code to
                    </p>
                    <p className="jetbrains text-xs font-bold text-forest mt-1 truncate">
                      {email}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="signup-otp" className="typography-technical-sm text-forest mb-2 block">
                      Verification Code (OTP) *
                    </label>
                    <input
                      id="signup-otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-transparent border-b border-grid/20 px-0 py-2.5 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:opacity-50 text-center tracking-[0.2em] font-bold"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </>
              )
            ) : (
              // Login Mode
              <>
                <div>
                  <label htmlFor="login-email" className="typography-technical-sm text-forest mb-2 block">
                    Email Address *
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-transparent border-b border-grid/20 px-0 py-2.5 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:opacity-50"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="typography-technical-sm text-forest mb-2 block">
                    Password *
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-b border-grid/20 px-0 py-2.5 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-coral/5 text-coral border border-coral/30 jetbrains text-[11px] leading-relaxed"
              >
                ⚠ {error}
              </motion.div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer jetbrains text-[10px] uppercase px-6 py-4 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Spinner size={16} color="#022617" />
                    <span>Processing...</span>
                  </>
                ) : mode === 'signup' ? (
                  step === 'details' ? (
                    <>
                      <span>Create Account</span>
                      <Icon icon="lucide:user-plus" width={14} />
                    </>
                  ) : (
                    <>
                      <span>Confirm Code</span>
                      <Icon icon="lucide:check" width={14} />
                    </>
                  )
                ) : (
                  <>
                    <span>Sign In</span>
                    <Icon icon="lucide:log-in" width={14} />
                  </>
                )}
              </button>

              {mode === 'signup' && step === 'otp' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep('details');
                    setError('');
                  }}
                  className="w-full text-center jetbrains text-[9px] uppercase text-grid hover:text-forest transition-colors cursor-pointer py-2"
                >
                  ← Edit Account Details
                </button>
              ) : (
                <div className="text-center mt-2 jetbrains text-[9px] uppercase text-grid">
                  {mode === 'signup' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                        }}
                        className="text-forest hover:text-forest/80 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Log In
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setError('');
                        }}
                        className="text-forest hover:text-forest/80 underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
