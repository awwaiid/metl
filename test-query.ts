#!/usr/bin/env tsx
/**
 * Simple test to debug the query function
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { createMetlMcpServer } from './dist/agent.js';

async function main() {
  console.log('==> Starting test...');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  console.log('==> API key is set');

  const mcpServer = createMetlMcpServer();
  console.log('==> MCP server created');

  const prompt = 'Hello! Can you help me create a simple Alloy model for a User with an email field?';
  console.log('==> Prompt:', prompt);

  try {
    console.log('==> Calling query()...');
    const q = query({
      prompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: { metl: mcpServer },
        maxTurns: 3,
        env: process.env,
      },
    });

    console.log('==> Query created, starting iteration...');

    let count = 0;
    for await (const message of q) {
      count++;
      console.log(`\n==> Message ${count}: type=${message.type}`);
      console.log('Full message:', JSON.stringify(message, null, 2));
    }

    console.log(`\n==> Iteration complete. Total messages: ${count}`);
  } catch (error) {
    console.error('==> Error:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
