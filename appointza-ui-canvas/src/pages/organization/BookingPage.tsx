
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Share2, MapPin, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserTypeUtil } from "@/utils/userType.util";
import { getAppBaseUrl } from "@/utils/environment";

const OrganizationBookingPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const bookingUrl = `${getAppBaseUrl()}/book/${user?.organisationid || 'your-organization'}${user?.organisationlocationid ? `?location=${user.organisationlocationid}` : ''}`;
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast({
      title: "URL Copied",
      description: "Booking page URL has been copied to clipboard.",
    });
  };
  
  const handleSaveSettings = () => {
    toast({
      title: "Booking Page Updated",
      description: "Your booking page settings have been saved.",
    });
  };
  
  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booking Page</h2>
          <p className="text-muted-foreground">
            Customize your public booking page and share it with customers.
          </p>
        </div>

        {/* User Type Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Type & Access
            </CardTitle>
            <CardDescription>
              Your current user type and access permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">User Type</span>
                </div>
                <p className="text-blue-800">
                  {UserTypeUtil.getDetailedUserType(user)}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Staff Access</div>
                  <div className={`text-lg font-bold ${UserTypeUtil.isStaff(user) ? 'text-green-600' : 'text-gray-400'}`}>
                    {UserTypeUtil.isStaff(user) ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Organization Access</div>
                  <div className={`text-lg font-bold ${UserTypeUtil.isOrganizationUser(user) ? 'text-green-600' : 'text-gray-400'}`}>
                    {UserTypeUtil.isOrganizationUser(user) ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Location Access</div>
                  <div className={`text-lg font-bold ${UserTypeUtil.hasLocationAccess(user) ? 'text-green-600' : 'text-gray-400'}`}>
                    {UserTypeUtil.hasLocationAccess(user) ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Location Information
            </CardTitle>
            <CardDescription>
              Your current organization location details for this booking page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Organization ID</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="font-mono text-sm">
                    {user?.organisationid || 'Not assigned'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Location ID</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="font-mono text-sm">
                    {user?.organisationlocationid || 'Not assigned'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Organization Name</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="text-sm">
                    {user?.organisationname || 'Not assigned'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Location Name</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="text-sm">
                    {user?.organisationlocationname || 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Your Booking Page
              </CardTitle>
              <CardDescription>
                Share this URL with your customers to allow them to book appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input 
                  value={bookingUrl} 
                  readOnly 
                  className="bg-gray-50"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(bookingUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full">
                  Generate QR Code
                </Button>
                <Button variant="outline" className="w-full">
                  Social Media Share
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Booking Page Settings</CardTitle>
              <CardDescription>
                Customize how your booking page appears to customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-title">Page Title</Label>
                <Input 
                  id="page-title" 
                  defaultValue="Book an Appointment"
                  placeholder="Enter page title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea 
                  id="welcome-message"
                  placeholder="Enter a welcome message for your customers"
                  defaultValue="Welcome! Please select a service and preferred time for your appointment."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-staff" className="font-medium">
                    Show Staff Selection
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to choose specific staff members.
                  </p>
                </div>
                <Switch id="show-staff" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-phone" className="font-medium">
                    Require Phone Number
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Make phone number mandatory for bookings.
                  </p>
                </div>
                <Switch id="require-phone" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-confirm" className="font-medium">
                    Auto-confirm Bookings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically confirm bookings without manual approval.
                  </p>
                </div>
                <Switch id="auto-confirm" defaultChecked />
              </div>
              
              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Booking Page Preview</CardTitle>
            <CardDescription>
              This is how your booking page will appear to customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Book an Appointment</h3>
                <p className="text-gray-600">
                  Welcome! Please select a service and preferred time for your appointment.
                </p>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500 italic">
                    Interactive booking form would appear here...
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
};

export default OrganizationBookingPage;
