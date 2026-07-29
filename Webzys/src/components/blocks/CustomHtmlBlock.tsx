import { useState, useRef, useEffect } from "react";

interface CustomHtmlBlockProps {
  data: {
    htmlCode?: string;
  };
}

const CustomHtmlBlock = ({ data }: CustomHtmlBlockProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(300);

  const htmlCode = data.htmlCode || "";

  useEffect(() => {
    if (!iframeRef.current || !htmlCode) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          </style>
        </head>
        <body>${htmlCode}</body>
      </html>
    `);
    doc.close();

    // Auto-resize iframe to content height
    const resizeObserver = new ResizeObserver(() => {
      if (doc.body) {
        const height = doc.body.scrollHeight;
        setIframeHeight(Math.max(100, Math.min(height, 2000)));
      }
    });

    if (doc.body) {
      resizeObserver.observe(doc.body);
      // Initial height
      setTimeout(() => {
        if (doc.body) {
          setIframeHeight(Math.max(100, Math.min(doc.body.scrollHeight, 2000)));
        }
      }, 100);
    }

    return () => resizeObserver.disconnect();
  }, [htmlCode]);

  if (!htmlCode) {
    return (
      <div className="flex items-center justify-center py-16 bg-muted/30">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Custom HTML Block</p>
          <p className="text-sm">Click to edit and paste your HTML code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        title="Custom HTML Preview"
        sandbox="allow-scripts allow-same-origin"
        className="w-full border-0"
        style={{ height: `${iframeHeight}px` }}
      />
    </div>
  );
};

export default CustomHtmlBlock;
