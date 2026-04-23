[CmdletBinding()]
param(
    [Parameter(Mandatory, Position = 0)]
    [string]$IssueKey
)

$JiraBaseUrl  = "https://martonnemeth.atlassian.net"
$JiraEmail    = "nemethmarci0124@gmail.com"
$JiraApiToken = $env:JIRA_API_TOKEN

if (-not $JiraApiToken) {
    Write-Error "JIRA_API_TOKEN environment variable is required"
    exit 1
}

$token = [Convert]::ToBase64String(
    [Text.Encoding]::ASCII.GetBytes("${JiraEmail}:${JiraApiToken}")
)

Invoke-RestMethod `
    -Uri "$JiraBaseUrl/rest/api/3/issue/$IssueKey" `
    -Headers @{ Authorization = "Basic $token"; Accept = "application/json" }
