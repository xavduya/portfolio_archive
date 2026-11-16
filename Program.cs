using System.IO;
using Microsoft.AspNetCore.DataProtection;
using PortfolioArchive.Services;
using Microsoft.AspNetCore.DataProtection.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure DataProtection to a writable folder inside the project
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(Directory.GetCurrentDirectory(), "DataProtection-Keys")));

builder.Services.AddRazorPages();
builder.Services.AddSingleton<IProjectService, ProjectService>();
builder.Services.AddHttpClient<EmailService>();



var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapRazorPages();

app.Run();
