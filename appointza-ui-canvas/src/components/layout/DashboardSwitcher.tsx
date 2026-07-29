
import { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const DashboardSwitcher = () => {
  const { userType, canSwitchMode, switchToMode } = useAuth();
  const { toast } = useToast();
  const [isUser, setIsUser] = useState(userType === 'user');

  console.log('DashboardSwitcher: userType =', userType, 'canSwitchMode =', canSwitchMode);

  // Update isUser state when userType changes
  useEffect(() => {
    console.log('DashboardSwitcher: userType changed to', userType);
    setIsUser(userType === 'user');
  }, [userType]);

  const handleModeSwitch = (checked: boolean) => {
    console.log('DashboardSwitcher: handleModeSwitch called with checked =', checked);
    console.log('DashboardSwitcher: canSwitchMode =', canSwitchMode);
    
    if (!canSwitchMode) {
      toast({
        title: "Access Restricted",
        description: "You don't have permission to switch between modes.",
        variant: "destructive"
      });
      return;
    }
    
    const targetMode = checked ? 'user' : 'organization';
    console.log('DashboardSwitcher: switching to mode', targetMode);
    
    switchToMode(targetMode);
    
    toast({
      title: `Switched to ${checked ? 'User' : 'Organization'} Mode`,
      description: checked 
        ? "You can now book services from other organizations." 
        : "You can now manage your organization."
    });
  };

  // If user cannot switch modes, don't show the switcher
  if (!canSwitchMode) {
    console.log('DashboardSwitcher: canSwitchMode is false, not rendering switcher');
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
      <div className="flex items-center space-x-2">
        <Switch 
          id="role-switch" 
          checked={isUser}
          onCheckedChange={handleModeSwitch}
        />
        <Label htmlFor="role-switch" className="text-sm font-medium">
          {isUser ? 'User Mode' : 'Organization Mode'}
        </Label>
      </div>
      <div className="text-xs text-gray-500">
        {isUser ? 'Book services from other providers' : 'Manage your organization'}
      </div>
    </div>
  );
};

export default DashboardSwitcher;
