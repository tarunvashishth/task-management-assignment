import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Per-card scroll-scrub reveal: rotateX(60deg) + opacity 0 → natural state.
 * Each direct child gets its own pinned ScrollTrigger so the animation is
 * driven 1-to-1 by the scrollbar while the card stays fixed in view.
 *
 * @param hasItems - pass `items.length > 0`; hook waits until true before
 *   measuring and wiring up triggers.
 */
export function useScrollFadeIn<T extends HTMLElement>(hasItems: boolean) {
  const containerRef = useRef<T>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasItems || hasAnimated.current) return;

    const container = containerRef.current;
    if (!container) return;

    const cards = Array.from(container.children) as HTMLElement[];
    if (cards.length === 0) return;

    hasAnimated.current = true;

    // Set perspective on each card so rotateX renders with depth.
    gsap.set(cards, {
      transformPerspective: 900,
      rotateX: 60,
      opacity: 0,
      transformOrigin: 'top center',
    });

    ScrollTrigger.refresh();

    cards.forEach((card) => {
      gsap.to(card, {
        rotateX: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',   // top edge of card crosses 80% of viewport height
          end: 'top 30%',     // animation completes when card top reaches 30%
          scrub: true,        // ties progress directly to scroll position
          pin: true,          // pins the card while the animation is playing
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [hasItems]);

  return containerRef;
}
