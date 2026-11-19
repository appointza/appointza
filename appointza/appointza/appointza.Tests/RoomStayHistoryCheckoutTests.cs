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
}
