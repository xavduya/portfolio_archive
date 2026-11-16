using System.Text.Json;
using PortfolioArchive.Models;

namespace PortfolioArchive.Services;


public class ProjectService : IProjectService
{
    private readonly List<Project> _projects;

    public ProjectService(IWebHostEnvironment env)
    {
        var path = Path.Combine(env.ContentRootPath, "Data", "projects.json");
        var json = File.ReadAllText(path);
        _projects = JsonSerializer.Deserialize<List<Project>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<Project>();
    }

    public IReadOnlyList<Project> GetAll() => _projects;

    public Project? GetBySlug(string slug) =>
        _projects.FirstOrDefault(p => string.Equals(p.Slug, slug, StringComparison.OrdinalIgnoreCase));
}
