/**
 * MAC Address Table
 * MAC-to-port table per switch.
 */
export class MacTable {
  constructor() {
    this.entries = new Map(); // mac -> { port (interface name), timestamp }
  }

  /**
   * Learn a MAC address on a port.
   */
  learn(mac, port) {
    this.entries.set(mac, { port, timestamp: Date.now() });
  }

  /**
   * Lookup which port a MAC address is on.
   * Returns the port (interface name) or null if unknown.
   */
  lookup(mac) {
    const entry = this.entries.get(mac);
    return entry ? entry.port : null;
  }

  /**
   * Clear all entries.
   */
  clear() {
    this.entries.clear();
  }

  /**
   * Get all entries as an array.
   */
  getEntries() {
    return Array.from(this.entries.entries()).map(([mac, entry]) => ({
      mac,
      port: entry.port,
    }));
  }

  has(mac) {
    return this.entries.has(mac);
  }
}
