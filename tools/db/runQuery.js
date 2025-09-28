const fs = require('fs');
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const dotenvPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
}

const projectRef = process.env.SUPABASE_PROJECT_ID;
const accessToken = (process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT || '').trim();

if (!projectRef || !accessToken) {
  console.error('Missing SUPABASE_PROJECT_ID or access token.');
  process.exit(1);
}

if (process.argv.length < 3) {
  console.error('Usage: node runQuery.js "<SQL>"');
  process.exit(1);
}

const arg = process.argv.slice(2).join(' ');
const query = fs.existsSync(arg) ? fs.readFileSync(arg, 'utf-8') : arg;

function decodeTextEntry(content) {
  if (!Array.isArray(content)) return null;
  const textEntry = content.find((item) => item.type === 'text');
  if (!textEntry) return null;
  let raw = textEntry.text;
  try {
    raw = JSON.parse(raw);
  } catch (err) {
    if (raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1);
    }
    raw = raw.replace(/\\\"/g, '"')
             .replace(/\\n/g, '\n')
             .replace(/\\r/g, '\r')
             .replace(/\\t/g, '\t')
             .replace(/\\\\/g, '\\');
  }
  const match = raw.match(/<untrusted-data-[^>]+>([\s\S]*?)<\/untrusted-data-[^>]+>/);
  if (!match) {
    return raw;
  }
  const payload = match[1];
  try {
    return JSON.parse(payload);
  } catch (err) {
    return payload;
  }
}

(async () => {
  const client = new Client({ name: 'local-runner', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@supabase/mcp-server-supabase', '--project-ref', projectRef, '--access-token', accessToken],
    env: {
      SUPABASE_ACCESS_TOKEN: accessToken,
    },
    stderr: 'pipe',
  });

  if (transport.stderr) {
    transport.stderr.on('data', (chunk) => process.stderr.write(chunk.toString()));
  }

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: 'execute_sql',
      arguments: { query },
    });
    if (result.isError) {
      console.error('Query error:', JSON.stringify(result.content, null, 2));
      process.exitCode = 1;
    } else {
      const decoded = decodeTextEntry(result.content);
      if (decoded !== null) {
        console.log(JSON.stringify(decoded, null, 2));
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    }
  } catch (err) {
    console.error('Failed to run query');
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
