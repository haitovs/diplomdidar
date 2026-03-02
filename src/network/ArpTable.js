/**
 * ARP Table
 * IP-to-MAC cache per device.
 */
export class ArpTable {
  constructor() {
    this.entries = new Map(); // ip -> { mac, iface, timestamp }
  }

  lookup(ip) {
    const entry = this.entries.get(ip);
    return entry ? entry.mac : null;
  }

  add(ip, mac, iface = '') {
    this.entries.set(ip, { mac, iface, timestamp: Date.now() });
  }

  remove(ip) {
    this.entries.delete(ip);
  }

  clear() {
    this.entries.clear();
  }

  getEntries() {
    return Array.from(this.entries.entries()).map(([ip, entry]) => ({
      ip,
      mac: entry.mac,
      iface: entry.iface,
    }));
  }

  has(ip) {
    return this.entries.has(ip);
  }
}
