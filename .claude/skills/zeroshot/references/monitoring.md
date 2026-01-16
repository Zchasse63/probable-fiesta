# Monitoring Guide

This guide provides best practices for monitoring your Zeroshot clusters to ensure they are making progress and to help you identify when to intervene.

## Core Monitoring Commands

These commands are your primary tools for keeping an eye on your Zeroshot tasks.

```bash
# List all active and recent clusters
zeroshot list

# Get a detailed status of a specific cluster, including token usage, cost, and agent states
zeroshot status <cluster-id>

# Follow the real-time logs of a cluster
zeroshot logs <cluster-id> -f

# Attach to a running task to see its live output
zeroshot attach <task-id>

# Use the terminal user interface (TUI) for a dashboard view
zeroshot watch
```

## Direct File Monitoring

In addition to the built-in monitoring commands, you can also monitor the filesystem directly.

```bash
# Monitor the output file of a task
tail -f /tmp/claude/-Users-$USER-<project>/tasks/<task-id>.output

# Check for recently modified files to verify progress
find . -type f -mmin -10 | grep -v node_modules | grep -v .git

# Check if the Claude worker process is still alive
ps aux | grep claude | grep -v grep
```

## Understanding the Validation Loop

It is normal for complex tasks to go through multiple validation loops. A typical workflow might look like this:

1.  **Iteration 1**: The `worker` agent implements the initial version of the code. Validators reject it due to missing requirements.
2.  **Iteration 2**: The `worker` addresses the missing requirements, but the validators now find test failures.
3.  **Iteration 3**: The `worker` fixes the test failures, but the validators identify type errors.
4.  **Iteration 4**: The `worker` resolves the type errors, but the validators find an edge case that was not handled.
5.  **Iteration 5**: The `worker` addresses the edge case, and all validators finally approve the work.

Each iteration typically costs between $2 and $4. Do not be alarmed by multiple rejections; this is a sign that the validation process is working as intended.

## Timeline Expectations

| Task Type | Expected Duration | Iterations |
|---|---|---|
| Simple Fix | 5-15 minutes | 1-2 |
| Multi-file Refactor | 20-40 minutes | 3-5 |
| Large Audit/Research | 15-30 minutes | 1-2 |
| Complex Remediation | 40-90 minutes | 4-7 |

## Active Monitoring Checklist

While a cluster is running, it is good practice to actively monitor its progress.

1.  **Check Cluster Status**: Run `zeroshot status <cluster-id>` every few minutes to ensure the cluster is still alive and making progress. Look for increasing token counts and changing agent states.
2.  **Check for File Modifications**: Use the `find` command to see if files are being modified. This is a good indication that the `worker` agent is actively working.
    ```bash
    find /path/to/project -type f -mmin -5 | grep -v node_modules
    ```
3.  **Monitor the Output File**: The output of each task is logged to a file. Tailing this file can give you a real-time view of the agent's thoughts and actions.
    ```bash
    tail -f /tmp/claude/-Users-$USER-<project>/tasks/<task-id>.output
    ```

## When to Be Patient vs. When to Intervene

**Be Patient When:**

*   The `planner` agent is running (this can take 3-10 minutes for complex tasks).
*   The `worker` agent is in the middle of a validation loop (iterations 3-6 are common).
*   The token count is steadily increasing.
*   The cost is within a reasonable range for the complexity of the task (e.g., under $25 for a complex task).

**Intervene When:**

*   The cluster state shows as `zombie`.
*   There has been no increase in the token count for over 10 minutes.
*   The cost has exceeded your budget (e.g., over $40) without completion.
*   The same validation error has occurred for 4 or more consecutive iterations.
* The `claude` process is no longer running (check with `ps aux | grep claude`).

## Cost Considerations

| Agent | Model | Approx Cost per Task |
|---|---|---|
| Conductors | Haiku | ~$0.01 |
| Planner | Opus | ~$1.50-4.50 (complex tasks) |
| Worker | Sonnet | ~$0.50-2.00 per iteration |
| Validators (each) | Sonnet | ~$0.10-0.50 per iteration |

**Real-World Examples:**

*   **Comprehensive audit** (21 minutes, 8 agents, research): **$6.45**
*   **Phase 1-2 remediation** (52 minutes, 10 agents, 6 iterations): **$19.14**
*   **Phase 3-4 remediation** (83 minutes, 8 agents, 5 iterations): **$11.74**

**Budgeting Tips:**

*   Simple tasks: Budget **$1-3**
*   Complex tasks with validation: Budget **$10-20**
*   Large audits or refactors: Budget **$20-40**
*   Split large tasks into phases to control costs.
