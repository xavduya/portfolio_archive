namespace PortfolioArchive.Models;

public class Project
{
    public string Slug { get; set; } = "";
    public string SpecimenTag { get; set; } = "";
    public string Title { get; set; } = "";
    public string ImageUrl { get; set; } = "";
    public string Date { get; set; } = "";
    public string Stack { get; set; } = "";
    public string Type { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Description { get; set; } = "";

    // Optional. Leave out of projects.json (or "") to show the placeholder.
    public string DemoVideo { get; set; } = "";   // e.g. "/videos/aidiq-demo.mp4"
    public string Demo { get; set; } = "";        // key for the interactive demo, e.g. "aidiq"
    public string Link { get; set; } = "";
}
