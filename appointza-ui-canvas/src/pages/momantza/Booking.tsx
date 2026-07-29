import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const MomantzaBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [momantzaUrl, setMomantzaUrl] = useState("https://pakshi.momantza.com/admin/bookingsmobile");
  const [iframeError, setIframeError] = useState(false);

  // Get the organization domain from user context or use default
  useEffect(() => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (userContextStr) {
        const userContext = JSON.parse(userContextStr);
        // If user has organization domain, use it to construct the URL with mobile path
        // Otherwise use the default pakshi.momantza.com/admin/bookingsmobile
        if (userContext.organisationdomain) {
          setMomantzaUrl(`https://${userContext.organisationdomain}/admin/bookingsmobile`);
        }
      }
    } catch (error) {
      console.error("Error reading user context:", error);
    }
  }, []);

  const handleOpenInNewTab = () => {
    window.open(momantzaUrl, '_blank');
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Momantza Bookings</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="w-full h-[calc(100vh-64px)] relative">
        {iframeError ? (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            <div className="text-center p-8">
              <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to load Momantza page
              </h3>
              <p className="text-gray-600 mb-4">
                The page cannot be embedded due to security restrictions.
              </p>
         
            </div>
          </div>
        ) : (
          <iframe
            src={momantzaUrl}
            className="w-full h-full border-0"
            title="Momantza Bookings"
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
};

export default MomantzaBooking;
