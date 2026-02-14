import { experimental_createMCPClient as createMcpClient } from '@ai-sdk/mcp';

let mcpClient: Awaited<ReturnType<typeof createMcpClient>> | null = null;

export async function getMcpClient() {
  if (mcpClient) return mcpClient;

  const url = process.env.NEXUS_MCP_URL;
  const token = process.env.NEXUS_ACCESS_TOKEN;

  if (!url || !token) {
    console.warn('MCP not configured: missing NEXUS_MCP_URL or NEXUS_ACCESS_TOKEN');
    return null;
  }

  console.log('Connecting to MCP server:', url);

  try {
    // Use HTTP transport for Streamable HTTP MCP servers
    mcpClient = await createMcpClient({
      transport: {
        type: 'http',
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      },
    });
    console.log('MCP client connected successfully');
    return mcpClient;
  } catch (error) {
    console.error('Failed to create MCP client:', error);
    return null;
  }
}

export async function getMcpTools() {
  try {
    const client = await getMcpClient();
    if (!client) return {};

    const tools = await client.tools();
    console.log('MCP tools loaded:', Object.keys(tools));
    return tools;
  } catch (error) {
    console.error('Failed to get MCP tools:', error);
    return {};
  }
}
