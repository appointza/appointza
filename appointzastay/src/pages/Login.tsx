import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { authService, type StaySignupReq } from "@/services/auth.service";
import { getLoginRedirectPath, isStaffRole, isPlatformAdminRole } from "@/models/stay";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { stayApi } from "@/services/stay.service";
import { normalizeOnboarding } from "@/config/onboardingSteps";

const loginSchema = z.object({
  login: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "" },
  });

  const fillDemo = () => {
    form.setValue("login", "owner@appointzastay.com");
    form.setValue("password", "demo123");
  };

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const session = await login(values.login, values.password);
      toast({ title: "Welcome back!", description: `Signed in as ${session.name}` });

      // First-time / incomplete property setup → resume full-page wizard.
      if (isStaffRole(session.role) && !isPlatformAdminRole(session.role)) {
        try {
          const onboard = await stayApi.dashboard.onboarding();
          const progress = normalizeOnboarding(onboard.onboarding);
          if (!progress.isComplete) {
            const step =
              progress.currentStepId || progress.steps.find((s) => !s.done)?.id || "basic";
            navigate(`/staff/onboarding?step=${encodeURIComponent(step)}`);
            return;
          }
        } catch {
          /* fall through to default dashboard */
        }
      }

      navigate(getLoginRedirectPath(session.role));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast({
        title: "Sign in failed",
        description: err?.response?.data?.message || err?.response?.data?.error || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">
              Appointza<span className="text-primary">Stay</span>
            </CardTitle>
            <CardDescription>Sign in with your email or phone</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Email or phone</Label>
                <Input id="login" {...form.register("login")} placeholder="you@example.com" className="h-11" />
                {form.formState.errors.login && (
                  <p className="text-sm text-destructive">{form.formState.errors.login.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border bg-muted/40 px-3 py-3 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Demo account</p>
              <p>
                Email: <span className="font-mono text-foreground">owner@appointzastay.com</span>
              </p>
              <p>
                Password: <span className="font-mono text-foreground">demo123</span>
              </p>
              <Button type="button" variant="outline" size="sm" className="w-full h-8" onClick={fillDemo}>
                Fill demo credentials
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              New property?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const registerSchema = z
  .object({
    accountType: z.enum(["Guest", "Organisation"]),
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "Organisation",
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const payload: StaySignupReq = {
        accountType: values.accountType,
        name: values.name,
        phone: values.phone,
        email: values.email,
        password: values.password,
      };
      const session = await authService.register(payload);
      toast({ title: "Account created", description: `Welcome, ${session.name}!` });
      navigate(
        isStaffRole(session.role) && !isPlatformAdminRole(session.role)
          ? "/staff/onboarding"
          : getLoginRedirectPath(session.role)
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Registration failed",
        description: err?.response?.data?.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Register as a property owner or guest</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-2">
                {(["Organisation", "Guest"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={form.watch("accountType") === type ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => form.setValue("accountType", type)}
                  >
                    {type === "Organisation" ? "Property owner" : "Guest"}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" {...form.register("password")} />
              </div>
              <div className="space-y-2">
                <Label>Confirm password</Label>
                <Input type="password" {...form.register("confirmPassword")} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
