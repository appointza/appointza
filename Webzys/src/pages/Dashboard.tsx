import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Plus, 
  Globe, 
  Calendar, 
  MoreHorizontal, 
  Search,
  Grid3X3,
  List,
  Settings,
  LogOut,
  ChevronDown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { WebsiteService } from "@/services/website.service";
import { WebsiteSelectReq, Website } from "@/models/website.model";
import webzysLogo from "@/assets/webzys-logo.png";
import CreateWebsiteDialog from "@/components/CreateWebsiteDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userContext = localStorage.getItem('user_context');
    
    if (!token || !userContext || !isAuthenticated) {
      navigate('/login', { 
        state: { from: '/dashboard' },
        replace: true 
      });
    }
  }, [isAuthenticated, navigate]);

  // Fetch websites for the logged-in user
  const fetchWebsites = async () => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const websiteService = new WebsiteService();
      const req = new WebsiteSelectReq();
      req.user_id = user.id;
      
      const fetchedWebsites = await websiteService.select(req);
      setWebsites(fetchedWebsites);
    } catch (error: any) {
      console.error("Error fetching websites:", error);
      toast({
        title: "Error",
        description: "Failed to load websites. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchWebsites();
    }
  }, [isAuthenticated, user?.id, toast]);

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Helper function to get pages from website data
  const getPages = (website: Website): Record<string, any> => {
    if (typeof website.data === 'string') {
      try {
        const parsed = JSON.parse(website.data);
        return parsed.pages || {};
      } catch {
        return {};
      }
    }
    return website.data?.pages || {};
  };

  // Helper function to get page count
  const getPageCount = (website: Website): number => {
    const pages = getPages(website);
    return Object.keys(pages).length || 0;
  };

  // Helper function to render logo thumbnail
  const renderLogoThumbnail = (website: Website) => {
    if (website.type === "appointza") {
      // Appointza logo - using purple background with calendar icon
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-white mx-auto mb-2" />
            <span className="text-white font-bold text-xl">Appointza</span>
          </div>
        </div>
      );
    } else {
      // Webzys logo
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
          <img 
            src={webzysLogo} 
            alt="Webzys" 
            className="h-20 w-auto max-w-[80%] object-contain"
          />
        </div>
      );
    }
  };

  const filteredWebsites = websites.filter((website) =>
    website.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWebsiteClick = (websiteId: number) => {
    navigate(`/builder/${websiteId}`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={webzysLogo} alt="Webzys" className="h-8 w-auto" />
            <span className="text-xl font-bold text-foreground">Webzys</span>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user?.username?.charAt(0).toUpperCase() || user?.mobile?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block">
                    {user?.username || user?.mobile || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Websites</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your websites
            </p>
          </div>
          <Button variant="gradient" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-5 w-5" />
            New Website
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Websites Grid/List */}
        {filteredWebsites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No websites yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first website to get started
            </p>
            <Button variant="gradient" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-5 w-5" />
              Create Website
            </Button>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebsites.map((website, index) => (
              <motion.div
                key={website.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group card-elevated rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer"
                onClick={() => handleWebsiteClick(website.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <div className="w-full h-full group-hover:scale-105 transition-transform duration-300">
                    {renderLogoThumbnail(website)}
                  </div>
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="glass" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Logo Badge */}
                  <div className="absolute top-3 left-3">
                    {website.type === "appointza" ? (
                      <div className="px-2 py-1 rounded-md bg-purple-500/90 backdrop-blur-sm flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-white" />
                        <span className="text-xs font-semibold text-white">Appointza</span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm flex items-center gap-1.5 shadow-sm">
                        <img 
                          src={webzysLogo} 
                          alt="Webzys" 
                          className="h-4 w-auto"
                        />
                        <span className="text-xs font-semibold text-foreground">Webzys</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex-1">
                      {website.name}
                    </h3>
                    {/* Logo in card info */}
                    <div className="flex-shrink-0">
                      {website.type === "appointza" ? (
                        <div className="h-6 w-6 rounded bg-purple-500/10 flex items-center justify-center">
                          <Calendar className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                      ) : (
                        <img 
                          src={webzysLogo} 
                          alt="Webzys" 
                          className="h-6 w-auto opacity-80"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>{getPageCount(website)} pages</span>
                    <span>{formatDate(website.updated_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWebsites.map((website, index) => (
              <motion.div
                key={website.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 bg-card transition-all duration-200 cursor-pointer"
                onClick={() => handleWebsiteClick(website.id)}
              >
                <div className="h-16 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {renderLogoThumbnail(website)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {website.name}
                    </h3>
                    {/* Logo in list view */}
                    {website.type === "appointza" ? (
                      <div className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-3 w-3 text-purple-600" />
                      </div>
                    ) : (
                      <img 
                        src={webzysLogo} 
                        alt="Webzys" 
                        className="h-5 w-auto opacity-80 flex-shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {website.type === "appointza" ? (
                        <Calendar className="h-3 w-3" />
                      ) : (
                        <Globe className="h-3 w-3" />
                      )}
                      {website.type === "appointza" ? "Appointza" : "Website"}
                    </span>
                    <span>{getPageCount(website)} pages</span>
                    <span>{formatDate(website.updated_at)}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <CreateWebsiteDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onWebsiteCreated={fetchWebsites}
      />
    </div>
  );
};

export default Dashboard;
