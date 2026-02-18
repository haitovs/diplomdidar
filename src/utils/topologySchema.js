/**
 * Topology schema normalization helpers used by editor/runtime pages.
 */

const VALID_NODE_STATUSES = new Set(['healthy', 'warning', 'critical', 'degraded', 'offline']);
const VALID_ROUTING_ROLES = new Set(['core', 'distribution', 'access', 'edge', 'server', 'security', 'endpoint']);
const VALID_ROUTING_PROTOCOLS = new Set(['none', 'static', 'rip', 'ospf', 'eigrp', 'bgp']);
const VALID_LINK_TYPES = new Set(['fiber', 'ethernet', 'wireless', 'wan', 'vpn']);
const VALID_DUPLEX = new Set(['full', 'half']);

const NODE_DEFAULTS_BY_TYPE = {
  coreRouter: { role: 'core', routingProtocol: 'ospf', interfaceSpeedMbps: 10000, vlan: 1, subnetCidr: '10.0.0.0/24' },
  router: { role: 'edge', routingProtocol: 'static', interfaceSpeedMbps: 1000, vlan: 1, subnetCidr: '10.0.1.0/24' },
  firewall: { role: 'security', routingProtocol: 'static', interfaceSpeedMbps: 1000, vlan: 1, subnetCidr: '10.0.2.0/24' },
  switch: { role: 'distribution', routingProtocol: 'none', interfaceSpeedMbps: 1000, vlan: 10, subnetCidr: '10.10.10.0/24' },
  server: { role: 'server', routingProtocol: 'none', interfaceSpeedMbps: 1000, vlan: 20, subnetCidr: '10.20.20.0/24' },
  accessPoint: { role: 'access', routingProtocol: 'none', interfaceSpeedMbps: 1000, vlan: 30, subnetCidr: '10.30.30.0/24' },
  lab: { role: 'endpoint', routingProtocol: 'none', interfaceSpeedMbps: 1000, vlan: 40, subnetCidr: '10.40.40.0/24' },
  iot: { role: 'endpoint', routingProtocol: 'none', interfaceSpeedMbps: 100, vlan: 50, subnetCidr: '10.50.50.0/24' },
  pc: { role: 'endpoint', routingProtocol: 'none', interfaceSpeedMbps: 100, vlan: 60, subnetCidr: '10.60.60.0/24' },
  cloud: { role: 'edge', routingProtocol: 'bgp', interfaceSpeedMbps: 10000, vlan: 1, subnetCidr: '' },
  internet: { role: 'edge', routingProtocol: 'bgp', interfaceSpeedMbps: 10000, vlan: 1, subnetCidr: '' },
};

