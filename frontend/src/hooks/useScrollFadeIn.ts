import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Staggered fade-in (opacity 0→1, y 32→0) for direct children of a container
 * as the container enters the viewport. Plays exactly once — subsequent re-renders
 * caused by data updates (e.g., socket events) do not restart the animation.
 *
 * @param hasItems - pass `items.length > 0`; the hook waits for this to become
 *   true before setting the initial hidden state and creating the ScrollTrigger.
 */
export function useScrollFadeIn<T extends HTMLElement>(hasItems: boolean) {
  const containerRef = useRef<T>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasItems || hasAnimated.current) return;

    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.children) as HTMLElement[];
    if (items.length === 0) return;

    hasAnimated.current = true;

    gsap.set(items, { opacity: 0, y: 32 });

    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: container,
        start: 'top 85%',
        once: true,
      },
    });

    // No cleanup needed — the tween is owned by ScrollTrigger and self-terminates
    // once it plays. Killing it here would interrupt the animation on Fast Refresh.
  }, [hasItems]);

  return containerRef;
}
