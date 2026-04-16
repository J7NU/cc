/**
 * Installer handles writing/removing plugin metadata via the Registry.
 *
 * In a real deployment this would also download plugin assets, run
 * post-install hooks, etc.  For this implementation the installer manages
 * the registry state that the CLI reads (list, info, update).
 */
export class Installer {
  #registry;

  constructor(registry) {
    this.#registry = registry;
  }

  /**
   * Whether a plugin with the given name is currently installed.
   */
  isInstalled(name) {
    return this.#registry.has(name);
  }

  /**
   * Return the installed version string for a plugin, or null.
   */
  getInstalledVersion(name) {
    return this.#registry.get(name)?.version ?? null;
  }

  /**
   * Install (or upgrade) a plugin to the given version.
   *
   * @param {object} catalogEntry  - Full marketplace catalog entry.
   * @param {string} version       - Resolved version string to install.
   * @param {object} versionEntry  - Version-specific metadata from the catalog.
   */
  async install(catalogEntry, version, versionEntry) {
    // Simulate async work (e.g. downloading assets) without real I/O.
    await this.#simulateDownload(catalogEntry.name, version);

    this.#registry.set(catalogEntry.name, {
      name: catalogEntry.name,
      version,
      description: catalogEntry.description,
      author: catalogEntry.author,
      tags: catalogEntry.tags ?? [],
      activationNote: versionEntry.activationNote ?? null,
    });
  }

  /**
   * Remove an installed plugin.
   *
   * @param {string} name - Plugin name.
   */
  async remove(name) {
    await this.#simulateRemove(name);
    this.#registry.delete(name);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  async #simulateDownload(name, version) {
    // Placeholder for real download logic.
    // Keeps the public API async-ready without introducing real network calls.
    return new Promise((resolve) => setImmediate(resolve));
  }

  async #simulateRemove(name) {
    return new Promise((resolve) => setImmediate(resolve));
  }
}
