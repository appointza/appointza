import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Check, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/AuthService";
// Removed FilesService import - using mock implementation

type UserRole = "user" | "organization";

interface AuthFormProps {
  onSuccess: (userType: UserRole) => void;
}

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState(["", "", "", "", "", ""]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Form values
  const [mobileNumber, setMobileNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [address, setAddress] = useState("");

  // Image upload states
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);

  // Mock file service since API services are removed

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    setUploadedImageId(null);
  };

  const uploadImage = async () => {
    if (!profileImage) return null;
    
    try {
      setIsUploading(true);
      // Mock image upload since API services are removed
      const mockImageId = Date.now();
      setUploadedImageId(mockImageId);
      return mockImageId;
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber || mobileNumber.length < 10) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid mobile number",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would trigger an API call to send OTP
    setOtpSent(true);
    toast({
      title: "OTP Sent",
      description: "Please check your phone for the verification code",
    });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting a full OTP
      const pastedValue = value.slice(0, 6).split("");
      const newOtp = [...otpValue];
      pastedValue.forEach((val, i) => {
        if (i < 6) newOtp[i] = val;
      });
      setOtpValue(newOtp);
      return;
    }

    // For normal input
    const newOtp = [...otpValue];
    newOtp[index] = value;
    setOtpValue(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpValue.join("");
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    
    // Upload image if selected
    let finalImageId = uploadedImageId;
    if (profileImage && !uploadedImageId) {
      finalImageId = await uploadImage();
    }
    
    toast({
      title: "Success!",
      description: activeTab === "login" 
        ? "You have successfully logged in" 
        : "Your account has been created successfully",
    });

    console.log('OTP verified, calling onSuccess with userRole:', userRole);
    if (finalImageId) {
      console.log('Profile image uploaded with ID:', finalImageId);
    }

    // Mock authentication by setting the auth token in localStorage
    localStorage.setItem('auth_token', 'mock_token_' + Date.now());
    
    // Call the onSuccess callback with user type after successful verification
    onSuccess(userRole);
    
    // Reset form state
    setOtpSent(false);
    setOtpValue(["", "", "", "", "", ""]);
    setProfileImage(null);
    setProfileImagePreview(null);
    setUploadedImageId(null);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userRole === "user") {
      if (!name || !mobileNumber) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!orgName || !mobileNumber || !businessType || !address) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
    }
    
    // In a real app, this would register the user and then send OTP
    setOtpSent(true);
    toast({
      title: "OTP Sent",
      description: "Please check your phone for the verification code",
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-block">
          <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16Z" 
              fill="url(#paint0_linear)" 
            />
            <defs>
              <linearGradient id="paint0_linear" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1AAFCC" />
                <stop offset="0.5" stopColor="#FF8A50" />
                <stop offset="1" stopColor="#F04E98" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-appointza-navy mt-2">Appointza</h2>
        <p className="text-gray-600 mt-1">Scheduling made simple</p>
      </div>

      {!otpSent ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-mobile">Mobile Number</Label>
                <Input
                  id="login-mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full bg-gradient-appointza hover:opacity-90">
                Send OTP
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="mt-6">
            <div className="mb-6">
              <div className="flex justify-center space-x-4">
                <Button 
                  variant={userRole === "user" ? "default" : "outline"}
                  onClick={() => setUserRole("user")}
                  className={userRole === "user" ? "bg-gradient-appointza hover:opacity-90" : ""}
                >
                  User
                </Button>
                <Button 
                  variant={userRole === "organization" ? "default" : "outline"}
                  onClick={() => setUserRole("organization")}
                  className={userRole === "organization" ? "bg-gradient-appointza hover:opacity-90" : ""}
                >
                  Organization
                </Button>
              </div>
            </div>
            
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Profile Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="profile-image">
                  {userRole === "user" ? "Profile Picture" : "Organization Logo"} (optional)
                </Label>
                
                {profileImagePreview ? (
                  <div className="relative w-24 h-24 mx-auto">
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => document.getElementById('profile-image')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center">
                  Max file size: 5MB. Formats: JPG, PNG, GIF
                </p>
              </div>

              {userRole === "user" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-mobile">Mobile Number</Label>
                    <Input
                      id="signup-mobile"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email (optional)</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      type="text"
                      placeholder="Enter organization name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="org-mobile">Mobile Number</Label>
                    <Input
                      id="org-mobile"
                      type="tel"
                      placeholder="Enter contact number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Email</Label>
                    <Input
                      id="org-email"
                      type="email"
                      placeholder="Enter business email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-type">Business Type</Label>
                    <Input
                      id="business-type"
                      type="text"
                      placeholder="e.g., Salon, Clinic, Education"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter business address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              
              <Button type="submit" className="w-full bg-gradient-appointza hover:opacity-90" disabled={isUploading}>
                {isUploading ? "Processing..." : "Sign Up & Get OTP"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-appointza-navy">Verify your phone number</h3>
            <p className="text-sm text-gray-500 mt-1">
              We've sent a 6-digit code to {mobileNumber}
            </p>
          </div>
          
          {/* Show image preview if uploaded */}
          {profileImagePreview && (
            <div className="text-center">
              <img
                src={profileImagePreview}
                alt="Profile preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 mx-auto"
              />
              <p className="text-xs text-gray-500 mt-1">
                {userRole === "user" ? "Profile picture" : "Organization logo"} ready to upload
              </p>
            </div>
          )}
          
          <div className="flex justify-center gap-2">
            {otpValue.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 text-center text-lg p-0"
              />
            ))}
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={handleVerifyOtp} 
              className="w-full bg-gradient-appointza hover:opacity-90"
              disabled={isUploading}
            >
              <Check className="mr-2 h-4 w-4" /> 
              {isUploading ? "Uploading Image..." : "Verify OTP"}
            </Button>
          </div>
          
          <div className="text-center text-sm">
            <button 
              type="button" 
              className="text-appointza-teal hover:underline"
              onClick={() => setOtpSent(false)}
            >
              Back to {activeTab === "login" ? "login" : "signup"}
            </button>
            <span className="text-gray-500 mx-2">•</span>
            <button 
              type="button" 
              className="text-appointza-teal hover:underline"
              onClick={() => {
                toast({
                  title: "OTP resent",
                  description: "Please check your phone for the new code",
                });
                setOtpValue(["", "", "", "", "", ""]);
              }}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        {activeTab === "login" ? (
          <p>Don't have an account? <button type="button" className="text-appointza-teal font-medium hover:underline" onClick={() => setActiveTab("signup")}>Sign up</button></p>
        ) : (
          <p>Already have an account? <button type="button" className="text-appointza-teal font-medium hover:underline" onClick={() => setActiveTab("login")}>Log in</button></p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
