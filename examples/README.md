# METL Examples

This directory contains examples demonstrating how to use METL (Model Extract Transform Load).

## Examples

### 1. Direct Tool Usage (`direct-tool-usage.ts`)

Demonstrates how to call METL tools directly without using the full agent query system.

**What it shows:**
- Creating an Alloy model programmatically
- Running an Alloy model
- Translating scenarios to test cases

**Run it:**
```bash
npx tsx examples/direct-tool-usage.ts
```

**Use this when:**
- You want to integrate METL tools into your own application
- You need fine-grained control over tool execution
- You're testing individual tool functionality

### 2. Basic Usage with Agent (`basic-usage.ts`)

Shows how to use METL as a complete agent using the Claude Agent SDK query function.

**What it shows:**
- Setting up the METL MCP server
- Using the query() function with the agent
- Streaming responses from the agent
- The agent autonomously using tools to accomplish tasks

**Run it:**
```bash
# Set your API key first
export ANTHROPIC_API_KEY=your_key_here
npx tsx examples/basic-usage.ts
```

**Use this when:**
- You want the agent to autonomously analyze your code
- You need natural language interaction
- You want the full METL workflow (identify, model, test)

### 3. Example Alloy Model (`queue-system.als`)

A reference Alloy model showing what METL might generate for a priority queue system.

**What it shows:**
- Proper Alloy syntax and structure
- Signatures (data types)
- Facts (constraints)
- Predicates (scenarios)
- Commands (run and check)

**Use this as:**
- A reference for Alloy model structure
- A template for your own models
- An example of formal specification

## Prerequisites

All TypeScript examples require:
- Node.js >= 18.0.0
- Dependencies installed (`npm install`)
- Project built (`npm run build`)

The agent example additionally requires:
- `ANTHROPIC_API_KEY` environment variable set

## Next Steps

After running these examples, you can:

1. **Analyze Your Own Code**: Modify the prompts to target your codebase
2. **Extend the Tools**: Add custom functionality to the Alloy tools
3. **Integrate with CI/CD**: Use METL tools in your testing pipeline
4. **Explore Alloy**: Learn more at [alloytools.org](https://alloytools.org/)

## Troubleshooting

**"ANTHROPIC_API_KEY not set"**
- Set the environment variable: `export ANTHROPIC_API_KEY=your_key_here`

**"Cannot find module"**
- Make sure you've run: `npm install && npm run build`

**"tsx: command not found"**
- Use npx: `npx tsx examples/your-example.ts`
