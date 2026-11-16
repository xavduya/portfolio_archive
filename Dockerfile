# syntax=docker/dockerfile:1

# Keep this in sync with <TargetFramework> in PortfolioArchive.csproj
# (net10.0 <-> 10.0). .NET 8 left support on Nov 10, 2026.
ARG DOTNET_VERSION=10.0

# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

# Restore first so this layer stays cached until the csproj changes
COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o /app/out --no-restore /p:UseAppHost=false

# ---------- Runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:5002

# --chown avoids the duplicate layer a separate "RUN chown -R" creates
COPY --from=build --chown=app:app /app/out ./

# Data Protection keys (see Program.cs). Mount a volume here to persist them.
RUN mkdir -p /app/DataProtection-Keys && chown app:app /app/DataProtection-Keys
VOLUME /app/DataProtection-Keys

# Built-in non-root user shipped with the official .NET 8+ images
USER app

EXPOSE 5002
ENTRYPOINT ["dotnet", "PortfolioArchive.dll"]