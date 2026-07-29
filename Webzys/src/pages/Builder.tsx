import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Download,
  Save,
  Plus,
  Settings,
  Layers,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  Loader2,
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
import PageDialog from "@/components/PageDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import webzysLogo from "@/assets/webzys-logo.png";
import BlockPalette from "@/components/builder/BlockPalette";
import BlockEditor from "@/components/builder/BlockEditor";
import PreviewPanel from "@/components/builder/PreviewPanel";
import MediaLibrary from "@/components/builder/MediaLibrary";
import ResumeExportDialog from "@/components/builder/ResumeExportDialog";
import { Block, PageData, MediaItem } from "@/types/builder";
import { WebsiteService } from "@/services/website.service";
import { WebsiteSelectReq, Website, WebsiteData } from "@/models/website.model";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import PaymentDialog from "@/components/PaymentDialog";

// Price per page for export (in rupees)
const PRICE_PER_PAGE = 1;

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [websiteType, setWebsiteType] = useState<string>(searchParams.get("type") || "normal");
  const [websiteName, setWebsiteName] = useState<string>(searchParams.get("name") || "Untitled Website");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showResumeExportDialog, setShowResumeExportDialog] = useState(false);

  const [currentWebsite, setCurrentWebsite] = useState<Website | null>(null);
  const [isLoadingWebsite, setIsLoadingWebsite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [pages, setPages] = useState<Record<string, PageData>>({
    home: {
      id: "home",
      name: "Home",
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          data: {
            title: "Welcome to Your Website",
            subtitle: "Build something amazing with Webzys",
            buttonText: "Get Started",
            backgroundType: "gradient",
          },
          visible: true,
        },
        {
          id: "features-1",
          type: "features",
          data: {
            title: "Why Choose Us",
            features: [
              { icon: "Zap", title: "Fast", description: "Lightning fast performance" },
              { icon: "Shield", title: "Secure", description: "Enterprise-grade security" },
              { icon: "Heart", title: "Loved", description: "Trusted by thousands" },
            ],
          },
          visible: true,
        },
      ],
    },
  });

  // Load website from database if ID is provided and not "new"
  useEffect(() => {
    const loadWebsite = async () => {
      if (!id || id === "new") {
        // New website - use default data from search params
        return;
      }

      const websiteId = parseInt(id, 10);
      if (isNaN(websiteId)) {
        toast({
          title: "Error",
          description: "Invalid website ID",
          variant: "destructive"
        });
        navigate("/dashboard");
        return;
      }

      setIsLoadingWebsite(true);
      try {
        const websiteService = new WebsiteService();
        const req = new WebsiteSelectReq();
        req.id = websiteId;
        
        const websites = await websiteService.select(req);
        if (websites && websites.length > 0) {
          const website = websites[0];
          setCurrentWebsite(website);
          
          // Set website name from database
          if (website.name) {
            setWebsiteName(website.name);
          }
          
          // Set website type from database
          if (website.type) {
            setWebsiteType(website.type);
          }
          
          // Parse website data
          let websiteData: any = {};
          if (typeof website.data === 'string') {
            try {
              websiteData = JSON.parse(website.data);
            } catch (e) {
              console.error("Error parsing website data:", e);
            }
          } else {
            websiteData = website.data || {};
          }

          // Set pages from website data
          if (websiteData.pages && Object.keys(websiteData.pages).length > 0) {
            // Normalize blocks to ensure they have the visible property
            const normalizedPages: Record<string, PageData> = {};
            Object.entries(websiteData.pages).forEach(([pageId, pageData]: [string, any]) => {
              normalizedPages[pageId] = {
                id: pageData.id || pageId,
                name: pageData.name || pageId,
                blocks: (pageData.blocks || []).map((block: any) => ({
                  ...block,
                  visible: block.visible !== undefined ? block.visible : true
                }))
              };
            });
            setPages(normalizedPages);
            setCurrentPage(websiteData.currentPage || Object.keys(normalizedPages)[0] || "home");
          }
        } else {
          toast({
            title: "Error",
            description: "Website not found",
            variant: "destructive"
          });
          navigate("/dashboard");
        }
      } catch (error: any) {
        console.error("Error loading website:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load website",
          variant: "destructive"
        });
        navigate("/dashboard");
      } finally {
        setIsLoadingWebsite(false);
      }
    };

    loadWebsite();
  }, [id, navigate, toast]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"blocks" | "media" | "settings">("blocks");
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  // Shared images state for both Media tab and MediaLibrary
  const [images, setImagesState] = useState<MediaItem[]>([
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
      name: "laptop-coding.jpg",
      size: 245000,
      type: "image/jpeg",
      uploadedAt: new Date().toISOString(),
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      name: "avatar-man.jpg",
      size: 85000,
      type: "image/jpeg",
      uploadedAt: new Date().toISOString(),
    },
  ]);

  // Custom setImages to also update user.media with numeric image IDs
  const setImages = (updater: MediaItem[] | ((prev: MediaItem[]) => MediaItem[])) => {
    setImagesState((prev) => {
      const newImages = typeof updater === 'function' ? updater(prev) : updater;
      if (user && Array.isArray(user.media)) {
        // Find new images (by id) that are not already in media
        const prevIds = new Set(prev.map(img => img.id));
        const newImageIds = newImages
          .filter(img => !prevIds.has(img.id))
          .map(img => Number(img.id))
          .filter(id => !isNaN(id));
        // Add to user.media if not already present
        newImageIds.forEach(id => {
          if (!user.media.includes(id)) {
            user.media.push(id);
          }
        });
      }
      return newImages;
    });
  };

  const currentPageData = pages[currentPage];
  const selectedBlock = currentPageData?.blocks.find((b) => b.id === selectedBlockId);

  const handleAddBlock = (blockType: string) => {
    const newBlock: Block = {
      id: `${blockType}-${Date.now()}`,
      type: blockType,
      data: getDefaultBlockData(blockType),
      visible: true,
    };

    setPages((prev) => {
      const updated = {
        ...prev,
        [currentPage]: {
          ...prev[currentPage],
          blocks: [...prev[currentPage].blocks, newBlock],
        },
      };
      // Auto-save after adding block (async, don't await)
      setTimeout(() => saveWebsiteToDatabase(updated), 0);
      return updated;
    });

    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (blockId: string, data: Record<string, any>) => {
    setPages((prev) => {
      const updated = {
        ...prev,
        [currentPage]: {
          ...prev[currentPage],
          blocks: prev[currentPage].blocks.map((block) =>
            block.id === blockId ? { ...block, data: { ...block.data, ...data } } : block
          ),
        },
      };
      // Auto-save after updating block (async, don't await)
      setTimeout(() => saveWebsiteToDatabase(updated), 0);
      return updated;
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    setPages((prev) => {
      const updated = {
        ...prev,
        [currentPage]: {
          ...prev[currentPage],
          blocks: prev[currentPage].blocks.filter((block) => block.id !== blockId),
        },
      };
      // Auto-save after deleting block (async, don't await)
      setTimeout(() => saveWebsiteToDatabase(updated), 0);
      return updated;
    });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = currentPageData?.blocks.find((b) => b.id === blockId);
    if (block) {
      const newBlock: Block = {
        ...block,
        id: `${block.type}-${Date.now()}`,
      };
      const blockIndex = currentPageData.blocks.findIndex((b) => b.id === blockId);
      setPages((prev) => ({
        ...prev,
        [currentPage]: {
          ...prev[currentPage],
          blocks: [
            ...prev[currentPage].blocks.slice(0, blockIndex + 1),
            newBlock,
            ...prev[currentPage].blocks.slice(blockIndex + 1),
          ],
        },
      }));
    }
  };

  const handleToggleVisibility = (blockId: string) => {
    setPages((prev) => ({
      ...prev,
      [currentPage]: {
        ...prev[currentPage],
        blocks: prev[currentPage].blocks.map((block) =>
          block.id === blockId ? { ...block, visible: !block.visible } : block
        ),
      },
    }));
  };

  // Handle applying a full resume template with pre-filled data
  const handleApplyResumeTemplate = (templateId: "template1" | "template2" | "template3") => {
    // Import the full template data
    import("@/components/blocks/resume/FullResumePreview").then(({ getFullTemplateSampleData }) => {
      const templateData = getFullTemplateSampleData(templateId);
      
      // Create a single block that contains the full resume template
      const newBlock: Block = {
        id: `full-resume-template-${Date.now()}`,
        type: "full-resume-template",
        data: {
          templateId,
          resumeData: templateData,
        },
        visible: true,
      };

      setPages((prev) => {
        const updated = {
          ...prev,
          [currentPage]: {
            ...prev[currentPage],
            blocks: [newBlock],
          },
        };
        // Auto-save after applying template
        setTimeout(() => saveWebsiteToDatabase(updated), 0);
        return updated;
      });

      setSelectedBlockId(newBlock.id);
      
      const templateNames: Record<string, string> = {
        template1: "Classic Professional",
        template2: "Creative Sidebar",
        template3: "Tech Minimal",
      };
      
      toast({
        title: "Template Applied",
        description: `${templateNames[templateId]} template with sample data has been applied. You can now edit all content.`,
      });
    });
  };

  const handleCreatePage = () => {
    setEditingPageId(null);
    setIsPageDialogOpen(true);
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
    setIsPageDialogOpen(true);
  };

  const handleSavePage = async (pageName: string, pageId?: string) => {
    if (pageId) {
      // Edit existing page
      setPages((prev) => {
        const updated = {
          ...prev,
          [pageId]: {
            ...prev[pageId],
            name: pageName,
          },
        };
        // Auto-save after page edit (async, don't await)
        setTimeout(() => saveWebsiteToDatabase(updated), 0);
        return updated;
      });
    } else {
      // Create new page
      const newPageId = pageName.toLowerCase().replace(/\s+/g, "-");
      setPages((prev) => {
        const updated = {
          ...prev,
          [newPageId]: {
            id: newPageId,
            name: pageName,
            blocks: [],
          },
        };
        // Auto-save after page creation (async, don't await)
        setTimeout(() => saveWebsiteToDatabase(updated), 0);
        return updated;
      });
      setCurrentPage(newPageId);
    }
    setEditingPageId(null);
  };

  const handleDeletePage = (pageId: string) => {
    if (Object.keys(pages).length <= 1) {
      alert("Cannot delete the last page. Please create another page first.");
      return;
    }

    setPages((prev) => {
      const newPages = { ...prev };
      delete newPages[pageId];
      // Auto-save after page deletion (async, don't await)
      setTimeout(() => saveWebsiteToDatabase(newPages), 0);
      return newPages;
    });

    // Switch to home page if current page was deleted
    if (currentPage === pageId) {
      const remainingPages = Object.keys(pages).filter((id) => id !== pageId);
      setCurrentPage(remainingPages[0] || "home");
    }
  };

  // Save website to database
  const saveWebsiteToDatabase = async (pagesToSave?: Record<string, PageData>) => {
    // Only save if we have a valid website ID (not "new")
    if (!id || id === "new" || !currentWebsite) {
      return;
    }

    const pagesData = pagesToSave || pages;
    
    try {
      setIsSaving(true);
      const websiteService = new WebsiteService();
      
      // Prepare website data
      const websiteData: WebsiteData = {
        pages: pagesData,
        currentPage: currentPage
      };

      // Update website object
      const updatedWebsite = new Website();
      updatedWebsite.id = currentWebsite.id;
      updatedWebsite.user_id = currentWebsite.user_id;
      updatedWebsite.name = currentWebsite.name;
      updatedWebsite.type = currentWebsite.type;
      updatedWebsite.data = websiteData;
      updatedWebsite.created_at = currentWebsite.created_at;
      updatedWebsite.updated_at = new Date().toISOString();

      // Save to database
      const savedWebsite = await websiteService.update(updatedWebsite);
      
      if (savedWebsite) {
        setCurrentWebsite(savedWebsite);
        
        // Re-parse the saved data to ensure pages state is in sync
        let savedWebsiteData: any = {};
        if (typeof savedWebsite.data === 'string') {
          try {
            savedWebsiteData = JSON.parse(savedWebsite.data);
          } catch (e) {
            console.error("Error parsing saved website data:", e);
            savedWebsiteData = websiteData; // Fallback to what we just saved
          }
        } else {
          savedWebsiteData = savedWebsite.data || websiteData;
        }
        
        // Update pages state with the saved data to keep it in sync
        // Only update if the data structure is different to avoid unnecessary re-renders
        if (savedWebsiteData.pages && Object.keys(savedWebsiteData.pages).length > 0) {
          // Normalize blocks to ensure they have the visible property
          const normalizedPages: Record<string, PageData> = {};
          Object.entries(savedWebsiteData.pages).forEach(([pageId, pageData]: [string, any]) => {
            normalizedPages[pageId] = {
              id: pageData.id || pageId,
              name: pageData.name || pageId,
              blocks: (pageData.blocks || []).map((block: any) => ({
                ...block,
                visible: block.visible !== undefined ? block.visible : true
              }))
            };
          });
          
          // Only update state if pages actually changed (compare JSON strings)
          const currentPagesStr = JSON.stringify(pages);
          const normalizedPagesStr = JSON.stringify(normalizedPages);
          if (currentPagesStr !== normalizedPagesStr) {
            setPages(normalizedPages);
          }
          
          // Update current page if needed
          if (savedWebsiteData.currentPage && savedWebsiteData.currentPage !== currentPage) {
            setCurrentPage(savedWebsiteData.currentPage);
          }
        }
        
        toast({
          title: "Saved",
          description: "Website saved successfully.",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("Error saving website:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save website. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save handler
  const handleSave = async () => {
    await saveWebsiteToDatabase();
  };

  // Show payment dialog before export (only if not already paid)
  const handleExport = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to export your website",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!currentWebsite || !currentWebsite.id) {
      toast({
        title: "Error",
        description: "Please save your website before exporting",
        variant: "destructive"
      });
      return;
    }

    const pageCount = Object.keys(pages).length;
    if (pageCount === 0) {
      toast({
        title: "Error",
        description: "No pages to export",
        variant: "destructive"
      });
      return;
    }

    // If payment already made, export directly
    if (currentWebsite.export_paid) {
      performExport();
      return;
    }

    // Show payment dialog
    setShowPaymentDialog(true);
  };

  // Refresh website data after payment success
  const handlePaymentSuccess = async () => {
    if (!currentWebsite || !currentWebsite.id) return;
    
    try {
      // Reload website to get updated payment status
      const websiteService = new WebsiteService();
      const websites = await websiteService.select({ id: currentWebsite.id, user_id: 0, type: '' });
      if (websites && websites.length > 0) {
        const updatedWebsite = websites[0];
        setCurrentWebsite(updatedWebsite);
        // Parse data if it's a string
        if (typeof updatedWebsite.data === 'string') {
          updatedWebsite.data = JSON.parse(updatedWebsite.data);
        }
        if (updatedWebsite.data && updatedWebsite.data.pages) {
          setPages(updatedWebsite.data.pages);
        }
      }
    } catch (error) {
      console.error('Error refreshing website after payment:', error);
    }
    
    // Perform export
    performExport();
  };

  // Save exported HTML to ReferenceValue
  const saveExportedHtmlToReferenceValue = async (html: string) => {
    if (!currentWebsite || !currentWebsite.id || !user) {
      return;
    }

    try {
      const websiteService = new WebsiteService();
      // Use currentWebsite.name if available, otherwise fall back to websiteName state
      const nameToSend = currentWebsite?.name || websiteName;
      await websiteService.saveExportedHtml({
        website_id: currentWebsite.id,
        html_content: html,
        website_name: nameToSend
      });
      console.log('Exported HTML saved to ReferenceValue successfully');
    } catch (error) {
      console.error('Error saving exported HTML to ReferenceValue:', error);
      // Don't throw - export was successful, this is just a side effect
    }
  };

  // Actual export function called after successful payment
  const performExport = () => {
    try {
      if (!currentPageData) {
        console.error("No page data available");
        toast({
          title: "Error",
          description: "No page data available to export",
          variant: "destructive"
        });
        return;
      }

      console.log("Generating HTML for website type:", websiteType);
      console.log("All pages:", Object.keys(pages).length);

      // Generate single HTML file with all pages
      let html: string;
      try {
        html = generateMultiPageHTML(pages, websiteType);
        console.log("HTML generated, length:", html?.length);
        console.log(websiteType === "appointza" 
          ? "Exporting Appointza template with variables" 
          : "Exporting normal website with actual data");
      } catch (genError) {
        console.error("Error in generateMultiPageHTML:", genError);
        throw genError;
      }
      
      if (!html || html.trim().length === 0) {
        console.error("Generated HTML is empty");
        toast({
          title: "Error",
          description: "Failed to generate HTML. The pages might be empty.",
          variant: "destructive"
        });
        return;
      }

      // Create blob with proper MIME type
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `${websiteName.toLowerCase().replace(/\s+/g, "-")}.html`;
      a.style.display = "none";
      a.setAttribute("download", `${websiteName.toLowerCase().replace(/\s+/g, "-")}.html`);
      
      // Append to body, click, then remove
      document.body.appendChild(a);
      
      // Trigger download
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      a.dispatchEvent(clickEvent);
      
      // Save HTML to ReferenceValue (async, don't block export)
      if (currentWebsite && currentWebsite.id) {
        saveExportedHtmlToReferenceValue(html).catch(error => {
          console.error('Error saving exported HTML to ReferenceValue:', error);
          // Don't show error to user as export was successful
        });
      }
      
      // Cleanup
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 200);
      
      console.log("HTML exported successfully");
    } catch (error) {
      console.error("Error exporting HTML:", error);
      toast({
        title: "Export Error",
        description: `Failed to export HTML: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    }
  };

  // Calculate payment amount
  const pageCount = Object.keys(pages).length;
  const paymentAmount = pageCount * PRICE_PER_PAGE;

  // Show loading state while fetching website
  if (isLoadingWebsite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading website...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={webzysLogo} alt="Webzys" className="h-6 w-auto" />
            <span className="font-semibold text-foreground">
              {currentWebsite?.name || websiteName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                {currentPageData?.name || "Select Page"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {Object.values(pages).map((page) => (
                <DropdownMenuItem
                  key={page.id}
                  onClick={() => setCurrentPage(page.id)}
                  className="flex items-center justify-between"
                >
                  <span className={currentPage === page.id ? "font-semibold" : ""}>
                    {page.name}
                  </span>
                  {currentPage === page.id && (
                    <span className="text-xs text-muted-foreground ml-2">Current</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreatePage}>
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </DropdownMenuItem>
              {Object.values(pages).length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleEditPage(currentPage)}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Current Page
              </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isPreviewMode ? "default" : "outline"}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {websiteType === "resume" ? (
            <Button variant="outline" onClick={() => setShowResumeExportDialog(true)}>
              <Download className="h-4 w-4" />
              Export Resume
            </Button>
          ) : (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          <Button 
            variant="gradient" 
            onClick={handleSave}
            disabled={isSaving || !currentWebsite || id === "new"}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Palette */}
        {!isPreviewMode && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="w-72 border-r border-border bg-card flex flex-col h-full"
          >
            <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as "blocks" | "media" | "settings")} className="flex-1 flex flex-col h-full">
              <TabsList className="w-full rounded-none border-b border-border h-12 bg-transparent">
                <TabsTrigger value="blocks" className="flex-1">
                  <Layers className="h-4 w-4 mr-2" />
                  Blocks
                </TabsTrigger>
                <TabsTrigger value="media" className="flex-1">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="h-full overflow-y-auto overflow-x-hidden space-y-6 pb-6">
                <BlockPalette onAddBlock={handleAddBlock} onApplyResumeTemplate={handleApplyResumeTemplate} websiteType={websiteType} />
              </TabsContent>
              <TabsContent value="media" className="h-full overflow-y-auto overflow-x-hidden p-4 mt-0">
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setIsMediaLibraryOpen(true)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Open Media Library
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Upload and manage images that can be used across all your pages and blocks.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <div key={img.id} className="rounded-lg overflow-hidden border border-border bg-muted">
                        <img src={img.url} alt={img.name} className="w-full h-32 object-cover" />
                        <div className="p-2 text-xs truncate text-center">{img.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="settings" className="h-full overflow-y-auto overflow-x-hidden p-4 mt-0">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Page Name
                    </label>
                    <Input value={currentPageData?.name || ""} onChange={() => {}} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.aside>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto bg-muted/50">
          <PreviewPanel
            blocks={currentPageData?.blocks || []}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            isPreviewMode={isPreviewMode}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onToggleVisibility={handleToggleVisibility}
            onPageLinkClick={(pageId) => {
              if (pages[pageId]) {
                setCurrentPage(pageId);
              }
            }}
            pages={pages}
          />
        </div>

        {/* Right Sidebar - Block Editor */}
        {!isPreviewMode && selectedBlock && (
          <motion.aside
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            className="w-80 border-l border-border bg-card overflow-auto"
          >
            <BlockEditor
              block={selectedBlock}
              onUpdate={(data) => handleUpdateBlock(selectedBlock.id, data)}
              onClose={() => setSelectedBlockId(null)}
              images={images}
              setImages={setImages}
              pages={Object.values(pages).map((p) => ({ id: p.id, name: p.name }))}
            />
          </motion.aside>
        )}
      </div>

      {/* Media Library Modal */}
      <MediaLibrary
        open={isMediaLibraryOpen}
        onOpenChange={setIsMediaLibraryOpen}
        images={images}
        setImages={setImages}
      />

      {/* Page Dialog */}
      <PageDialog
        open={isPageDialogOpen}
        onOpenChange={setIsPageDialogOpen}
        pageName={editingPageId ? pages[editingPageId]?.name : ""}
        pageId={editingPageId || undefined}
        onSave={handleSavePage}
        onDelete={handleDeletePage}
        existingPageNames={Object.values(pages).map((p) => p.name).filter((name, index, self) => {
          // Only include names that aren't the current editing page
          if (editingPageId) {
            return name !== pages[editingPageId]?.name;
          }
          return true;
        })}
      />

      {/* Payment Dialog */}
      {currentWebsite && currentWebsite.id && (
        <PaymentDialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          onSuccess={handlePaymentSuccess}
          websiteId={currentWebsite.id}
          pageCount={pageCount}
          amount={paymentAmount}
        />
      )}

      {/* Resume Export Dialog */}
      <ResumeExportDialog
        open={showResumeExportDialog}
        onOpenChange={setShowResumeExportDialog}
        resumeElementId="resume-preview-container"
        fileName={currentWebsite?.name || websiteName}
      />
    </div>
  );
};

// Helper functions
function getDefaultBlockData(blockType: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    hero: {
      title: "Your Headline Here",
      subtitle: "Add a compelling subtitle that explains your value proposition",
      buttonText: "Get Started",
      backgroundType: "gradient",
    },
    "hero-2": {
      title: "Your Headline Here",
      subtitle: "Add a compelling subtitle that explains your value proposition",
      buttonText: "Get Started",
      secondaryButtonText: "Learn More",
      image: "",
    },
    "hero-3": {
      title: "Your Headline Here",
      subtitle: "Add a compelling subtitle that explains your value proposition",
      buttonText: "Get Started",
    },
    "hero-4": {
      title: "Your Headline Here",
      subtitle: "Add a compelling subtitle that explains your value proposition",
      buttonText: "Get Started",
      image: "",
    },
    "hero-5": {
      title: "Your Headline Here",
      subtitle: "Add a compelling subtitle that explains your value proposition",
      buttonText: "Get Started",
      secondaryButtonText: "Learn More",
      image: "",
    },
    "hero-6": {
      title: "Your Headline Here",
      subtitle: "Add a compelling subtitle that explains your value proposition",
      buttonText: "Get Started",
      secondaryButtonText: "Watch Video",
      videoUrl: "",
    },
    section: {
      title: "Section Title",
      content: "<p>Add your content here. You can use HTML formatting.</p>",
      backgroundImage: "",
      backgroundColor: "#ffffff",
      backgroundOverlay: false,
      overlayOpacity: 0.5,
      textAlign: "center",
      padding: "medium",
      buttonText: "",
      buttonLink: "#",
    },
    text: {
      content: "Add your text content here. You can format it as needed.",
    },
    image: {
      src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
      alt: "Image description",
    },
    "image-carousel": {
      images: [],
      autoPlay: false,
    },
    features: {
      title: "Features",
      features: [
        { icon: "Zap", title: "Feature 1", description: "Description here" },
        { icon: "Shield", title: "Feature 2", description: "Description here" },
        { icon: "Heart", title: "Feature 3", description: "Description here" },
      ],
    },
    cta: {
      title: "Ready to Get Started?",
      subtitle: "Join thousands of satisfied customers today",
      buttonText: "Start Now",
    },
    testimonial: {
      quote: "This product changed my life. Highly recommended!",
      author: "John Doe",
      role: "CEO, Company",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    header: {
      logoText: "Your Logo",
      links: [
        { label: "Home", href: "#" },
        { label: "About", href: "#" },
        { label: "Services", href: "#" },
        { label: "Contact", href: "#" },
      ],
      ctaText: "Get Started",
    },
    footer: {
      companyName: "Your Company",
      description: "Building amazing experiences for our customers.",
      textItems: [
        { text: "About", href: "#" },
        { text: "Contact", href: "#" },
        { text: "Privacy", href: "#" },
      ],
    },
    benefits: {
      title: "Key Benefits",
      benefits: [
        { text: "Benefit 1" },
        { text: "Benefit 2" },
        { text: "Benefit 3" },
      ],
    },
    stats: {
      title: "Our Impact",
      stats: [
        { value: "1000+", label: "Happy Customers" },
        { value: "50+", label: "Projects Completed" },
        { value: "99%", label: "Satisfaction Rate" },
        { value: "24/7", label: "Support Available" },
      ],
    },
    gallery: {
      title: "Our Gallery",
      images: [],
      columns: 3,
    },
    video: {
      title: "Watch Our Story",
      videoUrl: "",
      description: "Learn more about what we do",
    },
    "social-video": {
      title: "Follow Us on Social Media",
      subtitle: "Watch our latest videos and reels",
      columns: 3,
      videos: [
        {
          id: "1",
          platform: "youtube",
          videoUrl: "",
          thumbnail: "",
          title: "YouTube Video 1",
        },
        {
          id: "2",
          platform: "instagram",
          videoUrl: "",
          thumbnail: "",
          title: "Instagram Reel",
        },
        {
          id: "3",
          platform: "youtube",
          videoUrl: "",
          thumbnail: "",
          title: "YouTube Video 2",
        },
      ],
    },
    form: {
      title: "Get In Touch",
      subtitle: "We'd love to hear from you",
      fields: {
        name: true,
        email: true,
        phone: false,
        message: true,
      },
      submitText: "Send Message",
    },
    pricing: {
      title: "Choose Your Plan",
      subtitle: "Select the perfect plan for your needs",
      plans: [
        {
          name: "Starter",
          price: "$9",
          period: "/month",
          description: "Perfect for getting started",
          features: [
            { text: "Feature 1", included: true },
            { text: "Feature 2", included: true },
            { text: "Feature 3", included: false },
          ],
          ctaText: "Get Started",
        },
        {
          name: "Pro",
          price: "$29",
          period: "/month",
          description: "For growing businesses",
          features: [
            { text: "Feature 1", included: true },
            { text: "Feature 2", included: true },
            { text: "Feature 3", included: true },
          ],
          ctaText: "Get Started",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "$99",
          period: "/month",
          description: "For large organizations",
          features: [
            { text: "Feature 1", included: true },
            { text: "Feature 2", included: true },
            { text: "Feature 3", included: true },
          ],
          ctaText: "Contact Sales",
        },
      ],
    },
    reviews: {
      title: "What Our Customers Say",
      reviews: [
        {
          rating: 5,
          comment: "Excellent service!",
          author: "John Doe",
          role: "Customer",
        },
        {
          rating: 5,
          comment: "Highly recommended!",
          author: "Jane Smith",
          role: "Client",
        },
      ],
      autoPlay: false,
    },
    logos: {
      title: "Trusted By",
      logos: [],
    },
    faq: {
      title: "Frequently Asked Questions",
      faqs: [
        {
          question: "What is this service?",
          answer: "This is a comprehensive solution designed to help you achieve your goals efficiently.",
        },
        {
          question: "How do I get started?",
          answer: "Simply sign up for an account and follow the onboarding process.",
        },
      ],
    },
    steps: {
      title: "How It Works",
      subtitle: "Get started in three simple steps",
      steps: [
        { title: "Step 1", description: "Description of the first step" },
        { title: "Step 2", description: "Description of the second step" },
        { title: "Step 3", description: "Description of the third step" },
      ],
    },
    team: {
      title: "Our Team",
      subtitle: "Meet the people behind our success",
      members: [
        {
          name: "John Doe",
          role: "CEO & Founder",
          bio: "Passionate about building great products",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        },
        {
          name: "Jane Smith",
          role: "CTO",
          bio: "Tech enthusiast and problem solver",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
        },
      ],
    },
    // Appointza Blocks
    "appointza-organization": {
      organizationName: "Beauty Salon & Spa",
      organizationTagline: "Your Beauty, Our Passion",
      organizationLogo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop",
      organizationNotes: "We provide premium beauty and wellness services with a focus on quality and customer satisfaction. Our experienced team is dedicated to making you look and feel your best.",
      organizationEmail: "info@beautysalon.com",
      organizationGstNumber: "GST123456789",
    },
    "appointza-location": {
      locationName: "Main Branch",
      addressLine1: "123 Main Street",
      addressLine2: "Suite 100",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      country: "India",
      mobile: "+91 98765 43210",
      googleLocation: "https://maps.google.com/?q=123+Main+Street+Mumbai",
      latitude: 19.0760,
      longitude: 72.8777,
    },
    "appointza-services": {
      title: "Our Services",
      services: [
        {
          id: 1,
          serviceName: "Haircut & Styling",
          prize: 500,
          timeTaken: 60,
          notes: "Professional haircut with styling and finishing",
          imageId: 1,
        },
        {
          id: 2,
          serviceName: "Hair Color",
          prize: 2500,
          timeTaken: 120,
          notes: "Full hair coloring service with premium products",
          imageId: 2,
        },
        {
          id: 3,
          serviceName: "Facial Treatment",
          prize: 1500,
          timeTaken: 90,
          notes: "Deep cleansing facial with massage",
          imageId: 3,
        },
        {
          id: 4,
          serviceName: "Manicure & Pedicure",
          prize: 800,
          timeTaken: 75,
          notes: "Complete nail care and polish",
          imageId: 4,
        },
      ],
    },
    "appointza-timings": {
      title: "Operating Hours",
      timings: [
        { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
        { id: 2, dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
        { id: 3, dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
        { id: 4, dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
        { id: 5, dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
        { id: 6, dayOfWeek: 6, startTime: "10:00", endTime: "16:00" },
      ],
    },
    "appointza-events": {
      title: "Upcoming Events",
      events: [
        {
          id: 1,
          eventName: "Summer Beauty Workshop",
          eventDate: "2024-06-15 14:00:00",
          fromDate: "2024-06-15",
          toDate: "2024-06-15",
          description: "Learn beauty tips and tricks from our expert stylists",
          entryAmount: 500,
          remainingSlot: 15,
          status: "Active",
          imageIds: [5],
        },
        {
          id: 2,
          eventName: "Hair Care Seminar",
          eventDate: "2024-07-20 11:00:00",
          fromDate: "2024-07-20",
          toDate: "2024-07-20",
          description: "Expert advice on maintaining healthy hair",
          entryAmount: 300,
          remainingSlot: 25,
          status: "Active",
          imageIds: [6],
        },
      ],
    },
    "appointza-reviews": {
      title: "Customer Reviews",
      reviews: [
        {
          id: 1,
          rating: 5,
          comment: "Excellent service! The staff is very professional and the results are amazing. Highly recommended!",
          createdAt: "2024-01-15 10:30:00",
          serviceId: 1,
        },
        {
          id: 2,
          rating: 5,
          comment: "Best salon in the city. The hair color turned out exactly as I wanted. Will definitely come back!",
          createdAt: "2024-01-20 14:45:00",
          serviceId: 2,
        },
        {
          id: 3,
          rating: 4,
          comment: "Great facial treatment. My skin feels so smooth and refreshed. The ambiance is also very relaxing.",
          createdAt: "2024-02-01 16:20:00",
          serviceId: 3,
        },
      ],
    },
    "appointza-facilities": {
      title: "Our Facilities",
      facilities: [
        "Free WiFi",
        "Parking Available",
        "Air Conditioned",
        "Wheelchair Accessible",
        "Credit Card Accepted",
        "Loyalty Program",
      ],
    },
    "appointza-location-images": {
      title: "Location Gallery",
      imageIds: [7, 8, 9, 10],
    },
    // Resume Blocks
    "resume-profile": {
      fullName: "John Doe",
      title: "Senior Software Engineer",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      email: "john.doe@email.com",
      phone: "+1 234 567 890",
      location: "San Francisco, CA",
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
      website: "https://johndoe.dev",
    },
    "resume-summary": {
      title: "Professional Summary",
      summary: "Experienced software engineer with 8+ years of expertise in full-stack development. Passionate about building scalable web applications and mentoring junior developers. Strong background in React, Node.js, and cloud technologies.",
    },
    "resume-experience": {
      title: "Work Experience",
      experiences: [
        { id: 1, company: "Tech Corp", position: "Senior Software Engineer", location: "San Francisco, CA", startDate: "2021", endDate: "", current: true, description: "Lead developer for core platform features", achievements: ["Led team of 5 engineers", "Improved performance by 40%"] },
        { id: 2, company: "StartupXYZ", position: "Software Engineer", location: "Remote", startDate: "2018", endDate: "2021", description: "Full-stack development using React and Node.js", achievements: ["Built MVP from scratch", "Scaled to 100k users"] },
      ],
    },
    "resume-education": {
      title: "Education",
      education: [
        { id: 1, institution: "Stanford University", degree: "Master's", field: "Computer Science", startDate: "2016", endDate: "2018", gpa: "3.9" },
        { id: 2, institution: "UC Berkeley", degree: "Bachelor's", field: "Computer Science", startDate: "2012", endDate: "2016", gpa: "3.7" },
      ],
    },
    "resume-skills": {
      title: "Skills",
      displayType: "bars",
      skills: [
        { name: "React/TypeScript", level: 5, category: "Frontend" },
        { name: "Node.js", level: 5, category: "Backend" },
        { name: "Python", level: 4, category: "Backend" },
        { name: "AWS", level: 4, category: "Cloud" },
      ],
    },
    "resume-projects": {
      title: "Projects",
      projects: [
        { id: 1, name: "Portfolio Website", description: "Personal portfolio built with React and Next.js", technologies: ["React", "Next.js", "Tailwind"], liveUrl: "https://example.com" },
      ],
    },
    "resume-certifications": {
      title: "Certifications",
      certifications: [
        { id: 1, name: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2023", credentialUrl: "https://aws.amazon.com" },
      ],
    },
    "resume-languages": {
      title: "Languages",
      languages: [
        { name: "English", proficiency: "Native" },
        { name: "Spanish", proficiency: "Intermediate" },
      ],
    },
    "resume-contact": {
      title: "Get In Touch",
      email: "john.doe@email.com",
      phone: "+1 234 567 890",
      location: "San Francisco, CA",
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
      message: "I'm always open to discussing new opportunities and interesting projects.",
    },
    "custom-html": {
      htmlCode: "",
    },
  };
  return defaults[blockType] || {};
}

function generateMultiPageHTML(allPages: Record<string, PageData>, websiteType: string = "normal"): string {
  const pageEntries = Object.entries(allPages);
  if (pageEntries.length === 0) {
    return "<!DOCTYPE html><html><head><title>Empty Website</title></head><body><p>No pages to display</p></body></html>";
  }

  // Find the first page (or home page) as default
  const defaultPage = allPages["home"] || pageEntries[0][1];
  const defaultPageId = defaultPage.id || pageEntries[0][0];

  // Generate HTML for each page (keep page links for JavaScript navigation)
  const pagesHTML = pageEntries.map(([pageId, pageData]) => {
    const pageHTML = generateHTML(pageData, websiteType, allPages, true); // true = keep page links
    // Extract body content from the generated HTML
    const bodyMatch = pageHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : "";
    
    return `
    <div id="page-${pageId}" class="page-content" style="display: ${pageId === defaultPageId ? 'block' : 'none'};">
      ${bodyContent}
    </div>`;
  }).join("\n");

  // Generate navigation script
  const pageIds = pageEntries.map(([pageId]) => pageId);
  const pageNames = pageEntries.map(([pageId, pageData]) => ({
    id: pageId,
    name: pageData.name.toLowerCase().replace(/\s+/g, '-')
  }));
  
  const navigationScript = `
    <script>
      // Page data
      const pages = ${JSON.stringify(pageNames)};
      const defaultPageId = '${defaultPageId}';
      
      // Get page ID from URL path
      function getPageIdFromPath() {
        const path = window.location.pathname;
        if (path === '/' || path === '') {
          return defaultPageId;
        }
        const pathName = path.replace(/^\\//, '').replace(/\\/$/, '');
        const page = pages.find(p => p.name === pathName);
        return page ? page.id : defaultPageId;
      }
      
      // Get page name from ID
      function getPageNameFromId(pageId) {
        const page = pages.find(p => p.id === pageId);
        return page ? page.name : defaultPageId;
      }
      
      // Page navigation function
      function navigateToPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
          page.style.display = 'none';
        });
        // Show target page
        const targetPage = document.getElementById('page-' + pageId);
        if (targetPage) {
          targetPage.style.display = 'block';
          // Scroll to top
          window.scrollTo(0, 0);
          // Update URL using History API
          const pageName = getPageNameFromId(pageId);
          const newPath = pageId === defaultPageId ? '/' : '/' + pageName;
          window.history.pushState({ pageId: pageId }, '', newPath);
          // Update document title
          const pageData = pages.find(p => p.id === pageId);
          if (pageData) {
            document.title = pageData.name.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()) + ' - ' + document.title.split(' - ').pop();
          }
        }
      }

      // Convert page links to navigation
      function convertPageLinks() {
        document.querySelectorAll('a[href^="#page:"]').forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            const pageId = href.replace('#page:', '');
            link.addEventListener('click', function(e) {
              e.preventDefault();
              navigateToPage(pageId);
            });
            link.setAttribute('href', 'javascript:void(0)');
          }
        });
      }

      // Initialize on page load
      document.addEventListener('DOMContentLoaded', function() {
        convertPageLinks();
        
        // Handle initial page load
        const pageId = getPageIdFromPath();
        if (document.getElementById('page-' + pageId)) {
          navigateToPage(pageId);
        } else {
          navigateToPage(defaultPageId);
        }
      });
      
      // Handle browser back/forward buttons
      window.addEventListener('popstate', function(event) {
        const pageId = event.state ? event.state.pageId : getPageIdFromPath();
        if (document.getElementById('page-' + pageId)) {
          navigateToPage(pageId);
        }
      });

      // Re-convert links after dynamic content loads
      setTimeout(convertPageLinks, 100);
    </script>`;

  // Get styles from the first page
  const firstPageHTML = generateHTML(defaultPage, websiteType, allPages, true);
  const styleMatch = firstPageHTML.match(/<style[^>]*>([\s\S]*)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : "";

  // Get title from first page
  const titleMatch = firstPageHTML.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : defaultPage.name;

  // Combine everything into a single HTML file
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${styles}
    .page-content {
      min-height: 100vh;
      width: 100%;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  ${pagesHTML}
  ${navigationScript}
</body>
</html>`;
}

function generateHTML(pageData: PageData, websiteType: string = "normal", allPages: Record<string, PageData> = {}, keepPageLinks: boolean = false): string {
  // For Appointza websites: Generate template HTML with placeholders ({{variable}})
  // For Normal websites: Generate HTML with actual data (what you see in preview)
  const escapeHtml = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  // Helper to convert page links to proper URLs
  const convertPageLink = (href: string): string => {
    if (href.startsWith("#page:")) {
      if (keepPageLinks) {
        // Keep #page: format for JavaScript navigation in multi-page HTML
        return href;
      }
      const pageId = href.replace("#page:", "");
      const targetPage = allPages[pageId];
      if (targetPage) {
        // Convert to filename based on page name
        return `${targetPage.name.toLowerCase().replace(/\s+/g, "-")}.html`;
      }
      return "#";
    }
    return href;
  };

  // Helper to generate placeholder-based HTML for Appointza blocks
  const generateAppointzaBlockHTML = (block: Block): string => {
    switch (block.type) {
      case "appointza-organization": {
        const hasLogo = block.data.organizationLogo || false;
        const hasGst = block.data.organizationGstNumber || false;
        return `
    <section class="appointza-org-section">
      <div class="appointza-org-container">
        ${hasLogo ? `{{#organizationlogo}}<img src="/api/Files/Get?id={{organisationdetail.organisationlogo}}" alt="{{organisationdetail.name}} Logo" class="appointza-org-logo" />{{/organizationlogo}}` : ''}
        <h1>{{organisationdetail.name}}</h1>
        <p class="appointza-org-tagline">{{organisationdetail.tagline}}</p>
        <p class="appointza-org-notes">{{organisationdetail.notes}}</p>
        <p class="appointza-org-email">Email: {{organizationemail}}</p>
        ${hasGst ? `{{#gstnumber}}<p class="appointza-org-gst">GST: {{organisationdetail.organisationgstnumber}}</p>{{/gstnumber}}` : ''}
        <a href="{{BOOKNOWURL}}" class="appointza-book-button">Book Appointment</a>
      </div>
    </section>`;
      }

      case "appointza-location": {
        return `
    <section class="appointza-location-section">
      <div class="appointza-location-bg"></div>
      <div class="appointza-location-container">
        <h2>Location Details</h2>
        <div class="appointza-location-grid">
          <div class="appointza-location-col">
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="appointza-location-content">
                <h3>Address</h3>
                <div class="appointza-location-text">
                  <p>{{locationdetail.addressline1}}</p>
                  {{#addressline2}}<p>{{locationdetail.addressline2}}</p>{{/addressline2}}
                  <p>{{locationdetail.city}}, {{locationdetail.state}} - {{locationdetail.pincode}}</p>
                  {{#country}}<p>{{locationdetail.country}}</p>{{/country}}
                </div>
              </div>
            </div>
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div class="appointza-location-content">
                <p class="appointza-location-label">Phone</p>
                <p class="appointza-location-value">{{locationdetail.mobile}}</p>
              </div>
            </div>
          </div>
          <div class="appointza-location-col">
            {{#googlemaps}}
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div class="appointza-location-content">
                <h3>Location</h3>
                <a href="{{locationdetail.googlelocation}}" target="_blank" rel="noopener noreferrer" class="appointza-location-link">
                  View on Google Maps
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>
            </div>
            {{/googlemaps}}
            {{#coordinates}}
            <div class="appointza-location-item">
              <div class="appointza-location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
              <div class="appointza-location-content">
                <p class="appointza-location-label">Coordinates</p>
                <p class="appointza-location-value">{{locationdetail.latitude}}, {{locationdetail.longitude}}</p>
              </div>
            </div>
            {{/coordinates}}
          </div>
        </div>
      </div>
    </section>`;
      }

      case "appointza-services": {
        // Always include loop structure in template - backend will handle empty sections
        return `
    <section class="appointza-services-section">
      <div class="appointza-services-bg"></div>
      <div class="appointza-services-container">
        <h2>Our Services</h2>
        <div class="appointza-services-list">
          {{#orgnaisatinservice}}
          <div class="appointza-service-card">
            {{#service_image_id}}
            <div class="appointza-service-image">
              <img src="/api/Files/Get?id={{service_image_id}}" alt="{{Servicename}}" />
            </div>
            {{/service_image_id}}
            <div class="appointza-service-content">
              <h3>{{Servicename}}</h3>
              <div class="appointza-service-details">
                <div class="appointza-service-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span class="appointza-service-price">₹{{prize}}</span>
                </div>
                <div class="appointza-service-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{timetaken}} minutes</span>
                </div>
              </div>
              <div class="appointza-service-notes">
                <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 9 11"></polyline>
                </svg>
                <p>{{notes}}</p>
              </div>
              <a href="{{BOOKNOWURL}}" class="appointza-service-button">Book Appointment</a>
            </div>
          </div>
          {{/orgnaisatinservice}}
        </div>
      </div>
    </section>`;
      }

      case "appointza-timings": {
        // Always include loop structure in template - backend will handle empty sections
        return `
    <section class="appointza-timings-section">
      <div class="appointza-timings-container">
        <h2>Service Timings</h2>
        <div class="appointza-timings-list">
          {{#OrganisationServiceTiming}}
          <div class="appointza-timing-item">
            <p>Day: {{day_name}}</p>
            <p>Time: {{start_time}} - {{end_time}}</p>
          </div>
          {{/OrganisationServiceTiming}}
        </div>
      </div>
    </section>`;
      }

      case "appointza-events": {
        // Always include loop structure in template - backend will handle empty sections
        return `
    <section class="appointza-events-section">
      <div class="appointza-events-bg"></div>
      <div class="appointza-events-container">
        <h2>Upcoming Events</h2>
        {{#hasevents}}
        <div class="appointza-events-list">
          {{#events}}
          <div class="appointza-event-card">
            {{#event_image_id}}
            <div class="appointza-event-image">
              <img src="/api/Files/Get?id={{event_image_id}}" alt="{{event_name}}" />
            </div>
            {{/event_image_id}}
            <div class="appointza-event-content">
              <h3>{{event_name}}</h3>
              <div class="appointza-event-details">
                <div class="appointza-event-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{{event_date}}</span>
                </div>
                <div class="appointza-event-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{from_date}}{{#to_date}} - {{to_date}}{{/to_date}}</span>
                </div>
                <div class="appointza-event-detail-item appointza-event-price">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <span class="appointza-event-amount">₹{{entry_amount}}</span>
                </div>
                <div class="appointza-event-detail-item">
                  <svg class="appointza-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{{remainingslot}} slots remaining</span>
                </div>
              </div>
              <p class="appointza-event-description">{{description}}</p>
              <div class="appointza-event-footer">
                <div class="appointza-event-status">
                  <span class="appointza-status-badge" data-status="{{status}}">{{status}}</span>
                </div>
                <a href="{{EVENTBOOKURL}}" class="appointza-event-button">Book Now</a>
              </div>
            </div>
          </div>
          {{/events}}
        </div>
        {{/hasevents}}
      </div>
    </section>`;
      }

      case "appointza-reviews": {
        // Always include loop structure in template - backend will handle empty sections
        return `
    <section class="appointza-reviews-section">
      <div class="appointza-reviews-container">
        <h2>Customer Reviews</h2>
        <div class="appointza-reviews-list">
          {{#reviews}}
          <div class="appointza-review-item">
            <div class="appointza-review-stars">{{rating_stars}}</div>
            <blockquote>"{{comment}}"</blockquote>
            <p class="appointza-review-date">{{created_at}}</p>
            {{#service_id}}<p class="appointza-review-service">Service ID: {{service_id}}</p>{{/service_id}}
            {{#event_id}}<p class="appointza-review-event">Event ID: {{event_id}}</p>{{/event_id}}
          </div>
          {{/reviews}}
        </div>
      </div>
    </section>`;
      }

      case "appointza-facilities": {
        // Always include loop structure in template - backend will handle empty sections
        return `
    <section class="appointza-facilities-section">
      <div class="appointza-facilities-container">
        <h2>Our Facilities</h2>
        <div class="appointza-facilities-list">
          {{#facilities}}
          <div class="appointza-facility-item">
            <p>{{facility_displaytext}}</p>
          </div>
          {{/facilities}}
        </div>
      </div>
    </section>`;
      }

      case "appointza-location-images": {
        // Always include loop structure in template - backend will handle empty sections
        return `
    <section class="appointza-location-images-section">
      <div class="appointza-location-images-container">
        <h2>Location Gallery</h2>
        <div class="appointza-location-images-grid">
          {{#locationimages}}
          <div class="appointza-location-image-item" onclick='openImagePreview("/api/Files/Get?id={{location_image_id}}")'>
            <img src="/api/Files/Get?id={{location_image_id}}" alt="Location Image" />
          </div>
          {{/locationimages}}
        </div>
      </div>
      <!-- Image Preview Modal -->
      <div id="imagePreviewModal" class="appointza-image-modal" onclick="closeImagePreview()">
        <button class="appointza-image-modal-close" onclick="closeImagePreview()">&times;</button>
        <img id="previewImage" class="appointza-image-modal-img" onclick="event.stopPropagation()" />
      </div>
    </section>`;
      }

      default:
        // For non-appointza blocks, return empty or use normal generation
        return '';
    }
  };

  const generateBlockHTML = (block: Block): string => {
    // Always generate HTML with actual data (what you see in preview)
    // This works for both normal and Appointza websites
    switch (block.type) {
      case "hero": {
        const title = escapeHtml(block.data.title || "Your Headline Here");
        const subtitle = escapeHtml(block.data.subtitle || "Add a compelling subtitle");
        const buttonText = escapeHtml(block.data.buttonText || "Get Started");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        return `
    <section class="hero-section">
      <div class="hero-glow-1"></div>
      <div class="hero-glow-2"></div>
      <div class="hero-content">
        <h1 class="hero-title">${title}</h1>
        <p class="hero-subtitle">${subtitle}</p>
        <a href="${buttonLink}" class="hero-button">${buttonText} <svg class="hero-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
      </div>
      <div class="hero-bottom-gradient"></div>
    </section>`;
      }

      case "hero-2": {
        const title = escapeHtml(block.data.title || "Your Headline Here");
        const subtitle = escapeHtml(block.data.subtitle || "Add a compelling subtitle");
        const buttonText = escapeHtml(block.data.buttonText || "Get Started");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        const secondaryButtonText = escapeHtml(block.data.secondaryButtonText || "");
        const secondaryButtonLink = convertPageLink(block.data.secondaryButtonLink || "#");
        const image = block.data.image || "";
        return `
    <section class="hero-2-section" style="position: relative; min-height: 80vh; display: flex; align-items: center; overflow: hidden; background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), var(--background) 50%, rgba(59, 130, 246, 0.05)); width: 100%; box-sizing: border-box;">
      <div style="max-width: 1280px; margin: 0 auto; width: 100%; padding: 4rem 1.5rem; box-sizing: border-box;">
        <div class="hero-2-grid">
          <div class="hero-2-content" style="display: flex; flex-direction: column; gap: 1.5rem; width: 100%;">
            <h1 class="hero-2-title" style="font-size: 2.25rem; font-weight: 700; color: var(--foreground); line-height: 1.2; margin: 0;">${title}</h1>
            <p class="hero-2-subtitle" style="font-size: 1.125rem; color: var(--muted-foreground); line-height: 1.75; margin: 0;">${subtitle}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem;">
              <a href="${buttonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: var(--primary-foreground); padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); transition: all 0.2s;">${buttonText} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
              ${secondaryButtonText ? `<a href="${secondaryButtonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; border: 2px solid var(--primary); color: var(--primary); padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; transition: all 0.2s; background: transparent;">${secondaryButtonText}</a>` : ""}
            </div>
          </div>
          <div class="hero-2-image" style="position: relative; width: 100%;">
            ${image ? `<div style="background: var(--muted); padding: 1rem; border-radius: 1rem; width: 100%; box-sizing: border-box;"><img src="${escapeHtml(image)}" alt="${title}" style="width: 100%; height: 500px; object-fit: cover; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);" /></div>` : `<div style="width: 100%; height: 500px; background: var(--muted); border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: var(--muted-foreground);">Add an image</div>`}
          </div>
        </div>
      </div>
    </section>`;
      }

      case "hero-3": {
        const title = escapeHtml(block.data.title || "Your Headline Here");
        const subtitle = escapeHtml(block.data.subtitle || "Add a compelling subtitle");
        const buttonText = escapeHtml(block.data.buttonText || "Get Started");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        return `
    <section style="min-height: 60vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 5rem 2rem; background: var(--background);">
      <div style="max-width: 48rem; margin: 0 auto;">
        <h1 style="font-size: clamp(3rem, 6vw, 4.5rem); font-weight: 700; color: var(--foreground); margin-bottom: 1.5rem; line-height: 1.2;">${title}</h1>
        <p style="font-size: clamp(1.25rem, 2.5vw, 1.5rem); color: var(--muted-foreground); margin-bottom: 2rem; max-width: 32rem; margin-left: auto; margin-right: auto;">${subtitle}</p>
        <a href="${buttonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--foreground); color: var(--background); padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; font-size: 1.125rem; text-decoration: none; transition: opacity 0.2s;">${buttonText} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
      </div>
    </section>`;
      }

      case "hero-4": {
        const title = escapeHtml(block.data.title || "Your Headline Here");
        const subtitle = escapeHtml(block.data.subtitle || "Add a compelling subtitle");
        const buttonText = escapeHtml(block.data.buttonText || "Get Started");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        const image = block.data.image || "";
        return `
    <section style="position: relative; min-height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5rem 2rem; overflow: hidden;">
      ${image ? `<div style="position: absolute; inset: 0;"><img src="${escapeHtml(image)}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;" /><div style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5);"></div></div>` : `<div style="position: absolute; inset: 0; background: linear-gradient(to bottom right, var(--primary), rgba(59, 130, 246, 0.6));"></div>`}
      <div style="position: relative; z-index: 10; max-width: 56rem; margin: 0 auto;">
        <h1 style="font-size: clamp(2.25rem, 4vw, 3.75rem); font-weight: 700; color: white; margin-bottom: 1.5rem; line-height: 1.2; filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.3));">${title}</h1>
        <p style="font-size: clamp(1.125rem, 2vw, 1.25rem); color: rgba(255, 255, 255, 0.9); margin-bottom: 2rem; max-width: 32rem; margin-left: auto; margin-right: auto; filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.2));">${subtitle}</p>
        <a href="${buttonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: white; color: var(--foreground); padding: 1rem 2rem; border-radius: 0.75rem; font-weight: 600; font-size: 1.125rem; text-decoration: none; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); transition: all 0.3s;">${buttonText} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
      </div>
    </section>`;
      }

      case "hero-5": {
        const title = escapeHtml(block.data.title || "Your Headline Here");
        const subtitle = escapeHtml(block.data.subtitle || "Add a compelling subtitle");
        const buttonText = escapeHtml(block.data.buttonText || "Get Started");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        const secondaryButtonText = escapeHtml(block.data.secondaryButtonText || "");
        const secondaryButtonLink = convertPageLink(block.data.secondaryButtonLink || "#");
        const image = block.data.image || "";
        return `
    <section style="position: relative; min-height: 70vh; display: flex; align-items: center; padding: 5rem 2rem; background: linear-gradient(to right, rgba(59, 130, 246, 0.1), var(--background), var(--background));">
      <div style="max-width: 1280px; margin: 0 auto; width: 100%;">
        <div class="hero-5-grid">
          <div class="hero-5-content" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <h1 class="hero-5-title" style="font-size: 2.25rem; font-weight: 700; color: var(--foreground); line-height: 1.2; text-align: left; margin: 0;">${title}</h1>
            <p class="hero-5-subtitle" style="font-size: 1.125rem; color: var(--muted-foreground); line-height: 1.75; text-align: left; max-width: 36rem; margin: 0;">${subtitle}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; padding-top: 1rem;">
              <a href="${buttonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: var(--primary-foreground); padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); transition: all 0.2s;">${buttonText} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
              ${secondaryButtonText ? `<a href="${secondaryButtonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; border: 2px solid var(--primary); color: var(--primary); padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; transition: all 0.2s;">${secondaryButtonText}</a>` : ""}
            </div>
          </div>
          <div class="hero-5-image" style="position: relative; height: 400px;">
            ${image ? `<img src="${escapeHtml(image)}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);" />` : `<div style="width: 100%; height: 100%; background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05)); border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: var(--muted-foreground);">Add an image</div>`}
          </div>
        </div>
      </div>
    </section>`;
      }

      case "hero-6": {
        const title = escapeHtml(block.data.title || "Your Headline Here");
        const subtitle = escapeHtml(block.data.subtitle || "Add a compelling subtitle");
        const buttonText = escapeHtml(block.data.buttonText || "Get Started");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        const secondaryButtonText = escapeHtml(block.data.secondaryButtonText || "");
        const secondaryButtonLink = convertPageLink(block.data.secondaryButtonLink || "#");
        const videoUrl = block.data.videoUrl || "";
        return `
    <section style="position: relative; min-height: 90vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 5rem 2rem; overflow: hidden;">
      ${videoUrl ? `<div style="position: absolute; inset: 0;"><video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;"><source src="${escapeHtml(videoUrl)}" type="video/mp4"></video><div style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4);"></div></div>` : `<div style="position: absolute; inset: 0; background: linear-gradient(135deg, var(--primary) 0%, hsl(240, 91%, 65%) 100%);"></div>`}
      <div style="position: relative; z-index: 10; max-width: 56rem; margin: 0 auto;">
        <h1 style="font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; color: white; margin-bottom: 1.5rem; line-height: 1.2; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${title}</h1>
        <p style="font-size: clamp(1.125rem, 2vw, 1.25rem); color: rgba(255, 255, 255, 0.9); margin-bottom: 2rem; max-width: 32rem; margin-left: auto; margin-right: auto; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">${subtitle}</p>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
          <a href="${buttonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: white; color: var(--foreground); padding: 1rem 2rem; border-radius: 0.75rem; font-weight: 600; font-size: 1.125rem; text-decoration: none; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); transition: all 0.3s;">${buttonText} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          ${secondaryButtonText ? `<a href="${secondaryButtonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); color: white; border: 2px solid rgba(255, 255, 255, 0.3); padding: 1rem 2rem; border-radius: 0.75rem; font-weight: 600; font-size: 1.125rem; text-decoration: none; transition: all 0.3s;">▶ ${secondaryButtonText}</a>` : ""}
        </div>
      </div>
    </section>`;
      }

      case "header": {
        const logoText = escapeHtml(block.data.logoText || "Your Logo");
        const links = (block.data.links || []).map((link: any) => 
          `<a href="${convertPageLink(link.href || "#")}" class="nav-link">${escapeHtml(link.label)}</a>`
        ).join("");
        const ctaText = escapeHtml(block.data.ctaText || "");
        const ctaLink = convertPageLink(block.data.ctaLink || "#");
        return `
    <header class="header-section">
      <div class="header-container">
        <div class="header-logo">${block.data.logo ? `<img src="${block.data.logo}" alt="Logo" />` : logoText}</div>
        <nav class="header-nav">${links}${ctaText ? `<a href="${ctaLink}" class="header-cta">${ctaText}</a>` : ""}</nav>
      </div>
    </header>`;
      }

      case "section": {
        const title = escapeHtml(block.data.title || "");
        const content = block.data.content || "";
        const backgroundImage = block.data.backgroundImage || "";
        const backgroundColor = block.data.backgroundColor || "#ffffff";
        const backgroundOverlay = block.data.backgroundOverlay || false;
        const overlayOpacity = block.data.overlayOpacity || 0.5;
        const textAlign = block.data.textAlign || "center";
        const padding = block.data.padding || "medium";
        const buttonText = escapeHtml(block.data.buttonText || "");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        const secondaryButtonText = escapeHtml(block.data.secondaryButtonText || "");
        const secondaryButtonLink = convertPageLink(block.data.secondaryButtonLink || "#");

        const paddingStyles = {
          small: "padding: 3rem 1.5rem;",
          medium: "padding: 5rem 2rem;",
          large: "padding: 8rem 2rem;",
        };

        const textAlignStyle = `text-align: ${textAlign};`;
        const justifyStyle = textAlign === "center" ? "justify-content: center;" : textAlign === "right" ? "justify-content: flex-end;" : "justify-content: flex-start;";

        let backgroundStyle = "";
        if (backgroundImage) {
          backgroundStyle = `background-image: url('${escapeHtml(backgroundImage)}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
        } else {
          backgroundStyle = `background-color: ${backgroundColor};`;
        }

        return `
    <section style="${backgroundStyle} position: relative; ${paddingStyles[padding as keyof typeof paddingStyles]} overflow: hidden;">
      ${backgroundImage && backgroundOverlay ? `<div style="position: absolute; inset: 0; background-color: rgba(0, 0, 0, ${overlayOpacity});"></div>` : ""}
      <div style="position: relative; z-index: 10; max-width: 75rem; margin: 0 auto;">
        <div style="${textAlignStyle}">
          ${title ? `<h2 style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; margin-bottom: 1.5rem; ${backgroundImage && backgroundOverlay ? "color: white;" : "color: var(--foreground);"}">${title}</h2>` : ""}
          ${content ? `<div style="font-size: 1.125rem; line-height: 1.75; margin-bottom: 2rem; max-width: 48rem; ${textAlign === "center" ? "margin-left: auto; margin-right: auto;" : ""} ${backgroundImage && backgroundOverlay ? "color: rgba(255, 255, 255, 0.9);" : "color: var(--muted-foreground);"}">${content}</div>` : ""}
          ${(buttonText || secondaryButtonText) ? `<div style="display: flex; flex-wrap: wrap; gap: 1rem; ${justifyStyle}">
            ${buttonText ? `<a href="${buttonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: var(--primary-foreground); padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; transition: all 0.2s;">${buttonText}</a>` : ""}
            ${secondaryButtonText ? `<a href="${secondaryButtonLink}" style="display: inline-flex; align-items: center; gap: 0.5rem; border: 2px solid ${backgroundImage && backgroundOverlay ? "white" : "var(--primary)"}; color: ${backgroundImage && backgroundOverlay ? "white" : "var(--primary)"}; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; transition: all 0.2s;">${secondaryButtonText}</a>` : ""}
          </div>` : ""}
        </div>
      </div>
    </section>`;
      }

      case "footer": {
        const companyName = escapeHtml(block.data.companyName || "Your Company");
        const description = escapeHtml(block.data.description || "");
        const textItems = block.data.textItems || block.data.links || [];
        const textItemsHTML = textItems.map((item: any) => {
          const text = escapeHtml(item.text || item.label || "");
          const href = convertPageLink(item.href || "#");
          if (href && href !== "#") {
            return `<li><a href="${href}">${text}</a></li>`;
          }
          return `<li>${text}</li>`;
        }).join("");
        return `
    <footer class="footer-section">
      <div class="footer-glow-1"></div>
      <div class="footer-glow-2"></div>
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3>${companyName}</h3>
            <p>${description}</p>
          </div>
          ${textItemsHTML ? `<div class="footer-col">
            <h4>Quick Links</h4>
            <ul>${textItemsHTML}</ul>
          </div>` : ""}
        </div>
        <div class="footer-copyright">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</div>
      </div>
    </footer>`;
      }

      case "features": {
        const title = escapeHtml(block.data.title || "Why Choose Us");
        const features = (block.data.features || []).map((f: any) => `
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>${escapeHtml(f.title || "")}</h3>
            <p>${escapeHtml(f.description || "")}</p>
          </div>`).join("");
        return `
    <section class="features-section">
      <div class="features-glow-1"></div>
      <div class="features-glow-2"></div>
      <div class="features-container">
        <h2 class="features-title">${title}</h2>
        <div class="features-grid">${features}</div>
      </div>
    </section>`;
      }

      case "text": {
        const content = escapeHtml(block.data.content || "").replace(/\n/g, "<br>");
        return `
    <section class="text-section">
      <div class="text-container">
        <div class="text-content">${content}</div>
      </div>
    </section>`;
      }

      case "image": {
        const src = block.data.src || "";
        const alt = escapeHtml(block.data.alt || "Image");
        return `
    <section class="image-section">
      <div class="image-container">
        <div class="image-wrapper">
          <img src="${src}" alt="${alt}" />
        </div>
      </div>
    </section>`;
      }

      case "image-carousel": {
        const images = (block.data.images || []).map((img: any, i: number) => 
          `<div class="carousel-slide ${i === 0 ? 'active' : ''}"><img src="${img.src}" alt="${escapeHtml(img.alt || '')}" /></div>`
        ).join("");
        return `
    <section class="carousel-section">
      <div class="carousel-container">
        <div class="carousel-wrapper">${images}</div>
      </div>
    </section>`;
      }

      case "cta": {
        const title = escapeHtml(block.data.title || "Ready to Get Started?");
        const subtitle = escapeHtml(block.data.subtitle || "");
        const buttonText = escapeHtml(block.data.buttonText || "Start Now");
        const buttonLink = convertPageLink(block.data.buttonLink || "#");
        return `
    <section class="cta-section">
      <div class="cta-glow"></div>
      <div class="cta-container">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <a href="${buttonLink}" class="cta-button">${buttonText} <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
      </div>
    </section>`;
      }

      case "testimonial": {
        const quote = escapeHtml(block.data.quote || "");
        const author = escapeHtml(block.data.author || "");
        const role = escapeHtml(block.data.role || "");
        const avatar = block.data.avatar || "";
        return `
    <section class="testimonial-section">
      <div class="testimonial-quote-1">"</div>
      <div class="testimonial-quote-2">"</div>
      <div class="testimonial-container">
        <div class="testimonial-icon">💬</div>
        <blockquote>${quote}</blockquote>
        <div class="testimonial-author">
          ${avatar ? `<img src="${avatar}" alt="${author}" />` : ""}
          <div>
            <p class="testimonial-name">${author}</p>
            <p class="testimonial-role">${role}</p>
          </div>
        </div>
      </div>
    </section>`;
      }

      case "benefits": {
        const title = escapeHtml(block.data.title || "");
        const benefits = (block.data.benefits || []).map((b: any) => `
          <div class="benefit-item">
            <div class="benefit-check">✓</div>
            <p>${escapeHtml(b.text || "")}</p>
          </div>`).join("");
        return `
    <section class="benefits-section">
      <div class="benefits-container">
        ${title ? `<h2 class="benefits-title">${title}</h2>` : ""}
        <div class="benefits-list">${benefits}</div>
      </div>
    </section>`;
      }

      case "stats": {
        const title = escapeHtml(block.data.title || "");
        const stats = (block.data.stats || []).map((s: any) => `
          <div class="stat-item">
            <div class="stat-value">${escapeHtml(s.value || "")}</div>
            <p class="stat-label">${escapeHtml(s.label || "")}</p>
          </div>`).join("");
        return `
    <section class="stats-section">
      <div class="stats-container">
        ${title ? `<h2 class="stats-title">${title}</h2>` : ""}
        <div class="stats-grid">${stats}</div>
      </div>
    </section>`;
      }

      case "gallery": {
        const title = escapeHtml(block.data.title || "");
        const images = (block.data.images || []).map((img: any) => 
          `<div class="gallery-item"><img src="${img.src}" alt="${escapeHtml(img.alt || '')}" /></div>`
        ).join("");
        return `
    <section class="gallery-section">
      <div class="gallery-container">
        ${title ? `<h2 class="gallery-title">${title}</h2>` : ""}
        <div class="gallery-grid">${images || '<p class="gallery-empty">Add images to the gallery</p>'}</div>
      </div>
    </section>`;
      }

      case "video": {
        const title = escapeHtml(block.data.title || "");
        const description = escapeHtml(block.data.description || "");
        const videoUrl = block.data.videoUrl || "";
        const thumbnail = block.data.thumbnail || "";
        return `
    <section class="video-section">
      <div class="video-container">
        ${title ? `<h2 class="video-title">${title}</h2>` : ""}
        ${description ? `<p class="video-description">${description}</p>` : ""}
        ${videoUrl ? `<div class="video-wrapper"><iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe></div>` : 
          `<div class="video-placeholder">Add a video URL (YouTube or Vimeo)</div>`}
      </div>
    </section>`;
      }

      case "form": {
        const title = escapeHtml(block.data.title || "");
        const subtitle = escapeHtml(block.data.subtitle || "");
        const submitText = escapeHtml(block.data.submitText || "Send Message");
        const fields = block.data.fields || {};
        return `
    <section class="form-section">
      <div class="form-container">
        ${title ? `<h2 class="form-title">${title}</h2>` : ""}
        ${subtitle ? `<p class="form-subtitle">${subtitle}</p>` : ""}
        <form class="form-wrapper">
          ${fields.name ? `<div class="form-field"><label>Name</label><input type="text" name="name" required /></div>` : ""}
          ${fields.email ? `<div class="form-field"><label>Email</label><input type="email" name="email" required /></div>` : ""}
          ${fields.phone ? `<div class="form-field"><label>Phone</label><input type="tel" name="phone" /></div>` : ""}
          ${fields.message ? `<div class="form-field"><label>Message</label><textarea name="message" required></textarea></div>` : ""}
          <button type="submit" class="form-submit">${submitText}</button>
        </form>
      </div>
    </section>`;
      }

      case "pricing": {
        const title = escapeHtml(block.data.title || "");
        const subtitle = escapeHtml(block.data.subtitle || "");
        const plans = (block.data.plans || []).map((plan: any) => {
          const features = (plan.features || []).map((f: any) => 
            `<li class="${f.included ? 'feature-included' : 'feature-excluded'}">${f.included ? '✓' : '✗'} ${escapeHtml(f.text || "")}</li>`
          ).join("");
          return `
          <div class="pricing-plan ${plan.popular ? 'popular' : ''}">
            ${plan.popular ? '<span class="popular-badge">Most Popular</span>' : ''}
            <h3>${escapeHtml(plan.name || "")}</h3>
            <p class="plan-description">${escapeHtml(plan.description || "")}</p>
            <div class="plan-price">
              <span class="price-amount">${escapeHtml(plan.price || "")}</span>
              ${plan.period ? `<span class="price-period">${escapeHtml(plan.period)}</span>` : ""}
            </div>
            <ul class="plan-features">${features}</ul>
            <button class="plan-button">${escapeHtml(plan.ctaText || "Get Started")}</button>
          </div>`;
        }).join("");
        return `
    <section class="pricing-section">
      <div class="pricing-container">
        ${title ? `<h2 class="pricing-title">${title}</h2>` : ""}
        ${subtitle ? `<p class="pricing-subtitle">${subtitle}</p>` : ""}
        <div class="pricing-grid">${plans}</div>
      </div>
    </section>`;
      }

      case "reviews": {
        const title = escapeHtml(block.data.title || "");
        const reviews = block.data.reviews || [];
        const firstReview = reviews[0] || {};
        return `
    <section class="reviews-section">
      <div class="reviews-container">
        ${title ? `<h2 class="reviews-title">${title}</h2>` : ""}
        <div class="review-card">
          ${firstReview.rating ? `<div class="review-stars">${'★'.repeat(firstReview.rating)}</div>` : ""}
          <blockquote>${escapeHtml(firstReview.comment || "")}</blockquote>
          <div class="review-author">
            ${firstReview.avatar ? `<img src="${firstReview.avatar}" alt="${escapeHtml(firstReview.author || '')}" />` : ""}
            <div>
              <p class="review-name">${escapeHtml(firstReview.author || "")}</p>
              <p class="review-role">${escapeHtml(firstReview.role || "")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`;
      }

      case "logos": {
        const title = escapeHtml(block.data.title || "");
        const logos = (block.data.logos || []).map((logo: any) => 
          `<div class="logo-item"><img src="${logo.logo}" alt="${escapeHtml(logo.name || '')}" /></div>`
        ).join("");
        return `
    <section class="logos-section">
      <div class="logos-container">
        ${title ? `<h3 class="logos-title">${title}</h3>` : ""}
        <div class="logos-grid">${logos || '<p>Add client logos</p>'}</div>
      </div>
    </section>`;
      }

      case "faq": {
        const title = escapeHtml(block.data.title || "");
        const faqs = (block.data.faqs || []).map((faq: any) => `
          <div class="faq-item">
            <div class="faq-question">${escapeHtml(faq.question || "")}</div>
            <div class="faq-answer">${escapeHtml(faq.answer || "")}</div>
          </div>`).join("");
        return `
    <section class="faq-section">
      <div class="faq-container">
        ${title ? `<h2 class="faq-title">${title}</h2>` : ""}
        <div class="faq-list">${faqs}</div>
      </div>
    </section>`;
      }

      case "steps": {
        const title = escapeHtml(block.data.title || "");
        const subtitle = escapeHtml(block.data.subtitle || "");
        const steps = (block.data.steps || []).map((step: any, i: number) => `
          <div class="step-item">
            <div class="step-number">${i + 1}</div>
            <h3>${escapeHtml(step.title || "")}</h3>
            <p>${escapeHtml(step.description || "")}</p>
          </div>`).join("");
        return `
    <section class="steps-section">
      <div class="steps-container">
        ${title ? `<h2 class="steps-title">${title}</h2>` : ""}
        ${subtitle ? `<p class="steps-subtitle">${subtitle}</p>` : ""}
        <div class="steps-grid">${steps}</div>
      </div>
    </section>`;
      }

      case "team": {
        const title = escapeHtml(block.data.title || "");
        const subtitle = escapeHtml(block.data.subtitle || "");
        const members = (block.data.members || []).map((member: any) => `
          <div class="team-member">
            <img src="${member.avatar}" alt="${escapeHtml(member.name || '')}" />
            <h3>${escapeHtml(member.name || "")}</h3>
            <p class="member-role">${escapeHtml(member.role || "")}</p>
            ${member.bio ? `<p class="member-bio">${escapeHtml(member.bio)}</p>` : ""}
          </div>`).join("");
        return `
    <section class="team-section">
      <div class="team-container">
        ${title ? `<h2 class="team-title">${title}</h2>` : ""}
        ${subtitle ? `<p class="team-subtitle">${subtitle}</p>` : ""}
        <div class="team-grid">${members}</div>
      </div>
    </section>`;
      }

      case "appointza-organization": {
        const orgName = escapeHtml(block.data.organizationName || "Organization Name");
        const tagline = escapeHtml(block.data.organizationTagline || "");
        const logo = block.data.organizationLogo || "";
        const notes = escapeHtml(block.data.organizationNotes || "");
        const email = escapeHtml(block.data.organizationEmail || "");
        const gst = escapeHtml(block.data.organizationGstNumber || "");
        return `
    <section class="appointza-org-section">
      <div class="appointza-org-container">
        ${logo ? `<img src="${logo}" alt="${orgName} Logo" class="appointza-org-logo" />` : ''}
        <h1>${orgName}</h1>
        ${tagline ? `<p class="appointza-org-tagline">${tagline}</p>` : ''}
        ${notes ? `<p class="appointza-org-notes">${notes}</p>` : ''}
        ${email ? `<p class="appointza-org-email">Email: ${email}</p>` : ''}
        ${gst ? `<p class="appointza-org-gst">GST: ${gst}</p>` : ''}
      </div>
    </section>`;
      }

      case "appointza-location": {
        const address1 = escapeHtml(block.data.address || "");
        const address2 = escapeHtml(block.data.addressLine2 || "");
        const city = escapeHtml(block.data.city || "");
        const state = escapeHtml(block.data.state || "");
        const pincode = escapeHtml(block.data.pincode || "");
        const country = escapeHtml(block.data.country || "");
        const mobile = escapeHtml(block.data.mobile || "");
        const googleLocation = block.data.googleLocation || "";
        const coordinates = block.data.coordinates || "";
        return `
    <section class="appointza-location-section">
      <div class="appointza-location-container">
        <h2>Location Details</h2>
        ${address1 ? `<p>${address1}${address2 ? `, ${address2}` : ''}</p>` : ''}
        ${city || state || pincode ? `<p>${city}${city && state ? ', ' : ''}${state} ${pincode}</p>` : ''}
        ${country ? `<p>${country}</p>` : ''}
        ${mobile ? `<p>Mobile: ${mobile}</p>` : ''}
        ${googleLocation ? `<a href="${googleLocation}" target="_blank">View on Google Maps</a>` : ''}
        ${coordinates ? `<p>Coordinates: ${coordinates}</p>` : ''}
      </div>
    </section>`;
      }

      case "appointza-services": {
        const title = escapeHtml(block.data.title || "Our Services");
        const services = (block.data.services || []).map((s: any) => `
          <div class="appointza-service-item">
            ${s.serviceImage ? `<img src="${s.serviceImage}" alt="${escapeHtml(s.serviceName || '')}" />` : ''}
            <h3>${escapeHtml(s.serviceName || 'Service')}</h3>
            ${s.prize !== undefined ? `<p>Price: ₹${escapeHtml(String(s.prize))}</p>` : ''}
            ${s.timeTaken ? `<p>Time: ${escapeHtml(s.timeTaken)} minutes</p>` : ''}
            ${s.notes ? `<p>${escapeHtml(s.notes)}</p>` : ''}
          </div>`
        ).join("");
        return `
    <section class="appointza-services-section">
      <div class="appointza-services-container">
        <h2>${title}</h2>
        <div class="appointza-services-list">${services}</div>
      </div>
    </section>`;
      }

      case "appointza-timings": {
        const title = escapeHtml(block.data.title || "Service Timings");
        const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const timings = (block.data.timings || []).map((t: any) => {
          const dayName = dayNames[t.dayOfWeek] || `Day ${t.dayOfWeek}`;
          return `
          <div class="appointza-timing-item">
            <p>Day: ${escapeHtml(dayName)}</p>
            <p>Time: ${escapeHtml(t.startTime || '')} - ${escapeHtml(t.endTime || '')}</p>
          </div>`;
        }).join("");
        return `
    <section class="appointza-timings-section">
      <div class="appointza-timings-container">
        <h2>${title}</h2>
        <div class="appointza-timings-list">${timings}</div>
      </div>
    </section>`;
      }

      case "appointza-events": {
        const title = escapeHtml(block.data.title || "Upcoming Events");
        const events = (block.data.events || []).map((e: any) => `
          <div class="appointza-event-item">
            ${e.eventImage ? `<img src="${e.eventImage}" alt="${escapeHtml(e.eventName || '')}" />` : ''}
            <h3>${escapeHtml(e.eventName || 'Event')}</h3>
            ${e.eventDate ? `<p>Date: ${escapeHtml(e.eventDate)}</p>` : ''}
            ${e.fromDate ? `<p>From: ${escapeHtml(e.fromDate)}${e.toDate ? ` to ${escapeHtml(e.toDate)}` : ''}</p>` : ''}
            ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ''}
            ${e.entryAmount !== undefined ? `<p>Amount: ₹${escapeHtml(String(e.entryAmount))}</p>` : ''}
            ${e.remainingSlot !== undefined ? `<p>Slots: ${escapeHtml(String(e.remainingSlot))}</p>` : ''}
            ${e.status ? `<p>Status: ${escapeHtml(e.status)}</p>` : ''}
          </div>`
        ).join("");
        return `
    <section class="appointza-events-section">
      <div class="appointza-events-container">
        <h2>${title}</h2>
        <div class="appointza-events-list">${events}</div>
      </div>
    </section>`;
      }

      case "appointza-reviews": {
        const title = escapeHtml(block.data.title || "Customer Reviews");
        const reviews = (block.data.reviews || []).map((r: any) => `
          <div class="appointza-review-item">
            <div class="appointza-review-stars">${'⭐'.repeat(r.rating || 5)}</div>
            <blockquote>"${escapeHtml(r.comment || '')}"</blockquote>
            ${r.createdAt ? `<p class="appointza-review-date">${escapeHtml(r.createdAt)}</p>` : ''}
            ${r.serviceId ? `<p class="appointza-review-service">Service ID: ${r.serviceId}</p>` : ''}
            ${r.eventId ? `<p class="appointza-review-event">Event ID: ${r.eventId}</p>` : ''}
          </div>`
        ).join("");
        return `
    <section class="appointza-reviews-section">
      <div class="appointza-reviews-container">
        <h2>${title}</h2>
        <div class="appointza-reviews-list">${reviews}</div>
      </div>
    </section>`;
      }

      case "appointza-facilities": {
        const title = escapeHtml(block.data.title || "Our Facilities");
        const facilities = (block.data.facilities || []).map((f: string) => `
          <div class="appointza-facility-item">
            <p>${escapeHtml(f)}</p>
          </div>`
        ).join("");
        return `
    <section class="appointza-facilities-section">
      <div class="appointza-facilities-container">
        <h2>${title}</h2>
        <div class="appointza-facilities-list">${facilities}</div>
      </div>
    </section>`;
      }

      case "appointza-location-images": {
        const title = escapeHtml(block.data.title || "Location Gallery");
        const images = (block.data.imageIds || []).map((imgId: number) => `
          <div class="appointza-location-image-item">
            <img src="http://appointza.com/api/Files/get?id=${imgId}" alt="Location Image" />
          </div>`
        ).join("");
        return `
    <section class="appointza-location-images-section">
      <div class="appointza-location-images-container">
        <h2>${title}</h2>
        <div class="appointza-location-images-grid">${images}</div>
      </div>
    </section>`;
      }

      default:
        return `<section class="default-section"><p>${block.type} block</p></section>`;
    }
  };

  // For Appointza websites, use template placeholders for Appointza blocks
  const blocksHTML = pageData.blocks
    .filter((block) => block.visible)
    .map((block) => {
      // If this is an Appointza website and the block is an Appointza block type,
      // use the template placeholder version
      if (websiteType === "appointza" && block.type.startsWith("appointza-")) {
        return generateAppointzaBlockHTML(block);
      }
      // Otherwise use the normal block HTML with actual data
      return generateBlockHTML(block);
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageData.name)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: hsl(217, 91%, 60%);
      --primary-foreground: hsl(0, 0%, 100%);
      --background: hsl(0, 0%, 100%);
      --foreground: hsl(222, 47%, 11%);
      --card: hsl(0, 0%, 100%);
      --card-foreground: hsl(222, 47%, 11%);
      --muted: hsl(220, 14%, 96%);
      --muted-foreground: hsl(220, 9%, 46%);
      --border: hsl(220, 13%, 91%);
      --secondary: hsl(220, 14%, 96%);
      --secondary-foreground: hsl(222, 47%, 11%);
      --accent: hsl(217, 91%, 60%);
      --accent-foreground: hsl(0, 0%, 100%);
      --gradient-primary: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(240, 91%, 65%) 100%);
      --gradient-glow: radial-gradient(ellipse at center, hsla(217, 91%, 60%, 0.15) 0%, transparent 70%);
      --shadow-sm: 0 1px 2px 0 hsla(222, 47%, 11%, 0.05);
      --shadow-md: 0 4px 6px -1px hsla(222, 47%, 11%, 0.07), 0 2px 4px -2px hsla(222, 47%, 11%, 0.05);
      --shadow-lg: 0 10px 15px -3px hsla(222, 47%, 11%, 0.08), 0 4px 6px -4px hsla(222, 47%, 11%, 0.05);
      --shadow-xl: 0 20px 25px -5px hsla(222, 47%, 11%, 0.1), 0 8px 10px -6px hsla(222, 47%, 11%, 0.05);
      --radius: 0.75rem;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }

    body {
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: var(--foreground);
      background: var(--background);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Ensure all sections take full width */
    section {
      width: 100%;
      box-sizing: border-box;
    }

    /* Hero Section - Matches HeroBlock.tsx */
    .hero-section {
      position: relative;
      min-height: 70vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 5rem 2rem;
      background: var(--gradient-primary);
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .hero-glow-1, .hero-glow-2 {
      position: absolute;
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      filter: blur(3rem);
      animation: pulse 3s ease-in-out infinite;
    }

    .hero-glow-1 {
      top: 25%;
      left: 25%;
      animation-delay: 0s;
    }

    .hero-glow-2 {
      bottom: 25%;
      right: 25%;
      animation-delay: 1s;
    }

    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 56rem;
      margin: 0 auto;
    }

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 700;
      color: var(--primary-foreground);
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }

    .hero-subtitle {
      font-size: clamp(1.125rem, 2vw, 1.25rem);
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--background);
      color: var(--foreground);
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
      text-decoration: none;
    }

    .hero-button:hover {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(1.05);
    }

    .hero-arrow {
      width: 1.25rem;
      height: 1.25rem;
    }

    .hero-bottom-gradient {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8rem;
      background: linear-gradient(to top, rgba(255, 255, 255, 0.1), transparent);
    }

    /* Header Section */
    .header-section {
      position: sticky;
      top: 0;
      z-index: 50;
      width: 100%;
      box-sizing: border-box;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
    }

    .header-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4rem;
    }

    .header-logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--foreground);
    }

    .header-logo img {
      height: 2rem;
      width: auto;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-link {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 0.2s;
    }

    .nav-link:hover {
      color: var(--foreground);
    }

    .header-cta {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background: var(--primary);
      color: var(--primary-foreground);
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }

    /* Footer Section */
    .footer-section {
      padding: 4rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      border-top: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }

    .footer-glow-1, .footer-glow-2 {
      position: absolute;
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: rgba(217, 91%, 60%, 0.05);
      filter: blur(3rem);
    }

    .footer-glow-1 {
      bottom: 0;
      left: 0;
    }

    .footer-glow-2 {
      top: 0;
      right: 0;
    }

    .footer-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .footer-col h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .footer-col h4 {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    .footer-col p {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-bottom: 1rem;
    }

    .footer-col ul {
      list-style: none;
    }

    .footer-col ul li {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-bottom: 0.5rem;
    }

    .footer-col ul a {
      display: block;
      font-size: 0.875rem;
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-col ul a:hover {
      color: var(--foreground);
    }

    .footer-copyright {
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }

    /* Features Section - Matches FeaturesBlock.tsx */
    .features-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom, var(--background), hsla(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .features-glow-1, .features-glow-2 {
      position: absolute;
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: hsla(217, 91%, 60%, 0.05);
      filter: blur(3rem);
    }

    .features-glow-1 {
      top: 0;
      left: 25%;
    }

    .features-glow-2 {
      bottom: 0;
      right: 25%;
    }

    .features-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .features-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 4rem;
      color: var(--foreground);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .features-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .feature-card {
      background: var(--card);
      padding: 2rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      border-color: hsla(217, 91%, 60%, 0.5);
      box-shadow: var(--shadow-lg);
    }

    .feature-icon {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 0.75rem;
      background: hsla(217, 91%, 60%, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
      color: var(--primary);
      transition: background 0.3s ease;
    }

    .feature-card:hover .feature-icon {
      background: hsla(217, 91%, 60%, 0.2);
    }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--foreground);
    }

    .feature-card p {
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Text Section */
    .text-section {
      padding: 4rem 2rem;
      background: var(--background);
      border-top: 1px solid rgba(220, 13%, 91%, 0.5);
      border-bottom: 1px solid rgba(220, 13%, 91%, 0.5);
    }

    .text-container {
      max-width: 48rem;
      margin: 0 auto;
    }

    .text-content {
      color: var(--foreground);
      line-height: 1.75;
      font-size: 1.125rem;
      white-space: pre-wrap;
    }

    /* Image Section */
    .image-section {
      padding: 4rem 2rem;
      background: rgba(220, 14%, 96%, 0.3);
      position: relative;
      overflow: hidden;
    }

    .image-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .image-wrapper {
      position: relative;
    }

    .image-wrapper img {
      width: 100%;
      height: auto;
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(220, 13%, 91%, 0.5);
    }

    /* Carousel Section */
    .carousel-section {
      padding: 4rem 2rem;
      background: linear-gradient(to bottom right, rgba(220, 14%, 96%, 0.5), rgba(220, 14%, 96%, 0.3));
      position: relative;
      overflow: hidden;
    }

    .carousel-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .carousel-wrapper {
      position: relative;
      overflow: hidden;
      border-radius: 1rem;
      aspect-ratio: 16/9;
      background: var(--muted);
    }

    .carousel-slide {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .carousel-slide.active {
      opacity: 1;
    }

    .carousel-slide img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* CTA Section - Matches CTABlock.tsx */
    .cta-section {
      padding: 6rem 2rem;
      background: var(--gradient-primary);
      position: relative;
      overflow: hidden;
    }

    .cta-glow {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      filter: blur(3rem);
      animation: pulse 3s ease-in-out infinite;
    }

    .cta-container {
      max-width: 48rem;
      margin: 0 auto;
      text-align: center;
      position: relative;
      z-index: 10;
    }

    .cta-container h2 {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      color: var(--primary-foreground);
      margin-bottom: 1rem;
    }

    .cta-container p {
      font-size: 1.125rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--background);
      color: var(--foreground);
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      box-shadow: var(--shadow-xl);
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .cta-button:hover {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(1.05);
    }

    /* Testimonial Section - Matches TestimonialBlock.tsx */
    .testimonial-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, hsla(220, 14%, 96%, 0.4), hsla(220, 14%, 96%, 0.2), hsla(220, 14%, 96%, 0.4));
      position: relative;
      overflow: hidden;
    }

    .testimonial-quote-1, .testimonial-quote-2 {
      position: absolute;
      font-size: 9rem;
      font-family: serif;
      line-height: 1;
      color: hsla(217, 91%, 60%, 0.05);
    }

    .testimonial-quote-1 {
      top: 2.5rem;
      left: 2.5rem;
    }

    .testimonial-quote-2 {
      bottom: 2.5rem;
      right: 2.5rem;
      transform: rotate(180deg);
    }

    .testimonial-container {
      max-width: 48rem;
      margin: 0 auto;
      text-align: center;
      position: relative;
      z-index: 10;
    }

    .testimonial-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: linear-gradient(to bottom right, hsla(217, 91%, 60%, 0.2), hsla(217, 91%, 60%, 0.1));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin: 0 auto 2rem;
      box-shadow: var(--shadow-lg);
      border: 1px solid hsla(217, 91%, 60%, 0.2);
    }

    .testimonial-container blockquote {
      font-size: clamp(1.5rem, 3vw, 1.875rem);
      font-weight: 500;
      font-style: italic;
      margin-bottom: 2.5rem;
      line-height: 1.75;
    }

    .testimonial-author {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .testimonial-author img {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(217, 91%, 60%, 0.2);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .testimonial-name {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .testimonial-role {
      color: var(--muted-foreground);
    }

    /* Benefits Section */
    .benefits-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.2), var(--background), rgba(220, 14%, 96%, 0.2));
      position: relative;
      overflow: hidden;
    }

    .benefits-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .benefits-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
    }

    .benefits-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--card);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      transition: all 0.3s;
    }

    .benefit-item:hover {
      border-color: var(--primary);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .benefit-check {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: rgba(217, 91%, 60%, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .benefit-item p {
      font-size: 1.125rem;
      line-height: 1.75;
      flex: 1;
    }

    /* Stats Section */
    .stats-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom right, rgba(217, 91%, 60%, 0.05), var(--background), rgba(217, 91%, 60%, 0.05));
      position: relative;
      overflow: hidden;
    }

    .stats-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .stats-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 4rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: clamp(2.5rem, 5vw, 3.75rem);
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      font-weight: 500;
    }

    /* Gallery Section */
    .gallery-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .gallery-container {
      max-width: 80rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .gallery-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .gallery-item {
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--muted);
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    .gallery-item:hover img {
      transform: scale(1.1);
    }

    .gallery-empty {
      text-align: center;
      padding: 4rem;
      color: var(--muted-foreground);
      border: 2px dashed var(--border);
      border-radius: 1rem;
    }

    /* Video Section */
    .video-section {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom right, rgba(220, 14%, 96%, 0.3), var(--background), rgba(220, 14%, 96%, 0.3));
      position: relative;
      overflow: hidden;
    }

    .video-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .video-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .video-description {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 2rem;
    }

    .video-wrapper {
      position: relative;
      aspect-ratio: 16/9;
      border-radius: 1rem;
      overflow: hidden;
      border: 2px solid var(--border);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .video-wrapper iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .video-placeholder {
      aspect-ratio: 16/9;
      border: 2px dashed var(--border);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--muted);
      color: var(--muted-foreground);
    }

    /* Form Section */
    .form-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .form-container {
      max-width: 32rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .form-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .form-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 3rem;
    }

    .form-wrapper {
      background: var(--card);
      padding: 2rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .form-field input,
    .form-field textarea {
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      font-size: 1rem;
      font-family: inherit;
    }

    .form-field textarea {
      min-height: 120px;
      resize: vertical;
    }

    .form-submit {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary) 0%, hsl(240, 91%, 65%) 100%);
      color: var(--primary-foreground);
      border: none;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .form-submit:hover {
      transform: scale(1.02);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    /* Pricing Section */
    .pricing-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.1), var(--background));
      position: relative;
      overflow: hidden;
    }

    .pricing-container {
      max-width: 80rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .pricing-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .pricing-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 4rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .pricing-plan {
      position: relative;
      background: var(--card);
      border-radius: 1rem;
      border: 2px solid var(--border);
      padding: 2rem;
      transition: all 0.3s;
    }

    .pricing-plan:hover {
      border-color: var(--primary);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .pricing-plan.popular {
      border-color: var(--primary);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      transform: scale(1.05);
    }

    .popular-badge {
      position: absolute;
      top: -0.75rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: var(--primary-foreground);
      padding: 0.25rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .pricing-plan h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .plan-description {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin-bottom: 1rem;
    }

    .plan-price {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      margin-bottom: 2rem;
    }

    .price-amount {
      font-size: 3rem;
      font-weight: 700;
    }

    .price-period {
      color: var(--muted-foreground);
    }

    .plan-features {
      list-style: none;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .feature-included {
      color: var(--foreground);
    }

    .feature-excluded {
      color: var(--muted-foreground);
      text-decoration: line-through;
    }

    .plan-button {
      width: 100%;
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s;
    }

    .pricing-plan.popular .plan-button {
      background: linear-gradient(135deg, var(--primary) 0%, hsl(240, 91%, 65%) 100%);
      color: var(--primary-foreground);
    }

    .pricing-plan:not(.popular) .plan-button {
      background: transparent;
      color: var(--foreground);
      border: 1px solid var(--border);
    }

    .plan-button:hover {
      transform: scale(1.02);
    }

    /* Reviews Section */
    .reviews-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.3), var(--background), rgba(220, 14%, 96%, 0.3));
      position: relative;
      overflow: hidden;
    }

    .reviews-container {
      max-width: 56rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .reviews-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 4rem;
    }

    .review-card {
      background: var(--card);
      padding: 3rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .review-stars {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
      margin-bottom: 1.5rem;
      color: #fbbf24;
      font-size: 1.25rem;
    }

    .review-card blockquote {
      font-size: clamp(1.5rem, 3vw, 1.875rem);
      font-weight: 500;
      font-style: italic;
      text-align: center;
      margin-bottom: 2rem;
      line-height: 1.75;
    }

    .review-author {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .review-author img {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(217, 91%, 60%, 0.2);
    }

    .review-name {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .review-role {
      color: var(--muted-foreground);
      font-size: 0.875rem;
    }

    /* Logos Section */
    .logos-section {
      padding: 4rem 2rem;
      background: var(--background);
      border-top: 1px solid rgba(220, 13%, 91%, 0.5);
      border-bottom: 1px solid rgba(220, 13%, 91%, 0.5);
    }

    .logos-container {
      max-width: 75rem;
      margin: 0 auto;
    }

    .logos-title {
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted-foreground);
      margin-bottom: 3rem;
    }

    .logos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 2rem;
      align-items: center;
    }

    .logo-item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      filter: grayscale(100%);
      opacity: 0.6;
      transition: all 0.3s;
    }

    .logo-item:hover {
      filter: grayscale(0%);
      opacity: 1;
    }

    .logo-item img {
      max-height: 3rem;
      max-width: 100%;
      object-fit: contain;
    }

    /* FAQ Section */
    .faq-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, rgba(220, 14%, 96%, 0.2), var(--background), rgba(220, 14%, 96%, 0.2));
      position: relative;
      overflow: hidden;
    }

    .faq-container {
      max-width: 48rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .faq-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
    }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .faq-item {
      background: var(--card);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      overflow: hidden;
      transition: all 0.3s;
    }

    .faq-item:hover {
      border-color: var(--primary);
    }

    .faq-question {
      padding: 1.5rem;
      font-weight: 600;
      cursor: pointer;
    }

    .faq-answer {
      padding: 0 1.5rem 1.5rem;
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Steps Section */
    .steps-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.1), var(--background));
      position: relative;
      overflow: hidden;
    }

    .steps-container {
      max-width: 80rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .steps-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .steps-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 4rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      position: relative;
    }

    .step-item {
      text-align: center;
      position: relative;
    }

    .step-number {
      width: 6rem;
      height: 6rem;
      border-radius: 50%;
      background: linear-gradient(to bottom right, rgba(217, 91%, 60%, 0.2), rgba(217, 91%, 60%, 0.1));
      border: 4px solid var(--background);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .step-number::after {
      content: '';
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .step-item h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .step-item p {
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Team Section */
    .team-section {
      padding: 6rem 2rem;
      background: linear-gradient(to bottom, var(--background), rgba(220, 14%, 96%, 0.2), var(--background));
      position: relative;
      overflow: hidden;
    }

    .team-container {
      max-width: 75rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .team-title {
      font-size: clamp(1.875rem, 4vw, 2.25rem);
      font-weight: 700;
      text-align: center;
      margin-bottom: 1rem;
    }

    .team-subtitle {
      text-align: center;
      color: var(--muted-foreground);
      margin-bottom: 4rem;
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .team-member {
      background: var(--card);
      border-radius: 1rem;
      border: 1px solid var(--border);
      padding: 2rem;
      text-align: center;
      transition: all 0.3s;
    }

    .team-member:hover {
      border-color: var(--primary);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .team-member img {
      width: 8rem;
      height: 8rem;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 1.5rem;
      border: 4px solid var(--background);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .team-member h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .member-role {
      color: var(--primary);
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .member-bio {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      line-height: 1.75;
    }

    /* Appointza Blocks */
    .appointza-org-section,
    .appointza-location-section,
    .appointza-services-section,
    .appointza-timings-section,
    .appointza-events-section,
    .appointza-reviews-section,
    .appointza-facilities-section,
    .appointza-location-images-section {
      padding: 6rem 2rem;
      position: relative;
      overflow: hidden;
    }

    .appointza-services-section,
    .appointza-events-section,
    .appointza-location-section {
      background: linear-gradient(to bottom, var(--background), rgba(59, 130, 246, 0.05), var(--background));
    }

    .appointza-services-bg,
    .appointza-events-bg,
    .appointza-location-bg {
      position: absolute;
      inset: 0;
      opacity: 0.2;
      pointer-events: none;
    }

    .appointza-services-bg::before,
    .appointza-events-bg::before,
    .appointza-location-bg::before {
      content: '';
      position: absolute;
      top: 25%;
      right: 25%;
      width: 24rem;
      height: 24rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 50%;
      filter: blur(3rem);
    }

    .appointza-services-bg::after,
    .appointza-events-bg::after,
    .appointza-location-bg::after {
      content: '';
      position: absolute;
      bottom: 25%;
      left: 25%;
      width: 24rem;
      height: 24rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 50%;
      filter: blur(3rem);
    }

    .appointza-org-container,
    .appointza-location-container,
    .appointza-services-container,
    .appointza-timings-container,
    .appointza-events-container,
    .appointza-reviews-container,
    .appointza-facilities-container,
    .appointza-location-images-container {
      max-width: 72rem;
      margin: 0 auto;
      position: relative;
      z-index: 10;
    }

    .appointza-location-container {
      max-width: 64rem;
    }

    .appointza-location-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .appointza-location-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .appointza-location-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .appointza-location-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      background: rgba(59, 130, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--primary);
      margin-top: 0.25rem;
    }

    .appointza-location-content {
      flex: 1;
    }

    .appointza-location-content h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--foreground);
      margin-bottom: 0.5rem;
    }

    .appointza-location-text {
      color: var(--muted-foreground);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .appointza-location-text p {
      margin: 0;
      font-size: 0.875rem;
    }

    .appointza-location-label {
      font-size: 0.875rem;
      color: var(--muted-foreground);
      margin: 0 0 0.25rem 0;
    }

    .appointza-location-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
      margin: 0;
    }

    .appointza-location-link {
      color: var(--primary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      transition: opacity 0.2s;
    }

    .appointza-location-link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    .appointza-org-logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 1rem;
    }

    .appointza-org-section h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .appointza-org-tagline {
      font-size: 1.125rem;
      color: var(--muted-foreground);
      margin-bottom: 1rem;
    }

    .appointza-org-notes {
      font-size: 1rem;
      color: var(--foreground);
      margin-bottom: 0.5rem;
    }

    .appointza-location-section h2,
    .appointza-services-section h2,
    .appointza-timings-section h2,
    .appointza-events-section h2,
    .appointza-reviews-section h2,
    .appointza-facilities-section h2,
    .appointza-location-images-section h2 {
      font-size: 2.25rem;
      font-weight: 700;
      text-align: center;
      color: var(--foreground);
      margin-bottom: 2rem;
    }

    @media (min-width: 768px) {
      .appointza-location-section h2 {
        font-size: 2.5rem;
        margin-bottom: 2rem;
      }
    }

    @media (min-width: 768px) {
      .appointza-services-section h2,
      .appointza-events-section h2 {
        font-size: 2.5rem;
      }
    }

    .appointza-location-container p,
    .appointza-facility-item p {
      color: var(--foreground);
      margin-bottom: 0.5rem;
    }

    .appointza-location-container a {
      color: var(--primary);
      text-decoration: none;
    }

    .appointza-services-list,
    .appointza-events-list {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
    }

    @media (min-width: 768px) {
      .appointza-services-list {
        grid-template-columns: repeat(2, 1fr);
      }
      .appointza-events-list {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .appointza-services-list {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .appointza-service-card,
    .appointza-event-card {
      background: var(--card);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      overflow: hidden;
      transition: all 0.3s ease;
      text-align: left;
    }

    .appointza-service-card:hover,
    .appointza-event-card:hover {
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .appointza-service-image,
    .appointza-event-image {
      height: 12rem;
      background: var(--muted);
      overflow: hidden;
    }

    .appointza-service-image img,
    .appointza-event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .appointza-service-content,
    .appointza-event-content {
      padding: 1.5rem;
    }

    .appointza-service-card h3,
    .appointza-event-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 1rem;
    }

    .appointza-service-details,
    .appointza-event-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .appointza-service-detail-item,
    .appointza-event-detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }

    .appointza-icon {
      flex-shrink: 0;
      color: var(--muted-foreground);
    }

    .appointza-service-price,
    .appointza-event-amount {
      font-weight: 600;
      color: var(--primary);
    }

    .appointza-event-price .appointza-icon {
      color: var(--primary);
    }

    .appointza-service-notes {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .appointza-service-notes .appointza-icon {
      margin-top: 0.125rem;
    }

    .appointza-service-notes p {
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--muted-foreground);
      margin: 0;
    }

    .appointza-book-button,
    .appointza-service-button {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      margin-top: 1rem;
      padding: 0.625rem 1.25rem;
      background: hsl(217, 91%, 60%) !important;
      color: white !important;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      width: 100%;
      border: none;
      cursor: pointer;
    }

    .appointza-book-button:hover,
    .appointza-service-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: hsl(217, 91%, 55%) !important;
    }

    .appointza-event-description {
      font-size: 0.875rem;
      line-height: 1.625;
      color: var(--muted-foreground);
      margin: 1rem 0;
    }

    .appointza-event-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .appointza-event-status {
      flex: 1;
    }

    .appointza-event-button {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      padding: 0.625rem 1.25rem;
      background: hsl(217, 91%, 60%) !important;
      color: white !important;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
      border: none;
      cursor: pointer;
    }

    .appointza-event-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: hsl(217, 91%, 55%) !important;
    }

    .appointza-status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      background-color: rgb(243, 244, 246);
      color: rgb(31, 41, 55);
    }

    .appointza-status-badge[data-status="Active"] {
      background-color: rgb(220, 252, 231);
      color: rgb(22, 101, 52);
    }

    .appointza-timings-list,
    .appointza-reviews-list,
    .appointza-facilities-list,
    .appointza-location-images-grid {
      display: grid;
      gap: 1rem;
    }

    .appointza-timing-item,
    .appointza-review-item,
    .appointza-facility-item {
      background: var(--background);
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      text-align: left;
    }

    .appointza-timing-item p,
    .appointza-review-item p {
      font-size: 0.9rem;
      color: var(--muted-foreground);
      margin-bottom: 0.25rem;
    }

    .appointza-review-stars {
      color: gold;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .appointza-review-item blockquote {
      font-size: 1rem;
      font-style: italic;
      margin-bottom: 0.5rem;
      color: var(--foreground);
    }

    .appointza-location-images-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .appointza-location-image-item {
      width: 100%;
      height: 16rem;
      overflow: hidden;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--muted);
    }

    .appointza-location-image-item:hover {
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .appointza-location-image-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .appointza-location-image-item:hover img {
      transform: scale(1.1);
    }

    /* Image Preview Modal */
    .appointza-image-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.9);
      align-items: center;
      justify-content: center;
      padding: 2rem;
      cursor: pointer;
    }

    .appointza-image-modal.active {
      display: flex;
    }

    .appointza-image-modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      font-size: 2rem;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      z-index: 10000;
    }

    .appointza-image-modal-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .appointza-image-modal-img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 0.5rem;
      cursor: default;
    }

    /* Default Section */
    .default-section {
      padding: 4rem 2rem;
      text-align: center;
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.6;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }

      .features-grid,
      .pricing-grid,
      .team-grid,
      .steps-grid {
        grid-template-columns: 1fr;
      }

      .footer-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .pricing-plan.popular {
        transform: scale(1);
      }
    }

    /* Hero Grid Layouts */
    .hero-2-grid,
    .hero-5-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      align-items: center;
      width: 100%;
    }

    @media (min-width: 768px) {
      .hero-2-grid,
      .hero-5-grid {
        grid-template-columns: 1fr 1fr;
      }
      .hero-2-content,
      .hero-5-content {
        order: 0;
      }
      .hero-2-image,
      .hero-5-image {
        order: 0;
      }
      .hero-2-title,
      .hero-5-title {
        font-size: 3rem;
      }
      .hero-2-subtitle,
      .hero-5-subtitle {
        font-size: 1.25rem;
      }
    }

    @media (min-width: 1024px) {
      .hero-2-title,
      .hero-5-title {
        font-size: 3.75rem;
      }
    }
  </style>
</head>
<body>
${blocksHTML}
<script>
  function openImagePreview(imageSrc) {
    const modal = document.getElementById("imagePreviewModal");
    const img = document.getElementById("previewImage");
    if (modal && img) {
      img.src = imageSrc;
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeImagePreview() {
    const modal = document.getElementById("imagePreviewModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // Close on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      closeImagePreview();
    }
  });
</script>
</body>
</html>`;
}

function generateAppointzaTemplateHTML(pageData: PageData): string {
  // Extract data from blocks to generate template placeholders
  const blocks = pageData.blocks.filter((block) => block.visible);
  
  // Find organization block
  const orgBlock = blocks.find((b) => b.type === "appointza-organization");
  const locationBlock = blocks.find((b) => b.type === "appointza-location");
  const servicesBlock = blocks.find((b) => b.type === "appointza-services");
  const timingsBlock = blocks.find((b) => b.type === "appointza-timings");
  const eventsBlock = blocks.find((b) => b.type === "appointza-events");
  const reviewsBlock = blocks.find((b) => b.type === "appointza-reviews");
  const facilitiesBlock = blocks.find((b) => b.type === "appointza-facilities");
  const locationImagesBlock = blocks.find((b) => b.type === "appointza-location-images");

  // Build HTML sections based on blocks
  let htmlContent = `
    <div class="d-flex flex-column p-5">
      <div class="row mb-3 align-items-center">
        <div class="col-12 col-md-6 d-flex flex-column align-items-start justify-content-center">
          <div>
            <div class="h3 primarycolour mb-2 fw-semibold text-start">{{organisationdetail.name}}</div>
            <div class="primarycolour mb-3 text-start">{{organisationdetail.tagline}}</div>
            <div class="d-flex">
              <a href="{{BOOKNOWURL}}" class="btn btn-outline-bg-primary me-2" id="bookAppointment">
                Book Appointment
              </a>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6 text-center mt-4 mt-md-0 d-flex align-items-center justify-content-center">
          {{#organizationlogo}}
          <img src="http://appointza.com/api/Files/get?id={{organisationdetail.organisationlogo}}" alt="{{organisationdetail.name}}" class="img-fluid" style="max-width: 400px; width: 100%; height: auto;" />
          {{/organizationlogo}}
        </div>
      </div>
      <div class="row mb-2">
        <div class="col-6">
          <div class="text-dark h3">About</div>
          <div class="text-small">
            <p>{{OrganisationNotes}}</p>
          </div>
        </div>
        <div class="col-12 col-md-3 ms-auto">
          <div class="backgroundcolour rounded py-2 px-3">
            <div class="mb-1 text-dark">Contact Info</div>
            <div class="mb-2">
              <i class="primarycolour fa-solid fa-location-dot me-2"></i>
              {{#googlemaps}}
              <a href="https://www.google.com/maps/search/?api=1&query={{locationdetail.googlelocation}}" target="_blank" class="text-decoration-none primarycolour" style="text-decoration: none;">
                {{locationdetail.addressline1}}{{#addressline2}}, {{locationdetail.addressline2}}{{/addressline2}}, {{locationdetail.city}}, {{locationdetail.state}}, {{locationdetail.pincode}}
              </a>
              {{/googlemaps}}
            </div>
            <div class="mb-2">
              <i class="primarycolour fa-solid fa-phone me-2"></i>
              <span>{{locationdetail.mobile}}</span>
            </div>
            <div class="mb-3">
              <i class="primarycolour fa-solid fa-envelope me-2"></i>
              <span>{{organizationemail}}</span>
            </div>
            {{#googlemaps}}
            <div class="text-center mt-3">
              <a href="https://www.google.com/maps/dir/?api=1&destination={{locationdetail.googlelocation}}" target="_blank" class="btn btn-outline-bg-primary btn-sm w-100">
                <i class="fa-solid fa-directions me-2"></i>Get Direction
              </a>
            </div>
            {{/googlemaps}}
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-2 me-2">
          <div class="rounded py-3 text-center backgroundcolour">
            <i class="fa-solid fa-star primarycolour mb-2"></i>
            <div class="primarycolour">Quality Service</div>
          </div>
        </div>
        <div class="col-2">
          <div class="rounded py-3 text-center backgroundcolour">
            <i class="fa-solid fa-users primarycolour mb-2"></i>
            <div class="primarycolour">Expert service</div>
          </div>
        </div>
      </div>
    </div>
    <div class="backgroundcolour">
      <div class="row g-3 p-5">
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">500+</div>
            <div class="primarycolour text-center">Happy Client</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">1000+</div>
            <div class="primarycolour text-center">Service Done</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">4.8</div>
            <div class="primarycolour text-center">Rating</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">24/7</div>
            <div class="primarycolour text-center">Support</div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-lg">
          <div class="h5">
            <div class="mb-1 text-center primarycolour">10+</div>
            <div class="primarycolour text-center">Years Experience</div>
          </div>
        </div>
      </div>
    </div>
    <div class="container">`;

  // Location Images Section
  if (locationImagesBlock) {
    htmlContent += `
    {{#locationimages}}
    <div class="p-5">
      <div class="primarycolour h4 mb-4 text-center">Our Location</div>
      <div class="row g-3">
        <div class="col-6 col-md-4 col-lg-3">
          <img src="http://appointza.com/api/Files/get?id={{location_image_id}}" alt="Location Image" class="img-fluid" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
        </div>
      </div>
    </div>
    {{/locationimages}}`;
  }

  // Facilities Section
  if (facilitiesBlock) {
    htmlContent += `
    <div class="p-5">
      <div class="primarycolour h4 mb-4 text-center">Our Facilities</div>
      <div class="row g-4">
        {{#facilities}}
        <div class="col-6 col-md-4 col-lg-3">
          <div class="facility-card rounded p-4 text-center h-100 d-flex flex-column align-items-center">
            <div class="facility-icon">
              <i class="fa-solid fa-check-circle primarycolour facility-icon-item" data-facility="{{facility_displaytext}}" style="font-size: 1.5rem;"></i>
            </div>
            <div class="primarycolour fw-semibold">{{facility_displaytext}}</div>
          </div>
        </div>
        {{/facilities}}
      </div>
    </div>`;
  }

  // Services Section
  if (servicesBlock) {
    htmlContent += `
    <div class="p-5">
      <div class="primarycolour h4 mb-4">Services</div>
      <div class="row g-3">
        {{#orgnaisatinservice}}
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="shadow-sm border rounded p-3 h-100">
            {{#service_image_id}}
            <img src="http://appointza.com/api/Files/get?id={{service_image_id}}" alt="{{Servicename}}" class="img-fluid mb-2" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;" />
            {{/service_image_id}}
            <div class="h4 primarycolour">{{Servicename}}</div>
            <div class="small primarycolour mb-2">{{notes}}</div>
            <div class="primarycolour h5">${"$"}{{prize}} | {{timetaken}} min</div>
          </div>
        </div>
        {{/orgnaisatinservice}}
      </div>
    </div>`;
  }

  // Events Section
  if (eventsBlock) {
    htmlContent += `
    {{#events.0}}
    <div class="p-5">
      <div class="primarycolour h4 mb-4">Upcoming Events</div>
      <div class="row g-3">
        {{#../events}}
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="shadow-sm border rounded p-3 h-100 d-flex flex-column">
            {{#event_image_id}}
            <img src="http://appointza.com/api/Files/get?id={{event_image_id}}" alt="{{event_name}}" class="img-fluid mb-2" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;" />
            {{/event_image_id}}
            <div class="h5 primarycolour mb-2">{{event_name}}</div>
            {{#description}}
            <div class="small primarycolour mb-2 flex-grow-1">{{description}}</div>
            {{/description}}
            <div class="mt-auto">
              {{#event_date}}
              <div class="small primarycolour mb-1">
                <i class="fa-solid fa-calendar me-2"></i>{{event_date}}
              </div>
              {{/event_date}}
              {{#from_date}}
              <div class="small primarycolour mb-1">
                <i class="fa-solid fa-calendar me-2"></i>{{from_date}}{{#to_date}} - {{to_date}}{{/to_date}}
              </div>
              {{/from_date}}
              {{#entry_amount}}
              <div class="primarycolour h6 mb-2">
                <i class="fa-solid fa-tag me-2"></i>${"$"}{{entry_amount}}
              </div>
              {{/entry_amount}}
              {{#remainingslot}}
              <div class="small primarycolour mb-2">
                <i class="fa-solid fa-users me-2"></i>{{remainingslot}} slots remaining
              </div>
              {{/remainingslot}}
            </div>
            <div class="mt-3 pt-3 border-top">
              <a href="{{EVENTBOOKURL}}" class="btn btn-outline-bg-primary w-100">
                <i class="fa-solid fa-calendar-check me-2"></i>Book Event
              </a>
            </div>
          </div>
        </div>
        {{/../events}}
      </div>
    </div>
    {{/events.0}}`;
  }

  // Service Timings Section
  if (timingsBlock) {
    htmlContent += `
    <div class="row p-5">
      <div class="col-12 col-md-6 mb-4 mb-md-0">
        <div class="primarycolour mb-3 h4">Service Timings</div>
        <div class="backgroundcolour p-3 rounded">
          {{#OrganisationServiceTiming}}
          <div class="row">
            <div class="col-6">
              <div>{{day_name}}</div>
            </div>
            <div class="col-6 text-end">
              <div>{{start_time}} - {{end_time}}</div>
            </div>
          </div>
          {{/OrganisationServiceTiming}}
        </div>
      </div>
      <div class="col-12 col-md-3 offset-md-3">
        <div class="backgroundcolour p-4 rounded text-center text-md-start">
          <div class="primarycolour h4 mb-3">Ready to Book?</div>
          <a href="{{BOOKNOWURL}}" class="btn btn-outline-bg-primary" id="bookAppointment">
            Book Now
          </a>
        </div>
      </div>
    </div>`;
  }

  htmlContent += `
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{organisationdetail.name}}</title>
    <!-- Bootstrap 5 CSS (CDN) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
    <!-- Optional: Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.4/font/bootstrap-icons.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" />
    <style>
      /* Small custom styles */
      body {
        font-family: "Poppins", sans-serif;
      }
      .hero {
        background: linear-gradient(135deg, #0d6efd22, #6f42c122);
        border-radius: 0.5rem;
        padding: 3rem 1.5rem;
      }
      .dept-card img {
        height: 160px;
        object-fit: cover;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
      }
      .faculty-photo {
        width: 86px;
        height: 86px;
        object-fit: cover;
        border-radius: 50%;
      }
      footer {
        background: #0b5ed7;
        color: #fff;
      }
      .primarycolour {
        color: #00416a;
      }
      .bg-primary {
        background-color: #00416a !important;
      }
      /* Define matching outline style */
      .btn-outline-bg-primary {
        color: #00416a;
        border: 1px solid #00416a;
      }
      .btn-outline-bg-primary:hover {
        background-color: #00416a;
        color: #fff;
      }
      img {
        width: 100%;
        border-radius: 8px;
        object-fit: cover;
      }
      .backgroundcolour {
        background-color: #f8f8ff;
      }
      .service-timing-row:not(:first-child) {
        margin-top: 0.5rem;
      }
      .facility-card {
        transition: all 0.3s ease;
        border: 1px solid #e0e0e0;
        background: #fff;
        position: relative;
        overflow: hidden;
      }
      .facility-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 65, 106, 0.15);
        border-color: #00416a;
      }
      .facility-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, #00416a, #0d6efd);
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }
      .facility-card:hover::before {
        transform: scaleX(1);
      }
      .facility-icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #00416a22, #0d6efd22);
        border-radius: 12px;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
${htmlContent}
    <!-- Bootstrap JS (bundle includes Popper) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // small JS helpers
      const yearElement = document.getElementById("year");
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }

      // Update facility icons - no function, direct execution
      const facilityMap = {
        "Air Conditioned": "fa-snowflake", "Cafeteria": "fa-utensils", "Card Payment": "fa-credit-card",
        "CCTV Surveillance": "fa-video", "Changing Room": "fa-tshirt", "Child Friendly": "fa-child",
        "Drinking Water": "fa-faucet", "First Aid Facility": "fa-kit-medical", "Power Backup": "fa-bolt",
        "Home Service Available": "fa-house", "Locker Facility": "fa-lock", "Music System": "fa-music",
        "Online Payment": "fa-mobile-screen-button", "Parking Facility": "fa-parking", "Pets Allowed": "fa-paw",
        "Restroom Available": "fa-restroom", "Valet Parking": "fa-car", "Waiting Area": "fa-couch",
        "Wheelchair Accessible": "fa-wheelchair", "Wi-Fi Available": "fa-wifi"
      };
      document.querySelectorAll(".facility-icon-item").forEach(el => {
        const name = el.getAttribute("data-facility");
        const icon = facilityMap[name] || "fa-check-circle";
        el.className = "fa-solid " + icon + " primarycolour facility-icon-item";
        el.setAttribute("data-facility", name);
        el.style.fontSize = "1.5rem";
      });
    </script>
  </body>
</html>`;
}

export default Builder;
