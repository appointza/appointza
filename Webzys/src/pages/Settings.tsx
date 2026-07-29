import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon,
  User,
  Building2,
  MapPin,
  ArrowLeft,
  Loader2,
  FileText,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import { UserDetailsWithOrganisationRes } from "@/models/users.model";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceValue } from "@/models/referencevalue.model";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceType } from "@/models/referencetype.model";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetailsWithOrganisationRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReferenceValue[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [updating, setUpdating] = useState(false);
  

  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { 
        state: { from: '/settings' },
        replace: true 
      });
      return;
    }

    loadSettingsData();
    loadTemplates();
  }, [isAuthenticated, user, navigate]);

  const loadSettingsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const usersService = new UsersService();
      const details = await usersService.getUserDetailsWithOrganisation();
      setUserDetails(details);
      
      // Set default selected location
      if (details.locations && details.locations.length > 0) {
        // Try to get from localStorage first, otherwise use first location
        const userContextStr = localStorage.getItem('user_context');
        if (userContextStr) {
          try {
            const userContext = JSON.parse(userContextStr);
            const defaultLocationId = userContext.organisationlocationid || 0;
            if (defaultLocationId > 0 && details.locations.some(loc => loc.id === defaultLocationId)) {
              setSelectedLocationId(defaultLocationId.toString());
            } else {
              setSelectedLocationId(details.locations[0].id.toString());
            }
          } catch {
            setSelectedLocationId(details.locations[0].id.toString());
          }
        } else {
          setSelectedLocationId(details.locations[0].id.toString());
        }
      }
    } catch (error: any) {
      console.error("Error loading settings data:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load settings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!user) return;

    // Get organisationid from localStorage
    const userContextStr = localStorage.getItem('user_context');
    if (!userContextStr) {
      console.warn("No user context found in localStorage");
      return;
    }

    try {
      const userContext = JSON.parse(userContextStr);
      const organisationid = userContext.organisationid || 0;

      if (organisationid <= 0) {
        console.warn("Invalid organisationid");
        return;
      }

      setLoadingTemplates(true);
      const referenceValueService = new ReferenceValueService();
      const templateList = await referenceValueService.select({
        id: 0,
        parentid: 0,
        referencetypeid: 5,
        organisationid: organisationid,
        identifier: ''
      });
      
      setTemplates(templateList);
      
      if (templateList.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(templateList[0].id.toString());
      }
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId) {
      toast({
        title: "No Template Selected",
        description: "Please select a template to update",
        variant: "destructive"
      });
      return;
    }

    if (!selectedLocationId) {
      toast({
        title: "No Location Selected",
        description: "Please select a location to update",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      const organisationLocationService = new OrganisationLocationService();
      
      // Update the templateid in OrganisationLocation table
      const updatedTemplateId = await organisationLocationService.updateLocationTemplateId({
        organisationlocationid: parseInt(selectedLocationId),
        templateid: parseInt(selectedTemplateId)
      });
      
      if (updatedTemplateId > 0) {
        const selectedLocation = userDetails?.locations?.find(loc => loc.id.toString() === selectedLocationId);
        const locationName = selectedLocation?.name || 'Location';
        toast({
          title: "Success",
          description: `Template updated successfully for ${locationName}`,
        });
      } else {
        toast({
          title: "Warning",
          description: "Template update completed but no confirmation received",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update template",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };


  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">View your account and organization information</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {/* User Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>User Information</CardTitle>
                      <CardDescription>Your account details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Username</p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {userDetails?.user?.name || user.username || user.mobile || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Mobile Number</p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {userDetails?.user?.mobile || user.mobile || "Not set"}
                        </p>
                      </div>
                    </div>
                    {(userDetails?.user?.email || user.email) && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p className="text-lg font-semibold text-foreground mt-1">
                            {userDetails?.user?.email || user.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Organisation Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Organization Information</CardTitle>
                      <CardDescription>Your organization details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg border border-border bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Organization Name</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {userDetails?.organisation?.name || "Not available"}
                    </p>
                    {userDetails?.organisation?.tagline && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {userDetails.organisation.tagline}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Location Information */}
            {userDetails?.locations && userDetails.locations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Location Information</CardTitle>
                        <CardDescription>
                          {userDetails.locations.length} location{userDetails.locations.length !== 1 ? 's' : ''} available
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userDetails.locations.map((location) => (
                        <div key={location.id} className="p-4 rounded-lg border border-border bg-muted/50">
                          <p className="text-sm font-medium text-muted-foreground">Location Name</p>
                          <p className="text-lg font-semibold text-foreground mt-1">
                            {location.name || "Not available"}
                          </p>
                          {location.addressline1 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {location.addressline1}
                              {location.addressline2 && `, ${location.addressline2}`}
                            </p>
                          )}
                          {(location.city || location.state || location.pincode) && (
                            <p className="text-sm text-muted-foreground">
                              {[location.city, location.state, location.pincode].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Template Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Website Templates</CardTitle>
                      <CardDescription>Manage your exported website templates</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="p-4 rounded-lg border border-border bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground">
                        No templates found. Export a website to create a template.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Location Selection */}
                      {userDetails?.locations && userDetails.locations.length > 1 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Select Location
                          </label>
                          <Select
                            value={selectedLocationId}
                            onValueChange={setSelectedLocationId}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                            <SelectContent>
                              {userDetails.locations.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{location.name || `Location ${location.id}`}</span>
                                    {location.addressline1 && (
                                      <span className="text-xs text-muted-foreground">
                                        {location.addressline1}
                                        {location.city && `, ${location.city}`}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Template Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Select Template
                        </label>
                        <Select
                          value={selectedTemplateId}
                          onValueChange={setSelectedTemplateId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{template.displaytext || template.identifier}</span>
                                  {template.notes && (
                                    <span className="text-xs text-muted-foreground">
                                      {template.notes.substring(0, 50)}
                                      {template.notes.length > 50 ? '...' : ''}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedTemplateId && selectedLocationId && (
                        <div className="p-4 rounded-lg border border-border bg-muted/50 space-y-2">
                          {selectedLocationId && userDetails?.locations && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Selected Location</span>
                              <span className="text-sm font-semibold text-foreground">
                                {userDetails.locations.find(loc => loc.id.toString() === selectedLocationId)?.name || 'N/A'}
                              </span>
                            </div>
                          )}
                          {selectedTemplateId && (() => {
                            const selected = templates.find(t => t.id.toString() === selectedTemplateId);
                            if (!selected) return null;
                            return (
                              <>
                                {selected.modifiedon && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Last Modified</span>
                                    <span className="text-sm font-semibold text-foreground">
                                      {new Date(selected.modifiedon).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      <Button
                        onClick={handleUpdateTemplate}
                        disabled={!selectedTemplateId || !selectedLocationId || updating}
                        className="w-full"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Update Template
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

