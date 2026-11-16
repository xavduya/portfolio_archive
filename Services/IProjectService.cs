using PortfolioArchive.Models;

namespace PortfolioArchive.Services;

public interface IProjectService
{
    IReadOnlyList<Project> GetAll();
    Project? GetBySlug(string slug);
}
