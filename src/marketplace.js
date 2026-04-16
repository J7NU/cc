import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, '..', 'data', 'catalog.json');

/**
 * Marketplace provides read-only access to the superpowers catalog.
 * In production this would fetch from a remote registry; here it reads
 * from the bundled catalog.json so the tool works fully offline.
 */
export class Marketplace {
  #catalog;

  constructor(catalogPath = CATALOG_PATH) {
    this.#catalog = this.#load(catalogPath);
  }

  #load(path) {
    try {
      const raw = readFileSync(path, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to load marketplace catalog: ${err.message}`);
    }
  }

  /**
   * Find a single superpower by exact name.
   * @returns {object|null} Catalog entry or null if not found.
   */
  find(name) {
    const normalized = name.toLowerCase();
    return (
      this.#catalog.superpowers.find(
        (s) => s.name.toLowerCase() === normalized
      ) ?? null
    );
  }

  /**
   * Search superpowers by query string.
   * Matches against name, description, author, and tags.
   * If query is empty, returns all entries.
   * @returns {object[]} Matching catalog entries.
   */
  search(query = '') {
    const q = query.trim().toLowerCase();
    if (!q) return [...this.#catalog.superpowers];

    return this.#catalog.superpowers.filter((s) => {
      const haystack = [
        s.name,
        s.description,
        s.author,
        ...(s.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every((term) => haystack.includes(term));
    });
  }

  /**
   * Return all catalog entries.
   */
  list() {
    return [...this.#catalog.superpowers];
  }
}
