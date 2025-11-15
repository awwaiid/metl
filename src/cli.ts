#!/usr/bin/env node
/**
 * METL CLI - Command line interface for Model Extract Transform Load
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { createMetlMcpServer } from './agent.js';
import * as fs from 'fs';
import * as path from 'path';

interface CliOptions {
  command: 'extract' | 'explore' | 'help';
  dir?: string;
  codebasePath?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    return { command: 'help' };
  }

  const command = args[0] as 'extract' | 'explore' | 'help';
  const dirIndex = args.indexOf('--dir');
  const dir = dirIndex !== -1 && args[dirIndex + 1] ? args[dirIndex + 1] : 'alloy';

  // Get codebase path (current directory or specified path)
  const pathIndex = args.indexOf('--path');
  const codebasePath = pathIndex !== -1 && args[pathIndex + 1] ? args[pathIndex + 1] : process.cwd();

  return { command, dir, codebasePath };
}

function printHelp() {
  console.log(`
🔧 METL - Model Extract Transform Load
Logic Code Analysis and Generation using Alloy

Usage:
  metl <command> [options]

Commands:
  extract [--dir <directory>] [--path <codebase>]
    Analyze a codebase and extract formal models

  explore [--dir <directory>] [--path <codebase>]
    Explore and validate extracted models through scenario generation

  help
    Show this help message

Options:
  --dir <directory>     Directory to store/read Alloy models (default: alloy)
  --path <codebase>     Path to the codebase to analyze (default: current directory)

Examples:
  metl extract --dir alloy --path /path/to/codebase
  metl explore --dir alloy
`);
}

async function ensureApiKey(): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable is not set');
    console.error('Please set your Anthropic API key:');
    console.error('  export ANTHROPIC_API_KEY=your-api-key-here');
    process.exit(1);
  }
  return apiKey;
}

async function extract(options: CliOptions) {
  console.log('🔍 Extracting formal models from codebase...');
  console.log(`   Codebase: ${options.codebasePath}`);
  console.log(`   Output directory: ${options.dir}\n`);

  const apiKey = await ensureApiKey();

  // Ensure output directory exists
  if (!fs.existsSync(options.dir!)) {
    fs.mkdirSync(options.dir!, { recursive: true });
  }

  // Create MCP server with METL tools
  const mcpServer = createMetlMcpServer();

  // Prepare the extraction prompt
  const extractPrompt = `
You are analyzing a codebase to extract formal models using Alloy.

Codebase path: ${options.codebasePath}
Output directory: ${options.dir}

Your task:
1. Explore the codebase structure to understand the main components
2. Identify core domain concepts, entities, and their relationships
3. Identify key business logic and constraints
4. Create Alloy models that capture these concepts using the create_alloy_model tool
5. Save the generated models to files in the output directory

Focus on:
- Core domain models (e.g., User, Organization, Item, Request, etc.)
- Key relationships and associations
- Important constraints and invariants
- State transitions and workflows

Start by exploring the codebase structure and identifying the main application directories.
`;

  try {
    console.log('🤖 Starting Claude agent for model extraction...\n');

    const queryStream = query({
      prompt: extractPrompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: { metl: mcpServer },
        maxTurns: 20,
        cwd: options.codebasePath,
        env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
      },
    });

    let resultText = '';
    for await (const message of queryStream) {
      if (message.type === 'assistant' && message.message.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
            resultText += block.text;
          }
        }
      } else if (message.type === 'result') {
        if ('result' in message) {
          resultText += message.result;
        }
      }
    }

    console.log('\n\n✅ Model extraction complete!');
    console.log(`\nResults saved to: ${options.dir}/`);

    // Save a summary of the extraction
    const summaryPath = path.join(options.dir!, 'extraction-summary.txt');
    fs.writeFileSync(summaryPath, `METL Extraction Summary
Codebase: ${options.codebasePath}
Date: ${new Date().toISOString()}

${resultText}
`);

    console.log(`Summary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('❌ Error during extraction:', error);
    process.exit(1);
  }
}

async function explore(options: CliOptions) {
  console.log('🔬 Exploring and validating models...');
  console.log(`   Model directory: ${options.dir}\n`);

  const apiKey = await ensureApiKey();

  // Check if model directory exists
  if (!fs.existsSync(options.dir!)) {
    console.error(`❌ Error: Model directory '${options.dir}' does not exist`);
    console.error('Please run `metl extract` first to generate models');
    process.exit(1);
  }

  // Read existing models
  const modelFiles = fs.readdirSync(options.dir!)
    .filter(f => f.endsWith('.als'));

  if (modelFiles.length === 0) {
    console.error(`❌ Error: No Alloy models (.als) found in '${options.dir}'`);
    console.error('Please run `metl extract` first to generate models');
    process.exit(1);
  }

  console.log(`Found ${modelFiles.length} Alloy model(s):`);
  modelFiles.forEach(f => console.log(`  - ${f}`));
  console.log();

  // Create MCP server with METL tools
  const mcpServer = createMetlMcpServer();

  // Read all models
  const models = modelFiles.map(file => {
    const filePath = path.join(options.dir!, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    return { name: file, content };
  });

  // Prepare the exploration prompt
  const explorePrompt = `
You are exploring and validating Alloy formal models to discover edge cases and generate test scenarios.

Model directory: ${options.dir}
Codebase path: ${options.codebasePath}

Available models:
${models.map(m => `- ${m.name}`).join('\n')}

Your task:
1. For each model, use the run_alloy_model tool to generate example scenarios
2. Analyze the generated scenarios to identify:
   - Expected normal cases
   - Edge cases
   - Potential failure scenarios
   - Boundary conditions
3. Use the translate_to_test tool to convert interesting scenarios into test cases
4. Save the generated test cases to files in the model directory

Focus on:
- Finding scenarios that might reveal bugs
- Identifying cases that might not be well-tested
- Discovering unexpected interactions between components
- Validating that constraints are properly enforced

Start by analyzing the first model and generating scenarios.
`;

  try {
    console.log('🤖 Starting Claude agent for model exploration...\n');

    const queryStream = query({
      prompt: explorePrompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: { metl: mcpServer },
        maxTurns: 30,
        cwd: options.codebasePath,
        env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
      },
    });

    let resultText = '';
    for await (const message of queryStream) {
      if (message.type === 'assistant' && message.message.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            process.stdout.write(block.text);
            resultText += block.text;
          }
        }
      } else if (message.type === 'result') {
        if ('result' in message) {
          resultText += message.result;
        }
      }
    }

    console.log('\n\n✅ Model exploration complete!');
    console.log(`\nResults saved to: ${options.dir}/`);

    // Save exploration results
    const resultsPath = path.join(options.dir!, 'exploration-results.txt');
    fs.writeFileSync(resultsPath, `METL Exploration Results
Date: ${new Date().toISOString()}

${resultText}
`);

    console.log(`Results saved to: ${resultsPath}`);

  } catch (error) {
    console.error('❌ Error during exploration:', error);
    process.exit(1);
  }
}

async function main() {
  const options = parseArgs();

  switch (options.command) {
    case 'help':
      printHelp();
      break;
    case 'extract':
      await extract(options);
      break;
    case 'explore':
      await explore(options);
      break;
    default:
      console.error(`❌ Unknown command: ${options.command}`);
      printHelp();
      process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
