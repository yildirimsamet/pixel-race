import { useState, useEffect, RefObject } from 'react';
import { useGlobalCountdown } from './useGlobalCountdown';

export function useVisibleCountdown(ref: RefObject<HTMLElement>): number | null {
  const [isVisible, setIsVisible] = useState(false);
  const globalNow = useGlobalCountdown();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isVisible ? globalNow : null;
}
