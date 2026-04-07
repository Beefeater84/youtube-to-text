---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring skill consideration before ANY response including clarifying questions
---

# Using Skills

## The Rule

**Consider relevant skills BEFORE any response or action.** Even a 1% chance a skill might apply means you should check it. If a skill turns out to be wrong for the situation, you don't need to use it.

## Flow

```
1. User message received
2. Might any skill apply? (check available skills)
3. If yes → Read skill, announce: "Using [skill] to [purpose]"
4. Has checklist? → Create TodoWrite todo per item
5. Follow skill exactly
6. Respond (including clarifications)
```

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Read it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.

## Available Skills

Check `.cursor/skills/` directory for available skills:

- **brainstorming** - Design exploration before implementation
- **test-driven-development** - TDD workflow
- **writing-plans** - Creating implementation plans
- **executing-plans** - Executing plans with checkpoints
- **systematic-debugging** - Root cause investigation
- **using-git-worktrees** - Isolated workspaces
- **subagent-driven-development** - Task execution with subagents
- **requesting-code-review** - Code review process
- **receiving-code-review** - Handling review feedback
- **finishing-a-development-branch** - Branch completion workflow
- **dispatching-parallel-agents** - Parallel task execution
- **verification-before-completion** - Evidence before claims
- **writing-skills** - Creating new skills

## The Bottom Line

**If a skill exists for what you're doing, use it.**

This is not optional. This is not negotiable.
