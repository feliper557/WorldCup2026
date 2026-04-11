using Microsoft.EntityFrameworkCore;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WorldCup.Api.Infrastructure;
using WorldCup.Api.Infrastructure.Repositories.Implementations;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// Configure CORS for Azure Static Web Apps integration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowStaticWebApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",  // Vite dev server
            "https://*.azurestaticapps.net"  // Production SWA
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Register EF Core DbContext with SQL Server
var sqlConnectionString = Environment.GetEnvironmentVariable("SqlConnectionString")
    ?? throw new InvalidOperationException("SqlConnectionString not configured");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(sqlConnectionString));

// Register repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IInvitationRepository, InvitationRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();
builder.Services.AddScoped<IPredictionRepository, PredictionRepository>();
builder.Services.AddScoped<IScoreRepository, ScoreRepository>();
builder.Services.AddScoped<IRaffleRepository, RaffleRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IChampionPredictionRepository, ChampionPredictionRepository>();

// Register services
builder.Services.AddSingleton<ITimeProviderService, TimeProviderService>();
builder.Services.AddScoped<IScoringService, ScoringService>();

// Register TokenService for invitation token encryption/decryption
builder.Services.AddScoped<TokenService>();

// Register JwtService for JWT token generation and validation
builder.Services.AddScoped<JwtService>();

// Register SecureTokenService for secure token validation with database verification
// Prevents privilege escalation attacks by verifying role against DB
builder.Services.AddScoped<SecureTokenService>();

// Register EmailService for sending emails via Resend
builder.Services.AddHttpClient<EmailService>();

// Register HttpClient for Football-Data.org API
builder.Services.AddHttpClient<IFootballDataService, FootballDataService>();

// Application Insights telemetry
builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

var app = builder.Build();

app.Run();
