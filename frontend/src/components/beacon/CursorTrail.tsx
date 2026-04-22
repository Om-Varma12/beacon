import { useEffect, useRef } from "react";

export function CursorTrail() {
  const dot = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mx = -100;
    let my = -100;
    let x = -100;
    let y = -100;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const tick = () => {
      x += (mx - x) * 0.18;
      y += (my - y) * 0.18;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x - 15}px, ${y - 15}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[30px] w-[30px] rounded-full mix-blend-screen"
      style={{
        background: "radial-gradient(circle, rgba(0,212,255,0.55), rgba(0,212,255,0) 70%)",
      }}
    />
  );
}
