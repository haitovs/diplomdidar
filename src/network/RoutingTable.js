/**
 * Routing Table
 * Static routes per router with longest-prefix-match lookup.
 */
export class RoutingTable {
  constructor() {
    this.routes = []; // { network, mask, maskBits, nextHop, iface, type }
  }

  /**
   * Add a connected route (directly attached network).
   */
  addConnectedRoute(network, mask, iface) {
    const maskBits = subnetMaskToBits(mask);
    const normalizedNet = applyMask(network, mask);
    // Avoid duplicates
    const exists = this.routes.find(r =>
      r.network === normalizedNet && r.maskBits === maskBits && r.type === 'connected'
    );
    if (!exists) {
      this.routes.push({
        network: normalizedNet,
        mask,
        maskBits,
        nextHop: null,
        iface,
        type: 'connected',
      });
      this._sort();
    }
  }

  /**
   * Add a static route.
   */
  addStaticRoute(network, mask, nextHop) {
    const maskBits = subnetMaskToBits(mask);
    const normalizedNet = applyMask(network, mask);
    const exists = this.routes.find(r =>
      r.network === normalizedNet && r.maskBits === maskBits && r.nextHop === nextHop
    );
    if (!exists) {
      this.routes.push({
        network: normalizedNet,
        mask,
        maskBits,
        nextHop,
        iface: null,
        type: 'static',
      });
      this._sort();
    }
  }

  /**
   * Remove a static route.
   */
  removeRoute(network, mask, nextHop) {
    const maskBits = subnetMaskToBits(mask);
    const normalizedNet = applyMask(network, mask);
    this.routes = this.routes.filter(r =>
      !(r.network === normalizedNet && r.maskBits === maskBits && r.nextHop === nextHop)
    );
  }

  /**
   * Longest-prefix-match lookup.
   */
  lookup(destIp) {
    for (const route of this.routes) {
      if (ipMatchesNetwork(destIp, route.network, route.mask)) {
        return route;
      }
    }
    return null;
  }

  /**
   * Clear all routes.
   */
  clear() {
    this.routes = [];
  }

  /**
   * Clear only connected routes (for re-initialization).
   */
  clearConnected() {
    this.routes = this.routes.filter(r => r.type !== 'connected');
  }

  getEntries() {
    return this.routes.map(r => ({ ...r }));
  }

  /**
   * Sort by mask bits descending (longest prefix first).
   */
  _sort() {
    this.routes.sort((a, b) => b.maskBits - a.maskBits);
  }
}

// IP utility functions
export function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function intToIp(num) {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join('.');
}

export function subnetMaskToBits(mask) {
  const num = ipToInt(mask);
  let bits = 0;
  let n = num;
  while (n) {
    bits += n & 1;
    n >>>= 1;
  }
  return bits;
}

export function bitsToSubnetMask(bits) {
  if (bits === 0) return '0.0.0.0';
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return intToIp(mask);
}

export function applyMask(ip, mask) {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(mask);
  return intToIp((ipInt & maskInt) >>> 0);
}

export function ipMatchesNetwork(ip, network, mask) {
  const ipInt = ipToInt(ip);
  const netInt = ipToInt(network);
  const maskInt = ipToInt(mask);
  return ((ipInt & maskInt) >>> 0) === ((netInt & maskInt) >>> 0);
}

export function isSameSubnet(ip1, ip2, mask) {
  return applyMask(ip1, mask) === applyMask(ip2, mask);
}

export function isBroadcast(ip, network, mask) {
  const maskInt = ipToInt(mask);
  const netInt = ipToInt(network);
  const broadcastInt = (netInt | (~maskInt >>> 0)) >>> 0;
  return ipToInt(ip) === broadcastInt;
}
