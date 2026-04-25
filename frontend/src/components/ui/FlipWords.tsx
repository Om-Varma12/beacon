import { useEffect, useState } from "react";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

export function FlipWords({ words, duration = 3000, className = "" }: FlipWordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setAnimating(false);
      }, 400);
    }, duration);

    return () => clearInterval(interval);
  }, [currentIndex, words, duration]);

  return (
    <span className="relative inline-block" style={{ perspective: "800px" }}>
      <span
        className={className}
        style={{
          display: "inline-block",
          transition: animating ? "none" : "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: animating
            ? "rotateX(-90deg) translateY(-50%)"
            : "rotateX(0deg) translateY(0)",
        }}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
}
