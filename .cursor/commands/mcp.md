# MCP servers in this project

Cursor uses `.cursor/mcp.json` in this repo.

---

## Installation guide (after reset)

Follow these steps to get all MCP servers working.

### 1. Confirm config file

- Ensure **`.cursor/mcp.json`** exists in this project (it’s already there with all servers).
- No need to edit it unless you want to add/remove servers.

### 2. Set environment variables (API/token-based servers)

Set these **before** opening Cursor (e.g. in PowerShell profile, or in a `.env` / `.env.local` that Cursor can load):

| Variable | Where to get it | Required for |
|----------|-----------------|--------------|
| `PERPLEXITY_API_KEY` | [Perplexity API](https://www.perplexity.ai/settings/api) | Perplexity |
| `UPSTASH_EMAIL` | [Upstash Console](https://console.upstash.com) → Account | Upstash |
| `UPSTASH_API_KEY` | Upstash → Account → Management API → Create API key | Upstash |
| `FIRECRAWL_API_KEY` | [Firecrawl](https://firecrawl.dev/app/api-keys) | Firecrawl |
| `APIFY_TOKEN` | [Apify Console](https://console.apify.com/account#/integrations) → Integrations | Apify |
| `N8N_MCP_URL` | Your n8n instance base URL (e.g. `https://your-name.app.n8n.cloud`) | N8N |
| `N8N_MCP_ACCESS_TOKEN` | n8n → **Settings → Instance-level MCP** → Connection details → Access Token | N8N |

- **Optional:** Playwright and Reddit work without env vars (Reddit is read-only without credentials).
- **Skip** any server you don’t plan to use; you can leave its env vars unset and disable that server in Cursor later.

### 3. Restart Cursor fully

- Quit Cursor completely (not just reload window).
- Start Cursor again and open this project so it reads `.cursor/mcp.json`.

### 4. Connect OAuth servers (Figma, Vercel, Supabase)

- Open **Cursor Settings** (e.g. `Ctrl+,`) → **Features** → **MCP** (or **Tools & MCP**).
- For **Figma**, **Vercel**, and **Supabase**: if you see “Needs login” or **Connect**, click it and complete the sign-in in the browser.
- Do this once per server; Cursor will remember the connection.

### 5. Verify

- In the same MCP settings page, check that servers show as connected or “Ready” (not red/error).
- In **Composer** (Agent), confirm that MCP tools appear under “Available Tools” when relevant.

If something fails: check the server name in the list, confirm env vars are set in the environment Cursor uses, and restart Cursor again after changing env vars.

---

## Configured servers reference

The following MCP servers are configured:

| Server      | Purpose                    | Required env / setup |
|------------|----------------------------|----------------------|
| **Playwright** | Browser automation (existing) | None |
| **Perplexity** | Search, reasoning, research via Perplexity API | `PERPLEXITY_API_KEY` from [Perplexity API](https://www.perplexity.ai/settings/api) |
| **N8N**    | Trigger and run n8n workflows from Cursor | `N8N_MCP_URL` (e.g. `https://your-instance.app.n8n.cloud`), `N8N_MCP_ACCESS_TOKEN` from n8n **Settings → Instance-level MCP → Connection details → Access Token** |
| **Upstash** | Redis and Upstash APIs via natural language | `UPSTASH_EMAIL`, `UPSTASH_API_KEY` from [Upstash Console](https://console.upstash.com) → Account → Management API |
| **Firecrawl** | Web scraping, crawling, content extraction | `FIRECRAWL_API_KEY` from [Firecrawl](https://firecrawl.dev/app/api-keys) |
| **Figma**   | Design context, variables, generate code from frames | OAuth when first used (click Connect in Cursor MCP settings) |
| **Reddit**  | Fetch posts, comments, subreddits; optional write (needs Reddit credentials) | Optional: Reddit API credentials for write access |
| **Apify**   | Run Actors from Apify Store, scrapers/crawlers, docs, storage | `APIFY_TOKEN` from [Apify Console](https://console.apify.com/account#/integrations) → Integrations |
| **Vercel**  | Deployments, logs, projects, Vercel docs | OAuth when first used (click Connect in Cursor MCP settings) |
| **Supabase** | SQL, migrations, Edge Functions, types, API keys, debugging | OAuth when first used (click Connect in Cursor MCP settings) |

## Setup

1. **Environment variables**  
   Set the variables above in your shell profile or in a `.env` file that Cursor can read. For project-only secrets you can use `.env.local` and reference it if you switch to global MCP config with `envFile`.

2. **Figma, Vercel, Supabase**  
   No env vars. After adding the servers, use **Cursor Settings → Features → MCP**, find each one, and click **Connect** to complete OAuth.

3. **N8N**  
   In your n8n instance: enable **Settings → Instance-level MCP**, copy your instance URL and create an MCP Access Token, then set `N8N_MCP_URL` and `N8N_MCP_ACCESS_TOKEN`.

4. **Restart Cursor**  
   Fully restart Cursor after changing `.cursor/mcp.json` or env vars so MCP servers reload.

## Optional: Codegraph (codebase graph)

If you want **Codegraph** (codebase graph by CartographAI), you can add it as a separate server (Python/uv):

```json
"codegraph": {
  "type": "stdio",
  "command": "uvx",
  "args": ["--from", "git+https://github.com/CartographAI/mcp-server-codegraph.git", "mcp-server-codegraph"]
}
```

Install [uv](https://docs.astral.sh/uv/) first.

## Disabling a server

Remove or comment out its entry in `.cursor/mcp.json`, or disable it in **Cursor Settings → Features → MCP** by toggling that server off.
