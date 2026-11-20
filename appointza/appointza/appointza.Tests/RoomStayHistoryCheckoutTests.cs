using appointza.Models.Hospitality;
using appointza.Utils;
using Xunit;

namespace appointza.Tests;

public class RoomStayHistoryCheckoutTests
{
    [Fact]
    public void CompleteCheckout_closes_stay_and_board_shows_available()
    {
        var room = new OrganisationRoom
        {
            status = "occupied",
            guest = new RoomGuestData { name = "Ada", phone = "9000000001" },
            booking = new RoomBookingData
            {
                booking_id = "BK-1",
                check_in = "2026-11-18",
                check_out = "2026-11-20",
                nights = 2,
                stays =
                [
                    new RoomStayRecord
                    {
                        booking_id = "BK-1",
                        check_in = "2026-11-18",
                        check_out = "2026-11-20",
                        nights = 2,
                        closed = false,
                        guest = new RoomGuestData { name = "Ada", phone = "9000000001" },
                    },
                ],
            },
        };

        var asOf = new DateOnly(2026, 11, 19);
        RoomStayHistory.CompleteCheckout(room, asOf);

        Assert.Equal("available", room.status);
        Assert.False(RoomStayHistory.HasActiveBooking(room));
        Assert.Equal("Available", RoomStayHistory.GetAvailabilityState(room, asOf));
        Assert.DoesNotContain(RoomStayHistory.Collect(room), s => !s.closed);
    }

    [Fact]
    public void GetAvailabilityState_ignores_closed_stays()
    {
        var room = new OrganisationRoom
        {
            status = "available",
            booking = new RoomBookingData
            {
                stays =
                [
                    new RoomStayRecord
                    {
                        booking_id = "BK-2",
                        check_in = "2026-11-18",
                        check_out = "2026-11-20",
                        closed = true,
                    },
                ],
            },
        };

        Assert.Equal(
            "Available",
            RoomStayHistory.GetAvailabilityState(room, new DateOnly(2026, 11, 19)));
    }

    [Fact]
    public void OverlayBoardDay_clears_guest_when_no_stay_on_date()
    {
        var room = new OrganisationRoom
        {
            status = "reserved",
            guest = new RoomGuestData { name = "Ada", phone = "9000000001" },
            booking = new RoomBookingData
            {
                booking_id = "BK-3",
                check_in = "2026-11-18",
                check_out = "2026-11-20",
                stays =
                [
                    new RoomStayRecord
                    {
                        booking_id = "BK-3",
                        check_in = "2026-11-18",
                        check_out = "2026-11-20",
                        closed = false,
                        guest = new RoomGuestData { name = "Ada", phone = "9000000001" },
                    },
                ],
            },
        };

        RoomStayHistory.OverlayBoardDay(room, new DateOnly(2026, 11, 21));
        Assert.Null(room.guest);
        Assert.True(string.IsNullOrEmpty(room.booking?.booking_id));
    }

    [Fact]
    public void OverlayBoardDay_shows_departing_guest_on_checkout_day()
    {
        var room = new OrganisationRoom
        {
            status = "occupied",
            booking = new RoomBookingData
            {
                stays =
                [
                    new RoomStayRecord
                    {
                        booking_id = "BK-4",
                        check_in = "2026-11-18",
                        check_out = "2026-11-20",
                        closed = false,
                        guest = new RoomGuestData { name = "Bob" },
                    },
                ],
            },
        };

        RoomStayHistory.OverlayBoardDay(room, new DateOnly(2026, 11, 20));
        Assert.Equal("Bob", room.guest?.name);
        Assert.Equal("Check-out", RoomStayHistory.GetAvailabilityState(room, new DateOnly(2026, 11, 20)));
    }

    [Fact]
    public void OverlapsAnyStayWindow_allows_non_overlapping_hourly_same_day()
    {
        var room = new OrganisationRoom
        {
            status = "reserved",
            booking = new RoomBookingData
            {
                stays =
                [
                    new RoomStayRecord
                    {
                        booking_id = "BK-H1",
                        check_in = "2026-11-18",
                        check_out = "2026-11-18",
                        check_in_time = "10:00",
                        check_out_time = "12:00",
                        closed = false,
                        status = "reserved",
                    },
                ],
            },
        };

        var morning = new DateTime(2026, 11, 18, 10, 0, 0);
        var noon = new DateTime(2026, 11, 18, 12, 0, 0);
        var afternoonStart = new DateTime(2026, 11, 18, 14, 0, 0);
        var afternoonEnd = new DateTime(2026, 11, 18, 16, 0, 0);
        var overlapStart = new DateTime(2026, 11, 18, 11, 0, 0);
        var overlapEnd = new DateTime(2026, 11, 18, 13, 0, 0);

        Assert.False(RoomStayHistory.OverlapsAnyStayWindow(room, afternoonStart, afternoonEnd));
        Assert.True(RoomStayHistory.OverlapsAnyStayWindow(room, morning, noon));
        Assert.True(RoomStayHistory.OverlapsAnyStayWindow(room, overlapStart, overlapEnd));
        Assert.False(RoomStayHistory.TimestampRangesOverlap(morning, noon, afternoonStart, afternoonEnd));
        Assert.True(RoomStayHistory.TimestampRangesOverlap(morning, noon, overlapStart, overlapEnd));
    }

    [Fact]
    public void OverlapsAnyStayWindow_overnight_still_blocks_nights()
    {
        var room = new OrganisationRoom
        {
            booking = new RoomBookingData
            {
                stays =
                [
                    new RoomStayRecord
                    {
                        booking_id = "BK-O1",
                        check_in = "2026-11-18",
                        check_out = "2026-11-20",
                        check_in_time = "14:00",
                        check_out_time = "11:00",
                        closed = false,
                        status = "confirmed",
                    },
                ],
            },
        };

        Assert.True(RoomStayHistory.OverlapsAnyStayWindow(
            room,
            new DateTime(2026, 11, 19, 14, 0, 0),
            new DateTime(2026, 11, 20, 11, 0, 0)));
        Assert.False(RoomStayHistory.OverlapsAnyStayWindow(
            room,
            new DateTime(2026, 11, 20, 14, 0, 0),
            new DateTime(2026, 11, 21, 11, 0, 0)));
    }
}
