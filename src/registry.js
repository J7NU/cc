import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DEFAULT_REGISTRY_DIR = join(homedir(), '.claude', 'plugins');
const REGISTRY_FILE = 'installed.json';

/**
 * Registry tracks superpowers installed on this machine.
 * State is persisted as JSON in ~/.claude/plugins/installed.json.
 */
export class Registry {
  #dir;
  #path;
  #data;

  constructor(dir = DEFAULT_REGISTRY_DIR) {
    this.#dir = dir;
    this.#path = join(dir, REGISTRY_FILE);
    this.#data = this.#load();
  }

  #load() {
    if (!existsSync(this.#path)) {
      return { installedAt: new Date().toISOString(), plugins: {} };
    }
    try {
      return JSON.parse(readFileSync(this.#path, 'utf8'));
    } catch {
      return { installedAt: new Date().toISOString(), plugins: {} };
    }
  }

  #save() {
    if (!existsSync(this.#dir)) {
      mkdirSync(this.#dir, { recursive: true });
    }
    writeFileSync(this.#path, JSON.stringify(this.#data, null, 2), 'utf8');
  }

  /**
   * Retrieve a single installed plugin record by name, or null.
   */
  get(name) {
    return this.#data.plugins[name] ?? null;
  }

  /**
   * Return all installed plugins as an array, sorted by name.
   */
  listInstalled() {
    return Object.values(this.#data.plugins).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Persist a new or updated plugin record.
   */
  set(name, record) {
    this.#data.plugins[name] = {
      ...record,
      installedAt: this.#data.plugins[name]?.installedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.#save();
  }

  /**
   * Remove a plugin record.
   */
  delete(name) {
    delete this.#data.plugins[name];
    this.#save();
  }

  /**
   * Check whether a plugin is currently installed.
   */
  has(name) {
    return name in this.#data.plugins;
  }
}
