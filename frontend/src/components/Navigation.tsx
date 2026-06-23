import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNavbar } from '../context/NavbarContext';
import { SignupPopup } from './SignupPopup';
import { Amplify } from 'aws-amplify';
import { signOut, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

try {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env?.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_NTT4B3WFb',
        userPoolClientId: import.meta.env?.VITE_COGNITO_CLIENT_ID || '4hg51l3srlfeq4kes57ruq5e6h',
      },
    },
  });
} catch (e) {
  console.error('Amplify configure error:', e);
}

export default function Navigation() {
  const { isNavbarVisible } = useNavbar();
  const [compressed, setCompressed] = useState(false);
  const lastScrollY = useRef(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ name: string; email: string; idToken?: string; accessToken?: string } | null>(null);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);

  // Read user data stored by the landing app after signup/login and verify session
  useEffect(() => {
    const initAuth = async () => {
      let initialUser: { name: string; email: string; idToken?: string; accessToken?: string } | null = null;
      
      try {
        const params = new URLSearchParams(window.location.search);
        const userParam = params.get('user');

        if (userParam) {
          const decoded = decodeURIComponent(userParam);
          initialUser = JSON.parse(decoded);
          localStorage.setItem('beacon_user', JSON.stringify(initialUser));
          setUser(initialUser);

          // Clean the query parameters from the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('user');
          window.history.replaceState({}, document.title, url.pathname + url.search);
        } else {
          const stored = localStorage.getItem('beacon_user');
          if (stored) {
            initialUser = JSON.parse(stored);
            setUser(initialUser);
          }
        }
      } catch (e) {
        console.error('Failed to parse user session from URL/localStorage:', e);
        try {
          const stored = localStorage.getItem('beacon_user');
          if (stored) {
            initialUser = JSON.parse(stored);
            setUser(initialUser);
          }
        } catch {
          // ignore parse errors
        }
      }

      // Check Cognito session to refresh the idToken if expired or near expiry
      try {
        if (initialUser && initialUser.idToken) {
          const decoded = parseJwt(initialUser.idToken);
          const isExpired = decoded && decoded.exp ? (decoded.exp * 1000 - 60000) < Date.now() : true;

          if (isExpired) {
            console.log('🔄 Token is expired or near expiry. Fetching fresh session...');
            const session = await fetchAuthSession();
            const freshIdToken = session.tokens?.idToken;
            const freshAccessToken = session.tokens?.accessToken;

            if (freshIdToken) {
              const updatedUser = {
                ...initialUser,
                idToken: freshIdToken.toString(),
                accessToken: freshAccessToken?.toString()
              };
              localStorage.setItem('beacon_user', JSON.stringify(updatedUser));
              setUser(updatedUser);
              console.log('✅ Token successfully refreshed via Cognito.');
            } else {
              // Cognito session has expired completely (refresh token invalid)
              console.warn('⚠️ Cognito session has expired. Logging out...');
              localStorage.removeItem('beacon_user');
              setUser(null);
            }
          }
        } else {
          // If no beacon_user in localStorage, but Amplify session is active, auto-login
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken;
          const accessToken = session.tokens?.accessToken;

          if (idToken) {
            console.log('🔄 Found active Cognito session without beacon_user. Auto logging in...');
            let name = '';
            let email = '';
            try {
              const attributes = await fetchUserAttributes();
              name = attributes.name || '';
              email = attributes.email || '';
            } catch (e) {
              console.error('Failed to fetch Cognito user attributes:', e);
            }

            if (!email) {
              const payload = idToken.payload;
              email = payload.email as string || '';
              name = payload.name as string || '';
            }

            if (!name && email) {
              name = email.split('@')[0];
            }

            const updatedUser = {
              name,
              email,
              idToken: idToken.toString(),
              accessToken: accessToken?.toString()
            };
            localStorage.setItem('beacon_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        }
      } catch (e) {
        console.error('Failed to verify Cognito session:', e);
        if (initialUser) {
          localStorage.removeItem('beacon_user');
          setUser(null);
        }
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 100) {
        setCompressed(false);
      } else {
        if (currentScrollY > lastScrollY.current) {
          setCompressed(true);
        } else if (currentScrollY < lastScrollY.current) {
          setCompressed(false);
        }
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const springConfig = { type: 'spring' as const, stiffness: 220, damping: 26 };

  const navVariants = {
    expanded: {
      height: 64,
      backgroundColor: 'rgba(247, 247, 245, 0.75)',
      borderBottomColor: 'rgba(58, 58, 56, 0.1)',
      transition: springConfig
    },
    compressed: {
      height: 48,
      backgroundColor: 'rgba(247, 247, 245, 0.92)',
      borderBottomColor: 'rgba(58, 58, 56, 0.2)',
      transition: springConfig
    }
  };

  const logoImageVariants = {
    expanded: { scale: 1, x: 0, transition: springConfig },
    compressed: { scale: 0.75, x: -6, transition: springConfig }
  };

  const wordmarkVariants = {
    expanded: { opacity: 1, width: 150, marginLeft: 12, transition: springConfig },
    compressed: { opacity: 0, width: 0, marginLeft: 0, transition: springConfig }
  };

  const rightContainerVariants = {
    expanded: { gap: '16px', transition: springConfig },
    compressed: { gap: '8px', transition: springConfig }
  };

  return (
    <>
      <motion.nav
      initial="expanded"
      animate={compressed ? 'compressed' : 'expanded'}
      variants={navVariants}
      className={`fixed top-0 left-0 right-0 border-b z-50 backdrop-blur-md transition-transform duration-300 ease-in-out transform ${
        isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="px-6 lg:px-16 h-full flex items-center justify-between">
        {/* Logo and Wordmark */}
        <a href="#" className="flex items-center h-full">
          <div className="flex items-center origin-left">
            <motion.img
              src="/logo.png"
              alt="Logo"
              variants={logoImageVariants}
              className="w-8 h-8 object-contain flex-shrink-0"
            />
            <motion.div
              variants={wordmarkVariants}
              className="overflow-hidden flex items-center h-full select-none"
            >
              <span className="font-display text-xl font-bold tracking-widest text-[rgb(24,24,24)] uppercase">
                BEACON
              </span>
            </motion.div>
          </div>
        </a>

        {/* User Account Icon with Profile Popup */}
        <motion.div
          variants={rightContainerVariants}
          className="flex items-center"
        >
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-9 h-9 border border-grid/30 flex items-center justify-center rounded-sm hover:bg-[var(--forest)] hover:text-white transition-all group"
              aria-label="User Profile"
              aria-expanded={isProfileOpen}
            >
              <Icon
                icon="lucide:user"
                className="text-base text-forest group-hover:text-white transition-colors"
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 bg-[var(--paper)] border border-grid/20 shadow-lg z-[100]">
                {/* Top accent line */}
                <div className="h-0.5 w-full bg-[var(--forest)]" />

                {/* Avatar + Info */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[var(--forest)] flex items-center justify-center flex-shrink-0">
                      <Icon icon="lucide:user" className="text-[var(--paper)] text-lg" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-forest truncate">
                        {user?.name ?? 'Guest'}
                      </p>
                      <p className="font-mono text-[10px] text-grid/50 truncate tracking-wide">
                        {user?.email ?? 'Not signed in'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-grid/10 pt-4 space-y-1 flex flex-col">
                    {user ? (
                      <>
                        <button className="flex items-center gap-2 py-1.5 px-2 text-grid/60 hover:text-white hover:bg-[var(--forest)] transition-all cursor-pointer w-full text-left">
                          <Icon icon="lucide:settings" className="text-xs flex-shrink-0" />
                          <span className="font-mono text-[10px] uppercase tracking-widest">Settings</span>
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await signOut({ global: true });
                            } catch (e) {
                              console.warn('Amplify signOut error:', e);
                            }
                            localStorage.removeItem('beacon_user');
                            sessionStorage.clear();
                            setUser(null);
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center gap-2 py-1.5 px-2 text-[var(--forest)] hover:opacity-100 hover:text-white hover:bg-[var(--forest)] transition-all cursor-pointer w-full text-left"
                        >
                          <Icon icon="lucide:log-out" className="text-xs flex-shrink-0" />
                          <span className="font-mono text-[10px] uppercase tracking-widest">Sign out</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAuthPopupOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-[var(--forest)] text-white hover:bg-forest/90 transition-all cursor-pointer w-full text-center rounded-sm font-mono text-[10px] uppercase tracking-widest font-bold"
                      >
                        <Icon icon="lucide:log-in" className="text-xs flex-shrink-0" />
                        <span>Sign In</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      </motion.nav>
      <SignupPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        onAuthSuccess={(userData) => setUser(userData)}
        initialMode="login"
      />
    </>
  );
}