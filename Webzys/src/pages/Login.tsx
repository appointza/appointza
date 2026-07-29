import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UsersService } from "@/services/users.service";
import { UsersGetOtpReq } from "@/models/users.model";
import webzysLogo from "@/assets/webzys-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setMobile, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mobile, setMobileState] = useState('');
  const [mobileError, setMobileError] = useState('');
  
  // Get the intended destination from state, if any
  const from = location.state?.from?.pathname || location.state?.from || '/dashboard';

  // Check if user is already authenticated on page load
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Mobile validation function
  const validateMobile = (mobileNumber: string): boolean => {
    // Remove any spaces, dashes, or other characters
    const cleanMobile = mobileNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if mobile number is valid (10-15 digits, allowing country codes)
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(cleanMobile)) {
      setMobileError('Please enter a valid mobile number (10-15 digits)');
      return false;
    }
    
    // Check if it's too short
    if (cleanMobile.length < 10) {
      setMobileError('Mobile number must be at least 10 digits');
      return false;
    }
    
    // Clear any existing error
    setMobileError('');
    return true;
  };

  // Get OTP function
  const getOtp = async () => {
    // Clear any previous errors
    setMobileError('');
    
    // Clean the mobile number
    const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
    
    // Validate mobile number
    if (!validateMobile(cleanMobile)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const usersService = new UsersService();
      let getotpreq = new UsersGetOtpReq();
      getotpreq.mobile = cleanMobile;
      
      let getotpresp = await usersService.getotp(getotpreq);
      
      if (getotpresp) {
        setMobile(cleanMobile);
        
        toast({
          title: "OTP Sent",
          description: `We've sent a verification code to ${cleanMobile}`,
        });
        
        // Navigate to OTP verification page
        navigate('/otp', { 
          state: { 
            mobile: cleanMobile,
            name: getotpresp.name || 'User',
            from: from
          } 
        });
      } else {
        toast({
          title: "Failed to send OTP",
          description: "Please try again.",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error("OTP Error:", error);
      
      var message = error?.response?.data?.message || error?.message || 'Failed to send OTP';
      
      if (message && (message.includes('duplicate') || message.includes('already exists'))) {
        setMobileError('This mobile number is already registered');
      } else if (message.includes('500') || message.includes('Internal Server Error')) {
        toast({
          title: "Server Error",
          description: "Server is temporarily unavailable. Please try again later.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "OTP Error",
          description: message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getOtp();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 left-4">
          <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <img src={webzysLogo} alt="Webzys Logo" className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl text-center">Login to Webzys</CardTitle>
            <CardDescription className="text-center">
              Login with your mobile number
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobileState(e.target.value);
                    setMobileError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
                      if (cleanMobile.length === 10 && /^[0-9]{10}$/.test(cleanMobile)) {
                        e.preventDefault();
                        getOtp();
                      }
                    }
                  }}
                  placeholder="Enter your mobile number (e.g., 9876543210)"
                  required
                />
                {mobileError && (
                  <p className="text-sm text-red-500">{mobileError}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Get OTP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
