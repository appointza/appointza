import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type BrowseNavKey = "/" | "/events" | "/services" | "/organisations";

export type PublicBrowseShellProps = {
  title: string;
  metaDescription?: string;
  heading: string;
  description?: ReactNode;
  /** Optional footer line below description (cross-links etc.) */
  footnote?: ReactNode;
  children: ReactNode;
};

export function PublicBrowseShell({
  title,
  metaDescription = "Discover on Appointza.",
  heading,
  description,
  footnote,
  children,
}: PublicBrowseShellProps) {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const browseClasses = (path: BrowseNavKey) =>
    cn(
      "transition-colors whitespace-nowrap",
      pathname === path ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-blue-600"
    );

  return (
    <div className="flex min-h-screen flex-col bg-appointza-light text-slate-900 antialiased">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <header className="sticky top-0 z-50 border-b border-blue-50 bg-white shadow-[0_8px_30px_-22px_rgba(36,76,170,0.3)] md:bg-white/90 md:backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity w-fit">
            <img
              src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="bg-gradient-appointza bg-clip-text text-lg font-extrabold text-transparent">Appointza</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium md:justify-center md:flex-1">
            <Link to="/" className={browseClasses("/")}>
              Home
            </Link>
            <Link to="/events" className={browseClasses("/events")}>
              Events
            </Link>
            <Link to="/services" className={browseClasses("/services")}>
              Services
            </Link>
            <Link to="/organisations" className={browseClasses("/organisations")}>
              Organisations
            </Link>
            <Link to="/explore" className="whitespace-nowrap text-slate-600 transition-colors hover:text-blue-600">
              Explore
            </Link>
          </nav>

          <nav className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-sm font-medium text-slate-600 sm:justify-end">
            {isAuthenticated ? (
              <Link to="/user/profile" className="transition-colors hover:text-blue-600">
                Profile
              </Link>
            ) : (
              <>
                <Link to="/login" className="transition-colors hover:text-blue-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl bg-gradient-appointza px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:brightness-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 max-w-7xl mx-auto w-full pb-12 space-y-6 flex-1">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">{heading}</h1>
          {description ? <div className="text-zinc-600 mt-2 max-w-3xl">{description}</div> : null}
          {footnote ? <div className="text-sm text-zinc-500 mt-3">{footnote}</div> : null}
        </div>
        {children}
      </main>

      <Footer />
    </div>
  );
}
