namespace appointza.Models.AppointzaStay;

public class AppointzaStayLoginReq
{
    public string login { get; set; } = "";
    public string password { get; set; } = "";
}

public class AppointzaStaySignupReq
{
    public SignupAccountType accountType { get; set; } = SignupAccountType.Guest;
    public string name { get; set; } = "";
    public string phone { get; set; } = "";
    public string email { get; set; } = "";
    public string password { get; set; } = "";
}

public class AppointzaStayAuthRes
{
    public string userId { get; set; } = "";
    public string name { get; set; } = "";
    public string email { get; set; } = "";
    public string role { get; set; } = "";
    public string organizationId { get; set; } = "";
    public string organizationName { get; set; } = "";
    public string organizationSlug { get; set; } = "";
    public string accesstoken { get; set; } = "";
}

public class AppointzaStayUserContext
{
    public string userId { get; set; } = "";
    public string name { get; set; } = "";
    public string email { get; set; } = "";
    public string role { get; set; } = "";
    public string organizationId { get; set; } = "";
    public string organizationName { get; set; } = "";
    public string organizationSlug { get; set; } = "";
}
