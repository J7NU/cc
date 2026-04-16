import { Marketplace } from './marketplace.js';
import { Registry } from './registry.js';
import { Installer } from './installer.js';

const USAGE = `
claude plugin <command> [options]

Commands:
  install <name[@version]>   Install a superpower from the marketplace
  remove <name>              Remove an installed superpower
  list                       List all installed superpowers
  search [query]             Search the marketplace catalog
  info <name>                Show details about a superpower
  update [name]              Update one or all installed superpowers

Examples:
  claude plugin install superpowers@claude-plugins-official
  claude plugin install git-tools@1.2.0
  claude plugin search "code review"
  claude plugin list
  claude plugin remove git-tools
  claude plugin update
`.trim();

export async function run(args) {
  const [command, ...rest] = args;

  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE);
    process.exit(0);
  }

  const marketplace = new Marketplace();
  const registry = new Registry();
  const installer = new Installer(registry);

  try {
    switch (command) {
      case 'install':
        await cmdInstall(rest, marketplace, installer);
        break;
      case 'remove':
      case 'uninstall':
        await cmdRemove(rest, registry, installer);
        break;
      case 'list':
        await cmdList(registry);
        break;
      case 'search':
        await cmdSearch(rest, marketplace);
        break;
      case 'info':
        await cmdInfo(rest, marketplace, registry);
        break;
      case 'update':
        await cmdUpdate(rest, marketplace, installer, registry);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run `claude plugin --help` for usage.');
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function cmdInstall(args, marketplace, installer) {
  if (!args.length) {
    console.error('Usage: claude plugin install <name[@version]>');
    process.exit(1);
  }

  const [nameSpec] = args;
  const { name, version, author } = parseNameSpec(nameSpec);

  console.log(`Searching marketplace for "${name}"...`);
  const entry = await marketplace.find(name);

  if (!entry) {
    throw new Error(`Superpower "${name}" not found in the marketplace.`);
  }

  if (author && entry.author.toLowerCase() !== author.toLowerCase()) {
    throw new Error(
      `Superpower "${name}" exists but is published by "${entry.author}", not "${author}".`
    );
  }

  const resolvedVersion = version ?? entry.latest;
  const versionEntry = entry.versions[resolvedVersion];

  if (!versionEntry) {
    throw new Error(
      `Version "${resolvedVersion}" not found for "${name}". Available: ${Object.keys(entry.versions).join(', ')}`
    );
  }

  if (installer.isInstalled(name)) {
    const current = installer.getInstalledVersion(name);
    if (current === resolvedVersion) {
      console.log(`"${name}@${resolvedVersion}" is already installed.`);
      return;
    }
    console.log(`Upgrading "${name}" from ${current} to ${resolvedVersion}...`);
  } else {
    console.log(`Installing "${name}@${resolvedVersion}"...`);
  }

  await installer.install(entry, resolvedVersion, versionEntry);
  console.log(`Successfully installed "${name}@${resolvedVersion}".`);
  if (versionEntry.activationNote) {
    console.log(`\nNote: ${versionEntry.activationNote}`);
  }
}

async function cmdRemove(args, registry, installer) {
  if (!args.length) {
    console.error('Usage: claude plugin remove <name>');
    process.exit(1);
  }

  const [name] = args;

  if (!installer.isInstalled(name)) {
    throw new Error(`"${name}" is not installed.`);
  }

  await installer.remove(name);
  console.log(`Successfully removed "${name}".`);
}

async function cmdList(registry) {
  const installed = registry.listInstalled();

  if (!installed.length) {
    console.log('No superpowers installed.\nRun `claude plugin search` to browse the marketplace.');
    return;
  }

  console.log(`Installed superpowers (${installed.length}):\n`);
  const nameWidth = Math.max(...installed.map((p) => p.name.length), 4);

  console.log(`  ${'Name'.padEnd(nameWidth)}  Version    Description`);
  console.log(`  ${'─'.repeat(nameWidth)}  ─────────  ${'─'.repeat(40)}`);

  for (const plugin of installed) {
    console.log(
      `  ${plugin.name.padEnd(nameWidth)}  ${plugin.version.padEnd(9)}  ${plugin.description}`
    );
  }
}

async function cmdSearch(args, marketplace) {
  const query = args.join(' ');
  const results = await marketplace.search(query);

  if (!results.length) {
    console.log(query ? `No superpowers found for "${query}".` : 'The marketplace catalog is empty.');
    return;
  }

  const label = query ? `Search results for "${query}"` : 'Available superpowers';
  console.log(`${label} (${results.length}):\n`);

  const nameWidth = Math.max(...results.map((r) => r.name.length), 4);

  console.log(`  ${'Name'.padEnd(nameWidth)}  Latest     Description`);
  console.log(`  ${'─'.repeat(nameWidth)}  ─────────  ${'─'.repeat(40)}`);

  for (const entry of results) {
    console.log(
      `  ${entry.name.padEnd(nameWidth)}  ${entry.latest.padEnd(9)}  ${entry.description}`
    );
  }

  console.log('\nInstall with: claude plugin install <name>');
}

async function cmdInfo(args, marketplace, registry) {
  if (!args.length) {
    console.error('Usage: claude plugin info <name>');
    process.exit(1);
  }

  const [name] = args;
  const entry = await marketplace.find(name);

  if (!entry) {
    throw new Error(`Superpower "${name}" not found in the marketplace.`);
  }

  const installed = registry.get(name);
  const versions = Object.keys(entry.versions);

  console.log(`\n  Name:        ${entry.name}`);
  console.log(`  Description: ${entry.description}`);
  console.log(`  Author:      ${entry.author}`);
  console.log(`  Latest:      ${entry.latest}`);
  console.log(`  Versions:    ${versions.join(', ')}`);
  console.log(`  Tags:        ${(entry.tags ?? []).join(', ') || '—'}`);
  console.log(`  Status:      ${installed ? `Installed (${installed.version})` : 'Not installed'}`);

  const latest = entry.versions[entry.latest];
  if (latest?.description) {
    console.log(`\n  ${latest.description}`);
  }
  console.log();
}

async function cmdUpdate(args, marketplace, installer, registry) {
  const targets = args.length ? args : registry.listInstalled().map((p) => p.name);

  if (!targets.length) {
    console.log('No superpowers installed to update.');
    return;
  }

  let updated = 0;
  for (const name of targets) {
    if (!installer.isInstalled(name)) {
      console.warn(`Skipping "${name}": not installed.`);
      continue;
    }

    const entry = await marketplace.find(name);
    if (!entry) {
      console.warn(`Skipping "${name}": not found in marketplace.`);
      continue;
    }

    const current = installer.getInstalledVersion(name);
    if (current === entry.latest) {
      console.log(`"${name}" is already up to date (${current}).`);
      continue;
    }

    console.log(`Updating "${name}" from ${current} to ${entry.latest}...`);
    const versionEntry = entry.versions[entry.latest];
    await installer.install(entry, entry.latest, versionEntry);
    console.log(`Updated "${name}" to ${entry.latest}.`);
    updated++;
  }

  if (updated > 0) {
    console.log(`\n${updated} superpower(s) updated.`);
  }
}

function parseNameSpec(spec) {
  // Supports "name", "name@version", "name@author", "@scope/name", "@scope/name@version"
  // A qualifier starting with a digit is treated as a version; anything else is an author filter.
  const atVersionIdx = spec.lastIndexOf('@');
  if (atVersionIdx > 0) {
    const qualifier = spec.slice(atVersionIdx + 1);
    const name = spec.slice(0, atVersionIdx);
    if (/^\d/.test(qualifier)) {
      return { name, version: qualifier, author: undefined };
    }
    return { name, author: qualifier, version: undefined };
  }
  return { name: spec, version: undefined, author: undefined };
}
