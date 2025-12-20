#!/usr/bin/env node
/**
 * METL CLI - Command line interface for Model Extract Transform Load
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { createMetlMcpServer } from './agent.js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface CliOptions {
  command: 'extract' | 'explore' | 'validate' | 'document' | 'help';
  dir?: string;
  codebasePath?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    return { command: 'help' };
  }

  const command = args[0] as 'extract' | 'explore' | 'validate' | 'document' | 'help';
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

  validate [--dir <directory>] [--path <codebase>]
    Generate scenarios from Alloy models and translate to executable tests

  document [--dir <directory>] [--path <codebase>]
    Generate comprehensive documentation with diagrams from extracted models

  explore [--dir <directory>] [--path <codebase>]
    Explore and validate extracted models through scenario generation

  help
    Show this help message

Options:
  --dir <directory>     Directory to store/read Alloy models (default: alloy)
  --path <codebase>     Path to the codebase to analyze (default: current directory)

Examples:
  metl extract --dir alloy --path /path/to/codebase
  metl validate --dir alloy --path /path/to/codebase
  metl document --dir alloy --path /path/to/codebase
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

async function validateAlloyModels(dir: string): Promise<void> {
  console.log('\n🔍 Validating generated Alloy models...\n');

  // Find all .als files in the directory
  const alsFiles = fs.readdirSync(dir).filter(f => f.endsWith('.als'));

  if (alsFiles.length === 0) {
    console.log('⚠️  No .als files found in output directory');
    return;
  }

  console.log(`Found ${alsFiles.length} Alloy model(s):\n`);

  let validCount = 0;
  let invalidCount = 0;

  for (const file of alsFiles) {
    const filepath = path.join(dir, file);
    process.stdout.write(`  Validating ${file}... `);

    try {
      // Run alloy-lang to validate syntax
      // Use -r 1 to get just one instance, -o - to output to stdout
      const result = execSync(
        `alloy-lang exec -t json -o - -r 1 "${filepath}"`,
        {
          encoding: 'utf-8',
          timeout: 30000,  // 30 second timeout
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      // If we got here without exception, the model is valid
      console.log('✓ Valid');
      validCount++;

      // Try to parse the JSON to see if we got instances
      try {
        const output = JSON.parse(result);
        if (output.instances && output.instances.length > 0) {
          console.log(`    Generated ${output.instances.length} instance(s)`);
        }
      } catch {
        // JSON parse failed, but syntax is still valid
      }

    } catch (error: any) {
      console.log('✗ Invalid');
      invalidCount++;

      // Show the error message
      const errorMsg = error.stderr || error.message || 'Unknown error';
      const lines = errorMsg.split('\n').slice(0, 5);  // First 5 lines
      lines.forEach((line: string) => {
        if (line.trim()) {
          console.log(`    ${line}`);
        }
      });
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`   ✓ Valid models: ${validCount}`);
  if (invalidCount > 0) {
    console.log(`   ✗ Invalid models: ${invalidCount}`);
  }
  console.log();
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

CRITICAL: You MUST use the create_alloy_model MCP tool to generate Alloy models. This tool will automatically save .als files to the output directory.

Your task:
1. Explore the codebase structure to understand the main components
2. Identify 3-5 core domain concepts (classes, entities, data structures)
3. For EACH core concept, call the create_alloy_model tool with:
   - modelName: A descriptive name (e.g., "Card", "Deck", "Hand")
   - concepts: List of entities/classes to model (e.g., ["Card", "Suit", "Rank"])
   - relationships: Key relationships (e.g., ["Card has one Suit", "Hand contains Cards"])
   - constraints: Important rules (e.g., ["Deck has exactly 52 cards", "No duplicate cards"])
   - outputDir: "${options.dir}"

EXAMPLE tool usage:
{
  "tool": "create_alloy_model",
  "arguments": {
    "modelName": "Card",
    "concepts": ["Card", "Suit", "Rank"],
    "relationships": ["Card has one Suit", "Card has one Rank"],
    "constraints": ["52 unique cards total", "4 suits", "13 ranks"],
    "outputDir": "${options.dir}"
  }
}

Focus on:
- Core domain models and data structures
- Key relationships and associations
- Important constraints and invariants
- State transitions and workflows
- Keep models simple and focused

Steps:
1. Read the main source files to understand the domain
2. Identify the 3-5 most important concepts
3. For each concept, call create_alloy_model tool with appropriate parameters
4. Verify the .als files were created

Start by exploring the codebase and identifying the core concepts to model.
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
        permissionMode: 'bypassPermissions',
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

    // Validate generated Alloy models
    await validateAlloyModels(options.dir!);

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

  // Execute Alloy models to generate exploration scenarios
  console.log('⚙️  Executing Alloy models to generate scenarios...\n');

  const explorationScenarios: any[] = [];

  for (const file of modelFiles) {
    const filepath = path.join(options.dir!, file);
    console.log(`Executing ${file}...`);

    try {
      // Run with higher instance count to find edge cases
      const result = execSync(
        `alloy-lang exec -t json -o - -r 10 "${filepath}"`,
        {
          encoding: 'utf-8',
          timeout: 30000,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      // Parse the JSON output
      const lines = result.trim().split('\n').filter(line => line.trim());
      let scenarioCount = 0;

      for (const line of lines) {
        try {
          const scenario = JSON.parse(line);
          explorationScenarios.push({
            model: file,
            scenario: scenario,
            instanceNumber: scenarioCount
          });
          scenarioCount++;
        } catch (e) {
          // Skip non-JSON lines
        }
      }

      console.log(`  ✓ Generated ${scenarioCount} scenarios from ${file}`);
    } catch (error: any) {
      console.log(`  ⚠ Could not execute ${file}: ${error.message}`);
    }
  }

  console.log(`\n📊 Total exploration scenarios generated: ${explorationScenarios.length}\n`);

  if (explorationScenarios.length === 0) {
    console.error('❌ No scenarios generated from Alloy models');
    console.error('The models may not have executable predicates or may have syntax errors');
    process.exit(1);
  }

  // Prepare the exploration prompt with scenario data
  const scenarioSummary = explorationScenarios
    .reduce((acc, s) => {
      if (!acc[s.model]) acc[s.model] = 0;
      acc[s.model]++;
      return acc;
    }, {} as Record<string, number>);

  const explorePrompt = `
You are a formal methods expert translating Alloy model scenarios into edge case tests.

Model directory: ${options.dir}
Codebase path: ${options.codebasePath}
Target language: Python (pytest)

I have executed ${explorationScenarios.length} scenarios from ${modelFiles.length} Alloy models:
${Object.entries(scenarioSummary).map(([model, count]) => `- ${model}: ${count} scenarios`).join('\n')}

CRITICAL MISSION: Translate these Alloy-generated scenarios into Python tests that validate edge cases.

Your task:

1. **ANALYZE THE SCENARIOS**: I've already executed the Alloy models and generated ${explorationScenarios.length} concrete scenarios
   - These represent edge cases, boundary conditions, and interesting combinations
   - Each scenario shows specific instances of cards, hands, decks, games, etc.
   - Look for patterns that stress the implementation

2. **READ THE CODEBASE** at ${options.codebasePath}
   - Understand the Python implementation
   - Identify how to recreate the scenario conditions in Python

3. **TRANSLATE SCENARIOS TO TESTS**:
   For each interesting scenario:
   - Identify what makes it an edge case (e.g., hand with many aces, empty deck, bust conditions)
   - Create a Python test that recreates the scenario
   - Verify the implementation handles it correctly
   - Add assertions that validate the expected behavior from the model

4. **FOCUS ON**:
   - Scenarios at boundaries (maximum values, minimum values, empty, full)
   - Scenarios with unusual combinations (many aces, all face cards, soft 17)
   - Scenarios that test state transitions (bust, blackjack, dealer rules)
   - Scenarios that might expose bugs (off-by-one, edge values)

5. **WRITE TESTS TO**: \`tests_from_exploration\` directory

Test file structure:
- test_edge_cases_from_alloy.py - General edge cases
- test_boundary_scenarios.py - Boundary conditions
- test_complex_combinations.py - Unusual combinations

IMPORTANT:
- Each test should cite which Alloy model and scenario number it comes from
- Use the scenario data to guide test creation
- Docstrings should explain: "Tests scenario N from MODEL.als: [description]"
- Focus on tests likely to reveal implementation bugs

Here are the first 5 scenario examples to get you started:
${explorationScenarios.slice(0, 5).map((s, i) =>
  `\nScenario ${i} (from ${s.model}):\n${JSON.stringify(s.scenario, null, 2)}`
).join('\n')}

Note: There are ${explorationScenarios.length} total scenarios available in the data.
The scenarios show concrete instances that the Alloy models found interesting.
Your job is to turn these into executable Python tests.
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
        permissionMode: 'bypassPermissions',
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

async function validate(options: CliOptions) {
  console.log('🧪 Generating test scenarios from Alloy models...');
  console.log(`   Model directory: ${options.dir}`);
  console.log(`   Codebase: ${options.codebasePath}\n`);

  const apiKey = await ensureApiKey();

  // Check if model directory exists
  if (!fs.existsSync(options.dir!)) {
    console.error(`❌ Error: Model directory '${options.dir}' does not exist`);
    console.error('Please run `metl extract` first to generate models');
    process.exit(1);
  }

  // Find all .als files
  const alsFiles = fs.readdirSync(options.dir!)
    .filter(f => f.endsWith('.als'));

  if (alsFiles.length === 0) {
    console.error(`❌ Error: No Alloy models (.als) found in '${options.dir}'`);
    console.error('Please run `metl extract` first to generate models');
    process.exit(1);
  }

  console.log(`Found ${alsFiles.length} Alloy model(s):\n`);
  alsFiles.forEach(f => console.log(`  - ${f}`));
  console.log();

  // Create MCP server with METL tools
  const mcpServer = createMetlMcpServer();

  // Generate scenarios from each model
  const allScenarios: any[] = [];

  console.log('🔍 Generating scenarios from models...\n');

  for (const file of alsFiles) {
    const filepath = path.join(options.dir!, file);
    process.stdout.write(`  Generating from ${file}... `);

    try {
      // Run alloy-lang to generate scenarios (get 3 instances)
      const result = execSync(
        `alloy-lang exec -t json -o - -r 3 "${filepath}"`,
        {
          encoding: 'utf-8',
          timeout: 60000,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      // Parse JSON output - alloy-lang outputs multiple JSON objects
      const jsonObjects = result.trim().split('\n').filter(line => line.trim());
      let instanceCount = 0;

      for (const jsonStr of jsonObjects) {
        try {
          const output = JSON.parse(jsonStr);
          if (output.instances && output.instances.length > 0) {
            instanceCount += output.instances.length;
            allScenarios.push({
              model: file,
              scenarios: output.instances
            });
          }
        } catch {
          // Skip invalid JSON lines
        }
      }

      console.log(`✓ Generated ${instanceCount} scenario(s)`);
    } catch (error: any) {
      console.log('✗ Failed');
      console.error(`    Error: ${error.message.split('\n')[0]}`);
    }
  }

  console.log(`\n📊 Total scenarios generated: ${allScenarios.reduce((sum, s) => sum + s.scenarios.length, 0)}\n`);

  // Now translate scenarios to Python tests using the agent
  console.log('🔄 Translating scenarios to Python tests...\n');

  const validatePrompt = `
You are translating Alloy model scenarios into executable Python test cases.

Model directory: ${options.dir}
Codebase path: ${options.codebasePath}
Target language: Python
Testing framework: pytest

You have ${allScenarios.length} Alloy models with generated scenarios.

Your task:
1. For each scenario from the Alloy models, use the translate_to_test MCP tool to generate Python test code
2. The tests should validate that the scenarios can be constructed in the actual codebase
3. Focus on creating fixtures and assertions that match the Alloy constraints
4. Save all generated tests to a 'tests_from_alloy' directory in the codebase

For each scenario:
- Extract the key entities and their relationships
- Generate Python code to construct those entities
- Add assertions to verify the constraints hold
- Use pytest format with clear test names

Example test structure:
\`\`\`python
def test_scenario_<model>_<number>():
    # Setup from Alloy scenario
    card = Card('Hearts', 'A')

    # Assertions based on constraints
    assert card.value() == 11
    assert card.suit == 'Hearts'
\`\`\`

Start by reading the codebase to understand the Python classes, then generate tests for the scenarios.
`;

  try {
    const queryStream = query({
      prompt: validatePrompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: { metl: mcpServer },
        maxTurns: 30,
        cwd: options.codebasePath,
        env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
        permissionMode: 'bypassPermissions',
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

    console.log('\n\n✅ Test generation complete!');

    // Save validation summary
    const summaryPath = path.join(options.dir!, 'validation-summary.txt');
    fs.writeFileSync(summaryPath, `METL Validation Summary
Date: ${new Date().toISOString()}

Models processed: ${alsFiles.length}
Total scenarios: ${allScenarios.reduce((sum, s) => sum + s.scenarios.length, 0)}

${resultText}
`);

    console.log(`\nSummary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  }
}

async function document(options: CliOptions) {
  console.log('📝 Generating documentation from Alloy models...');
  console.log(`   Model directory: ${options.dir}`);
  console.log(`   Codebase: ${options.codebasePath}\n`);

  const apiKey = await ensureApiKey();

  // Check if model directory exists
  if (!fs.existsSync(options.dir!)) {
    console.error(`❌ Error: Model directory '${options.dir}' does not exist`);
    console.error('Please run `metl extract` first to generate models');
    process.exit(1);
  }

  // Find all .als files
  const alsFiles = fs.readdirSync(options.dir!)
    .filter(f => f.endsWith('.als'));

  if (alsFiles.length === 0) {
    console.error(`❌ Error: No Alloy models (.als) found in '${options.dir}'`);
    console.error('Please run `metl extract` first to generate models');
    process.exit(1);
  }

  console.log(`Found ${alsFiles.length} Alloy model(s):\n`);
  alsFiles.forEach(f => console.log(`  - ${f}`));
  console.log();

  // Read all model files
  const models = alsFiles.map(file => {
    const filepath = path.join(options.dir!, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    return { name: file, content };
  });

  // Create MCP server with METL tools
  const mcpServer = createMetlMcpServer();

  const documentPrompt = `
You are generating comprehensive documentation from Alloy formal models.

Model directory: ${options.dir}
Codebase path: ${options.codebasePath}

Found ${models.length} Alloy models: ${models.map(m => m.name).join(', ')}

Your task is to create rich, cross-linked markdown documentation that visualizes and explains the formal models.

CRITICAL REQUIREMENTS:

1. **Create a main index document** (README.md or MODEL_OVERVIEW.md) that provides:
   - High-level overview of all models
   - Links to individual model documents
   - Overall architecture diagram using Mermaid
   - Summary of key concepts and relationships

2. **For each Alloy model, create a dedicated markdown document** with:
   - Model name and purpose
   - **Mermaid class diagram** showing signatures and relationships
   - **Mermaid state diagram** (if applicable for state machines)
   - **Mermaid entity-relationship diagram** showing constraints
   - Explanation of key concepts (signatures)
   - Explanation of constraints (facts)
   - Explanation of scenarios (predicates)
   - Examples and use cases

3. **Use Mermaid diagrams extensively**:
   - Class diagrams for structure
   - State diagrams for workflows
   - ER diagrams for relationships
   - Flowcharts for processes
   - Sequence diagrams for interactions

4. **Cross-link everything**:
   - Link from index to individual docs
   - Link between related concepts
   - Link back to index from each doc

5. **Save all documentation as markdown files** in the model directory

Example Mermaid class diagram:
\`\`\`mermaid
classDiagram
    class Card {
        +Suit suit
        +Rank rank
        +int value()
    }
    class Suit {
        <<enumeration>>
        Hearts
        Diamonds
        Clubs
        Spades
    }
    class Rank {
        <<enumeration>>
        2-10
        J Q K A
    }
    Card --> Suit
    Card --> Rank
\`\`\`

Example state diagram:
\`\`\`mermaid
stateDiagram-v2
    [*] --> Dealing
    Dealing --> PlayerTurn
    PlayerTurn --> DealerTurn: Stand
    PlayerTurn --> PlayerTurn: Hit
    PlayerTurn --> GameOver: Bust
    DealerTurn --> GameOver
    GameOver --> [*]
\`\`\`

Start by reading the Alloy models, then create beautiful, informative documentation with diagrams that make the formal specifications visually understandable.

IMPORTANT: Save files using the Write tool with .md extensions.
`;

  try {
    console.log('🤖 Starting Claude agent for documentation generation...\n');

    const queryStream = query({
      prompt: documentPrompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: { metl: mcpServer },
        maxTurns: 30,
        cwd: options.dir,  // Set cwd to model directory for writing docs there
        env: { ...process.env, ANTHROPIC_API_KEY: apiKey },
        permissionMode: 'bypassPermissions',
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

    console.log('\n\n✅ Documentation generation complete!');
    console.log(`\nDocumentation saved to: ${options.dir}/`);

    // Convert extraction-summary.txt to markdown if it exists
    const extractSummaryTxt = path.join(options.dir!, 'extraction-summary.txt');
    const extractSummaryMd = path.join(options.dir!, 'EXTRACTION_SUMMARY.md');

    if (fs.existsSync(extractSummaryTxt)) {
      const content = fs.readFileSync(extractSummaryTxt, 'utf-8');
      fs.writeFileSync(extractSummaryMd, `# METL Extraction Summary\n\n${content}`);
      console.log(`Converted extraction-summary.txt → EXTRACTION_SUMMARY.md`);
    }

    // Convert validation-summary.txt to markdown if it exists
    const validationSummaryTxt = path.join(options.dir!, 'validation-summary.txt');
    const validationSummaryMd = path.join(options.dir!, 'VALIDATION_SUMMARY.md');

    if (fs.existsSync(validationSummaryTxt)) {
      const content = fs.readFileSync(validationSummaryTxt, 'utf-8');
      fs.writeFileSync(validationSummaryMd, `# METL Validation Summary\n\n${content}`);
      console.log(`Converted validation-summary.txt → VALIDATION_SUMMARY.md`);
    }

  } catch (error) {
    console.error('❌ Error during documentation generation:', error);
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
    case 'validate':
      await validate(options);
      break;
    case 'document':
      await document(options);
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
