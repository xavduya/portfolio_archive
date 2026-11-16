using Microsoft.AspNetCore.Mvc.RazorPages;
using PortfolioArchive.Models;
using PortfolioArchive.Services;

namespace PortfolioArchive.Pages;

public class IndexModel : PageModel
{
    private readonly IProjectService _projects;

    public IndexModel(IProjectService projects) => _projects = projects;

    public IReadOnlyList<Project> Projects { get; private set; } = Array.Empty<Project>();

    public void OnGet()
    {
        Projects = _projects.GetAll();
    }
}
