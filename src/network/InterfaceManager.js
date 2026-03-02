/**
 * Interface Manager
 * Generates interface templates per device type with MAC addresses.
 */

const INTERFACE_TEMPLATES = {
  router: [
    { name: 'GigabitEthernet0/0', shortName: 'Gig0/0', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/1', shortName: 'Gig0/1', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/2', shortName: 'Gig0/2', speed: 1000, type: 'ethernet' },
  ],
  coreRouter: [
    { name: 'GigabitEthernet0/0', shortName: 'Gig0/0', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/1', shortName: 'Gig0/1', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/2', shortName: 'Gig0/2', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/3', shortName: 'Gig0/3', speed: 1000, type: 'ethernet' },
  ],
  firewall: [
    { name: 'GigabitEthernet0/0', shortName: 'Gig0/0', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/1', shortName: 'Gig0/1', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/2', shortName: 'Gig0/2', speed: 1000, type: 'ethernet' },
  ],
  switch: [
    { name: 'FastEthernet0/1', shortName: 'Fa0/1', speed: 100, type: 'ethernet' },
    { name: 'FastEthernet0/2', shortName: 'Fa0/2', speed: 100, type: 'ethernet' },
    { name: 'FastEthernet0/3', shortName: 'Fa0/3', speed: 100, type: 'ethernet' },
    { name: 'FastEthernet0/4', shortName: 'Fa0/4', speed: 100, type: 'ethernet' },
    { name: 'FastEthernet0/5', shortName: 'Fa0/5', speed: 100, type: 'ethernet' },
    { name: 'GigabitEthernet0/1', shortName: 'Gig0/1', speed: 1000, type: 'ethernet' },
  ],
  pc: [
    { name: 'FastEthernet0', shortName: 'Fa0', speed: 100, type: 'ethernet' },
  ],
  server: [
    { name: 'FastEthernet0', shortName: 'Fa0', speed: 100, type: 'ethernet' },
  ],
  accessPoint: [
    { name: 'FastEthernet0', shortName: 'Fa0', speed: 100, type: 'ethernet' },
    { name: 'Wireless0/0', shortName: 'Wlan0/0', speed: 300, type: 'wireless' },
  ],
  iot: [
    { name: 'FastEthernet0', shortName: 'Fa0', speed: 100, type: 'ethernet' },
  ],
  lab: [
    { name: 'FastEthernet0', shortName: 'Fa0', speed: 100, type: 'ethernet' },
  ],
  cloud: [
    { name: 'GigabitEthernet0/0', shortName: 'Gig0/0', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/1', shortName: 'Gig0/1', speed: 1000, type: 'ethernet' },
  ],
  internet: [
    { name: 'GigabitEthernet0/0', shortName: 'Gig0/0', speed: 1000, type: 'ethernet' },
    { name: 'GigabitEthernet0/1', shortName: 'Gig0/1', speed: 1000, type: 'ethernet' },
  ],
};

/**
 * Generate a deterministic MAC address from node ID and interface index.
 */
export function generateMAC(nodeId, interfaceIndex) {
  let hash = 0x1234;
  for (let i = 0; i < nodeId.length; i++) {
    hash = ((hash << 5) - hash + nodeId.charCodeAt(i)) & 0xffffffff;
  }
  hash = Math.abs(hash);

  const b0 = 0x00; // locally administered unicast
  const b1 = 0x50;
  const b2 = (hash >> 24) & 0xff;
  const b3 = (hash >> 16) & 0xff;
  const b4 = (hash >> 8) & 0xff;
  const b5 = ((hash & 0xff) + interfaceIndex) & 0xff;

  return [b0, b1, b2, b3, b4, b5]
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');
}

/**
 * Create interfaces for a device type.
 */
export function createInterfaces(deviceType, nodeId) {
  const templates = INTERFACE_TEMPLATES[deviceType] || INTERFACE_TEMPLATES.pc;
  return templates.map((tpl, index) => ({
    name: tpl.name,
    shortName: tpl.shortName,
    mac: generateMAC(nodeId, index),
    ipAddress: '',
    subnetMask: '',
    status: 'up',
    speed: tpl.speed,
    type: tpl.type,
    connectedLinkId: null,
  }));
}

/**
 * Get the interface template list for a device type.
 */
export function getInterfaceTemplates(deviceType) {
  return INTERFACE_TEMPLATES[deviceType] || INTERFACE_TEMPLATES.pc;
}

/**
 * Find the first unconnected interface on a node.
 */
export function findAvailableInterface(interfaces) {
  return interfaces.find(iface => !iface.connectedLinkId && iface.status !== 'down');
}

/**
 * Check if a device type behaves as an endpoint (needs default gateway).
 */
export function isEndpointType(deviceType) {
  return ['pc', 'server', 'iot', 'lab', 'accessPoint'].includes(deviceType);
}

/**
 * Check if a device type is a router (has routing table).
 */
export function isRouterType(deviceType) {
  return ['router', 'coreRouter', 'firewall'].includes(deviceType);
}

/**
 * Check if a device type is a switch (has MAC table).
 */
export function isSwitchType(deviceType) {
  return deviceType === 'switch';
}
