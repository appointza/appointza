
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const OrganizationSettings = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    reminders: true,
    marketing: false
  });

  const handleToggleChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: "Notification Settings Updated",
      description: "Your organization notification preferences have been saved.",
    });
  };
  
  const handleSavePreferences = () => {
    toast({
      title: "Organization Preferences Updated",
      description: "Your organization preferences have been saved successfully.",
    });
  };
  
  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
          <p className="text-muted-foreground">
            Manage your organization settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Organization Notification Settings</CardTitle>
                <CardDescription>
                  Configure how your organization receives notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive booking notifications via email.
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.email}
                      onCheckedChange={() => handleToggleChange("email")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications in the browser.
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notifications.push}
                      onCheckedChange={() => handleToggleChange("push")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications" className="font-medium">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive booking confirmations via SMS.
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notifications.sms}
                      onCheckedChange={() => handleToggleChange("sms")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reminder-notifications" className="font-medium">
                        Staff Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminders to staff about upcoming appointments.
                      </p>
                    </div>
                    <Switch
                      id="reminder-notifications"
                      checked={notifications.reminders}
                      onCheckedChange={() => handleToggleChange("reminders")}
                    />
                  </div>
                  
                  <Button onClick={handleSaveNotifications}>
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Organization Preferences</CardTitle>
                <CardDescription>
                  Customize your organization's experience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="time-zone">Organization Time Zone</Label>
                    <Select defaultValue="america-new-york">
                      <SelectTrigger id="time-zone">
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america-new-york">America/New York</SelectItem>
                        <SelectItem value="america-los-angeles">America/Los Angeles</SelectItem>
                        <SelectItem value="europe-london">Europe/London</SelectItem>
                        <SelectItem value="asia-tokyo">Asia/Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="booking-window">Booking Window</Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="booking-window">
                        <SelectValue placeholder="Select booking window" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days in advance</SelectItem>
                        <SelectItem value="14">14 days in advance</SelectItem>
                        <SelectItem value="30">30 days in advance</SelectItem>
                        <SelectItem value="60">60 days in advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-confirm" className="font-medium">
                        Auto-confirm Bookings
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically confirm new bookings without manual approval.
                      </p>
                    </div>
                    <Switch id="auto-confirm" defaultChecked />
                  </div>
                  
                  <Button onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Organization Privacy Settings</CardTitle>
                <CardDescription>
                  Manage your organization's privacy and data preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="public-visibility" className="font-medium">
                        Public Visibility
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Make your organization visible in public directories.
                      </p>
                    </div>
                    <Switch id="public-visibility" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-analytics" className="font-medium">
                        Data Analytics
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymous usage data collection for service improvement.
                      </p>
                    </div>
                    <Switch id="data-analytics" defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default OrganizationSettings;
