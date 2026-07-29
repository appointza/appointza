using System.ComponentModel.DataAnnotations;

namespace appointza.Models.AppointzaStay;

public enum SignupAccountType
{
    Guest,
    Organisation,
}

public class LoginViewModel
{
    [Required(ErrorMessage = "Email or phone is required")]
    [Display(Name = "Email or phone")]
    public string Login { get; set; } = "";

    [Required(ErrorMessage = "Password is required")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = "";

    [Display(Name = "Remember me")]
    public bool RememberMe { get; set; }

    public string? ReturnUrl { get; set; }
}

public class SignupViewModel
{
    public SignupAccountType AccountType { get; set; } = SignupAccountType.Guest;

    [Required(ErrorMessage = "Name is required")]
    [StringLength(120)]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "Phone is required")]
    [Phone(ErrorMessage = "Enter a valid phone number")]
    public string Phone { get; set; } = "";

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Enter a valid email")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = "";

    [Required(ErrorMessage = "Confirm your password")]
    [DataType(DataType.Password)]
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = "";
}
