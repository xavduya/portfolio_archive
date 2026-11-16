using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using PortfolioArchive.Models;
using PortfolioArchive.Services;

namespace PortfolioArchive.Pages.Work;

public class DetailModel : PageModel
{
    private readonly IProjectService _projects;

    public DetailModel(IProjectService projects) => _projects = projects;

    public Project? Project { get; private set; }

    public IActionResult OnGet(string slug)
    {
        Project = _projects.GetBySlug(slug);
        if (Project is null)
        {
            return NotFound();
        }
        return Page();
    }
}
