import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UsersService } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import OtpInput from "@/components/auth/OtpInput";
import { UsersLoginReq } from "@/models/users.model";
import webzysLogo from "@/assets/webzys-logo.png";

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, setMobile, refreshAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mobile, setMobileState] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  
  // Get the intended destination from state, if any
  const from = location.state?.from?.pathname || location.state?.from || '/dashboard';

  // Initialize component with mobile number from state
  useEffect(() => {
    const stateMobile = location.state?.mobile;
    
    if (stateMobile) {
      setMobileState(stateMobile);
      setName(location.state?.name || 'User');
    } else {
      // If no mobile in state, redirect to login
      navigate('/login');
    }
  }, [location.state, navigate]);

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Verify OTP function
  const verifyOtp = async (otpValue?: string) => {
    const currentOtp = otpValue || otp;
    
    if (!currentOtp || currentOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const usersService = new UsersService();
      let loginreq = new UsersLoginReq();
      loginreq.mobile = mobile;
      loginreq.otp = currentOtp;
      let loginresp = await usersService.login(loginreq);
      console.log('OTP verification response:', loginresp);
      
      // Store user context in localStorage (same pattern as appointza-ui-canvas)
      localStorage.setItem('user_context', JSON.stringify(loginresp));
      
      // User is a business if they have an organisation; otherwise a customer
      const iscustomer = loginresp?.organisationlocationid == 0 || loginresp?.organisationlocationid == null;
      const userTypeValue = iscustomer ? 'user' : 'organization';
      
      console.log('User type determined:', userTypeValue, 'iscustomer:', iscustomer);
      
      localStorage.setItem('user_type', userTypeValue);
      localStorage.setItem('auth_token', loginresp?.accesstoken || 'mock_token_' + Date.now());
      
      // Refresh auth state to update the context
      refreshAuth();
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error: any) {
      var message = error?.response?.data?.message || error?.message || 'OTP verification failed';
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP function
  const resendOtp = async () => {
    setLoading(true);
    try {
      const usersService = new UsersService();
      let getotpreq = { mobile: mobile };
      
      await usersService.getotp(getotpreq);
      
      toast({
        title: "OTP Resent",
        description: `We've sent a new verification code to ${mobile}`,
      });
    } catch (error: any) {
      var message = error?.response?.data?.message || error?.message || 'Failed to resend OTP';
      toast({
        title: "Resend Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 left-4">
          <button 
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <img src={webzysLogo} alt="Webzys Logo" className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl text-center">
              Verify Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter the verification code sent to your mobile
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-500">
                  We've sent a 6-digit verification code to {mobile}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <OtpInput 
                  onComplete={(otpValue) => {
                    setOtp(otpValue);
                    verifyOtp(otpValue);
                  }} 
                />
              </div>
              
              <Button
                onClick={() => verifyOtp()}
                className="w-full"
                disabled={loading || !otp || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
              
              <div className="flex justify-between items-center text-sm mt-4">
                <button 
                  type="button" 
                  onClick={handleBack}
                  className="text-primary hover:underline"
                >
                  Change Mobile Number
                </button>
                
                <button
                  type="button"
                  onClick={resendOtp}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OtpVerification;

