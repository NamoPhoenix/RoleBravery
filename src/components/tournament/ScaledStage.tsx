import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/**
 * Feste 1920×1080-Bühne, die proportional in ihren Container skaliert wird.
 * Overlay und Control-Vorschau rendern dadurch pixelgleich.
 */
export const ScaledStage: React.FC<{ children: React.ReactNode; className?: string; transparent?: boolean }> = ({
  children,
  className = '',
  transparent = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H) || 1);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <div
        className={`absolute left-1/2 top-1/2 ${transparent ? '' : 'bg-[#0a0b0e]'}`}
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Aktuelle Zeit, tickt solange `active` (für Glücksrad-Reveal). */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
