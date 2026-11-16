using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace PortfolioArchive.Services;

/// <summary>
/// Sends the contact-form email through Resend's HTTPS API.
/// Plain HTTPS works on Render's free tier, unlike SMTP ports 25/465/587.
/// </summary>
public class EmailService
{
    private readonly HttpClient _http;
    private readonly ILogger<EmailService> _logger;
    private readonly string _from;
    private readonly string _to;

    public EmailService(HttpClient http, IConfiguration configuration, ILogger<EmailService> logger)
    {
        _http = http;
        _logger = logger;

        // Until you verify your own domain with Resend, use their test sender.
        _from = configuration["EmailSettings:From"] ?? "Portfolio Contact Form <onboarding@resend.dev>";
        _to = configuration["EmailSettings:RecipientEmail"] ?? "";
        var apiKey = configuration["EmailSettings:ApiKey"] ?? "";

        _http.BaseAddress = new Uri("https://api.resend.com/");
        _http.Timeout = TimeSpan.FromSeconds(15); // fail fast instead of hanging
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
    }

    public async Task SendContactAsync(string name, string email, string message)
    {
        var payload = new
        {
            from = _from,
            to = new[] { _to },
            reply_to = email,
            subject = $"[Portfolio Inquiry] From {name}",
            text = $"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        };

        using var response = await _http.PostAsJsonAsync("emails", payload);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Email API returned {Status}: {Body}", (int)response.StatusCode, body);
            throw new InvalidOperationException($"Email API error {(int)response.StatusCode}");
        }
    }
}