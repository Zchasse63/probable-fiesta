# Installation and Setup Guide

This guide provides detailed instructions for installing Zeroshot and its dependencies. A correct setup is crucial for the smooth operation of the tool.

## Prerequisites

Before installing Zeroshot, you must have the following tools installed and authenticated:

*   **Claude Code CLI**: The command-line interface for interacting with Claude Code.
*   **GitHub CLI**: The command-line interface for interacting with GitHub.

### Installing Prerequisites

```bash
# Install the Claude Code CLI using npm
npm install -g @anthropic-ai/claude-code

# Install the GitHub CLI using Homebrew (macOS)
brew install gh

# For other operating systems, please refer to the official GitHub CLI installation documentation.
```

## Installing Zeroshot

Once the prerequisites are in place, you can install Zeroshot using `npm`.

```bash
# Install Zeroshot globally
npm install -g @covibes/zeroshot
```

### Permission Issues with Global NPM Installs

If you encounter permission errors (e.g., `EACCES`) during the global installation, it's recommended to configure `npm` to use a user-owned directory instead of the default system directory.

```bash
# Create a directory for global npm packages in your home directory
mkdir -p ~/.npm-global

# Configure npm to use this new directory
npm config set prefix '~/.npm-global'

# Add the new directory to your system's PATH
# For Zsh (default on modern macOS):
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For Bash:
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Retry the installation
npm install -g @covibes/zeroshot
```

## Authentication

After installation, you need to authenticate with both Anthropic (for Claude) and GitHub.

```bash
# This will open a browser window for you to log in to your Anthropic account.
claude auth login

# This will open a browser window for you to log in to your GitHub account.
gh auth login
```

## Verifying the Installation

To ensure that Zeroshot has been installed correctly, you can run the following command to check its version.

```bash
zeroshot --version
```

## PATH Configuration for Subprocesses

Zeroshot spawns subprocesses that may not inherit the `PATH` from your interactive shell. To prevent issues where these subprocesses cannot find the `claude` or `zeroshot` executables, it is recommended to create symbolic links in a standard system directory like `/usr/local/bin`.

```bash
# Create symbolic links for the claude and zeroshot executables
sudo ln -sf ~/.npm-global/bin/claude /usr/local/bin/claude
sudo ln -sf ~/.npm-global/bin/zeroshot /usr/local/bin/zeroshot
```

## Files and Locations

| Path | Purpose |
|---|---|
| `~/.claude-zeroshot/` | Zeroshot data directory |
| `~/.claude-zeroshot/logs/` | Task log files |
| `~/.claude-zeroshot/settings.json` | Configuration |
| `~/.zeroshot/sockets/` | Unix sockets for task communication |
| `/tmp/claude/-Users-$USER-<project>/tasks/` | Task output files |
