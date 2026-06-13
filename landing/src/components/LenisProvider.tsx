'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function LenisScrollHandler() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        // Only intercept actual hash anchors on the current page
        if (href && href.startsWith('#') && href.length > 1) {
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            e.preventDefault();
            lenis.scrollTo(targetElement, {
              duration: 3,
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [lenis]);

  return null;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Clear scroll memory on fresh load for clean animations
    ScrollTrigger.clearScrollMemory();
    window.history.scrollRestoration = 'manual';
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.05,
        duration: 3,
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      <LenisScrollHandler />
      {children}
    </ReactLenis>
  );
}
