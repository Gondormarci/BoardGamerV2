using System.Text.Json;
using Asp.Versioning;
using BoardGamer.Application.Common;
using Microsoft.OpenApi;
using BoardGamer.Infrastructure.Identity;
using BoardGamer.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<BoardGamerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var keycloak = builder.Configuration.GetSection("Authentication:Keycloak");
var authority = keycloak["Authority"] ?? "https://keycloak.example.com/realms/boardgamer";
var audience = keycloak["Audience"] ?? "boardgamer-api";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.Audience = audience;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidAudiences = new[] { audience }
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                // Map Keycloak realm_access.roles to Role claims for [Authorize(Roles = "Admin")] etc.
                var payload = context.Principal?.FindFirst("realm_access")?.Value;
                if (!string.IsNullOrEmpty(payload))
                {
                    try
                    {
                        var realmAccess = JsonSerializer.Deserialize<JsonElement>(payload);
                        if (realmAccess.TryGetProperty("roles", out var roles) && roles.ValueKind == JsonValueKind.Array)
                        {
                            var identity = (System.Security.Claims.ClaimsIdentity?)context.Principal?.Identity;
                            foreach (var role in roles.EnumerateArray())
                            {
                                var roleValue = role.GetString();
                                if (!string.IsNullOrEmpty(roleValue))
                                    identity?.AddClaim(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, roleValue));
                            }
                        }
                    }
                    catch
                    {
                        // Ignore if we can't parse; role claims may come from elsewhere
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("User", policy => policy.RequireRole("user", "host", "admin"));
    options.AddPolicy("Host", policy => policy.RequireRole("host", "admin"));
    options.AddPolicy("Admin", policy => policy.RequireRole("admin"));
});

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Add API versioning (URL path: /api/v1/...)
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Swagger UI only when not Production
if (!builder.Environment.IsProduction())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "BoardGamer API",
            Version = "v1",
            Description = "BoardGamer REST API"
        });
        options.DocInclusionPredicate((docName, apiDesc) => apiDesc.GroupName == docName);
    });
}

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "BoardGamer API v1");
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
