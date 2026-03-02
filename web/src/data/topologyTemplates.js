/**
 * Default topology with pre-configured IPs for a working two-subnet network.
 *
 * Network 1 (192.168.1.0/24) — Switch0 side:
 *   Router0 Gig0/0 = 192.168.1.1
 *   PC0  = 192.168.1.10
 *   PC1  = 192.168.1.11
 *   PC2  = 192.168.1.12
 *
 * Network 2 (192.168.2.0/24) — Switch1 side:
 *   Router0 Gig0/1 = 192.168.2.1
 *   PC3     = 192.168.2.10
 *   Server0 = 192.168.2.20
 */

export const defaultTopology = {
  nodes: [
    { id: 'pc0',  label: 'PC0',     hostname: 'PC0',     type: 'pc',     position: { x: 0.08, y: 0.78 }, defaultGateway: '192.168.1.1' },
    { id: 'pc1',  label: 'PC1',     hostname: 'PC1',     type: 'pc',     position: { x: 0.24, y: 0.78 }, defaultGateway: '192.168.1.1' },
    { id: 'pc2',  label: 'PC2',     hostname: 'PC2',     type: 'pc',     position: { x: 0.40, y: 0.78 }, defaultGateway: '192.168.1.1' },
    { id: 'sw0',  label: 'Switch0', hostname: 'Switch0', type: 'switch', position: { x: 0.24, y: 0.48 } },
    { id: 'r0',   label: 'Router0', hostname: 'Router0', type: 'router', position: { x: 0.50, y: 0.22 } },
    { id: 'sw1',  label: 'Switch1', hostname: 'Switch1', type: 'switch', position: { x: 0.76, y: 0.48 } },
    { id: 'pc3',  label: 'PC3',     hostname: 'PC3',     type: 'pc',     position: { x: 0.68, y: 0.78 }, defaultGateway: '192.168.2.1' },
    { id: 'srv0', label: 'Server0', hostname: 'Server0', type: 'server', position: { x: 0.88, y: 0.78 }, defaultGateway: '192.168.2.1' },
  ],
  links: [
    { id: 'l1', source: 'pc0',  target: 'sw0', type: 'ethernet' },
    { id: 'l2', source: 'pc1',  target: 'sw0', type: 'ethernet' },
    { id: 'l3', source: 'pc2',  target: 'sw0', type: 'ethernet' },
    { id: 'l4', source: 'sw0',  target: 'r0',  type: 'ethernet' },
    { id: 'l5', source: 'r0',   target: 'sw1', type: 'ethernet' },
    { id: 'l6', source: 'pc3',  target: 'sw1', type: 'ethernet' },
    { id: 'l7', source: 'srv0', target: 'sw1', type: 'ethernet' },
  ],
};

/**
 * IP configuration applied after engine initialization.
 * Maps nodeId → { iface: interfaceName, ip, mask } (or array for multi-iface).
 */
export const defaultIpConfig = {
  pc0:  [{ iface: 'FastEthernet0', ip: '192.168.1.10', mask: '255.255.255.0' }],
  pc1:  [{ iface: 'FastEthernet0', ip: '192.168.1.11', mask: '255.255.255.0' }],
  pc2:  [{ iface: 'FastEthernet0', ip: '192.168.1.12', mask: '255.255.255.0' }],
  pc3:  [{ iface: 'FastEthernet0', ip: '192.168.2.10', mask: '255.255.255.0' }],
  srv0: [{ iface: 'FastEthernet0', ip: '192.168.2.20', mask: '255.255.255.0' }],
  r0:   [
    { iface: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0' },
    { iface: 'GigabitEthernet0/1', ip: '192.168.2.1', mask: '255.255.255.0' },
  ],
};

export const starterTopology = defaultTopology;
