import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useSafeArea = () => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      if (Capacitor.isNativePlatform()) {
        // Read safe area insets from CSS environment variables
        // These are set by the native platform (iOS/Android)
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        // Try to get from CSS env() variables first (iOS native support)
        const testDiv = document.createElement('div');
        testDiv.style.position = 'fixed';
        testDiv.style.top = '0';
        testDiv.style.left = '0';
        testDiv.style.visibility = 'hidden';
        testDiv.style.paddingTop = 'env(safe-area-inset-top)';
        testDiv.style.paddingBottom = 'env(safe-area-inset-bottom)';
        testDiv.style.paddingLeft = 'env(safe-area-inset-left)';
        testDiv.style.paddingRight = 'env(safe-area-inset-right)';
        document.body.appendChild(testDiv);
        
        const testComputed = getComputedStyle(testDiv);
        const top = parseFloat(testComputed.paddingTop) || 0;
        const bottom = parseFloat(testComputed.paddingBottom) || 0;
        const left = parseFloat(testComputed.paddingLeft) || 0;
        const right = parseFloat(testComputed.paddingRight) || 0;
        
        document.body.removeChild(testDiv);
        
        // Update CSS custom properties for use in CSS
        root.style.setProperty('--safe-area-inset-top', `${top}px`);
        root.style.setProperty('--safe-area-inset-bottom', `${bottom}px`);
        root.style.setProperty('--safe-area-inset-left', `${left}px`);
        root.style.setProperty('--safe-area-inset-right', `${right}px`);

        setInsets({ top, bottom, left, right });
      }
    };

    // Initialize status bar for native platforms
    const initStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (error) {
          console.warn('StatusBar plugin not available:', error);
        }
      }
    };

    initStatusBar();
    
    // Wait a bit for the view to be ready, then update safe area
    const timer = setTimeout(() => {
      updateSafeArea();
    }, 100);

    // Update on orientation change and resize
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return insets;
};

