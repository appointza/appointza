import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    
    // Update the OTP array
    const newOtp = [...otp];
    
    // Take only the last character if someone types multiple digits
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    
    // If value was entered, move to the next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // If all inputs are filled, call onComplete
    const otpValue = newOtp.join('');
    if (otpValue.length === length) {
      onComplete(otpValue);
    }
  };

  // Handle key down events (for backspace and arrow keys)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        // If current input is empty, move to previous input and clear it
        if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Just clear the current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
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
    
    // Only accept digits and truncate to the remaining length
    const digits = pastedData.replace(/\D/g, '').substring(0, length - index);
    
    if (!digits) return;
    
    // Fill the OTP inputs
    const newOtp = [...otp];
    for (let i = 0; i < digits.length; i++) {
      if (index + i < length) {
        newOtp[index + i] = digits[i];
      }
    }
    
    setOtp(newOtp);
    
    // Focus on the input after the last filled input
    const newIndex = Math.min(index + digits.length, length - 1);
    inputRefs.current[newIndex]?.focus();
    
    // If all inputs are filled, call onComplete
    const otpValue = newOtp.join('');
    if (otpValue.length === length) {
      onComplete(otpValue);
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="tel"
          maxLength={1}
          value={otp[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          className="w-12 h-14 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;

