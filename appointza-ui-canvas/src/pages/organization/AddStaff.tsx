import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, Phone, Search, ArrowLeft, UserPlus, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import OrganizationLayout from "@/components/layout/OrganizationLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import { StaffService } from "@/services/staff.service";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { UsersSelectReq, UsersLoginReq, Users, UsersPermissionData as UsersPermissionDataFromUsers, UsersPermissionGroupData } from "@/models/users.model";
import { Staff, UsersPermissionData } from "@/models/staff.model";

const AddStaff = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const organizationId = user?.organisationid || 0;

  // API services
  const usersService = useMemo(() => new UsersService(), []);
  const staffService = useMemo(() => new StaffService(), []);
  const { data: locations = [], isLoading } = useOrganisationLocations({
    organisationId: organizationId,
    enabled: isAuthenticated && organizationId > 0,
  });
  const [searchMobile, setSearchMobile] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<Users | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Privileges state
  const [privileges, setPrivileges] = useState({
    editandviewDashboard: false,
    editandviewAppointments: false,
    editandviewEvents: false,
    editandviewCreateService: false,
    editandviewCreateEvent: false,
    editandviewClients: false,
    editandviewBusinessHours: false,
    editandviewStaffManagement: false,
    editandviewLocationManagement: false,
    editandviewTemplates: false,
    editandviewPaymentSettings: false,
    editandviewBusinessvalues: false,
  });

  useEffect(() => {
    if (locations.length > 0 && selectedLocationId <= 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Search user by mobile number
  const searchUserByMobile = async () => {
    const mobile = searchMobile.trim();
    if (!mobile) {
      toast({
        title: "Enter Mobile Number",
        description: "Please enter a mobile number to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const req = new UsersSelectReq();
      req.mobile = mobile;
      
      const response = await usersService.select(req);
      
      if (response && Array.isArray(response) && response.length > 0) {
        const user = response[0];
        setFoundUser(user);
        toast({
          title: "User Found",
          description: `Found user: ${user.name || 'Unknown'}`,
        });
      } else {
        setFoundUser(null);
        toast({
          title: "User Not Found",
          description: `No user found with mobile number: ${mobile}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: "Error",
        description: "Failed to search user",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle privilege change
  const handlePrivilegeChange = (privilege: string, checked: boolean) => {
    setPrivileges(prev => ({
      ...prev,
      [privilege]: checked
    }));
  };

  // Map frontend privileges to backend UsersPermissionData structure
  const mapPrivilegesToBackend = (): UsersPermissionData => {
    const permissionData = new UsersPermissionData();
    
    // Set privileges
    permissionData.editandviewDashboard = privileges.editandviewDashboard;
    permissionData.editandviewAppointments = privileges.editandviewAppointments;
    permissionData.editandviewEvents = privileges.editandviewEvents;
    permissionData.editandviewCreateService = privileges.editandviewCreateService;
    permissionData.editandviewCreateEvent = privileges.editandviewCreateEvent;
    permissionData.editandviewClients = privileges.editandviewClients;
    permissionData.editandviewBusinessHours = privileges.editandviewBusinessHours;
    permissionData.editandviewStaffManagement = privileges.editandviewStaffManagement;
    permissionData.editandviewLocationManagement = privileges.editandviewLocationManagement;
    permissionData.editandviewTemplates = privileges.editandviewTemplates;
    permissionData.editandviewPaymentSettings = privileges.editandviewPaymentSettings;
    permissionData.editandviewBusinessvalues = privileges.editandviewBusinessvalues;
    
    return permissionData;
  };

  // Add staff member
  const handleAddStaff = async () => {
    if (!foundUser || !selectedLocationId) {
      toast({
        title: "Missing Information",
        description: "Please search for a user and select a location",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      console.log('Adding staff member:', foundUser.name);
      
      // 1. Update user with permissions and organisationlocationid
      const userUpdate = { ...foundUser } as Users;
      userUpdate.attributes = foundUser.attributes || new Users.AttributesData();
      userUpdate.attributes.permission = mapPrivilegesToBackend();
      userUpdate.organisationid = organizationId;
      userUpdate.locationid = selectedLocationId;
      userUpdate.modifiedby = user?.id || organizationId;
      userUpdate.modifiedon = new Date();
      userUpdate.version = (foundUser.version || 0) + 1;
      
      await usersService.update(userUpdate);
      console.log('✅ Updated user permissions and location');
      
      // 2. Create staff record
      const staffReq = new Staff();
      staffReq.userid = foundUser.id;
      staffReq.organisationid = organizationId;
      staffReq.organisationlocationid = selectedLocationId;
      staffReq.roles = mapPrivilegesToBackend();
      staffReq.isactive = true;
      staffReq.issuspended = false;
      staffReq.isfactory = false;
      staffReq.version = 1;
      staffReq.createdby = user?.id || organizationId;
      staffReq.createdon = new Date();
      staffReq.modifiedby = user?.id || organizationId;
      staffReq.modifiedon = new Date();
      
      const response = await staffService.insert(staffReq);
      
      if (response && response.id) {
        toast({
          title: "Staff Added Successfully",
          description: `${foundUser.name || 'User'} has been added to your staff.`,
        });
        
        // Reset form
        setSearchMobile('');
        setFoundUser(null);
        setPrivileges({
          editandviewDashboard: false,
          editandviewAppointments: false,
          editandviewEvents: false,
          editandviewCreateService: false,
          editandviewCreateEvent: false,
          editandviewClients: false,
          editandviewBusinessHours: false,
          editandviewStaffManagement: false,
          editandviewLocationManagement: false,
          editandviewTemplates: false,
          editandviewPaymentSettings: false,
          editandviewBusinessvalues: false,
        });
        
        // Redirect to staff list after delay
        setTimeout(() => {
          window.location.href = '/organization/staff';
        }, 1500);
      } else {
        throw new Error('Failed to insert staff record');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add staff member",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
      setShowConfirmDialog(false);
    }
  };

  // Get selected location name
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  // Render
  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Staff Member</h1>
            <p className="text-gray-600">Search by mobile number and assign privileges</p>
          </div>
        </div>

        {/* Search Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Search User</span>
            </CardTitle>
            <CardDescription>
              Search for a user by their mobile number to add them as staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="Enter mobile number..."
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, ''))} // Only numbers
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && searchUserByMobile()}
                />
              </div>
              <Button 
                onClick={searchUserByMobile}
                disabled={isSearching || !searchMobile.trim()}
                className="px-6"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Found User Display */}
        {foundUser && (
          <Card className="shadow-sm border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>User Found</span>
              </CardTitle>
              <CardDescription>
                Review user details before adding to staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {foundUser.name || 'No Name'}
                  </h3>
                  <p className="text-gray-600">{foundUser.mobile || 'No Mobile'}</p>
                  {foundUser.email && (
                    <p className="text-sm text-gray-500">{foundUser.email}</p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    User ID: {foundUser.id}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Selection */}
        {foundUser && locations.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Assign Location</span>
              </CardTitle>
              <CardDescription>
                Select the business location for this staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full md:w-1/2">
                <Label htmlFor="location">Business Location</Label>
                <Select 
                  value={selectedLocationId.toString()} 
                  onValueChange={(value) => setSelectedLocationId(Number(value))}
                  disabled={locations.length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={locations.length === 0 ? "No locations available" : "Select a location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span>{location.name}</span>
                          {location.city && (
                            <span className="text-gray-500">- {location.city}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {locations.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No locations available. Please add a location first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privileges Assignment */}
        {foundUser && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Assign Privileges</span>
              </CardTitle>
              <CardDescription>
                Select the permissions this staff member should have
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Privilege checkboxes - same as before */}
                {Object.entries(privileges).map(([key, value]) => {
                  const label = key.replace('editandview', '').replace(/([A-Z])/g, ' $1').trim();
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handlePrivilegeChange(key, checked as boolean)}
                      />
                      <Label htmlFor={key} className="text-sm cursor-pointer">
                        Edit & View {label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {foundUser && (
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchMobile('');
                setFoundUser(null);
                setPrivileges({
                  editandviewDashboard: false,
                  editandviewAppointments: false,
                  editandviewEvents: false,
                  editandviewCreateService: false,
                  editandviewCreateEvent: false,
                  editandviewClients: false,
                  editandviewBusinessHours: false,
                  editandviewStaffManagement: false,
                  editandviewLocationManagement: false,
                  editandviewTemplates: false,
                  editandviewPaymentSettings: false,
                  editandviewBusinessvalues: false,
                });
              }}
            >
              Cancel
            </Button>
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={!selectedLocationId || locations.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Add Staff</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to add <strong>{foundUser.name || 'this user'}</strong> as a staff member 
                    {selectedLocation && ` at ${selectedLocation.name}`}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isAdding}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAddStaff}
                    disabled={isAdding}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Staff
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default AddStaff;