using System.ComponentModel.DataAnnotations;
using PortfolioArchive.Services;
using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MimeKit;

namespace PortfolioArchive.Pages;

public class ContactModel : PageModel
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ContactModel> _logger;

    private readonly EmailService _emailService;

    public ContactModel(IConfiguration configuration, ILogger<ContactModel> logger, EmailService emailService)
    {
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
    }

    [BindProperty]
    public ContactInput Input { get; set; } = new();

    public bool Submitted { get; private set; }
    public string? ErrorMessage { get; private set; }

    public void OnGet() { }

    public async Task<IActionResult> OnPostAsync()
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        try
        {
            var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var port = int.Parse(_configuration["EmailSettings:Port"] ?? "587");
            var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "mattxavierviduya@gmail.com";
            var recipientEmail = _configuration["EmailSettings:RecipientEmail"] ?? "mattxavierviduya@gmail.com";
            var appPassword = _configuration["EmailSettings:AppPassword"] ?? "";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Portfolio Contact Form", senderEmail));
            message.To.Add(new MailboxAddress("Matt Xavier Viduya", recipientEmail));
            message.ReplyTo.Add(new MailboxAddress(Input.Name, Input.Email));
            message.Subject = $"[Portfolio Inquiry] From {Input.Name}";

            var bodyBuilder = new BodyBuilder
            {
                TextBody = $"Name: {Input.Name}\nEmail: {Input.Email}\n\nMessage:\n{Input.Message}"
            };
            message.Body = bodyBuilder.ToMessageBody();

            await _emailService.SendAsync(message);

            Submitted = true;
            Input = new ContactInput();
            ModelState.Clear();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send contact email");
            ErrorMessage = "Could not send message. Please email directly or try again later.";
        }

        return Page();
    }

    public class ContactInput
    {
        [Required, Display(Name = "Name")]
        public string Name { get; set; } = "";

        [Required, EmailAddress, Display(Name = "Email")]
        public string Email { get; set; } = "";

        [Required, Display(Name = "Message")]
        public string Message { get; set; } = "";
    }
}
