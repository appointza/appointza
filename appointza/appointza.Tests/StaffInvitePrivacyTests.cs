using appointza.Models;
using appointza.Utils;
using Xunit;

namespace appointza.Tests;

public class StaffInvitePrivacyTests
{
    [Theory]
    [InlineData(null, "User")]
    [InlineData("", "User")]
    [InlineData("Arun", "A***")]
    [InlineData("Arun Kumar", "A*** K***")]
    public void MaskDisplayName_hides_full_name(string? input, string expected)
    {
        Assert.Equal(expected, StaffInvitePrivacy.MaskDisplayName(input));
    }

    [Theory]
    [InlineData(0, 16, false)]
    [InlineData(16, 16, true)]
    [InlineData(99, 16, false)]
    [InlineData(16, 0, false)]
    [InlineData(0, 0, false)]
    public void CanRevealIdentity_only_allows_same_organisation(
        long userOrg,
        long callerOrg,
        bool expected)
    {
        Assert.Equal(expected, StaffInvitePrivacy.CanRevealIdentity(userOrg, callerOrg));
    }

    [Fact]
    public void IsOrgAdminForStaffInvite_allows_org_owner_and_blocks_unprivileged_staff()
    {
        var orgOwner = new Users
        {
            id = 5,
            organisationid = 16,
            parentid = 0,
            isactive = true,
            issuspended = false,
        };
        var regularStaff = new Users
        {
            id = 6,
            organisationid = 16,
            parentid = 5,
            isactive = true,
            issuspended = false,
            attributes = new Users.AttributesData
            {
                permission = new UsersPermissionData { editandviewStaffManagement = false },
            },
        };
        var staffManager = new Users
        {
            id = 7,
            organisationid = 16,
            parentid = 5,
            isactive = true,
            issuspended = false,
            attributes = new Users.AttributesData
            {
                permission = new UsersPermissionData { editandviewStaffManagement = true },
            },
        };
        var otherOrgOwner = new Users
        {
            id = 8,
            organisationid = 99,
            parentid = 0,
            isactive = true,
            issuspended = false,
        };

        Assert.True(StaffInvitePrivacy.IsOrgAdminForStaffInvite(orgOwner, 16));
        Assert.False(StaffInvitePrivacy.IsOrgAdminForStaffInvite(regularStaff, 16));
        Assert.True(StaffInvitePrivacy.IsOrgAdminForStaffInvite(staffManager, 16));
        Assert.False(StaffInvitePrivacy.IsOrgAdminForStaffInvite(otherOrgOwner, 16));
        Assert.False(StaffInvitePrivacy.IsOrgAdminForStaffInvite(null, 16));
    }
}
