import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-slate-950 text-slate-300">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-bold text-white">
                Appointza<span className="text-primary">Stay</span>
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Hotel management software and party hall booking platform for India — free hotel booking website,
              room reservation system, property management, and direct online bookings in one dashboard.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-display font-semibold text-white">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/property" className="hover:text-white">
                  Demo property site
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display font-semibold text-white">Get started</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register" className="hover:text-white">
                  Start free
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white">
                  Owner sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Appointza Stay. Built for property owners across India.
        </div>
      </div>
    </footer>
  );
}
