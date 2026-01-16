# Troubleshooting Guide

This guide provides solutions to common issues you may encounter when using Zeroshot.

## Zombie Cluster

If the status of your cluster shows as `zombie`, it means the underlying process has died unexpectedly.

1.  **Check the Logs**: The first step is to check the log files for any error messages that might indicate what went wrong.
    ```bash
    ls -la ~/.claude-zeroshot/logs/ | grep <cluster-name>
    cat ~/.claude-zeroshot/logs/<cluster-name>-*.log
    ```
2.  **Assess the Damage**: See what work was completed before the cluster died by checking for recently modified files.
    ```bash
    find . -type f -mmin -60 | grep -v node_modules
    ```
3.  **Kill the Zombie**: You'll need to manually kill the zombie cluster.
    ```bash
    zeroshot kill <cluster-id>
    ```
4.  **Resume or Restart**: You can try to resume the cluster, but it may be more reliable to start a new one.
    ```bash
    zeroshot resume <cluster-id>
    # OR
    zeroshot run "<your-prompt>"
    ```

## Cluster Stuck (No Progress)

If a cluster appears to be stuck and is not making any progress:

1.  **Check the Task Log**: The task log may contain information about what the agent is currently doing.
    ```bash
    cat ~/.claude-zeroshot/logs/<task-id>.log
    ```
2.  **Check for Running Processes**: Ensure that the `claude` process is still running.
    ```bash
    ps aux | grep claude
    ```
3.  **Kill and Restart**: If there has been no change in the token count for more than 10 minutes, it is best to kill the cluster and restart it.
    ```bash
    zeroshot kill <cluster-id>
    ```

## Worker Fails But Made Progress

Sometimes, the `worker` agent may fail, but not before it has already made significant progress. Before restarting, check the filesystem for any changes that may have been made.

```bash
# Find recently modified files
find . -type f -mmin -15 | grep -v node_modules | grep -v .git
```

## Validators Repeatedly Reject Work

It is normal for validators to reject the `worker`'s output multiple times. The `worker` will automatically learn from the feedback and retry. However, if you find that the same validation error is occurring for 4 or more consecutive iterations, it may be a sign that the prompt is not clear enough. In this case, it is best to kill the cluster and restart it with a more specific prompt.

## Streaming Mode Error

Occasionally, a task may fail with the error "only prompt commands are supported in streaming mode." Even when this happens, the worker may have still completed a significant amount of work. Always check the filesystem for changes before restarting the task.

## Tests Keep Failing

If validators are repeatedly rejecting work due to test failures:

1.  **Check the Failing Tests**: Run the test suite locally to see which tests are failing.
    ```bash
    cd /path/to/project
    npm test
    ```
2.  **Review Validator Feedback**: The validator feedback will often provide clues as to why the tests are failing.
3.  **Manual Intervention**: If the same test fails for 3 or more iterations, it may require manual intervention.

## Long Running Tasks

For tasks that are expected to take a long time (30+ minutes), you can run them in the background.

```bash
# Run the task in the background
zeroshot run "your prompt" &

# You can also detach from a running task by pressing Ctrl+C
# You can then monitor the task with:
zeroshot list
zeroshot status <cluster-id>
```
