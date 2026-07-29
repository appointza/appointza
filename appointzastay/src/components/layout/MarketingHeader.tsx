import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getLoginRedirectPath } from "@/models/stay";

const nav = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingHeader() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold">
            Appointza<span className="text-primary">Stay</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/property"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Demo website
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild>
              <Link to={getLoginRedirectPath(user.role)}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="outline" size="sm" className="sm:hidden" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/register">Start free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
