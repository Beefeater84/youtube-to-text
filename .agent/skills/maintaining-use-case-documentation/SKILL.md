---
name: maintaining-use-case-documentation
description: Use when modifying component logic, API behavior, or system workflows to ensure local documentation (agent.md) remains synchronized with implementation.
---

# Maintaining Use Case Documentation

## Overview
Every significant component or module should have an `agent.md` file in its directory describing its core "Use Cases" and "Expected Behavior". Keeping these files updated ensures that future AI interactions have accurate context about the system's intended behavior.

## When to Use
- You are adding or modifying logic in a component, API, or service.
- You are implementing a new feature with specific user scenarios.
- You are fixing a bug that was caused by an unhandled or incorrectly handled use case.
- You are about to finish a task and need to ensure documentation parity.

## Core Pattern

### 1. Check for Documentation
Search for `agent.md` in:
- The same directory as the modified file.
- The parent directories (especially for features or apps).
- The project root.

### 2. Update/Add Use Cases
Format use cases consistently:
- **Title**: Brief description of the scenario.
- **Conditions**: What triggers this case.
- **Expected Behavior**: Detailed list of what the system should do.

### 3. Reference Previous Logic
If you changed existing logic, ensure the old "Expected behavior" is removed or updated. Do not leave contradictory information.

## Quick Reference
| Action | When to do it |
|--------|---------------|
| Create `agent.md` | When building a new non-trivial component. |
| Update Use Case | When changing existing logic within a component. |
| Add Use Case | When handling a new scenario or edge case. |
| Update Root | When changing overall project goals or core patterns. |

## Common Mistakes
- **Assuming Knowledge**: Thinking the next AI will "just know" the new logic from the code alone.
- **Narrative Documentation**: Writing a history of changes instead of a specification of current behavior.
- **Inconsistent Formatting**: Mixing bullet points, numbered lists, and paragraphs in Use Case sections.

## Red Flags
- Code and `agent.md` describing different outcomes for the same input.
- "Completed" tasks that didn't involve checking for nearby documentation.
- Use cases that use past tense ("I fixed X") instead of prescriptive present ("System does X").
