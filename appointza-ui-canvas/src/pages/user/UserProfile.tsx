import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Save, Loader2, LogOut, Building2, RefreshCw, ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import { FilesService } from "@/services/files.service";
import { Users, UsersSelectReq, Organisationdeletereq } from "@/models/users.model";
import OrganizationSwitchModal, {
  type SwitchableOrganization,
} from "@/components/organization/OrganizationSwitchModal";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { ProfilePhotoSection } from "@/components/user/ProfilePhotoSection";
import {
  resolveProfileImageId,
  useAuthenticatedProfileImage,
} from "@/hooks/useAuthenticatedProfileImage";
import { org } from "@/lib/orgTheme";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { cn } from "@/lib/utils";

const profileTabTriggerClass =
  "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 shadow-none transition-colors hover:text-stone-800 data-[state=active]:bg-gradient-coral data-[state=active]:text-white data-[state=active]:shadow-sm sm:px-4";

const profileCardHeaderClass = "space-y-1.5 p-5 md:p-6";
const profileCardContentClass = "p-5 pt-0 md:p-6 md:pt-0";
const profileCardTitleClass = "text-lg font-semibold leading-snug text-appointza-navy md:text-xl";
const profileCardDescClass = "text-sm text-stone-500";
const profileSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#E85D4C]";

const profileTabsPanelInsetClass = "px-4 sm:px-6 lg:px-8 xl:px-10";

const profileTabPanelClass = cn(
  "m-0 py-6 focus-visible:outline-none md:py-8",
  profileTabsPanelInsetClass,
);

const profileFieldInputClass = cn(org.input, "mt-1.5 h-11 min-h-11 md:h-10 md:min-h-10");

type UserProfileTab = "profile" | "account";

function withResolvedProfileImage(data: Users, authImageId?: number | null): Users {
  const resolved = { ...data };
  resolved.profileimage = resolveProfileImageId(resolved.profileimage, authImageId);
  return resolved;
}

