using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class CustomersController : ControllerBase
{
    private readonly CustomerService _customers;

    public CustomersController(CustomerService customers) => _customers = customers;

    [HttpGet("Select")]
    public ActionResult<ActionRes<List<StayModels.Customer>>> Select(string? search, string? id)
    {
        var list = _customers.GetAllCustomers(search);
        StayModels.CustomerSummary? selected = id != null ? _customers.GetCustomer(id) : null;
        return Ok(new ActionRes<object>
        {
            item = new
            {
                customers = list,
                selected,
                search,
            },
        });
    }
}
