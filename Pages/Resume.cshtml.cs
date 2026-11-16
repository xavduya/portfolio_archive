using Microsoft.AspNetCore.Mvc.RazorPages;

namespace PortfolioArchive.Pages;

public class ResumeModel : PageModel
{
    private readonly IConfiguration _configuration;

    public string? ResumeUrl { get; set; }
    public string? ResumeDownloadUrl { get; set; }

    public ResumeModel(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void OnGet()
    {
        // Get the resume URL from configuration
        // You can set this in appsettings.json or environment variables
        ResumeUrl = _configuration["ResumeSettings:GoogleDrivePreviewUrl"];
        ResumeDownloadUrl = _configuration["ResumeSettings:GoogleDriveDownloadUrl"];
    }
}
