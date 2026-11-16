using System;
using System.IO;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MailKit; // for SendAsync extension

namespace PortfolioArchive.Services
{
    /// <summary>
    /// Provides a reusable, singleton email sender using MailKit.
    /// The client is connected and authenticated once at startup and reused for subsequent sends.
    /// Implements <see cref="IAsyncDisposable"/> to cleanly disconnect on shutdown.
    /// </summary>
    public class EmailService : IAsyncDisposable
    {
        private readonly SmtpClient _client;
        private readonly ILogger<EmailService> _logger;
        private bool _connected;
        private readonly string _smtpServer;
        private readonly int _port;
        private readonly string _senderEmail;
        private readonly string _appPassword;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _logger = logger;
            _smtpServer = configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            _port = int.TryParse(configuration["EmailSettings:Port"], out var p) ? p : 587;
            _senderEmail = configuration["EmailSettings:senderEmail"] ?? "example@example.com";
            _appPassword = configuration["EmailSettings:AppPassword"] ?? string.Empty;
            _client = new SmtpClient();
        }

        private async Task EnsureConnectedAsync()
        {
            // Reconnect if not currently connected (e.g., after timeout or disconnection)
            if (_connected && _client.IsConnected)
                return;

            // Reset connection state before (re)connecting
            _connected = false;
            try
            {
                var socketOptions = _port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
                await _client.ConnectAsync(_smtpServer, _port, socketOptions);
                if (!string.IsNullOrEmpty(_appPassword))
                {
                    await _client.AuthenticateAsync(_senderEmail, _appPassword);
                }
                _connected = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect/authenticate SMTP client");
                throw;
            }
        }

        public async Task SendAsync(MimeMessage message)
        {
            // Ensure we have a live, authenticated connection.
            await EnsureConnectedAsync();
            try
            {
                await _client.SendAsync(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email");
                // Reset connection state so a future call will reconnect.
                _connected = false;
                if (_client.IsConnected)
                {
                    try { await _client.DisconnectAsync(true); } catch { }
                }
                throw;
            }
        }


        public async ValueTask DisposeAsync()
        {
            if (_client.IsConnected)
            {
                try
                {
                    await _client.DisconnectAsync(true);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error during SMTP client disconnect");
                }
            }
            _client.Dispose();
        }
    }
}
