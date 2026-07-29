import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { userService } from "@/services/user.service";

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Email and password are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await userService.login({ email, password });

      const role = result.role?.toLowerCase();
      const isAdmin = role === "admin" || role === "admin_staff";

      toast({
        title: "Welcome back!",
        description: `Signed in as ${isAdmin ? "Administrator" : "Staff Member"}`,
      });
      navigate(isAdmin ? "/admin" : "/staff");
    } catch (error: any) {
      let message = "Sign in failed. Please try again.";
      const responseData = error?.response?.data;
      if (typeof responseData === "string") {
        try {
          const parsed = JSON.parse(responseData);
          message = parsed?.message || parsed?.key || message;
        } catch {
          message = responseData || message;
        }
      } else if (responseData) {
        message = responseData?.message || responseData?.error || responseData?.key || message;
      }

      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Campusza Logo" className="h-16 w-16 rounded-2xl object-cover shadow-lg" />
            </div>
            <CardTitle className="text-2xl font-display font-bold">
              Welcome to <span className="text-primary">Campusza</span>
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your school management dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@school.edu"
                  className="h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                variant="hero"
                className="w-full h-12 mt-2"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>

            <div className="mt-6 text-center space-y-3">
              <a href="#" className="text-sm text-primary hover:underline block">
                Forgot your password?
              </a>
              <div className="text-sm text-muted-foreground">
                New organization?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Register here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
