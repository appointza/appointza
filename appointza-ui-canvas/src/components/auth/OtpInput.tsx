
import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onChange?: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete, onChange }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateOtp = (newOtp: string[]) => {
    setOtp(newOtp);
    const value = newOtp.join('');
    onChange?.(value);
    if (value.length === length) {
      onComplete(value);
    }
  };

  // Initialize refs array on component mount
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus the first input on component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only accept digits
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    updateOtp(newOtp);
    
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down events (for backspace and arrow keys)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          updateOtp(newOtp);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        updateOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste event to fill multiple inputs at once
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    const digits = pastedData.replace(/\D/g, '').substring(0, length - index);
    
    if (!digits) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < digits.length; i++) {
      if (index + i < length) {
        newOtp[index + i] = digits[i];
      }
    }
    
    updateOtp(newOtp);
    
    const newIndex = Math.min(index + digits.length, length - 1);
    inputRefs.current[newIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={otp[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          className={cn(
            "h-12 w-10 rounded-2xl border-2 border-stone-200 bg-white text-center text-lg font-semibold text-appointza-navy shadow-sm transition-colors",
            "focus:border-appointza-coral focus:outline-none focus:ring-2 focus:ring-appointza-coral/20",
            "sm:h-14 sm:w-12 sm:text-xl",
            otp[index] && "border-[#FFD4CC] bg-[#FFF8F5]",
          )}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
