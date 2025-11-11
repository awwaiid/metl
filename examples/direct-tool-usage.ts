/**
 * Direct tool usage example
 *
 * This example shows how to call the METL tools directly without using
 * the full agent query system. Useful for testing and integration.
 *
 * Usage:
 *   tsx examples/direct-tool-usage.ts
 */

import { createAlloyModel, runAlloyModel, translateToTest } from '../dist/tools/alloy.js';

async function main() {
  console.log('🔧 METL Direct Tool Usage Example\n');

  // Example 1: Create an Alloy model
  console.log('1️⃣ Creating an Alloy model for a banking system...\n');

  const createResult = await createAlloyModel.handler(
    {
      modelName: 'BankingSystem',
      concepts: ['Account', 'Transaction', 'User'],
      relationships: [
        'User owns Account',
        'Transaction references source and target Account',
      ],
      constraints: [
        'Account balance must be non-negative',
        'Transaction amount must be positive',
        'A user cannot transfer to their own account',
      ],
    },
    {} // extra parameter (not used in our implementation)
  );

  console.log('Result:');
  for (const content of createResult.content) {
    if (content.type === 'text') {
      const result = JSON.parse(content.text);
      console.log(`✅ ${result.message}`);
      console.log('\nGenerated Alloy Model:');
      console.log('─'.repeat(60));
      console.log(result.model);
      console.log('─'.repeat(60));
    }
  }

  // Example 2: Run an Alloy model (placeholder for now)
  console.log('\n2️⃣ Running an Alloy model...\n');

  const runResult = await runAlloyModel.handler(
    {
      modelContent: 'sig Account {} // Simple example',
      command: 'run',
      scope: 4,
    },
    {}
  );

  for (const content of runResult.content) {
    if (content.type === 'text') {
      const result = JSON.parse(content.text);
      console.log(`✅ ${result.message}`);
      console.log(`Note: ${result.note}`);
    }
  }

  // Example 3: Translate a scenario to a test
  console.log('\n3️⃣ Translating an Alloy scenario to a test...\n');

  const translateResult = await translateToTest.handler(
    {
      scenario: 'User Alice transfers $100 from Account A to Account B',
      language: 'TypeScript',
      framework: 'Jest',
      codeContext: 'Banking system with Account and Transaction classes',
    },
    {}
  );

  for (const content of translateResult.content) {
    if (content.type === 'text') {
      const result = JSON.parse(content.text);
      console.log(`✅ ${result.message}`);
      console.log('\nGenerated Test Code:');
      console.log('─'.repeat(60));
      console.log(result.testCode);
      console.log('─'.repeat(60));
    }
  }

  console.log('\n✨ All examples completed successfully!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
