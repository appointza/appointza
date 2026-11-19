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
    [InlineData(0, 16, true)]
    [InlineData(16, 16, true)]
    [InlineData(99, 16, false)]
    [InlineData(16, 0, false)]
    public void CanRevealIdentity_only_same_org_or_unattached(
        long userOrg,
        long callerOrg,
        bool expected)
    {
        Assert.Equal(expected, StaffInvitePrivacy.CanRevealIdentity(userOrg, callerOrg));
    }
}
