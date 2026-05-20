const assert = require('node:assert');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function toInt(value, fallback) {
  if (typeof value === 'undefined' || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readConfigFromEnv() {
  const mode = process.env.PROBRO_MCP_MODE || 'remote';
  const database = process.env.PROBRO_DB_DATABASE || '';
  const user = process.env.PROBRO_DB_USER || '';
  const password = process.env.PROBRO_DB_PASSWORD || '';
  const dbHost = process.env.PROBRO_DB_HOST || '';
  const dbPort = process.env.PROBRO_DB_PORT || '';
  const params = process.env.PROBRO_DB_PARAMS || '';

  const cfg = {
    mode,
    database,
    user,
    password,
    dbHost,
    dbPort,
    params,
  };

  if (mode === 'local') {
    cfg.dlc = process.env.PROBRO_DLC || '';
    cfg.projectRoot = process.env.PROBRO_PROJECT_ROOT || path.resolve(projectRoot, '..');
    cfg.agentPort = toInt(process.env.PROBRO_AGENT_PORT, 23456);
  } else {
    cfg.agentHost = process.env.PROBRO_AGENT_HOST || '';
    cfg.agentPort = toInt(process.env.PROBRO_AGENT_PORT, 23456);
  }

  return cfg;
}

function validateConfig(cfg) {
  const missing = [];
  if (!cfg.database) {
    missing.push('PROBRO_DB_DATABASE');
  }

  if (cfg.mode === 'local') {
    if (!cfg.dlc) {
      missing.push('PROBRO_DLC');
    }
  } else if (!cfg.agentHost) {
    missing.push('PROBRO_AGENT_HOST');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

function extractText(result) {
  if (!result || !Array.isArray(result.content)) {
    return '';
  }

  const textBlock = result.content.find((item) => item.type === 'text');
  return textBlock ? textBlock.text : '';
}

function parseToolResult(result) {
  const text = extractText(result);
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    return  err instanceof Error ? err.message : String(err);
  }
}

function throwIfOpenEdgeError(payload, context, cfg) {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  const hasOpenEdgeError =
    typeof payload.error === 'number' ||
    typeof payload.description === 'string' ||
    typeof payload.trace === 'string';

  if (!hasOpenEdgeError) {
    return;
  }

  const description = payload.description || 'Unknown OpenEdge error';
  const errorCode = typeof payload.error === 'number' ? ` (code ${payload.error})` : '';
  const hint =
    cfg.mode === 'local'
      ? ` In local mode, set PROBRO_DB_DATABASE to a valid .db path or database name resolvable by OpenEdge startup settings. Current value: '${cfg.database}'.`
      : '';

  throw new Error(`${context} failed with OpenEdge error${errorCode}: ${description}${hint}`);
}

function extractErrorMessage(payload) {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }
  if (typeof payload.error === 'string') {
    return payload.error;
  }
  if (payload.error && typeof payload.error.message === 'string') {
    return payload.error.message;
  }
  return '';
}

function extractTablesPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (Array.isArray(payload.tables)) {
    return payload.tables;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.result && Array.isArray(payload.result.tables)) {
    return payload.result.tables;
  }

  if (payload.payload && Array.isArray(payload.payload.tables)) {
    return payload.payload.tables;
  }

  return null;
}

async function run() {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

  const cfg = readConfigFromEnv();
  validateConfig(cfg);

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['src/index.js'],
    cwd: projectRoot,
  });

  const client = new Client(
    {
      name: 'probro-mcp-integration-test',
      version: '0.1.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);

    const setConnectionResult = await client.callTool({
      name: 'probro_set_connection',
      arguments: cfg,
    });
    const setConnectionParsed = parseToolResult(setConnectionResult);
    throwIfOpenEdgeError(setConnectionParsed, 'probro_set_connection', cfg);
    if (!setConnectionParsed || setConnectionParsed.ok !== true) {
      const msg = extractErrorMessage(setConnectionParsed);
      console.error('Unexpected probro_set_connection payload:', JSON.stringify(setConnectionParsed, null, 2));
      throw new Error(msg || 'Connection setup did not return ok=true');
    }

    const listTablesResult = await client.callTool({
      name: 'probro_list_tables',
      arguments: {},
    });
    const listTablesParsed = parseToolResult(listTablesResult);
    throwIfOpenEdgeError(listTablesParsed, 'probro_list_tables', cfg);

    assert(listTablesParsed, 'No payload received from probro_list_tables');
    const tables = extractTablesPayload(listTablesParsed);

    if (!tables) {
      console.error('Unexpected probro_list_tables payload:', JSON.stringify(listTablesParsed, null, 2));
      throw new Error('Expected a table list payload (tables[] or data[]) in probro_list_tables response');
    }

    const tableCount = tables.length;
    console.log(`Integration test passed: connected and retrieved ${tableCount} tables.`);
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  const message = String(err && err.message ? err.message : err);
  if (message.includes('ECONNREFUSED')) {
    console.error('Integration test failed: cannot reach ProBro/OpenEdge agent.');
    console.error('Tip 1: start the OpenEdge socket agent at PROBRO_AGENT_HOST:PROBRO_AGENT_PORT.');
    console.error('Tip 2: or run in local mode by setting PROBRO_MCP_MODE=local and PROBRO_DLC.');
    console.error('Raw error:', message);
  } else {
    console.error('Integration test failed:', message);
  }
  process.exit(1);
});
