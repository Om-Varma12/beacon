'use client';

import { ReactLenis } from 'lenis/react';
import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
        lerp: 0.08,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
