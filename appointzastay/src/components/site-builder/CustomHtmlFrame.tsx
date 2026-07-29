import { cn } from "@/lib/utils";

type CustomHtmlFrameProps = {
  html: string;
  title?: string;
  className?: string;
};

export function CustomHtmlFrame({
  html,
  title = "Custom website",
  className,
}: CustomHtmlFrameProps) {
  return (
    <iframe
      title={title}
      srcDoc={html}
      className={cn("h-full min-h-0 w-full border-0 bg-white", className)}
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-presentation"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
