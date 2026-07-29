import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  User,
  Camera,
  Save,
  Trash2,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Building2,
  Loader2,
  MapPin,
  Gift,
  Wallet,
} from "lucide-react";
import { org } from "@/lib/orgTheme";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { CreditWalletBillingPanel } from "@/components/organization/CreditWalletBillingPanel";
import { cn } from "@/lib/utils";
import TimingScreen from "@/pages/organization/Timing";
import StaffManagement from "@/pages/organization/StaffManagement";
import LocationsScreen from "@/pages/organization/Locations";
import OrganizationTemplates from "@/pages/organization/Templates";
import PaymentSettings from "@/pages/organization/PaymentSettings";
import ReferenceValuesPage from "@/pages/organization/ReferenceValues";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import { OrganisationService } from "@/services/organisation.service";
import { Users, UsersSelectReq, Organisationdeletereq } from "@/models/users.model";
import { FilesService } from "@/services/files.service";
import { useLocation } from "@/hooks/useLocation";
import { useLocationList } from "@/hooks/useLocationList";
import OrganizationSwitchModal, {
  type SwitchableOrganization,
} from "@/components/organization/OrganizationSwitchModal";
import IntegrationTokenPanel from "@/components/organization/IntegrationTokenPanel";

/** Pill segment tabs — matches Services / Events toggle on org Services page. */
const profileTabTriggerClass =
  "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 shadow-none transition-colors hover:text-stone-800 data-[state=active]:bg-gradient-coral data-[state=active]:text-white data-[state=active]:shadow-sm sm:px-4";

const profileCardHeaderClass = "space-y-1.5 p-5 md:p-6";
const profileCardContentClass = "p-5 pt-0 md:p-6 md:pt-0";
const profileCardTitleClass = "text-lg font-semibold leading-snug text-appointza-navy md:text-xl";
const profileCardDescClass = "text-sm text-stone-500";

/** Matches OrganizationLayout main padding; required because Tabs uses opposing negative horizontal margins. */
const profileTabsPanelInsetClass = "px-4 sm:px-6 lg:px-8 xl:px-10";

const profileTabPanelClass = cn(
  "m-0 py-6 focus-visible:outline-none md:py-8",
  profileTabsPanelInsetClass
);

const profileFieldInputClass = cn(org.input, "mt-1.5 h-11 min-h-11 md:h-10 md:min-h-10");

const profileSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C]";

type ProfileSettingsTab =
  | "profile"
  | "business-hours"
  | "staff"
  | "location"
  | "templates"
  | "payment"
  | "billing"
  | "appointment-values"
  | "account";

