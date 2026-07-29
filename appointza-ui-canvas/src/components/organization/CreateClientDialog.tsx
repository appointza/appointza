import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import { UsersRegisterReq, UsersLoginReq, UsersGetOtpReq } from "@/models/users.model";
import OtpInput from "@/components/auth/OtpInput";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: () => void;
}

const CreateClientDialog = ({ open, onOpenChange, onClientCreated }: CreateClientDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
  });
  const [otp, setOtp] = useState("");

  const usersService = new UsersService();

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the client's name",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.mobile.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter mobile number",
        variant: "destructive",
      });
      return false;
    }
    if (formData.mobile.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create registration request (as a regular user, not organization)
      const registerReq = new UsersRegisterReq();
      registerReq.username = formData.name.trim();
      registerReq.usermobile = formData.mobile.trim();
      registerReq.useremail = formData.email.trim() || "";
      registerReq.usermobilecountrycode = "+91"; // Default to India
      
      // Set organization fields to 0/null for regular user
      registerReq.organisationid = 0;
      registerReq.organisationname = "";
      registerReq.primarytype = 0;
      registerReq.secondarytype = 0;
      registerReq.latitude = 0;
      registerReq.longitude = 0;

      // Call register API which will send OTP
      const response = await usersService.register(registerReq);
      
      if (response) {
        toast({
          title: "OTP Sent",
          description: `We've sent a verification code to ${formData.mobile}`,
        });
        // Move to OTP verification step
        setStep("otp");
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const currentOtp = otpValue || otp;
    
    if (!currentOtp || currentOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const loginReq = new UsersLoginReq();
      loginReq.mobile = formData.mobile;
      loginReq.otp = currentOtp;

      const loginResp = await usersService.login(loginReq);
      
      if (loginResp && loginResp.userid && loginResp.userid > 0) {
        toast({
          title: "Client Created Successfully",
          description: `${formData.name} has been added as a client`,
        });
        
        // Reset form and close dialog
        setFormData({ name: "", mobile: "", email: "" });
        setOtp("");
        setStep("form");
        onOpenChange(false);
        
        // Notify parent to refresh client list
        onClientCreated();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "OTP verification failed";
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const getOtpReq = new UsersGetOtpReq();
      getOtpReq.mobile = formData.mobile;
      await usersService.getotp(getOtpReq);
      toast({
        title: "OTP Resent",
        description: `We've sent a new verification code to ${formData.mobile}`,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to resend OTP";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === "otp") {
      // Ask for confirmation if in OTP step
      if (window.confirm("Are you sure you want to cancel? The OTP verification will be lost.")) {
        setStep("form");
        setOtp("");
        onOpenChange(false);
      }
    } else {
      setFormData({ name: "", mobile: "", email: "" });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === "form" ? "Create New Client" : "Verify Mobile Number"}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Enter client details to create a new user account. They will be able to book appointments and events."
              : `Enter the 6-digit verification code sent to ${formData.mobile}`}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter client's full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, mobile: value });
                }}
                maxLength={10}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <OtpInput
                onComplete={(otpValue) => {
                  setOtp(otpValue);
                  handleVerifyOtp(otpValue);
                }}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-blue-600 hover:underline"
                disabled={loading}
              >
                Change Mobile Number
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-blue-600 hover:underline"
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "form" ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={loading}>
                {loading ? "Sending OTP..." : "Create User & Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={() => handleVerifyOtp()}
                disabled={loading || !otp || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Create"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientDialog;
