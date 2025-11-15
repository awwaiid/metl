#!/usr/bin/env tsx
/**
 * Detailed debug test with comprehensive logging
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { createMetlMcpServer } from './dist/agent.js';
import * as fs from 'fs';

const logFile = '/tmp/sdk-debug.log';
const log = (msg: string) => {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  console.log(msg);
  fs.appendFileSync(logFile, logMsg);
};

async function main() {
  // Clear log file
  fs.writeFileSync(logFile, '=== SDK Debug Log ===\n');

  log('==> Starting detailed debug test...');

  if (!process.env.ANTHROPIC_API_KEY) {
    log('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  log(`==> API key is set (length: ${process.env.ANTHROPIC_API_KEY.length})`);

  const mcpServer = createMetlMcpServer();
  log('==> MCP server created');

  const prompt = 'Say hello and tell me you are working!';
  log(`==> Prompt: ${prompt}`);

  // Add stderr handler to capture SDK errors
  const stderrMessages: string[] = [];
  const stderrHandler = (data: string) => {
    log(`STDERR: ${data}`);
    stderrMessages.push(data);
  };

  try {
    log('==> Calling query() with detailed options...');

    const options = {
      model: 'claude-sonnet-4-5-20250929',
      mcpServers: { metl: mcpServer },
      maxTurns: 2,
      env: process.env,
      stderr: stderrHandler,
    };

    log(`==> Options: ${JSON.stringify({ ...options, mcpServers: '[Object]', env: '[Object]', stderr: '[Function]' })}`);

    const q = query({
      prompt,
      options,
    });

    log('==> Query created, type: ' + typeof q);
    log('==> Query is iterable: ' + (Symbol.asyncIterator in Object(q)));
    log('==> Starting iteration...');

    let count = 0;
    let startTime = Date.now();

    // Set a timeout to detect if we're stuck
    const timeoutId = setTimeout(() => {
      log(`!!! TIMEOUT: No messages received after 60 seconds`);
      log(`!!! Stderr messages collected: ${stderrMessages.length}`);
      stderrMessages.forEach((msg, i) => log(`    [${i}]: ${msg}`));
      process.exit(1);
    }, 60000);

    for await (const message of q) {
      clearTimeout(timeoutId);
      count++;
      const elapsed = Date.now() - startTime;
      log(`\n==> Message ${count} received after ${elapsed}ms`);
      log(`    Type: ${message.type}`);
      log(`    Keys: ${Object.keys(message).join(', ')}`);

      // Log message details based on type
      if (message.type === 'assistant' && 'message' in message) {
        log(`    Assistant message ID: ${(message as any).message.id}`);
        log(`    Content blocks: ${(message as any).message.content?.length || 0}`);

        if ((message as any).message.content) {
          for (const block of (message as any).message.content) {
            if (block.type === 'text') {
              log(`    Text: ${block.text.substring(0, 100)}...`);
            } else if (block.type === 'tool_use') {
              log(`    Tool use: ${block.name}`);
            }
          }
        }
      } else if (message.type === 'result') {
        log(`    Result message`);
      } else {
        log(`    Full message: ${JSON.stringify(message, null, 2).substring(0, 500)}`);
      }

      // Reset timer for next message
      startTime = Date.now();
      setTimeout(() => {
        log(`!!! WARNING: No new message for 30 seconds after message ${count}`);
      }, 30000);
    }

    clearTimeout(timeoutId);
    log(`\n==> Iteration complete. Total messages: ${count}`);
    log(`==> Stderr messages collected: ${stderrMessages.length}`);

  } catch (error: any) {
    log(`==> ERROR: ${error.message}`);
    log(`==> Stack: ${error.stack}`);
    throw error;
  }
}

main().catch((error) => {
  log(`FATAL ERROR: ${error}`);
  process.exit(1);
});