const OrganizationProfile = () => {
  const { user, isAuthenticated, logout, refreshAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = user?.userid || user?.id || 0;
  const organizationId = user?.organisationid || 0;
  
  // Check if user is staff - use from user context (already calculated correctly in AuthContext)
  const isStaff = user?.isStaff === true;
  
  // Get user context from localStorage for permissions
  const getUserContext = () => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) return null;
      return JSON.parse(userContextStr);
    } catch (error) {
      console.error('Error parsing user_context:', error);
      return null;
    }
  };
  
  const userContext = getUserContext();
  const userpermission = userContext?.userpermission || {};
  
  // Check permissions for Quick Navigation buttons (non-staff users have full access)
  const hasBusinessHoursAccess = !isStaff || userpermission?.editandviewBusinessHours === true;
  const hasStaffManagementAccess = !isStaff || userpermission?.editandviewStaffManagement === true;
  const hasLocationManagementAccess = !isStaff || userpermission?.editandviewLocationManagement === true;
  const hasTemplatesAccess = !isStaff || userpermission?.editandviewTemplates === true;
  const hasPaymentSettingsAccess = !isStaff || userpermission?.editandviewPaymentSettings === true;
  const hasBusinessValuesAccess = !isStaff || userpermission?.editandviewBusinessvalues === true;

  const accessibleTabValues = useMemo((): ProfileSettingsTab[] => {
    const list: ProfileSettingsTab[] = ["profile"];
    if (hasBusinessHoursAccess) list.push("business-hours");
    if (hasStaffManagementAccess) list.push("staff");
    if (hasLocationManagementAccess) list.push("location");
    if (hasTemplatesAccess) list.push("templates");
    if (hasPaymentSettingsAccess) list.push("payment");
    if (!isStaff) list.push("billing");
    if (hasBusinessValuesAccess) list.push("appointment-values");
    list.push("account");
    return list;
  }, [
    hasBusinessHoursAccess,
    hasStaffManagementAccess,
    hasLocationManagementAccess,
    hasTemplatesAccess,
    hasPaymentSettingsAccess,
    hasBusinessValuesAccess,
    isStaff,
  ]);

  const activeTab = useMemo(() => {
    const raw = searchParams.get("tab") as ProfileSettingsTab | null;
    if (raw && accessibleTabValues.includes(raw)) return raw;
    return "profile";
  }, [searchParams, accessibleTabValues]);

  const setActiveTab = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        return next;
      },
      { replace: true },
    );
  };
  
  // Location management for staff users
  const { 
    currentLocation, 
    isLoading: isLocationLoading, 
    getLocationDisplayName, 
    getFullAddress 
  } = useLocation();

  // Location list management (automatically filtered for staff users)
  const { 
    locations: availableLocations, 
    isLoading: isLocationListLoading,
    canAccessLocation,
    getLocationDisplayName: getLocationDisplayNameById
  } = useLocationList();
  
  // Debug user context
  console.log('🔍 User context:', user);
  console.log('🔍 isAuthenticated:', isAuthenticated);
  console.log('🔍 userId:', userId);
  console.log('🔍 isStaff:', isStaff);
  console.log('🔍 currentLocation:', currentLocation);
  console.log('🔍 availableLocations:', availableLocations);
  console.log('🔍 isLocationListLoading:', isLocationListLoading);

  // API services
  const usersService = useMemo(() => new UsersService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  // State
  const [profile, setProfile] = useState<Users>(new Users());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);
  const [profileImageBlobUrl, setProfileImageBlobUrl] = useState("");
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [otp, setOtp] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOrgSwitchModal, setShowOrgSwitchModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [referralAlreadyApplied, setReferralAlreadyApplied] = useState(false);
  const [canApplyReferralCode, setCanApplyReferralCode] = useState(true);
  const [isLoadingReferralStatus, setIsLoadingReferralStatus] = useState(false);
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);

  const handleOrganizationSwitch = (org: SwitchableOrganization) => {
    if (org === "momantza") {
      navigate("/momantza/booking");
    } else if (org === "campusza") {
      navigate("/campusza/staff");
    } else if (org === "crm") {
      navigate("/crm");
    }
  };

  // Update user_context in localStorage with latest user data
  const updateUserContext = useCallback(async (userData: Users) => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) {
        console.warn('⚠️ user_context not found in localStorage');
        return;
      }
      
      const userContext = JSON.parse(userContextStr);
      const oldPermissions = JSON.stringify(userContext.userpermission || {});
      
      // Update user data from fetched profile
      userContext.userid = userData.id || userContext.userid;
      userContext.username = userData.name || userContext.username;
      userContext.useremail = userData.email || userContext.useremail;
      userContext.usermobile = userData.mobile || userContext.usermobile;
      userContext.userimageid = userData.profileimage || userContext.userimageid;
      userContext.organisationid = userData.organisationid || userContext.organisationid;
      userContext.organisationlocationid = userData.locationid || userContext.organisationlocationid;
      
      // Update permissions from userData.attributes.permission
      if (userData.attributes && userData.attributes.permission) {
        userContext.userpermission = userData.attributes.permission;
      }
      
      // Save updated user_context back to localStorage
      localStorage.setItem('user_context', JSON.stringify(userContext));
      console.log('✅ Updated user_context in localStorage with latest user data');
      
      // Dispatch custom event to notify other components (for same-tab updates)
      // This allows components to react without causing full re-renders
      window.dispatchEvent(new CustomEvent('userContextUpdated', { 
        detail: { userpermission: userContext.userpermission } 
      }));
      
      // Note: We don't call refreshAuth() immediately to prevent flickering
      // Components (sidebar, route protection, etc.) read directly from localStorage
      // AuthContext will be refreshed naturally on next navigation or page interaction
    } catch (error) {
      console.error('❌ Error updating user_context:', error);
    }
  }, []);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      return;
    }
    
    setIsLoading(true);
    try {
      const req = new UsersSelectReq();
      req.id = userId;
      
      const response = await usersService.select(req);
      
      if (response && response.length > 0) {
        const userData = response[0];
        setProfile(userData);
        
        // Update user_context in localStorage with latest data
        await updateUserContext(userData);
      } else {
        // Fallback to user context data if API returns empty
        if (user) {
          const fallbackProfile = new Users();
          fallbackProfile.id = user.userid || user.id || 0;
          fallbackProfile.name = user.username || user.firstname || '';
          fallbackProfile.email = user.useremail || user.email || '';
          fallbackProfile.mobile = user.usermobile || user.mobile || '';
          fallbackProfile.designation = '';
          fallbackProfile.organisationid = user.organisationid || 0;
          fallbackProfile.locationid = user.organisationlocationid || user.locationid || 0;
          fallbackProfile.profileimage = user.imageid || 0;
          fallbackProfile.notes = '';
          console.log('✅ Setting fallback profile with ID:', fallbackProfile.id);
          setProfile(fallbackProfile);
        }
      }
    } catch (error) {
      // Fallback to user context data on error
      if (user) {
        const fallbackProfile = new Users();
        fallbackProfile.id = user.userid || user.id || 0;
        fallbackProfile.name = user.username || user.firstname || '';
        fallbackProfile.email = user.useremail || user.email || '';
        fallbackProfile.mobile = user.usermobile || user.mobile || '';
        fallbackProfile.designation = '';
        fallbackProfile.organisationid = user.organisationid || 0;
        fallbackProfile.locationid = user.organisationlocationid || user.locationid || 0;
        fallbackProfile.profileimage = user.imageid || 0;
        fallbackProfile.notes = '';
        console.log('✅ Setting error fallback profile with ID:', fallbackProfile.id);
        setProfile(fallbackProfile);
      }
      
      toast({
        title: "Warning",
        description: "Using cached profile data. Some information may be outdated.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, usersService, toast, user, updateUserContext]);

  const loadReferralStatus = useCallback(async () => {
    if (!isAuthenticated || isStaff || organizationId <= 0) {
      return;
    }
    setIsLoadingReferralStatus(true);
    try {
      const info = await organisationService.getReferral(organizationId);
      setReferralAlreadyApplied(info?.referral_already_applied ?? false);
      setCanApplyReferralCode(
        info?.can_apply_referral_code ?? !info?.referral_already_applied,
      );
    } catch {
      setCanApplyReferralCode(true);
    } finally {
      setIsLoadingReferralStatus(false);
    }
  }, [isAuthenticated, isStaff, organizationId, organisationService]);

  const handleApplyReferralCode = async () => {
    const code = referralCodeInput.trim();
    if (!code) {
      toast({
        title: "Enter a code",
        description: "Please enter a referral code.",
        variant: "destructive",
      });
      return;
    }
    setIsApplyingReferral(true);
    try {
      const result = await organisationService.applyReferral(code, organizationId);
      if (result?.success) {
        toast({
          title: "Referral applied",
          description: result.message || "Referral code applied successfully.",
        });
        setReferralCodeInput("");
        setReferralAlreadyApplied(true);
        setCanApplyReferralCode(false);
      } else {
        toast({
          title: "Could not apply",
          description: result?.message || "Invalid referral code.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to apply referral code.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingReferral(false);
    }
  };

  // Load profile on component mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void loadReferralStatus();
  }, [loadReferralStatus]);

  // Immediate fallback if user context is available but profile is empty
  useEffect(() => {
    if (user && (!profile.name || profile.name === '')) {
      const immediateProfile = new Users();
      immediateProfile.id = user.userid || user.id || 0;
      immediateProfile.name = user.username || user.firstname || '';
      immediateProfile.email = user.useremail || user.email || '';
      immediateProfile.mobile = user.usermobile || user.mobile || '';
      immediateProfile.designation = '';
      immediateProfile.organisationid = user.organisationid || 0;
      immediateProfile.locationid = user.organisationlocationid || user.locationid || 0;
      immediateProfile.profileimage = user.imageid || 0;
      immediateProfile.notes = '';
      console.log('✅ Setting immediate fallback profile with ID:', immediateProfile.id);
      setProfile(immediateProfile);
    }
  }, [user, profile.name]);

  // Load profile image via authenticated fetch (img src cannot send Authorization header)
  useEffect(() => {
    let cancelled = false;

    const loadProfileImage = async () => {
      const imageId = profile.profileimage;
      if (!imageId || imageId <= 0) {
        setProfileImageBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return "";
        });
        setIsProfileImageLoading(false);
        return;
      }

      setIsProfileImageLoading(true);
      try {
        const userContextStr = localStorage.getItem("user_context");
        const authHeaders: Record<string, string> = {};
        if (userContextStr) {
          const userContext = JSON.parse(userContextStr);
          const token = userContext.accesstoken;
          if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
          }
        }

        const response = await fetch(
          `${filesService.getImageUrl(imageId)}&v=${profileImageVersion}`,
          {
            method: "GET",
            headers: { Accept: "image/*", ...authHeaders },
          },
        );

        if (cancelled) return;

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setProfileImageBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return objectUrl;
          });
        } else {
          console.error("Failed to load profile image:", response.status);
          setProfileImageBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return "";
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading profile image:", error);
          setProfileImageBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return "";
          });
        }
      } finally {
        if (!cancelled) {
          setIsProfileImageLoading(false);
        }
      }
    };

    loadProfileImage();

    return () => {
      cancelled = true;
    };
  }, [profile.profileimage, profileImageVersion, filesService]);

  // Save profile
  const handleSaveProfile = async () => {
    console.log('🔍 Save button clicked');
    console.log('🔍 isAuthenticated:', isAuthenticated);
    console.log('🔍 userId:', userId);
    console.log('🔍 profile data:', profile);
    
    if (!isAuthenticated || !userId) {
      console.log('❌ Cannot save - not authenticated or no userId');
      toast({
        title: "Error",
        description: "Please log in to save your profile",
        variant: "destructive"
      });
      return;
    }
    
    if (!profile.id || profile.id === 0) {
      console.log('❌ Cannot save - profile has no ID');
      toast({
        title: "Error",
        description: "Profile data is not loaded properly. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('💾 Saving profile:', profile);
      const result = await usersService.save(profile);
      console.log('✅ Save result:', result);

      const savedProfile = result ?? profile;
      setProfile(savedProfile);
      await updateUserContext(savedProfile);
      refreshAuth();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      console.error('❌ Error details:', error);
      toast({
        title: "Error",
        description: `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!isAuthenticated || !userId || !profile.id) {
      toast({
        title: "Error",
        description: "Profile not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedFiles = await filesService.upload([file]);

      if (!uploadedFiles?.length) {
        throw new Error("No file ID returned from upload");
      }

      const imageId = uploadedFiles[0];
      const updatedProfile = { ...profile, profileimage: imageId };
      setProfile(updatedProfile);
      setProfileImageVersion((v) => v + 1);

      const savedProfile = await usersService.save(updatedProfile);
      const persistedProfile = savedProfile ?? updatedProfile;
      setProfile(persistedProfile);
      await updateUserContext(persistedProfile);
      refreshAuth();

      toast({
        title: "Success",
        description: "Profile photo updated",
      });
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle organization deletion
  const handleDeleteOrganization = async () => {
    if (!isAuthenticated || !userId || !organizationId) return;
    
    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting organization:', organizationId);
      const req = new Organisationdeletereq();
      req.organisationid = organizationId;
      req.userid = userId;
      req.otp = otp;

      await usersService.DeleteOrganisationPermananet(req);
      // Clear all localStorage data after successful deletion
      localStorage.clear();
      toast({
        title: "Organization Deleted",
        description: "Your organization has been permanently deleted.",
      });
      // Redirect to login or home page
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Error deleting organization:', error);
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const showProfileImage =
    profile.profileimage > 0 && (profileImageBlobUrl || isProfileImageLoading);

  if (isLoading) {
    return (
      <div className={cn(org.loading, "flex-col gap-3")}>
        <Loader2 className="h-8 w-8 animate-spin text-appointza-coral" />
        <p className="text-sm text-stone-600">Loading profile…</p>
      </div>
    );
  }
  
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className={cn(org.page, "flex min-h-0 flex-col")}
    >
        <header className={cn(org.pageHeader, "border-b border-stone-100/80 pb-4")}>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="h-10 w-10 shrink-0 rounded-xl text-stone-500 hover:bg-[#FFF0EB] hover:text-[#E85D4C]"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className={org.title}>Settings</h1>
              <p className={org.description}>Manage your organization profile and preferences</p>
            </div>
          </div>
        </header>

        <div className="px-4 pb-4 sm:px-6 lg:px-8 xl:px-10">
          <TabsList
            className={cn(
              org.segmentGroup,
              "inline-flex h-auto w-full min-w-0 max-w-full gap-1 overflow-x-auto bg-white p-1 shadow-sm [scrollbar-width:thin]",
            )}
          >
            <TabsTrigger value="profile" className={profileTabTriggerClass}>
              Profile
            </TabsTrigger>
            {hasBusinessHoursAccess && (
              <TabsTrigger value="business-hours" className={profileTabTriggerClass}>
                Business Hours
              </TabsTrigger>
            )}
            {hasStaffManagementAccess && (
              <TabsTrigger value="staff" className={profileTabTriggerClass}>
                Staff
              </TabsTrigger>
            )}
            {hasLocationManagementAccess && (
              <TabsTrigger value="location" className={profileTabTriggerClass}>
                Location
              </TabsTrigger>
            )}
            {hasTemplatesAccess && (
              <TabsTrigger value="templates" className={profileTabTriggerClass}>
                Templates
              </TabsTrigger>
            )}
            {hasPaymentSettingsAccess && (
              <TabsTrigger value="payment" className={profileTabTriggerClass}>
                Payment Settings
              </TabsTrigger>
            )}
            {!isStaff && (
              <TabsTrigger value="billing" className={profileTabTriggerClass}>
                <Wallet className="mr-1.5 inline h-4 w-4 shrink-0" />
                Credit Wallet
              </TabsTrigger>
            )}
            {hasBusinessValuesAccess && (
              <TabsTrigger value="appointment-values" className={profileTabTriggerClass}>
                Appointment Values
              </TabsTrigger>
            )}
            <TabsTrigger value="account" className={profileTabTriggerClass}>
              Account
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className={profileTabPanelClass}>
          <div className="w-full">
        <Card className={cn(org.card, "overflow-hidden rounded-3xl")}>
          <CardContent className="p-0">
            {/* Profile Photo */}
            <div className={cn(profileCardHeaderClass, "bg-gradient-to-br from-[#FFF8F5] to-white")}>
              <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                <span className={profileSectionIconWrap}>
                  <Camera className="h-5 w-5" />
                </span>
                <span>Profile Photo</span>
              </CardTitle>
              <CardDescription className={profileCardDescClass}>Upload or change your profile photo</CardDescription>
            </div>
            <div className={`${profileCardContentClass} pb-6 md:pb-8`}>
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
                <div className="relative shrink-0">
                  {showProfileImage ? (
                    isProfileImageLoading && !profileImageBlobUrl ? (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#FFF0EB] bg-[#FFF0EB] shadow-md ring-2 ring-appointza-coral/25">
                        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" />
                      </div>
                    ) : (
                      <img
                        key={profileImageBlobUrl}
                        src={profileImageBlobUrl}
                        alt="Profile"
                        className="h-28 w-28 rounded-full border-4 border-[#FFF0EB] object-cover shadow-md ring-2 ring-appointza-coral/25"
                      />
                    )
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-[#FFD4CC] bg-[#FFF0EB] ring-2 ring-appointza-coral/15">
                      <User className="h-12 w-12 text-[#E85D4C]/50" />
                    </div>
                  )}
                </div>
                <div className="w-full min-w-0 text-center md:w-auto md:text-left">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <Button
                    variant="outline"
                    disabled={isUploadingImage}
                    onClick={() => document.getElementById('profile-image-upload')?.click()}
                    className={cn(org.btnOutline, "mb-2 min-h-11 w-full touch-manipulation md:w-auto")}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#E85D4C]" />
                    ) : (
                      <Camera className="h-4 w-4 shrink-0 text-[#E85D4C]" />
                    )}
                    {isUploadingImage
                      ? "Uploading…"
                      : profile.profileimage === 0
                        ? "Upload Photo"
                        : "Change Photo"}
                  </Button>
                  <p className="text-xs text-stone-500 md:text-sm">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="border-t border-stone-100">
              <div className={profileCardHeaderClass}>
                <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                  <span className={profileSectionIconWrap}>
                    <User className="h-5 w-5" />
                  </span>
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription className={profileCardDescClass}>
                  Update your personal and organization details
                </CardDescription>
              </div>
              <div className={`${profileCardContentClass} space-y-4 pb-6 md:space-y-6 md:pb-8`}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div className="min-w-0">
                    <Label htmlFor="name" className={org.label}>Name</Label>
                    <Input
                      id="name"
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter your name"
                      className={profileFieldInputClass}
                      autoComplete="name"
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="mobile" className={org.label}>Contact Number</Label>
                    <Input
                      id="mobile"
                      value={profile.mobile || ""}
                      onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                      placeholder="Enter your contact number"
                      type="tel"
                      inputMode="tel"
                      className={profileFieldInputClass}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
            </div>

            {!isStaff && (
              <div className="border-t border-stone-100">
                <div className={profileCardHeaderClass}>
                  <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                    <span className={profileSectionIconWrap}>
                      <Gift className="h-5 w-5" />
                    </span>
                    <span>Referral code</span>
                  </CardTitle>
                  <CardDescription className={profileCardDescClass}>
                    Have a code from another business? Enter it once here. They receive 1 extra
                    month of free subscription when you apply a valid code.
                  </CardDescription>
                </div>
                <div className={`${profileCardContentClass} space-y-3 pb-6 md:pb-8`}>
                  {isLoadingReferralStatus ? (
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Loader2 className="h-4 w-4 animate-spin text-[#E85D4C]" />
                      Checking referral status…
                    </div>
                  ) : referralAlreadyApplied || !canApplyReferralCode ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                      Referral code already applied for this organization.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="referral-code" className={org.label}>
                          Referral code (one time)
                        </Label>
                        <Input
                          id="referral-code"
                          value={referralCodeInput}
                          onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                          placeholder="APZ-XXXXXXXX"
                          className={profileFieldInputClass}
                          autoComplete="off"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleApplyReferralCode}
                        disabled={isApplyingReferral || !referralCodeInput.trim()}
                        className={cn(org.btnPrimary, "min-h-11 shrink-0 touch-manipulation")}
                      >
                        {isApplyingReferral ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying…
                          </>
                        ) : (
                          "Apply code"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isStaff && organizationId > 0 && (
              <IntegrationTokenPanel
                embedded
                headerClass={profileCardHeaderClass}
                contentClass={profileCardContentClass}
                titleClass={profileCardTitleClass}
                descClass={profileCardDescClass}
                iconWrapClass={profileSectionIconWrap}
              />
            )}

            {/* Location Information for Staff Users */}
            {isStaff && currentLocation && (
              <div className="border-t border-stone-100 bg-appointza-cream/20">
                <div className={profileCardHeaderClass}>
                  <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                    <span className={profileSectionIconWrap}>
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span>Your Location Details</span>
                  </CardTitle>
                  <CardDescription className={profileCardDescClass}>
                    Location information for staff access
                  </CardDescription>
                </div>
                <div className={`${profileCardContentClass} pb-6 md:pb-8`}>
                  <div className="space-y-4">
                    <div>
                      <Label className={org.label}>Location Name</Label>
                      <div className="mt-1.5 rounded-2xl border border-stone-100 bg-[#FFF0EB]/60 p-3">
                        <span className="font-medium text-appointza-navy">{currentLocation.name}</span>
                      </div>
                    </div>

                    <div>
                      <Label className={org.label}>Full Address</Label>
                      <div className="mt-1.5 rounded-2xl border border-stone-100 bg-white p-3">
                        <span className="text-sm text-stone-700">{getFullAddress()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label className={org.label}>Phone</Label>
                        <div className="mt-1.5 rounded-2xl border border-stone-100 bg-white p-3">
                          <span className="text-sm text-stone-700">
                            {currentLocation.phone || "Not provided"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className={org.label}>Email</Label>
                        <div className="mt-1.5 rounded-2xl border border-stone-100 bg-white p-3">
                          <span className="text-sm text-stone-700">
                            {currentLocation.email || "Not provided"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="break-words text-sm font-medium text-emerald-800">
                          Staff Access: {getLocationDisplayName()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Locations */}
            <div className="border-t border-stone-100">
              <div className={profileCardHeaderClass}>
                <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                  <span className={profileSectionIconWrap}>
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span>Available Locations</span>
                </CardTitle>
                <CardDescription className={profileCardDescClass}>
                  {isStaff ? "Your assigned location" : "All organization locations"}
                </CardDescription>
              </div>
              <div className={`${profileCardContentClass} pb-6 md:pb-8`}>
                {isLocationListLoading ? (
                  <div className="flex h-16 items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-appointza-coral" />
                    <span className="text-sm text-stone-600">Loading locations…</span>
                  </div>
                ) : availableLocations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-appointza-cream/40 p-6 text-center text-sm text-stone-500">
                    No locations available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableLocations.map((location) => (
                      <div
                        key={location.id}
                        className="flex flex-col gap-3 rounded-2xl border border-stone-100 bg-appointza-cream/30 p-4 transition-colors hover:border-stone-200 hover:bg-[#FFF0EB]/40 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3 md:items-center">
                          <div className={profileSectionIconWrap}>
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-appointza-navy">{location.name}</h3>
                            <p className="break-words text-sm text-stone-600">
                              {location.city && location.state
                                ? `${location.city}, ${location.state}`
                                : location.address || "No address"}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-start md:self-auto">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              location.isactive ?
                                "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                location.isactive ? "bg-emerald-500" : "bg-red-500"
                              )}
                            />
                            {location.isactive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Switch Organization */}
            <div className="border-t border-stone-100">
              <div className={profileCardHeaderClass}>
                <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                  <span className={profileSectionIconWrap}>
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span>Switch Organization</span>
                </CardTitle>
                <CardDescription className={profileCardDescClass}>
                  Switch to Momantza, Campusza, or CRM to access their features
                </CardDescription>
              </div>
              <div className={`${profileCardContentClass} pb-6 md:pb-8`}>
                <Button
                  onClick={() => setShowOrgSwitchModal(true)}
                  className={cn(org.btnOutline, "min-h-11 w-full touch-manipulation")}
                >
                  <RefreshCw className="mr-2 h-4 w-4 text-[#E85D4C]" />
                  Switch Organization
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="border-t border-stone-100 bg-gradient-to-r from-[#FFF8F5] to-white p-4 md:p-6">
              <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end md:gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className={cn(org.btnOutline, "min-h-11 w-full touch-manipulation md:w-auto")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation md:w-auto")}
                >
                  {isSaving ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <OrganizationSwitchModal
          open={showOrgSwitchModal}
          onOpenChange={setShowOrgSwitchModal}
          onSelect={handleOrganizationSwitch}
        />
          </div>
        </TabsContent>

          {hasBusinessHoursAccess && (
            <TabsContent value="business-hours" className={profileTabPanelClass}>
              {activeTab === "business-hours" ? <TimingScreen embedded /> : null}
            </TabsContent>
          )}

          {hasStaffManagementAccess && (
            <TabsContent value="staff" className={profileTabPanelClass}>
              {activeTab === "staff" ? <StaffManagement embedded /> : null}
            </TabsContent>
          )}

          {hasLocationManagementAccess && (
            <TabsContent value="location" className={profileTabPanelClass}>
              {activeTab === "location" ? <LocationsScreen embedded /> : null}
            </TabsContent>
          )}

          {hasTemplatesAccess && (
            <TabsContent value="templates" className={profileTabPanelClass}>
              {activeTab === "templates" ? <OrganizationTemplates embedded /> : null}
            </TabsContent>
          )}

          {hasPaymentSettingsAccess && (
            <TabsContent value="payment" className={profileTabPanelClass}>
              {activeTab === "payment" ? <PaymentSettings embedded /> : null}
            </TabsContent>
          )}

          {!isStaff && (
            <TabsContent value="billing" className={profileTabPanelClass}>
              {activeTab === "billing" ? (
                <OrganizationPageShell embedded>
                  <SettingsEmbeddedHeader
                    icon={Wallet}
                    title="Credit Wallet"
                    description="Prepaid booking credits, free monthly allowance, and Razorpay recharge packs."
                  />
                  <div className={settingsEmbedded.sectionBody}>
                    <CreditWalletBillingPanel organisationId={organizationId} creditWalletOnly />
                  </div>
                </OrganizationPageShell>
              ) : null}
            </TabsContent>
          )}

          {hasBusinessValuesAccess && (
            <TabsContent value="appointment-values" className={profileTabPanelClass}>
              {activeTab === "appointment-values" ? <ReferenceValuesPage embedded /> : null}
            </TabsContent>
          )}

          <TabsContent value="account" className={profileTabPanelClass}>
            <Card className={cn(settingsEmbedded.shell)}>
              <CardContent className="p-0">
                <SettingsEmbeddedHeader
                  icon={User}
                  title="Account"
                  description="Manage your account settings and logout"
                />
                <div className={cn(settingsEmbedded.sectionBody, "py-6 md:py-8")}>
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
                    <p className="text-sm text-stone-500">
                      Sign out of your organization account on this device.
                    </p>
                    <Button
                      onClick={handleLogout}
                      className={cn(
                        org.btnPrimary,
                        "h-14 min-h-14 w-full touch-manipulation rounded-2xl px-6 text-base font-semibold shadow-md",
                      )}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Log out
                    </Button>
                  </div>
                </div>

                <div className="border-t border-stone-100">
                  <div className={cn(profileCardContentClass, "py-4 md:py-5")}>
                    <p className="text-xs leading-relaxed text-stone-400">
                      Permanently delete this organization and all associated data. This cannot be undone.
                    </p>

                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-8 px-2 text-xs font-normal text-stone-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete organization
                        </Button>
                      </AlertDialogTrigger>
                        <AlertDialogContent className="max-h-[min(90dvh,40rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-3 overflow-y-auto p-4 md:p-6">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your organization and
                              remove all data from our servers. All services, appointments, staff, and customer
                              information will be lost forever.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <Label htmlFor="otp">Enter OTP (if required)</Label>
                            <Input
                              id="otp"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="Enter OTP"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              className="mt-1 h-11 min-h-11 text-base"
                            />
                          </div>
                          <AlertDialogFooter className="gap-2 md:gap-0">
                            <AlertDialogCancel className="min-h-11 w-full touch-manipulation md:w-auto">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteOrganization}
                              disabled={isDeleting}
                              className="min-h-11 w-full touch-manipulation bg-red-600 hover:bg-red-700 md:w-auto"
                            >
                              {isDeleting ? (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
    </Tabs>
  );
};

export default OrganizationProfile;