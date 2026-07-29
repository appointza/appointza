import { useEffect, useRef, useState } from "react";
import type { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin, useGoogleOAuth } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5 shrink-0", className)} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError?: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
};

/**
 * Custom-styled Google sign-in that keeps full GIS behavior.
 * The real Google button sits on top at opacity 0.01 (opacity 0 blocks iframe clicks).
 */
export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  loading = false,
  label = "Sign in with Google",
  className,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const [buttonWidth, setButtonWidth] = useState<number>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setButtonWidth(Math.max(Math.floor(container.clientWidth), 280));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const canSignIn = scriptLoadedSuccessfully && buttonWidth && !disabled && !loading;

  return (
    <div ref={containerRef} className={cn("relative w-full min-h-11", className)}>
      <div
        className={cn(
          org.btnOutline,
          "pointer-events-none relative z-0 flex min-h-11 w-full items-center justify-center gap-2.5",
          (disabled || loading) && "opacity-60",
        )}
        aria-hidden
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#E85D4C]" />
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <GoogleMark />
            <span>{label}</span>
          </>
        )}
      </div>

      {canSignIn && (
        <div
          className={cn(
            "absolute inset-0 z-10 min-h-11 w-full cursor-pointer overflow-hidden",
            // GIS iframe ignores clicks at opacity:0 — use near-zero instead
            "opacity-[0.01]",
            "[&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full",
          )}
          aria-label={label}
        >
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            ux_mode="popup"
            use_fedcm_for_button={false}
            use_fedcm_for_prompt={false}
            context="signin"
            theme="outline"
            size="large"
            text="signin_with"
            shape="pill"
            logo_alignment="left"
            width={buttonWidth}
            containerProps={{
              className: "h-full w-full",
              style: { height: "100%", minHeight: 44 },
            }}
          />
        </div>
      )}

      {!scriptLoadedSuccessfully && !loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex min-h-11 items-center justify-center">
          <span className="text-xs text-stone-400">Loading Google Sign-In…</span>
        </div>
      )}
    </div>
  );
}

export default GoogleSignInButton;