const UserProfile = () => {
  const { user, isAuthenticated, logout, refreshAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = user?.id || 0;
  const isCustomer = user?.organisationid === 0;

  const usersService = useMemo(() => new UsersService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const [profile, setProfile] = useState<Users>(new Users());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOrgSwitchModal, setShowOrgSwitchModal] = useState(false);

  const profileImageId = useMemo(() => {
    void profileImageVersion;
    return resolveProfileImageId(profile.profileimage, user?.imageid);
  }, [profile.profileimage, user?.imageid, profileImageVersion]);

  const {
    blobUrl: profileImageBlobUrl,
    isLoading: isProfileImageLoading,
    showImage: showProfileImage,
  } = useAuthenticatedProfileImage(profileImageId, profileImageVersion);

  useEffect(() => {
    const onContextUpdated = () => setProfileImageVersion((v) => v + 1);
    window.addEventListener("userContextUpdated", onContextUpdated);
    return () => window.removeEventListener("userContextUpdated", onContextUpdated);
  }, []);

  const activeTab = useMemo((): UserProfileTab => {
    const raw = searchParams.get("tab") as UserProfileTab | null;
    if (raw === "account") return "account";
    return "profile";
  }, [searchParams]);

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

  const handleOrganizationSwitch = (org: SwitchableOrganization) => {
    if (org === "momantza") {
      navigate("/momantza/booking");
    } else if (org === "campusza") {
      navigate("/campusza/staff");
    } else if (org === "crm") {
      navigate("/crm");
    }
  };

  const updateUserContext = useCallback(async (userData: Users) => {
    try {
      const userContextStr = localStorage.getItem("user_context");
      if (!userContextStr) return;

      const userContext = JSON.parse(userContextStr);
      userContext.userid = userData.id || userContext.userid;
      userContext.username = userData.name || userContext.username;
      userContext.useremail = userData.email || userContext.useremail;
      userContext.usermobile = userData.mobile || userContext.usermobile;
      userContext.userimageid = userData.profileimage || userContext.userimageid;
      userContext.organisationid = userData.organisationid ?? userContext.organisationid;

      localStorage.setItem("user_context", JSON.stringify(userContext));
      window.dispatchEvent(new CustomEvent("userContextUpdated"));
    } catch (error) {
      console.error("Error updating user_context:", error);
    }
  }, []);

  const loadProfileData = useCallback(async () => {
    if (!isAuthenticated || !userId) return;

    setIsLoading(true);
    try {
      const req = new UsersSelectReq();
      req.id = userId;

      const response = await usersService.select(req);

      if (response && response.length > 0) {
        const userData = withResolvedProfileImage(response[0], user?.imageid);
        setProfile(userData);
        await updateUserContext(userData);
      } else if (user) {
        const fallbackProfile = new Users();
        fallbackProfile.id = user.id || 0;
        fallbackProfile.mobile = user.mobile || "";
        fallbackProfile.name = user.username || user.firstname || "";
        fallbackProfile.email = user.email || "";
        fallbackProfile.profileimage = resolveProfileImageId(0, user.imageid);
        setProfile(fallbackProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (user) {
        const fallbackProfile = new Users();
        fallbackProfile.id = user.id || 0;
        fallbackProfile.mobile = user.mobile || "";
        fallbackProfile.name = user.username || user.firstname || "";
        fallbackProfile.email = user.email || "";
        fallbackProfile.profileimage = resolveProfileImageId(0, user.imageid);
        setProfile(fallbackProfile);
      }
      toast({
        title: "Warning",
        description: "Using cached profile data. Some information may not be up to date.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, usersService, toast, user, updateUserContext]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    const resolved = resolveProfileImageId(profile.profileimage, user?.imageid);
    if (resolved <= 0 || resolved === profile.profileimage) return;
    setProfile((prev) => ({ ...prev, profileimage: resolved }));
  }, [user?.imageid, profile.profileimage]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!isAuthenticated || !userId) {
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
      const updatedProfile = {
        ...profile,
        id: profile.id || userId,
        profileimage: imageId,
      };
      setProfile(updatedProfile);
      setProfileImageVersion((v) => v + 1);

      const savedProfile = await usersService.save(updatedProfile);
      const persistedProfile = withResolvedProfileImage(savedProfile ?? updatedProfile, imageId);
      if (!persistedProfile.profileimage) {
        persistedProfile.profileimage = imageId;
      }
      setProfile(persistedProfile);
      await updateUserContext(persistedProfile);
      refreshAuth();
      setProfileImageVersion((v) => v + 1);

      toast({
        title: "Success",
        description: "Profile photo updated",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isAuthenticated) return;

    setIsSaving(true);
    try {
      const toSave = { ...profile, id: profile.id || userId };
      const response = await usersService.save(toSave);

      if (response) {
        const persisted = withResolvedProfileImage(response, user?.imageid);
        setProfile(persisted);
        toast({
          title: "Success",
          description: "Profile saved successfully",
        });
        await updateUserContext(persisted);
        refreshAuth();
        setProfileImageVersion((v) => v + 1);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!isAuthenticated) return;

    setIsDeleting(true);
    try {
      const req = new Organisationdeletereq();
      req.organisationid = user?.organisationid || 0;
      req.userid = userId;
      req.otp = otp;

      let response;
      if (isCustomer) {
        response = await usersService.Deleteuserpermanent(req);
        toast({
          title: "Success",
          description: "Account deleted successfully",
        });
      } else {
        response = await usersService.DeleteOrganisationPermananet(req);
        toast({
          title: "Success",
          description: "Organization deleted successfully",
        });
      }

      if (response) {
        localStorage.removeItem("user_context");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleInputChange = (field: keyof Users, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

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
            <p className={org.description}>Manage your personal profile and preferences</p>
          </div>
        </div>
      </header>

      <div className={profileTabsPanelInsetClass}>
        <TabsList
          className={cn(
            org.segmentGroup,
            "inline-flex h-auto w-full min-w-0 max-w-full gap-1 overflow-x-auto bg-white p-1 shadow-sm [scrollbar-width:thin]",
          )}
        >
          <TabsTrigger value="profile" className={profileTabTriggerClass}>
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className={profileTabTriggerClass}>
            Account
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="profile" className={profileTabPanelClass}>
        <div className="w-full">
          <Card className={cn(org.card, "overflow-hidden rounded-3xl")}>
            <CardContent className="p-0">
              <ProfilePhotoSection
                headerClassName={profileCardHeaderClass}
                contentClassName={cn(profileCardContentClass, "pb-6 md:pb-8")}
                titleClassName={profileCardTitleClass}
                showImage={showProfileImage}
                isImageLoading={isProfileImageLoading}
                imageBlobUrl={profileImageBlobUrl}
                isUploading={isUploadingImage}
                hasImage={profileImageId > 0}
                onPickImage={() => document.getElementById("profile-image-upload")?.click()}
                onFileChange={handleImageUpload}
              />

              <div className="border-t border-stone-100">
                <div className={profileCardHeaderClass}>
                  <CardTitle className={cn("flex items-center gap-3", profileCardTitleClass)}>
                    <span className={profileSectionIconWrap}>
                      <User className="h-5 w-5" />
                    </span>
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription className={profileCardDescClass}>
                    Update your personal details
                  </CardDescription>
                </div>
                <div className={cn(profileCardContentClass, "space-y-4 pb-6 md:space-y-6 md:pb-8")}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    <div className="min-w-0">
                      <Label htmlFor="name" className={org.label}>
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={profile.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your name"
                        className={profileFieldInputClass}
                        autoComplete="name"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="mobile" className={org.label}>
                        Contact Number
                      </Label>
                      <Input
                        id="mobile"
                        value={profile.mobile || ""}
                        onChange={(e) => handleInputChange("mobile", e.target.value)}
                        placeholder="Enter your contact number"
                        type="tel"
                        inputMode="tel"
                        className={profileFieldInputClass}
                        autoComplete="tel"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="email" className={org.label}>
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={profile.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter your email"
                        type="email"
                        className={profileFieldInputClass}
                        autoComplete="email"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="designation" className={org.label}>
                        Role
                      </Label>
                      <Input
                        id="designation"
                        value={profile.designation || ""}
                        onChange={(e) => handleInputChange("designation", e.target.value)}
                        placeholder="Enter your role"
                        className={profileFieldInputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100">
                <div className={profileCardHeaderClass}>
                  <CardTitle className={cn("flex items-center gap-3", profileCardTitleClass)}>
                    <span className={profileSectionIconWrap}>
                      <Building2 className="h-5 w-5" />
                    </span>
                    <span>Switch Organization</span>
                  </CardTitle>
                  <CardDescription className={profileCardDescClass}>
                    Switch to Momantza, Campusza, or CRM to access their features
                  </CardDescription>
                </div>
                <div className={cn(profileCardContentClass, "pb-6 md:pb-8")}>
                  <Button
                    type="button"
                    onClick={() => setShowOrgSwitchModal(true)}
                    className={cn(org.btnOutline, "min-h-11 w-full touch-manipulation md:w-auto")}
                  >
                    <RefreshCw className="mr-2 h-4 w-4 text-[#E85D4C]" />
                    Switch Organization
                  </Button>
                </div>
              </div>

              <div className="border-t border-stone-100 bg-gradient-to-r from-[#FFF8F5] to-white p-4 md:p-6">
                <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end md:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className={cn(org.btnOutline, "min-h-11 w-full touch-manipulation md:w-auto")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
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
                <p className="text-sm text-stone-500">Sign out of your account on this device.</p>
                <Button
                  type="button"
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
                  Permanently delete your {isCustomer ? "account" : "organization"} and all associated
                  data. This cannot be undone.
                </p>

                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 px-2 text-xs font-normal text-stone-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      {isCustomer ? "Delete account" : "Delete organization"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-h-[min(90dvh,40rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-3 overflow-y-auto p-4 md:p-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All related data will be lost forever.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label htmlFor="otp-user-profile" className={org.label}>
                        Enter OTP (if required)
                      </Label>
                      <Input
                        id="otp-user-profile"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className={cn(profileFieldInputClass, "mt-1.5")}
                      />
                    </div>
                    <AlertDialogFooter className="gap-2 md:gap-0">
                      <AlertDialogCancel className="min-h-11 w-full touch-manipulation md:w-auto">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProfile}
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

export default UserProfile;
