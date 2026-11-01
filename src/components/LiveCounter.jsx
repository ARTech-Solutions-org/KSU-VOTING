import React, { useEffect, useState, useRef } from 'react';

export default function LiveCounter({ count = 0, isVotingOpen = true }) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count !== prevCountRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 900);

      // Smooth count-up increment
      const start = displayCount;
      const end = count;
      const duration = 500;
      const startTime = performance.now();

      const animateCount = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * ease);
        setDisplayCount(current);

        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          setDisplayCount(end);
        }
      };

      requestAnimationFrame(animateCount);
      prevCountRef.current = count;
      return () => clearTimeout(timer);
    }
  }, [count, displayCount]);

  const formatted = new Intl.NumberFormat('en-US').format(displayCount);

  return (
    <div className={`screen-total ${isPulsing ? 'counter-pulse' : ''}`}>
      <span className="flex items-center gap-1.5">
        {isVotingOpen && (
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
        )}
        LIVE TOTAL
      </span>
      <strong>{formatted}</strong>
      <small>votes recorded</small>
    </div>
  );
}
