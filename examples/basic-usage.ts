/**
 * Basic usage example for METL Agent
 *
 * This example demonstrates how to use the METL agent with the Claude Agent SDK
 * to extract formal models from code and generate tests.
 *
 * Prerequisites:
 * - Set ANTHROPIC_API_KEY environment variable
 * - Run: npm install
 * - Run: npm run build
 *
 * Usage:
 *   tsx examples/basic-usage.ts
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { createMetlMcpServer, metlAgentDefinition } from '../dist/agent.js';

async function main() {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    console.error('Please set it with: export ANTHROPIC_API_KEY=your_key_here');
    process.exit(1);
  }

  console.log('🔧 METL Basic Usage Example\n');

  // Create the MCP server with METL tools
  const metlMcpServer = createMetlMcpServer();

  // Example prompt: Ask METL to model a simple queue system
  const prompt = `I have a simple queue system in my codebase with the following concepts:
- Queue: Can hold items
- Item: Has a priority (high, normal, low)
- Consumer: Takes items from the queue

Business rules:
- High priority items should be processed before normal or low priority
- Each item can only be in one queue at a time
- Consumers can only process one item at a time

Can you help me create an Alloy model for this system? Use the create_alloy_model tool.`;

  console.log('Prompt:', prompt, '\n');
  console.log('Querying METL agent...\n');

  try {
    // Use the query function with METL agent
    const q = query({
      prompt,
      options: {
        systemPrompt: metlAgentDefinition.prompt,
        mcpServers: {
          metl: metlMcpServer,
        },
        model: 'claude-sonnet-4-5-20250929',
        maxTurns: 5,
      },
    });

    // Stream and display the responses
    for await (const message of q) {
      if (message.type === 'user') {
        console.log('\n📨 User Message:');
        for (const content of message.content) {
          if (content.type === 'text') {
            console.log(content.text);
          }
        }
      } else if (message.type === 'assistant') {
        console.log('\n🤖 Assistant Message:');
        for (const content of message.content) {
          if (content.type === 'text') {
            console.log(content.text);
          } else if (content.type === 'tool_use') {
            console.log(`\n🔧 Tool Use: ${content.name}`);
            console.log('Input:', JSON.stringify(content.input, null, 2));
          }
        }
      } else if (message.type === 'tool_result') {
        console.log('\n✅ Tool Result:');
        console.log(message.content);
      }
    }

    console.log('\n✨ Example completed successfully!');
  } catch (error) {
    console.error('Error during query:', error);
    process.exit(1);
  }
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
