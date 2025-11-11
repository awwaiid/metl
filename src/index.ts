#!/usr/bin/env node
/**
 * METL - Model Extract Transform Load
 * Main entry point for the Claude Agent SDK application
 */

import { createMetlMcpServer } from './agent.js';

async function main() {
  console.log('🔧 METL - Model Extract Transform Load');
  console.log('Logic Code Analysis and Generation using Alloy\n');

  try {
    // Create the MCP server with METL tools
    const mcpServer = createMetlMcpServer();

    console.log('METL MCP Server created successfully!');
    console.log('\nMETL Agent Capabilities:');
    console.log('  ✓ Extract formal models (Alloy) from codebases');
    console.log('  ✓ Generate and explore scenarios');
    console.log('  ✓ Identify edge cases and failures');
    console.log('  ✓ Translate scenarios into test cases\n');

    console.log('Available Tools:');
    console.log('  - create_alloy_model: Create Alloy formal models');
    console.log('  - run_alloy_model: Execute Alloy models');
    console.log('  - translate_to_test: Translate scenarios to tests\n');

    // The MCP server is ready to be used
    // In a full implementation, you would:
    // 1. Configure Anthropic API key
    // 2. Use the query() function with the MCP server
    // 3. Process user requests through the agent
    // 4. Add full Alloy execution logic using alloy-lang package

    console.log('MCP Server is ready.');
    console.log('\nNext steps:');
    console.log('  1. Set ANTHROPIC_API_KEY environment variable');
    console.log('  2. Use query() function to interact with the agent');
    console.log('  3. Implement full Alloy execution using alloy-lang');
  } catch (error) {
    console.error('Error initializing METL:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createMetlMcpServer, metlAgentDefinition, METL_SYSTEM_PROMPT } from './agent.js';
export * from './types/index.js';
export * from './tools/alloy.js';
