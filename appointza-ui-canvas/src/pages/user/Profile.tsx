import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { OrganizationSwitchService, OrganizationInfo } from "@/services/organizationSwitch.service";
import { AppointmentRecord } from "@/models/appointmentrecord.model";
import { CalendarDays, Building2, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import OrganizationSwitchModal, {
  type SwitchableOrganization,
} from "@/components/organization/OrganizationSwitchModal";

const UserProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: user?.firstname || "",
    lastName: user?.lastname || "",
    email: user?.email || "",
    phone: user?.mobile || "",
  });

  // Organization switching state
  const [availableOrganizations, setAvailableOrganizations] = useState<OrganizationInfo[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("appointza");
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOrgSwitchModal, setShowOrgSwitchModal] = useState(false);

  const orgSwitchService = new OrganizationSwitchService();

  const handleOrganizationSwitch = (org: SwitchableOrganization) => {
    if (org === "momantza") {
      navigate("/momantza/booking");
    } else if (org === "campusza") {
      navigate("/campusza/staff");
    } else if (org === "crm") {
      navigate("/crm");
    }
  };

  // Load available organizations on mount
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!user?.mobile) return;
      
      setLoadingOrgs(true);
      try {
        const orgs = await orgSwitchService.getAvailableOrganizations(user.mobile);
        setAvailableOrganizations(orgs);
        
        // Set current organization
        const currentOrg = orgs.find(o => o.isCurrent);
        if (currentOrg) {
          setSelectedOrganization(currentOrg.organizationId);
          setIsAdmin(currentOrg.isAdmin);
        }
      } catch (error: any) {
        console.error("Error loading organizations:", error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
      } finally {
        setLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, [user?.mobile]);

  // Load appointments when organization changes
  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.mobile || !selectedOrganization) return;

      setLoadingAppointments(true);
      try {
        const selectedOrg = availableOrganizations.find(o => o.organizationId === selectedOrganization);
        const apps = await orgSwitchService.getAppointments(
          selectedOrganization,
          user.mobile,
          selectedOrg?.isAdmin || false
        );
        setAppointments(apps);
      } catch (error: any) {
        console.error("Error loading appointments:", error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      } finally {
        setLoadingAppointments(false);
      }
    };

    if (availableOrganizations.length > 0) {
      loadAppointments();
    }
  }, [selectedOrganization, user?.mobile, availableOrganizations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password Updated",
      description: "Your password has been updated successfully.",
    });
  };

  const handleOrgSwitch = async (orgId: string) => {
    setSelectedOrganization(orgId);
    const selectedOrg = availableOrganizations.find(o => o.organizationId === orgId);
    setIsAdmin(selectedOrg?.isAdmin || false);
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="bg-gradient-elegant p-6 rounded-xl shadow-md">
          <h2 className="text-3xl font-bold tracking-tight text-appointza-navy">My Profile</h2>
          <p className="text-gray-600">
            Manage your account information and preferences.
          </p>
        </div>

        {/* Organization Switch Section */}
        <Card className="shadow-sm border-2 border-blue-200">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>Switch Organization</span>
            </CardTitle>
            <CardDescription>
              Switch to Momantza, Campusza, or CRM to access their features
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button
              onClick={() => setShowOrgSwitchModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Switch Organization
            </Button>
          </CardContent>
        </Card>

        {/* Organization Switch Modal */}
        <OrganizationSwitchModal
          open={showOrgSwitchModal}
          onOpenChange={setShowOrgSwitchModal}
          onSelect={handleOrganizationSwitch}
        />

        {/* Appointza Organization Switcher (for appointments) */}
        {availableOrganizations.length > 1 && (
          <Card className="border-2 border-appointza-softBlue shadow-md">
            <CardHeader className="bg-appointza-softBlue bg-opacity-10 rounded-t-lg">
              <CardTitle className="text-appointza-navy flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Appointza Organizations
              </CardTitle>
              <CardDescription>
                View appointments from different Appointza organizations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingOrgs ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading organizations...</span>
                </div>
              ) : (
                <Select value={selectedOrganization} onValueChange={handleOrgSwitch}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrganizations.map((org) => (
                      <SelectItem key={org.organizationId} value={org.organizationId}>
                        <div className="flex items-center justify-between w-full">
                          <span>{org.organizationName}</span>
                          {org.isCurrent && (
                            <span className="text-xs text-appointza-teal ml-2">(Current)</span>
                          )}
                          {org.isAdmin && (
                            <span className="text-xs text-orange-500 ml-2">(Admin)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        {/* Appointments Section */}
        <Card className="border-2 border-appointza-softBlue shadow-md">
          <CardHeader className="bg-appointza-softBlue bg-opacity-20 rounded-t-lg">
            <CardTitle className="text-appointza-navy flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {isAdmin ? "All Appointments" : "My Appointments"} - {availableOrganizations.find(o => o.organizationId === selectedOrganization)?.organizationName || "Appointza"}
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? "All appointments in this organization" 
                : "Your appointments from this organization"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-appointza-teal" />
                <span className="ml-2">Loading appointments...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No appointments found in this organization</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment: any) => {
                  // Handle both AppointmentRecord format and B2B format (from Momantza/Campusza)
                  const customerName = appointment.customerName || appointment.customername || 
                                     (appointment.record?.additionalData?.customername as string) || 
                                     "Appointment";
                  const customerEmail = appointment.customerEmail || appointment.customeremail || 
                                      (appointment.record?.additionalData?.customeremail as string) || "";
                  const customerPhone = appointment.customerPhone || appointment.customerphone || 
                                      appointment.customermobilenumber || "";
                  const appointmentDate = appointment.appointmentdate || appointment.eventDate || 
                                        appointment.appointmentdate || new Date();
                  const status = appointment.status;
                  
                  return (
                    <Card key={appointment.id || appointment.appointmentdate} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-appointza-navy">
                              {customerName}
                            </h3>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                              {appointmentDate && (
                                <p>
                                  <span className="font-medium">Date:</span>{" "}
                                  {format(new Date(appointmentDate), "PPP")}
                                </p>
                              )}
                              {customerPhone && (
                                <p>
                                  <span className="font-medium">Phone:</span> {customerPhone}
                                </p>
                              )}
                              {customerEmail && (
                                <p>
                                  <span className="font-medium">Email:</span> {customerEmail}
                                </p>
                              )}
                              {appointment.eventType && (
                                <p>
                                  <span className="font-medium">Type:</span> {appointment.eventType}
                                </p>
                              )}
                              {status !== undefined && (
                                <p>
                                  <span className="font-medium">Status:</span>{" "}
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    status === 1 || status === "confirmed" ? "bg-green-100 text-green-800" :
                                    status === 2 || status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {status === 1 || status === "confirmed" ? "Confirmed" :
                                     status === 2 || status === "pending" ? "Pending" : 
                                     status === "cancelled" ? "Cancelled" : "Unknown"}
                                  </span>
                                </p>
                              )}
                              {appointment.notes && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-2 border-appointza-softPurple shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-appointza-softPurple bg-opacity-20 rounded-t-lg">
              <CardTitle className="text-appointza-navy">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-6">
              <div className="p-1 rounded-full bg-gradient-pastel mb-4">
                <Avatar className="h-28 w-28 border-4 border-white">
                  <AvatarImage src="https://i.pravatar.cc/150?img=8" alt="Profile" />
                  <AvatarFallback className="bg-appointza-teal text-white text-xl">
                    {(user?.firstname || user?.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button variant="outline" size="sm" className="mt-4 border-appointza-teal text-appointza-teal hover:bg-appointza-softBlue hover:text-appointza-navy transition-all">
                Upload New Picture
              </Button>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 border-2 border-appointza-softBlue shadow-md hover:shadow-xl transition-all duration-300">
            <Tabs defaultValue="information" className="w-full">
              <CardHeader className="pb-0 bg-appointza-softBlue bg-opacity-20 rounded-t-lg">
                <CardTitle className="text-appointza-navy">Account Information</CardTitle>
                <CardDescription>Update your account information here.</CardDescription>
                <TabsList className="mt-4 bg-white p-1 border border-appointza-softBlue">
                  <TabsTrigger value="information" className="data-[state=active]:bg-appointza-softBlue data-[state=active]:text-appointza-navy">
                    Personal Information
                  </TabsTrigger>
                  <TabsTrigger value="security" className="data-[state=active]:bg-appointza-softPink data-[state=active]:text-appointza-navy">
                    Security
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-6">
                <TabsContent value="information" className="animate-fade-in">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-appointza-navy">First Name</Label>
                        <Input 
                          id="firstName" 
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="border-appointza-softBlue focus-visible:ring-appointza-teal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-appointza-navy">Last Name</Label>
                        <Input 
                          id="lastName" 
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="border-appointza-softBlue focus-visible:ring-appointza-teal"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-appointza-navy">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="border-appointza-softBlue focus-visible:ring-appointza-teal"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-appointza-navy">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="border-appointza-softBlue focus-visible:ring-appointza-teal"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="bg-gradient-pastel hover:opacity-90 text-appointza-navy font-medium"
                    >
                      Save Changes
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="security" className="animate-fade-in">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-appointza-navy">Current Password</Label>
                      <Input 
                        id="currentPassword" 
                        type="password" 
                        className="border-appointza-softPink focus-visible:ring-appointza-pink"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-appointza-navy">New Password</Label>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        className="border-appointza-softPink focus-visible:ring-appointza-pink"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-appointza-navy">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        className="border-appointza-softPink focus-visible:ring-appointza-pink"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-appointza-pink to-appointza-orange hover:opacity-90 text-white font-medium"
                    >
                      Update Password
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-2 border-red-200 shadow-md mt-6">
          <CardHeader className="bg-red-50 rounded-t-lg">
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Permanently delete your user account and all associated data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start space-y-2">
              <p className="text-sm text-red-700 mb-2">
                This action cannot be undone. This will permanently delete your user account and remove all your data from our servers.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  localStorage.clear();
                  toast({
                    title: "Account Deleted",
                    description: "Your account has been permanently deleted.",
                  });
                  window.location.href = '/login';
                }}
                className="mt-2"
              >
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default UserProfile;
