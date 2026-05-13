---
name: multi-agent-orchestrator
description: Coordinate multiple specialized AI agents to work together on complex tasks
---

# Multi-Agent Orchestrator

Coordinate multiple AI agents to collaborate on complex tasks.

## Architecture

```
User Request
     ↓
Orchestrator ( analyzes task, delegates)
     ↓
┌──────────┬──────────┬──────────┐
│ Agent 1  │ Agent 2 │ Agent 3  │ (parallel/sequential)
│ (Code)   │ (Research)│ (Writer)│
└──────────┴──────────┴──────────┘
     ↓
Aggregator (compiles results)
     ↓
Final Response
```

## Agent Types

### 1. Planner Agent
Analyzes request, creates plan, delegates subtasks.

### 2. Executor Agents
- **Coder:** Writes/modifies code
- **Researcher:** Gathers information
- **Writer:** Creates content
- **Reviewer:** Checks quality
- **Tester:** Validates functionality

### 3. Aggregator Agent
Compiles outputs from executors into final response.

## Communication Protocol

```json
{
  "task": "Build a todo app",
  "delegations": [
    {"agent": "coder", "task": "Create React component"},
    {"agent": "reviewer", "task": "Review code"}
  ],
  "aggregate": true
}
```

## Implementation Patterns

### Pattern 1: Sequential
A1 → A2 → A3 (each waits for previous)

### Pattern 2: Parallel
A1 → 
A2 → → Aggregator
A3 →

### Pattern 3: Hierarchical
Manager → (A1, A2, A3) → Manager → User

## Best Practices

- Define clear agent roles
- Use appropriate tools per agent
- Implement timeout handling
- Handle agent failures gracefully
- Aggregate partial results