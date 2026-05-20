const assert = require('node:assert');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

const expectedTools = [
  'probro_set_connection',
  'probro_get_version',
  'probro_list_tables',
  'probro_get_table_details',
  'probro_query_table',
  'probro_mutate_table',
];

async function run() {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['src/index.js'],
    cwd: projectRoot,
  });

  const client = new Client(
    {
      name: 'probro-mcp-smoke-test',
      version: '0.1.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);

    const toolsResult = await client.listTools();
    const toolNames = (toolsResult.tools || []).map((t) => t.name);

    for (const expected of expectedTools) {
      assert(
        toolNames.includes(expected),
        `Expected tool '${expected}' to be registered. Found: ${toolNames.join(', ')}`
      );
    }

    let gotExpectedFailure = false;
    try {
      const result = await client.callTool({
        name: 'probro_get_version',
        arguments: {},
      });

      const serialized = JSON.stringify(result);
      if (serialized.includes('No active ProBro connection')) {
        gotExpectedFailure = true;
      }
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.includes('No active ProBro connection')) {
        gotExpectedFailure = true;
      }
    }

    assert(
      gotExpectedFailure,
      'Expected probro_get_version to fail before connection is set.'
    );

    console.log('Smoke test passed: MCP server starts and tools are available.');
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
