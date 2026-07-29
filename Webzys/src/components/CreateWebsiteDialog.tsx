import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Calendar, ArrowRight, X, Loader2, FileUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { WebsiteService } from "@/services/website.service";
import { Website, WebsiteData, WebsiteType } from "@/models/website.model";

interface CreateWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteCreated?: () => void; // Callback to refresh website list
}

const CreateWebsiteDialog = ({ open, onOpenChange, onWebsiteCreated }: CreateWebsiteDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"type" | "name">("type");
  const [selectedType, setSelectedType] = useState<WebsiteType | null>(null);
  const [websiteName, setWebsiteName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleTypeSelect = (type: WebsiteType) => {
    setSelectedType(type);
    setStep("name");
  };

  const handleCreate = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a website.",
        variant: "destructive"
      });
      return;
    }

    if (!websiteName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website name.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const websiteService = new WebsiteService();
      
      // Create initial website data with a default home page
      const initialData: WebsiteData = {
        pages: {
          home: {
            id: "home",
            name: "Home",
            blocks: [
              {
                id: "hero-1",
                type: "hero",
                data: {
                  title: "Welcome to " + websiteName,
                  subtitle: "Build something amazing with Webzys",
                  buttonText: "Get Started",
                  buttonLink: "#",
                  backgroundType: "gradient",
                }
              }
            ]
          }
        },
        currentPage: "home"
      };

      // Create website object
      const newWebsite = new Website();
      newWebsite.id = 0; // Will be set by backend
      newWebsite.user_id = user.id;
      newWebsite.name = websiteName.trim();
      newWebsite.type = selectedType || "normal";
      newWebsite.data = initialData;
      newWebsite.created_at = new Date().toISOString();
      newWebsite.updated_at = new Date().toISOString();

      // Insert website into database
      const createdWebsite = await websiteService.insert(newWebsite);

      if (createdWebsite && createdWebsite.id > 0) {
        toast({
          title: "Success!",
          description: "Website created successfully.",
          variant: "default"
        });

        // Navigate to builder with the created website ID
        navigate(`/builder/${createdWebsite.id}`);
        
        // Close dialog and reset state
        onOpenChange(false);
        resetState();

        // Refresh website list in dashboard
        if (onWebsiteCreated) {
          onWebsiteCreated();
        }
      } else {
        throw new Error("Failed to create website");
      }
    } catch (error: any) {
      console.error("Error creating website:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create website. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetState = () => {
    setStep("type");
    setSelectedType(null);
    setWebsiteName("");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {step === "type" ? "Choose Website Type" : "Name Your Website"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "type" ? (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 pt-4"
            >
              <p className="text-muted-foreground mb-6">
                Select the type of website you want to create
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Normal Website */}
                <button
                  onClick={() => handleTypeSelect("normal")}
                  className="group relative flex flex-col items-start p-6 rounded-xl border-2 border-border hover:border-primary bg-card transition-all duration-200 text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Normal Website
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Full-featured page builder with all blocks
                  </p>
                  <ArrowRight className="absolute top-6 right-6 h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>

                {/* Appointza Website */}
                <button
                  onClick={() => handleTypeSelect("appointza")}
                  className="group relative flex flex-col items-start p-6 rounded-xl border-2 border-border hover:border-purple-500 bg-card transition-all duration-200 text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Appointza Website
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Booking and appointment-focused
                  </p>
                  <ArrowRight className="absolute top-6 right-6 h-5 w-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Resume Website */}
                <button
                  onClick={() => handleTypeSelect("resume")}
                  className="group relative flex flex-col items-start p-6 rounded-xl border-2 border-border hover:border-emerald-500 bg-card transition-all duration-200 text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <FileUser className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Resume
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Professional resume/CV builder
                  </p>
                  <ArrowRight className="absolute top-6 right-6 h-5 w-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 pt-4"
            >
              <button
                onClick={() => setStep("type")}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
              >
                ← Back to type selection
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  selectedType === "appointza" 
                    ? "bg-purple-500/10" 
                    : selectedType === "resume"
                    ? "bg-emerald-500/10"
                    : "bg-primary/10"
                }`}>
                  {selectedType === "appointza" ? (
                    <Calendar className="h-5 w-5 text-purple-500" />
                  ) : selectedType === "resume" ? (
                    <FileUser className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Globe className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creating</p>
                  <p className="font-medium text-foreground">
                    {selectedType === "appointza" ? "Appointza Website" : selectedType === "resume" ? "Resume" : "Normal Website"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website-name">Website Name</Label>
                  <Input
                    id="website-name"
                    placeholder="My Awesome Website"
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    autoFocus
                  />
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  disabled={!websiteName.trim() || isCreating}
                  onClick={handleCreate}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Website
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWebsiteDialog;
