import { ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

interface SafeAreaProps {
  children: ReactNode;
  className?: string;
  /**
   * Apply safe area padding:
   * - 'all': padding on all sides
   * - 'top': padding on top only (for headers)
   * - 'bottom': padding on bottom only (for footers)
   * - 'sides': padding on left/right only
   * - 'none': no safe area padding (default)
   */
  padding?: 'all' | 'top' | 'bottom' | 'sides' | 'none';
}

export const SafeArea = ({ 
  children, 
  className = '',
  padding = 'none'
}: SafeAreaProps) => {
  // Only apply safe area classes in native apps
  const isNative = Capacitor.isNativePlatform();
  
  // Build className with safe area utilities
  const safeAreaClass = isNative && padding !== 'none' 
    ? `safe-area-${padding}` 
    : '';
  
  const finalClassName = [className, safeAreaClass].filter(Boolean).join(' ');

  return (
    <div className={finalClassName || undefined}>
      {children}
    </div>
  );
};

