# Claude Agent SDK Bug Report

## Summary
The Claude Agent SDK v0.1.42 `query()` function never yields messages because the spawned CLI subprocess hangs on startup and produces no output.

## Environment
- SDK Version: @anthropic-ai/claude-agent-sdk@0.1.42
- Node Version: v22.21.1
- Platform: Linux 4.4.0
- ANTHROPIC_API_KEY: Set and valid (108 characters)

## Problem Description

The SDK's `query()` function spawns a Claude Code agent subprocess (`cli.js`) to handle requests:

```
node /path/to/claude-agent-sdk/cli.js --output-format stream-json --verbose --input-format stream-json ...
```

However, this subprocess:
1. Launches successfully (process is created)
2. Never produces any output
3. Hangs indefinitely
4. Does not respond to any flags including `--help` or `--version`

## Reproduction Steps

### Test 1: Using SDK `query()` function
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const q = query({
  prompt: "Hello!",
  options: {
    model: 'claude-sonnet-4-5-20250929',
    maxTurns: 2,
  },
});

// This loop never executes - no messages are ever yielded
for await (const message of q) {
  console.log(message);
}
```

**Result**: Process hangs indefinitely. No messages ever yielded from the async iterator.

### Test 2: Running CLI directly with --help
```bash
timeout 3 node node_modules/@anthropic-ai/claude-agent-sdk/cli.js --help
```

**Result**: Process times out after 3 seconds with no output.

### Test 3: Running CLI directly with version
```bash
timeout 3 node node_modules/@anthropic-ai/claude-agent-sdk/cli.js --version
```

**Result**: Process times out after 3 seconds with no output.

### Test 4: Running CLI with input
```bash
echo '{"type":"user","content":"Hello!"}' | timeout 10 node node_modules/@anthropic-ai/claude-agent-sdk/cli.js \
  --output-format stream-json \
  --input-format stream-json \
  --max-turns 1 \
  --model claude-sonnet-4-5-20250929
```

**Result**: Process times out after 10 seconds with no output.

## Observed Behavior

From detailed logging:
```
STDERR: Spawning Claude Code process: node /home/user/metl/node_modules/@anthropic-ai/claude-agent-sdk/cli.js \
  --output-format stream-json --verbose --input-format stream-json --system-prompt  --max-turns 2 \
  --model claude-sonnet-4-5-20250929 --mcp-config {"mcpServers":{"metl":{"type":"sdk","name":"metl"}}} \
  --setting-sources  --permission-mode default

[... 60 seconds pass ...]

!!! TIMEOUT: No messages received after 60 seconds
```

Process list confirms the subprocess is running:
```
node /home/user/metl/node_modules/@anthropic-ai/claude-agent-sdk/cli.js --output-format stream-json ...
```

But it produces absolutely no output, even on stderr.

## Impact

This makes the SDK completely unusable for:
- CLI applications using `query()`
- Agent-based workflows
- Any code that depends on the SDK agent subprocess

Direct tool usage (calling MCP tools directly) works fine. Only the agent subprocess is affected.

## Potential Causes

1. **Initialization Deadlock**: The CLI might be waiting for some initialization that never completes
2. **Environment Issue**: Missing environment variable or configuration the CLI requires
3. **IPC Problem**: Parent-child process communication protocol mismatch
4. **Startup Blocking**: CLI hanging in synchronous startup code (reading files, network calls, etc.)

## Workaround

Use METL tools directly without the SDK agent wrapper:

```typescript
import { createAlloyModel } from './dist/tools/alloy.js';

const result = await createAlloyModel.handler({
  modelName: 'System',
  concepts: ['User', 'Account'],
  relationships: ['User owns Account'],
  constraints: ['Account balance >= 0']
}, {});
```

This works perfectly - only the SDK `query()` agent subprocess is broken.

## Files Created for Debugging

- `/home/user/metl/test-query.ts` - Simple test showing SDK hang
- `/home/user/metl/test-query-detailed.ts` - Detailed test with comprehensive logging
- `/tmp/sdk-debug.log` - Debug log showing subprocess spawn but no messages

## Recommendation

The CLI subprocess needs investigation to determine why it hangs on startup. Suggested areas:
1. Check CLI initialization code
2. Verify stdin/stdout/stderr handling
3. Test if CLI can run standalone in this environment
4. Add CLI startup logging to identify where it hangs
