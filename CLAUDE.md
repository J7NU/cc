# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run tests
node --test src/**/*.test.js

# Run the CLI directly
node bin/plugin.js <command>

# Example CLI usage
node bin/plugin.js search
node bin/plugin.js install git-tools
node bin/plugin.js list
node bin/plugin.js info code-review
node bin/plugin.js update
node bin/plugin.js remove git-tools
```

No build step required — pure Node.js ESM, no transpilation.

## Architecture

This is a CLI tool (`@claude-plugins/superpowers-marketplace`) for discovering and installing Claude Code superpowers (plugins). Three core classes work together:

- **`Marketplace`** (`src/marketplace.js`) — read-only access to the catalog. Reads `data/catalog.json` at construction time. In a real deployment this would fetch from a remote registry; currently works fully offline.
- **`Registry`** (`src/registry.js`) — persists installed plugin state to `~/.claude/plugins/installed.json`. Handles its own directory creation.
- **`Installer`** (`src/installer.js`) — orchestrates install/remove by delegating to Registry. Simulates async download with `setImmediate`; real asset download logic would go in `#simulateDownload`.

The CLI (`src/cli.js`) is the only consumer of all three classes. `bin/plugin.js` is just the entry point that calls `run(process.argv.slice(2))`.

### Install name parsing

`parseNameSpec` in `src/cli.js` parses `name@qualifier` where a qualifier starting with a digit is treated as a version (`git-tools@1.2.0`) and any other qualifier is treated as an author filter (`superpowers@claude-plugins-official`).

### Adding a new catalog entry

Add an entry to `data/catalog.json` under the `superpowers` array. Each entry needs `name`, `description`, `author`, `latest`, `tags`, and a `versions` map. The `activationNote` field in a version entry is displayed after a successful install.
