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
  console.error('Missing SUPABASE_PROJECT_ID or access token in environment.');
  process.exit(1);
}
if (process.argv.length < 3) {
  console.error('Usage: node applyMigration.js <file.sql>');
  process.exit(1);
}
const filePath = path.resolve(process.cwd(), process.argv[2]);
const migrationName = path.basename(filePath).replace(/\.sql$/i, '');
let sql = fs.readFileSync(filePath, 'utf-8');
sql = sql.replace(/^\uFEFF/, '');
sql = sql.replace(/\r\n/g, '\n');
const typePattern = /create type if not exists public\.comment_parent_type as enum \('recipe','post'\);/i;
if (typePattern.test(sql)) {
  const replacement = [
    'DO ',
    'BEGIN',
    '  IF NOT EXISTS (',
    '    SELECT 1',
    '    FROM pg_type t',
    '    JOIN pg_namespace n ON n.oid = t.typnamespace',
    "    WHERE t.typname = 'comment_parent_type' AND n.nspname = 'public'",
    '  ) THEN',
    "    CREATE TYPE public.comment_parent_type AS ENUM ('recipe','post');",
    '  END IF;',
    'END',
    ' LANGUAGE plpgsql;'
  ].join('\n');
  sql = sql.replace(typePattern, replacement);
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
    transport.stderr.on('data', (chunk) => {
      process.stderr.write(chunk.toString());
    });
  }
  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: 'apply_migration',
      arguments: {
        name: migrationName,
        query: sql,
      },
    });
    if (result.isError) {
      console.error('Migration reported error:', result.content);
      process.exitCode = 1;
    } else {
      console.log('Applied migration', migrationName);
    }
  } catch (err) {
    console.error('Failed to apply migration', migrationName);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
