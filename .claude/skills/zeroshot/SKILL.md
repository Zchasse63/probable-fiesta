---
name: zeroshot
description: "Expert guidance for Zeroshot, a multi-agent orchestration wrapper for Claude Code with adversarial validation and automatic retry loops. Use when: (1) Running zeroshot tasks or clusters, (2) Monitoring cluster progress and costs, (3) Debugging zombie clusters or stuck tasks, (4) Writing effective prompts for audits, refactoring, or implementation, (5) Understanding the multi-agent architecture (conductors, planners, workers, validators), (6) Optimizing costs and task splitting strategies."
---

# Zeroshot Expert Guide

Multi-agent wrapper for Claude Code with adversarial validation and automatic retry loops.

## Core Concepts

- **Multiple isolated agents** with fresh contexts checking each other's work
- **Adversarial validation** - validators didn't write the code, can't lie about it working
- **Automatic retry loops** - if validation fails, worker fixes and retries until tests pass
- **Task complexity routing** - simple tasks get 1 agent, complex tasks get up to 9 agents

## Quick Reference

| Task | Command |
|------|---------|
| Run with validation | `zeroshot run "prompt"` |
| Single agent (no validation) | `zeroshot task run "prompt"` |
| Run from GitHub issue | `zeroshot run 123` |
| With PR creation | `zeroshot run "prompt" --pr` |
| Git worktree isolation | `zeroshot run 123 --worktree` |
| Docker isolation | `zeroshot run 123 --docker` |
| Background mode | `zeroshot run "prompt" -d` |

## Monitoring Commands

```bash
zeroshot list                    # List all clusters
zeroshot status <cluster-id>     # Tokens, cost, agent states
zeroshot logs <cluster-id> -f    # Follow logs real-time
zeroshot attach <task-id>        # Live task output
zeroshot watch                   # TUI dashboard
```

### Direct File Monitoring

```bash
# Monitor task output
tail -f /tmp/claude/-Users-$USER-<project>/tasks/<task-id>.output

# Check for file changes (verify progress)
find . -type f -mmin -10 | grep -v node_modules | grep -v .git

# Check if Claude process alive
ps aux | grep claude | grep -v grep
```

## Management Commands

```bash
zeroshot kill <cluster-id>       # Kill running cluster
zeroshot resume <cluster-id>     # Resume failed cluster
zeroshot stop <cluster-id>       # Graceful stop
zeroshot settings                # View settings
zeroshot settings set maxModel opus  # Cost ceiling
```

## Agent Architecture

| Agent | Model | Purpose |
|-------|-------|---------|
| junior-conductor | Haiku | Classifies task complexity |
| senior-conductor | Sonnet | Handles escalations |
| planner | Sonnet/Opus | Creates implementation plans |
| worker | Sonnet | Executes plan, writes code |
| validator-requirements | Sonnet | Verifies requirements met |
| validator-code | Sonnet | Verifies code quality |
| validator-security | Sonnet | Security checks (critical tasks) |
| validator-tester | Sonnet | Runs test suite |
| adversarial-tester | Sonnet | Proof-of-work validation |

### Task Classification

| Classification | Agents | Use Case |
|----------------|--------|----------|
| TRIVIAL | 1 worker | 1 file, mechanical |
| SIMPLE | 1 worker + 1 validator | Single concern |
| STANDARD:INQUIRY | planner + 3 validators | Research, audits |
| STANDARD:TASK | planner + 3 validators | Multi-file refactoring |
| CRITICAL:TASK | planner + 5 validators | Complex, security-sensitive |

### Workflow

```
1. ISSUE_OPENED → junior-conductor classifies
2. CLUSTER_OPERATIONS → spawn agents
3. PLAN_READY → planner creates plan (if complex)
4. IMPLEMENTATION_READY → worker executes
5. VALIDATION_RESULT → validators check
   - REJECTED: worker retries with feedback
   - APPROVED: completion-detector finalizes
6. CLUSTER_COMPLETE
```

## Prompt Writing Principles

1. **Be specific about scope** - "Do NOT modify X" as important as "Modify Y"
2. **Specify output format** - Tell exactly what files to create/update
3. **Reference context documents** - "Read docs/audit.md for context"
4. **Break large tasks into phases** - Better reliability and cost control
5. **Set clear expectations** - Research vs implementation task

### Audit/Research Prompt Template

