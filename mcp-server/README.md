# ProBro MCP Server

Standalone MCP server for ProBro/OpenEdge database access.

It exposes ProBro-style database operations as MCP tools so other extensions, agents, or clients can use them.

## Features

- Reuses the ProBro OpenEdge command protocol (base64 JSON over TCP)
- Supports both local and remote runtime modes
- Exposes schema, query, and CRUD operations
- Includes smoke and integration tests

## MCP tools

- `probro_set_connection`
- `probro_get_version`
- `probro_list_tables`
- `probro_get_table_details`
- `probro_query_table`
- `probro_mutate_table`

## Requirements

- Node.js 18+
- OpenEdge runtime available when using local mode

## Install

```bash
npm install
```

## Start server

```bash
npm start
```

## MCP client configuration example

```json
{
    "mcpServers": {
        "probro": {
            "command": "node",
            "args": ["c:/path/to/ProBro/mcp-server/src/index.js"]
        }
    }
}
```

## Connection modes

### Local mode

Starts OpenEdge runtime from this repository under `resources/oe`.

Required tool args for `probro_set_connection`:

- `mode`: `local`
- `dlc`: OpenEdge DLC path
- `database`: database name or path

Optional:

- `projectRoot` (defaults to repo root)
- `agentPort` (defaults to `23456`)
- `dbHost`, `dbPort`, `user`, `password`, `params`
- `startupTimeoutMs`, `socketTimeoutMs`
- `tempFilesPath`, `logEntryTypes`

Important:

- If OpenEdge cannot resolve a short DB name in local mode, set `database` to an absolute `.db` path.

### Remote mode

Connects to an already-running OpenEdge agent.

Required tool args for `probro_set_connection`:

- `mode`: `remote`
- `agentHost`
- `agentPort`
- `database`

Optional:

- `dbHost`, `dbPort`, `user`, `password`, `params`
- `startupTimeoutMs`, `socketTimeoutMs`

## Minimal tool call examples

Local:

```json
{
    "name": "probro_set_connection",
    "arguments": {
        "mode": "local",
        "dlc": "C:\\Progress\\OpenEdge",
        "database": "C:\\data\\sports2020.db",
        "agentPort": 23456
    }
}
```

Remote:

```json
{
    "name": "probro_set_connection",
    "arguments": {
        "mode": "remote",
        "agentHost": "127.0.0.1",
        "agentPort": 23456,
        "database": "sports2020"
    }
}
```

## Testing

### Smoke test

Checks that the MCP server starts and all tools are registered.

```bash
npm run test:smoke
```

### Integration test

Performs a real connection and validates table listing.

```bash
npm run test:integration
```

Environment variables used by integration test:

- `PROBRO_MCP_MODE`: `remote` (default) or `local`
- `PROBRO_DB_DATABASE`: required

Remote mode:

- `PROBRO_AGENT_HOST`: required
- `PROBRO_AGENT_PORT`: optional (default `23456`)

Local mode:

- `PROBRO_DLC`: required
- `PROBRO_AGENT_PORT`: optional (default `23456`)
- `PROBRO_PROJECT_ROOT`: optional

Optional DB parameters:

- `PROBRO_DB_USER`
- `PROBRO_DB_PASSWORD`
- `PROBRO_DB_HOST`
- `PROBRO_DB_PORT`
- `PROBRO_DB_PARAMS`

PowerShell example (local mode):

```powershell
$env:PROBRO_MCP_MODE="local"
$env:PROBRO_DLC="C:\Progress\OpenEdge"
$env:PROBRO_DB_DATABASE="C:\data\sports2020.db"
$env:PROBRO_AGENT_PORT="23456"
npm run test:integration
```

## Current limitations

- Local runtime bootstrap is currently Windows-focused.
- On Linux/macOS, use remote mode unless you add platform-specific startup logic.