const LINK_DEFAULTS_BY_TYPE = {
  fiber: { bandwidth: 10000, latency: 2, jitter: 0.3, packetLoss: 0.02, utilizationCap: 100, duplex: 'full', queueLimit: 10000 },
  ethernet: { bandwidth: 1000, latency: 5, jitter: 1, packetLoss: 0.1, utilizationCap: 100, duplex: 'full', queueLimit: 5000 },
  wireless: { bandwidth: 300, latency: 12, jitter: 4, packetLoss: 1.2, utilizationCap: 90, duplex: 'half', queueLimit: 2500 },
  wan: { bandwidth: 500, latency: 20, jitter: 8, packetLoss: 0.6, utilizationCap: 95, duplex: 'full', queueLimit: 3000 },
  vpn: { bandwidth: 200, latency: 35, jitter: 10, packetLoss: 1.5, utilizationCap: 90, duplex: 'full', queueLimit: 2000 },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toInteger(value, fallback) {
  return Math.round(toNumber(value, fallback));
}

function asText(value, fallback = '', maxLen = 256) {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  if (!text) return fallback;
  return text.slice(0, maxLen);
}

function normalizeIpv4(value) {
  const text = asText(value, '');
  if (!text) return '';

  const match = text.match(/^(\d{1,3})(?:\.(\d{1,3})){3}$/);
  if (!match) return '';

  const parts = text.split('.').map(Number);
  if (parts.some((part) => part < 0 || part > 255)) return '';
  return parts.join('.');
}

function normalizeCidr(value) {
  const text = asText(value, '');
  if (!text) return '';

  const [addr, prefix] = text.split('/');
  const normalizedAddress = normalizeIpv4(addr);
  const normalizedPrefix = toInteger(prefix, NaN);

  if (!normalizedAddress || !Number.isFinite(normalizedPrefix)) return '';
  if (normalizedPrefix < 0 || normalizedPrefix > 32) return '';
  return `${normalizedAddress}/${normalizedPrefix}`;
}

function buildUniqueId(id, prefix, fallbackIndex, used) {
  const base = asText(id, `${prefix}-${fallbackIndex}`, 80);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  const unique = `${base}-${suffix}`;
  used.add(unique);
  return unique;
}

function inferNodeStatus(load, explicitStatus) {
  if (VALID_NODE_STATUSES.has(explicitStatus)) return explicitStatus;
  if (load >= 0.9) return 'critical';
  if (load >= 0.75) return 'warning';
  if (load >= 0.6) return 'degraded';
  return 'healthy';
}

function getCanvasDimensions(options = {}) {
  return {
    width: Math.max(1, toNumber(options.canvasWidth, 1000)),
    height: Math.max(1, toNumber(options.canvasHeight, 500)),
  };
}

export function getNodeDefaults(type = 'switch') {
  return NODE_DEFAULTS_BY_TYPE[type] || NODE_DEFAULTS_BY_TYPE.switch;
}

export function getLinkDefaults(type = 'ethernet') {
  return LINK_DEFAULTS_BY_TYPE[type] || LINK_DEFAULTS_BY_TYPE.ethernet;
}

export function normalizeNode(rawNode = {}, index = 0, options = {}) {
  const dims = getCanvasDimensions(options);
  const type = asText(rawNode.type, 'switch', 40);
  const nodeDefaults = getNodeDefaults(type);

  const pxFromPosition = toNumber(rawNode.position?.x, NaN);
  const pyFromPosition = toNumber(rawNode.position?.y, NaN);
  const pxFromCanvas = toNumber(rawNode.x, NaN) / dims.width;
  const pyFromCanvas = toNumber(rawNode.y, NaN) / dims.height;

  const positionX = clamp(Number.isFinite(pxFromPosition) ? pxFromPosition : pxFromCanvas || 0.5, 0, 1);
  const positionY = clamp(Number.isFinite(pyFromPosition) ? pyFromPosition : pyFromCanvas || 0.5, 0, 1);

  const load = clamp(toNumber(rawNode.load ?? rawNode.targetLoad ?? rawNode.displayLoad, 0.35), 0, 1);
  const displayLoad = clamp(toNumber(rawNode.displayLoad, load), 0, 1);
  const targetLoad = clamp(toNumber(rawNode.targetLoad, load), 0, 1);

  const routingRoleRaw = rawNode.routingRole ?? rawNode.role ?? nodeDefaults.role;
  const routingRole = VALID_ROUTING_ROLES.has(routingRoleRaw) ? routingRoleRaw : nodeDefaults.role;

  const routingProtocolRaw = rawNode.routingProtocol ?? nodeDefaults.routingProtocol;
  const routingProtocol = VALID_ROUTING_PROTOCOLS.has(routingProtocolRaw) ? routingProtocolRaw : nodeDefaults.routingProtocol;

  const interfaceSpeedMbps = clamp(
    toInteger(rawNode.interfaceSpeedMbps ?? rawNode.bandwidthMbps, nodeDefaults.interfaceSpeedMbps),
    10,
    400000
  );

  const vlan = clamp(toInteger(rawNode.vlan, nodeDefaults.vlan), 1, 4094);

  return {
    ...rawNode,
    id: asText(rawNode.id, `node-${index + 1}`, 80),
    label: asText(rawNode.label, `${type}-${index + 1}`, 80),
    type,
    position: { x: positionX, y: positionY },
    x: positionX * dims.width,
    y: positionY * dims.height,
    load,
    displayLoad,
    targetLoad,
    status: inferNodeStatus(load, rawNode.status),
    role: routingRole,
    routingRole,
    routingProtocol,
    interfaceSpeedMbps,
    ipv4: normalizeIpv4(rawNode.ipv4 ?? rawNode.ipAddress ?? rawNode.managementIp),
    subnetCidr: normalizeCidr(rawNode.subnetCidr ?? rawNode.subnet ?? nodeDefaults.subnetCidr),
    gateway: normalizeIpv4(rawNode.gateway),
    vlan,
    notes: asText(rawNode.notes, '', 600),
  };
}

export function normalizeLink(rawLink = {}, index = 0, nodeIdSet = null) {
  const source = asText(rawLink.source, '', 80);
  const target = asText(rawLink.target, '', 80);
  if (!source || !target || source === target) return null;

  if (nodeIdSet && (!nodeIdSet.has(source) || !nodeIdSet.has(target))) return null;

  const type = VALID_LINK_TYPES.has(rawLink.type) ? rawLink.type : 'ethernet';
  const defaults = getLinkDefaults(type);
  const duplex = VALID_DUPLEX.has(rawLink.duplex) ? rawLink.duplex : defaults.duplex;

  return {
    ...rawLink,
    id: asText(rawLink.id, `link-${index + 1}`, 80),
    source,
    target,
    type,
    bandwidth: clamp(toInteger(rawLink.bandwidth ?? rawLink.bandwidthMbps, defaults.bandwidth), 1, 400000),
    latency: clamp(toNumber(rawLink.latency, defaults.latency), 0.1, 5000),
    jitter: clamp(toNumber(rawLink.jitter, defaults.jitter), 0, 1000),
    packetLoss: clamp(toNumber(rawLink.packetLoss ?? rawLink.loss, defaults.packetLoss), 0, 100),
    utilizationCap: clamp(toNumber(rawLink.utilizationCap, defaults.utilizationCap), 10, 100),
    duplex,
    queueLimit: clamp(toInteger(rawLink.queueLimit, defaults.queueLimit), 10, 200000),
  };
}

export function normalizeTopology(topology = {}, options = {}) {
  const warnings = [];
  const usedNodeIds = new Set();
  const usedLinkIds = new Set();

  const rawNodes = Array.isArray(topology.nodes) ? topology.nodes : [];
  const nodes = rawNodes.map((node, index) => {
    const normalized = normalizeNode(node, index, options);
    normalized.id = buildUniqueId(normalized.id, 'node', index + 1, usedNodeIds);
    return normalized;
  });

  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const seenLinkPairs = new Set();
  const rawLinks = Array.isArray(topology.links) ? topology.links : [];
  const links = [];

  rawLinks.forEach((link, index) => {
    const normalized = normalizeLink(link, index, nodeIdSet);
    if (!normalized) {
      warnings.push(`Link at index ${index} was dropped due to invalid source/target.`);
      return;
    }

    const pairKey = [normalized.source, normalized.target].sort().join('::');
    if (seenLinkPairs.has(pairKey)) {
      warnings.push(`Duplicate link between ${normalized.source} and ${normalized.target} was dropped.`);
      return;
    }

    normalized.id = buildUniqueId(normalized.id, 'link', index + 1, usedLinkIds);
    seenLinkPairs.add(pairKey);
    links.push(normalized);
  });

  return { nodes, links, warnings };
}

export function serializeTopology(topology = {}) {
  const { nodes, links } = normalizeTopology(topology);

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      position: node.position,
      load: node.load,
      status: node.status,
      role: node.routingRole,
      routingProtocol: node.routingProtocol,
      interfaceSpeedMbps: node.interfaceSpeedMbps,
      ipv4: node.ipv4,
      subnetCidr: node.subnetCidr,
      gateway: node.gateway,
      vlan: node.vlan,
      notes: node.notes,
    })),
    links: links.map((link) => ({
      id: link.id,
      source: link.source,
      target: link.target,
      type: link.type,
      bandwidth: link.bandwidth,
      latency: link.latency,
      jitter: link.jitter,
      packetLoss: link.packetLoss,
      utilizationCap: link.utilizationCap,
      duplex: link.duplex,
      queueLimit: link.queueLimit,
    })),
  };
}
