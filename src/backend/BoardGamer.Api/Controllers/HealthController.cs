using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace BoardGamer.Api.Controllers;

/// <summary>
/// Health check endpoint for API v1.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Returns API health status.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "healthy", version = "1.0" });
    }
}
