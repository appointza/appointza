
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const UserSettings = () => {
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
      description: "Your notification preferences have been saved.",
    });
  };
  
  const handleSavePreferences = () => {
    toast({
      title: "Preferences Updated",
      description: "Your preferences have been saved successfully.",
    });
  };
  
  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="mb-4">
            {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
            {/* <TabsTrigger value="preferences">Preferences</TabsTrigger> */}
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications.
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
                        Receive notifications via email.
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
                        Receive notifications via text messages.
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
                        Appointment Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders before your appointments.
                      </p>
                    </div>
                    <Switch
                      id="reminder-notifications"
                      checked={notifications.reminders}
                      onCheckedChange={() => handleToggleChange("reminders")}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-notifications" className="font-medium">
                        Marketing Emails
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive news, offers and updates.
                      </p>
                    </div>
                    <Switch
                      id="marketing-notifications"
                      checked={notifications.marketing}
                      onCheckedChange={() => handleToggleChange("marketing")}
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
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>
                  Customize your experience with Appointza.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="time-zone">Time Zone</Label>
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
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select defaultValue="mdy">
                      <SelectTrigger id="date-format">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time-format">Time Format</Label>
                    <Select defaultValue="12h">
                      <SelectTrigger id="time-format">
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="theme-preference" className="font-medium">
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable dark mode across the application.
                      </p>
                    </div>
                    <Switch id="theme-preference" />
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
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Manage your privacy and data preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visibility" className="font-medium">
                        Profile Visibility
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Make your profile visible to organizations.
                      </p>
                    </div>
                    <Switch id="profile-visibility" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cookies-consent" className="font-medium">
                        Analytics Cookies
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow us to collect usage data to improve our service.
                      </p>
                    </div>
                    <Switch id="cookies-consent" defaultChecked />
                  </div>
                  
                  <Button variant="destructive" className="mt-8">
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default UserSettings;
