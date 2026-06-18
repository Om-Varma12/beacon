import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNavbar } from '../context/NavbarContext';

export default function Navigation() {
  const { isNavbarVisible } = useNavbar();
  const [compressed, setCompressed] = useState(false);
  const lastScrollY = useRef(0);

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
      <div className="max-w-[93rem] mx-auto px-6 md:px-8 h-full flex items-center justify-between">
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

        {/* User Account Icon at Outlined Bell Style Position */}
        <motion.div
          variants={rightContainerVariants}
          className="flex items-center"
        >
          <a
            href="#profile"
            className="w-9 h-9 border border-grid/30 flex items-center justify-center rounded-sm hover:bg-[var(--forest)] hover:text-white transition-all"
            aria-label="User Profile"
          >
            <Icon icon="lucide:user" className="text-base text-forest hover:text-inherit" />
          </a>
        </motion.div>
      </div>
    </motion.nav>
  );
}