```
Perform a comprehensive audit of [scope] in [project].
Do NOT modify any code - this is a research/audit task only.

CONTEXT:
- Tech stack: [e.g., React, Node.js]
- Looking for: [e.g., security issues, performance]

FOCUS AREAS:
1. [First area with examples]
2. [Second area with examples]

OUTPUT:
Create detailed markdown report at docs/audits/[name].md containing:
- Executive summary
- Detailed findings by area
- Critical issues list
- File:line references
```

### Phased Implementation Template

```
Implementing fixes for [project] based on docs/audits/[name].md.
READ THE AUDIT FIRST for full context.

EXECUTE ONLY PHASE 1 & 2:

## PHASE 1: CRITICAL FIXES
1. [First critical fix]
2. [Second critical fix]

## PHASE 2: HIGH PRIORITY
3. [First high-priority fix]
4. [Second high-priority fix]

REQUIREMENTS:
- Preserve existing functionality
- Follow existing code patterns
- Run test suite after each phase

OUTPUT:
Update docs/audits/[name].md marking completed items with ✅
```

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Zombie cluster | `zeroshot kill <id>` then check logs |
| No progress 10+ min | Check `ps aux \| grep claude`, kill if dead |
| Same error 4+ times | Kill, restart with clearer prompt |
| Streaming mode error | Check filesystem - work may be done |
| Tests keep failing | Run tests locally, check validator feedback |

See [references/troubleshooting.md](references/troubleshooting.md) for detailed solutions.

## Cost Management

| Agent | Model | Approx Cost |
|-------|-------|-------------|
| Conductors | Haiku | ~$0.01 |
| Planner | Opus | ~$1.50-4.50 |
| Worker | Sonnet | ~$0.50-2.00/iteration |
| Validators | Sonnet | ~$0.10-0.50/iteration |

**Budget Guidelines:**
- Simple tasks: $1-3
- Complex with validation: $10-20
- Large audits/refactors: $20-40

**Real Examples:**
- Comprehensive audit (21 min): $6.45
- Phase 1-2 remediation (52 min, 6 iterations): $19.14
- Phase 3-4 remediation (83 min, 5 iterations): $11.74

## When to Be Patient vs Intervene

**Be Patient When:**
- Planner running (3-10 min for complex tasks)
- Worker in validation loop (iterations 3-6 common)
- Token count steadily increasing
- Cost within reasonable range

**Intervene When:**
- Cluster state shows `zombie`
- No token increase for 10+ minutes
- Cost exceeded budget without completion
- Same validation error 4+ consecutive iterations
- Claude process not running

## Timeline Expectations

| Task Type | Duration | Iterations |
|-----------|----------|------------|
| Simple fix | 5-15 min | 1-2 |
| Multi-file refactor | 20-40 min | 3-5 |
| Large audit/research | 15-30 min | 1-2 |
| Complex remediation | 40-90 min | 4-7 |

## Files and Locations

| Path | Purpose |
|------|---------|
| `~/.claude-zeroshot/` | Zeroshot data directory |
| `~/.claude-zeroshot/logs/` | Task log files |
| `~/.claude-zeroshot/settings.json` | Configuration |
| `~/.zeroshot/sockets/` | Unix sockets |
| `~/.zeroshot/clusters.json` | Cluster metadata |

## Key Lessons

1. **Zeroshot is thorough, not fast** - 2.5 hours for complete audit + 14-issue fix is normal
2. **Trust validation process** - Multiple rejections = working as intended
3. **Split tasks** - $12 + $12 + $12 more predictable than one $40 run
4. **Check filesystem after failures** - Work often completes before errors

## Critical Rules

| Rule | Forbidden | Required |
|------|-----------|----------|
| Never spawn without permission | "I'll run zeroshot on 123" | User says "run zeroshot" |
| Never use git in validators | `git diff`, `git status` | Validate files directly |
| Worker git with isolation only | Git ops without flags | Use `--worktree`, `--docker`, `--pr` |

**Read-only safe:** `list`, `status`, `logs`
**Destructive (needs permission):** `kill`, `clear`, `purge`

## Reference Documents

- [Installation Guide](references/installation.md) - Setup, authentication, PATH config
- [Monitoring Guide](references/monitoring.md) - Active monitoring, validation loops
- [Prompting Guide](references/prompting.md) - Detailed templates and examples
- [Troubleshooting Guide](references/troubleshooting.md) - Common issues and solutions
