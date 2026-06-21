import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNavbar } from '../context/NavbarContext';

export default function Navigation() {
  const { isNavbarVisible } = useNavbar();
  const [compressed, setCompressed] = useState(false);
  const lastScrollY = useRef(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
                        Om Varma
                      </p>
                      <p className="font-mono text-[10px] text-grid/50 truncate tracking-wide">
                        om.varma@example.com
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-grid/10 pt-4 space-y-1">
                    <div className="flex items-center gap-2 py-1.5 px-2 text-grid/60 hover:text-forest hover:bg-forest/5 transition-all cursor-pointer">
                      <Icon icon="lucide:settings" className="text-xs flex-shrink-0" />
                      <span className="font-mono text-[10px] uppercase tracking-widest">Settings</span>
                    </div>
                    <div className="flex items-center gap-2 py-1.5 px-2 text-coral/70 hover:text-coral hover:bg-coral/5 transition-all cursor-pointer">
                      <Icon icon="lucide:log-out" className="text-xs flex-shrink-0" />
                      <span className="font-mono text-[10px] uppercase tracking-widest">Sign out</span>
                    </div>
                  </div>
                </div>

                {/* Bottom status bar */}
                <div className="border-t border-grid/10 px-5 py-2.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-grid/40">Active session</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}