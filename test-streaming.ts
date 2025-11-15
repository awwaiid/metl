#!/usr/bin/env tsx
/**
 * Test streaming mode with a simple prompt
 */

import { query, type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources';
import { createMetlMcpServer } from './dist/agent.js';

// Create a simple message stream
async function* createTestMessageStream(sessionId: string): AsyncGenerator<SDKUserMessage> {
  console.log('==> Yielding initial message...');
  yield {
    type: 'user',
    message: {
      role: 'user',
      content: 'Hello! Please respond with "Streaming mode is working!" and then create a simple Alloy model for a User with an email field.',
    } as MessageParam,
    parent_tool_use_id: null,
    session_id: sessionId,
  };
  console.log('==> Initial message yielded');
}

async function main() {
  console.log('==> Testing streaming mode...\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const sessionId = `test-streaming-${Date.now()}`;
  const mcpServer = createMetlMcpServer();

  try {
    console.log('==> Creating message stream...');
    const messageStream = createTestMessageStream(sessionId);

    console.log('==> Starting query with streaming mode...');
    const queryStream = query({
      prompt: messageStream,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: { metl: mcpServer },
        maxTurns: 5,
        env: process.env,
      },
    });

    console.log('==> Processing messages...\n');
    let messageCount = 0;
    for await (const message of queryStream) {
      messageCount++;
      console.log(`\n[Message ${messageCount}] Type: ${message.type}`);

      if (message.type === 'assistant' && message.message.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            console.log('\n--- Assistant Response ---');
            console.log(block.text);
            console.log('--- End Response ---\n');
          } else if (block.type === 'tool_use') {
            console.log(`\n[Tool Use] ${block.name}`);
          }
        }
      } else if (message.type === 'result') {
        console.log('\n[Result Message]');
        if ('result' in message) {
          console.log('Result:', message.result);
        }
        if ('errors' in message && message.errors) {
          console.log('Errors:', message.errors);
        }
      }
    }

    console.log(`\n==> ✅ Streaming mode test complete! Processed ${messageCount} messages`);
  } catch (error: any) {
    console.error('==> ❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
