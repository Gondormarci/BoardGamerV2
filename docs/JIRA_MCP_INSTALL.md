# Jira MCP Server – Installation Guide for Cursor IDE (Windows)

This guide walks you through installing the [Jira MCP server](https://github.com/nguyenvanduocit/jira-mcp) so Cursor’s Agent can use Jira (issues, sprints, comments, etc.).

---

## Prerequisites

- **Cursor IDE** (v0.40 or later)
- **Docker Desktop for Windows** (recommended on Windows, since the project does not ship a Windows MCP binary)
- An **Atlassian account** with access to your Jira instance

---

## Step 1: Create an Atlassian API token

1. Open: **https://id.atlassian.com/manage-profile/security/api-tokens**
2. Sign in if prompted.
3. Click **Create API token**.
4. Give it a label (e.g. `Cursor Jira MCP`) and click **Create**.
5. **Copy the token** and store it somewhere safe (you won’t see it again).

---

## Step 2: Choose where to store the MCP config

Cursor merges MCP config from two places:

| Location | Use case |
|----------|----------|
| **Global** (all projects) | `C:\Users\<YourUsername>\.cursor\mcp.json` |
| **Project-only** | `c:\Dev\repos\BoardGamerV2\.cursor\mcp.json` |

- Use **global** if you want Jira MCP in every project and prefer to keep credentials out of the repo.
- Use **project** if you want this repo to have Jira MCP and are okay editing the project file (and e.g. adding it to `.gitignore` so you don’t commit secrets).

---

## Step 3: Add the Jira MCP server config

### Option A: Docker (recommended on Windows)

1. Create or open the MCP config file:
   - **Global:** `C:\Users\Marton\.cursor\mcp.json`
   - **Project:** `c:\Dev\repos\BoardGamerV2\.cursor\mcp.json`

2. Set the content to (merge with existing `mcpServers` if you already have other servers):

```json
{
  "mcpServers": {
    "jira": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "ATLASSIAN_HOST=https://YOUR-COMPANY.atlassian.net",
        "-e", "ATLASSIAN_EMAIL=your-email@company.com",
        "-e", "ATLASSIAN_TOKEN=your-api-token",
        "ghcr.io/nguyenvanduocit/jira-mcp:latest"
      ]
    }
  }
}
```

3. Replace:
   - `YOUR-COMPANY` with your Jira subdomain (e.g. `mycompany` → `https://mycompany.atlassian.net`).
   - `your-email@company.com` with your Atlassian account email.
   - `your-api-token` with the token from Step 1.

4. Save the file.

### Option B: Local binary (e.g. via WSL or Go)

If you use **WSL** or have the **Linux binary**:

1. Download the Linux AMD64 tarball from:  
   https://github.com/nguyenvanduocit/jira-mcp/releases/latest  
   (e.g. `jira-mcp_linux_amd64.tar.gz`).

2. Extract and make the binary executable, then in `mcp.json` use:

```json
{
  "mcpServers": {
    "jira": {
      "command": "/path/to/jira-mcp",
      "env": {
        "ATLASSIAN_HOST": "https://YOUR-COMPANY.atlassian.net",
        "ATLASSIAN_EMAIL": "your-email@company.com",
        "ATLASSIAN_TOKEN": "your-api-token"
      }
    }
  }
}
```

Replace the placeholders and `command` path as needed.

---

## Step 4: Restart Cursor

- Fully quit Cursor (File → Exit or close the window).
- Start Cursor again so it reloads MCP config.

---

## Step 5: Verify in Cursor

1. Open **Settings**: `Ctrl + Shift + J`.
2. Go to **Tools & MCP**.
3. You should see **jira** in the list. Ensure it’s **enabled** (toggle on).
4. Open **Output**: `Ctrl + Shift + U` → choose **MCP Logs** to confirm the Jira server starts without errors.

---

## Step 6: Try it in chat

In Cursor chat you can ask the Agent things like:

- “Show my issues assigned to me”
- “What’s in the current sprint for project ABC?”
- “Create a bug in ABC: Login fails on Safari”

The Agent will use the Jira MCP tools when relevant.

---

## Configuration reference

| Variable | Description |
|----------|-------------|
| `ATLASSIAN_HOST` | Jira base URL, e.g. `https://your-company.atlassian.net` |
| `ATLASSIAN_EMAIL` | Your Atlassian account email |
| `ATLASSIAN_TOKEN` | API token from https://id.atlassian.com/manage-profile/security/api-tokens |

---

## Troubleshooting

- **Docker not found:** Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) and ensure it’s running.
- **Server not listed:** Confirm the config file is in the correct path and JSON is valid (no trailing commas, quoted keys).
- **Auth errors:** Check host (no trailing slash), email, and that the API token is valid and not revoked.
- **Logs:** Settings → Tools & MCP, and Output → MCP Logs.

---

## Security note

Do **not** commit real `ATLASSIAN_EMAIL` or `ATLASSIAN_TOKEN` to git. Either:

- Use the **global** `mcp.json` (`C:\Users\Marton\.cursor\mcp.json`) for credentials, or  
- Use the **project** `.cursor/mcp.json` and add `.cursor/mcp.json` to `.gitignore` so only you have the file with secrets.
