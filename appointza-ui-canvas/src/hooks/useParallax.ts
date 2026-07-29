import { useEffect, useRef, useState } from 'react';

interface UseParallaxOptions {
  speed?: number;
  disabled?: boolean;
  offset?: number;
}

/**
 * Custom hook for parallax scrolling effect
 * @param speed - Speed multiplier (0.1 = slow, 1 = normal, 2 = fast). Negative values reverse direction
 * @param disabled - Disable parallax effect (useful for mobile)
 * @param offset - Initial offset in pixels
 */
export const useParallax = ({ 
  speed = 0.5, 
  disabled = false,
  offset = 0 
}: UseParallaxOptions = {}) => {
  const [transform, setTransform] = useState(0);
  const elementRef = useRef<HTMLDivElement | HTMLImageElement>(null);

  useEffect(() => {
    if (disabled) return;

    // Disable parallax on mobile for better performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    let ticking = false;

    const updateTransform = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Calculate scroll progress (0 to 1)
      const scrollProgress = Math.max(
        0,
        Math.min(1, (windowHeight - elementTop) / (windowHeight + elementHeight))
      );

      // Apply parallax transform
      const translateY = (scrollProgress - 0.5) * speed * 100 + offset;
      setTransform(translateY);

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateTransform);
        ticking = true;
      }
    };

    // Initial calculation
    updateTransform();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateTransform, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateTransform);
    };
  }, [speed, disabled, offset]);

  return {
    ref: elementRef,
    style: {
      transform: `translateY(${transform}px)`,
      willChange: 'transform',
    },
  };
};

/**
 * Hook for fade-in on scroll effect
 */
export const useFadeInOnScroll = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);

  return {
    ref: elementRef,
    className: `transition-opacity duration-1000 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`,
  };
};
