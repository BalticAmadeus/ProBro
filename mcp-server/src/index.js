import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ProBroBridge, buildConnectionString } from './probroBridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultProjectRoot = path.resolve(__dirname, '..', '..');

let activeConnection = null;
let bridge = null;

function asTextContent(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function resetBridge(newConnection) {
  if (bridge) {
    await bridge.close();
  }
  bridge = new ProBroBridge(newConnection.runtime);
  await bridge.init();
}

function normalizeConnectionInput(input) {
  const mode = input.mode;
  const dbConnection = {
    database: input.database,
    user: input.user || '',
    password: input.password || '',
    dbHost: input.dbHost || '',
    dbPort: input.dbPort || '',
    params: input.params || '',
  };

  if (!dbConnection.database) {
    throw new Error('database is required');
  }

  if (mode === 'local') {
    if (!input.dlc) {
      throw new Error('dlc is required in local mode');
    }
    return {
      dbConnection,
      runtime: {
        mode: 'local',
        projectRoot: input.projectRoot || defaultProjectRoot,
        dlc: input.dlc,
        agentHost: '127.0.0.1',
        agentPort: input.agentPort || 23456,
        startupTimeoutMs: input.startupTimeoutMs || 15000,
        socketTimeoutMs: input.socketTimeoutMs || 15000,
        tempFilesPath: input.tempFilesPath || '',
        logEntryTypes: input.logEntryTypes || '',
      },
    };
  }

  if (!input.agentHost || !input.agentPort) {
    throw new Error('agentHost and agentPort are required in remote mode');
  }

  return {
    dbConnection,
    runtime: {
      mode: 'remote',
      projectRoot: input.projectRoot || defaultProjectRoot,
      dlc: '',
      agentHost: input.agentHost,
      agentPort: input.agentPort,
      startupTimeoutMs: input.startupTimeoutMs || 15000,
      socketTimeoutMs: input.socketTimeoutMs || 15000,
      tempFilesPath: '',
      logEntryTypes: '',
    },
  };
}

async function exec(command, params) {
  if (!activeConnection || !bridge) {
    throw new Error('No active ProBro connection. Call probro_set_connection first.');
  }

  const payload = {
    connectionString: buildConnectionString(activeConnection.dbConnection),
    command,
  };

  if (typeof params !== 'undefined') {
    payload.params = params;
  }

  return bridge.execute(payload);
}

const server = new McpServer({
  name: 'probro-mcp-server',
  version: '0.1.0',
});

server.registerTool(
  'probro_set_connection',
  {
    mode: z.enum(['local', 'remote']).default('local'),
    projectRoot: z.string().optional(),
    dlc: z.string().optional(),
    agentHost: z.string().optional(),
    agentPort: z.number().int().positive().optional(),
    database: z.string(),
    user: z.string().optional(),
    password: z.string().optional(),
    dbHost: z.string().optional(),
    dbPort: z.string().optional(),
    params: z.string().optional(),
    startupTimeoutMs: z.number().int().positive().optional(),
    socketTimeoutMs: z.number().int().positive().optional(),
    tempFilesPath: z.string().optional(),
    logEntryTypes: z.string().optional(),
  },
  async (input) => {
    const normalized = normalizeConnectionInput(input);
    await resetBridge(normalized);
    activeConnection = normalized;

    const version = await exec('get_version');
    return asTextContent({
      ok: true,
      runtime: normalized.runtime,
      version,
    });
  }
);

server.registerTool('probro_get_version', {}, async () => {
  const data = await exec('get_version');
  return asTextContent(data);
});

server.registerTool('probro_list_tables', {}, async () => {
  const data = await exec('get_tables');
  return asTextContent(data);
});

server.registerTool(
  'probro_get_table_details',
  {
    tableName: z.string(),
  },
  async ({ tableName }) => {
    const data = await exec('get_table_details', tableName);
    return asTextContent(data);
  }
);

server.registerTool(
  'probro_query_table',
  {
    tableName: z.string(),
    wherePhrase: z.string().optional(),
    start: z.number().int().nonnegative().default(0),
    pageLength: z.number().int().positive().default(100),
    minTime: z.number().int().nonnegative().default(100),
    lastRowID: z.string().default(''),
    sortColumns: z.array(z.any()).optional(),
    filters: z.any().optional(),
    timeOut: z.number().int().positive().default(1000),
  },
  async (input) => {
    const payload = {
      wherePhrase: input.wherePhrase,
      start: input.start,
      pageLength: input.pageLength,
      minTime: input.minTime,
      lastRowID: input.lastRowID,
      sortColumns: input.sortColumns,
      filters: input.filters,
      timeOut: input.timeOut,
    };

    const data = await exec('get_table_data', {
      tableName: input.tableName,
      ...payload,
    });
    return asTextContent(data);
  }
);

server.registerTool(
  'probro_mutate_table',
  {
    tableName: z.string(),
    mode: z.enum(['INSERT', 'UPDATE', 'DELETE', 'COPY']),
    crud: z.array(z.string()).optional(),
    data: z
      .array(
        z.object({
          key: z.string(),
          value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
          defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
        })
      )
      .optional(),
    useWriteTriggers: z.boolean().optional(),
    useDeleteTriggers: z.boolean().optional(),
    wherePhrase: z.string().optional(),
    start: z.number().int().nonnegative().default(0),
    pageLength: z.number().int().positive().default(100),
    minTime: z.number().int().nonnegative().default(100),
    lastRowID: z.string().default(''),
    sortColumns: z.array(z.any()).optional(),
    filters: z.any().optional(),
    timeOut: z.number().int().positive().default(1000),
  },
  async (input) => {
    const payload = {
      tableName: input.tableName,
      mode: input.mode,
      crud: input.crud,
      data: input.data,
      useWriteTriggers: input.useWriteTriggers,
      useDeleteTriggers: input.useDeleteTriggers,
      wherePhrase: input.wherePhrase,
      start: input.start,
      pageLength: input.pageLength,
      minTime: input.minTime,
      lastRowID: input.lastRowID,
      sortColumns: input.sortColumns,
      filters: input.filters,
      timeOut: input.timeOut,
    };

    const data = await exec('submit_table_data', payload);
    return asTextContent(data);
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

process.on('SIGINT', async () => {
  if (bridge) {
    await bridge.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (bridge) {
    await bridge.close();
  }
  process.exit(0);
});

main().catch(async (error) => {
  if (bridge) {
    await bridge.close();
  }
  console.error(error);
  process.exit(1);
});
