/**
 * Topology schema normalization helpers used by editor/runtime pages.
 */

import { createInterfaces, findAvailableInterface, isEndpointType, isRouterType, isSwitchType } from '../network/InterfaceManager.js';

const VALID_LINK_TYPES = new Set(['fiber', 'ethernet', 'wireless', 'wan', 'vpn']);

const LINK_DEFAULTS_BY_TYPE = {
  fiber: { bandwidth: 10000 },
  ethernet: { bandwidth: 1000 },
  wireless: { bandwidth: 300 },
  wan: { bandwidth: 500 },
  vpn: { bandwidth: 200 },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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

function getCanvasDimensions(options = {}) {
  return {
    width: Math.max(1, toNumber(options.canvasWidth, 1000)),
    height: Math.max(1, toNumber(options.canvasHeight, 500)),
  };
}

export function getLinkDefaults(type = 'ethernet') {
  return LINK_DEFAULTS_BY_TYPE[type] || LINK_DEFAULTS_BY_TYPE.ethernet;
}

export function normalizeNode(rawNode = {}, index = 0, options = {}) {
  const dims = getCanvasDimensions(options);
  const type = asText(rawNode.type, 'switch', 40);

  const pxFromPosition = toNumber(rawNode.position?.x, NaN);
  const pyFromPosition = toNumber(rawNode.position?.y, NaN);
  const pxFromCanvas = toNumber(rawNode.x, NaN) / dims.width;
  const pyFromCanvas = toNumber(rawNode.y, NaN) / dims.height;

  const positionX = clamp(Number.isFinite(pxFromPosition) ? pxFromPosition : pxFromCanvas || 0.5, 0, 1);
  const positionY = clamp(Number.isFinite(pyFromPosition) ? pyFromPosition : pyFromCanvas || 0.5, 0, 1);

  const id = asText(rawNode.id, `node-${index + 1}`, 80);
  const hostname = asText(rawNode.hostname || rawNode.label, `${type}-${index + 1}`, 80);

  // Generate interfaces from templates if not provided
  let interfaces = rawNode.interfaces;
  if (!Array.isArray(interfaces) || interfaces.length === 0) {
    interfaces = createInterfaces(type, id);
  } else {
    // Normalize existing interfaces
    interfaces = interfaces.map((iface, i) => ({
      name: iface.name || `Interface${i}`,
      shortName: iface.shortName || iface.name || `If${i}`,
      mac: iface.mac || '',
      ipAddress: normalizeIpv4(iface.ipAddress) || '',
      subnetMask: iface.subnetMask || '',
      status: iface.status || 'up',
      speed: toNumber(iface.speed, 100),
      type: iface.type || 'ethernet',
      connectedLinkId: iface.connectedLinkId || null,
    }));
  }

  const result = {
    id,
    label: hostname,
    hostname,
    type,
    position: { x: positionX, y: positionY },
    x: positionX * dims.width,
    y: positionY * dims.height,
    status: rawNode.status || 'up',
    interfaces,
    notes: asText(rawNode.notes, '', 600),
  };

  // Endpoint-specific fields
  if (isEndpointType(type)) {
    result.defaultGateway = normalizeIpv4(rawNode.defaultGateway || rawNode.gateway) || '';
  }

  // Router-specific fields
  if (isRouterType(type)) {
    result.routingTable = Array.isArray(rawNode.routingTable) ? rawNode.routingTable : [];
  }

  // All devices get ARP table
  result.arpTable = Array.isArray(rawNode.arpTable) ? rawNode.arpTable : [];

  // Switch-specific fields
  if (isSwitchType(type)) {
    result.macTable = Array.isArray(rawNode.macTable) ? rawNode.macTable : [];
  }

  return result;
}

export function normalizeLink(rawLink = {}, index = 0, nodeIdSet = null) {
  const source = asText(rawLink.source, '', 80);
  const target = asText(rawLink.target, '', 80);
  if (!source || !target || source === target) return null;
  if (nodeIdSet && (!nodeIdSet.has(source) || !nodeIdSet.has(target))) return null;

  const type = VALID_LINK_TYPES.has(rawLink.type) ? rawLink.type : 'ethernet';
  const defaults = getLinkDefaults(type);

  return {
    id: asText(rawLink.id, `link-${index + 1}`, 80),
    source,
    target,
    sourceInterface: rawLink.sourceInterface || null,
    targetInterface: rawLink.targetInterface || null,
    type,
    bandwidth: clamp(toNumber(rawLink.bandwidth, defaults.bandwidth), 1, 400000),
    status: rawLink.status || 'up',
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
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
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

    // Auto-assign interfaces if not specified
    const sourceNode = nodeMap.get(normalized.source);
    const targetNode = nodeMap.get(normalized.target);

    if (sourceNode && !normalized.sourceInterface) {
      const iface = findAvailableInterface(sourceNode.interfaces);
      if (iface) {
        normalized.sourceInterface = iface.name;
        iface.connectedLinkId = normalized.id;
      }
    } else if (sourceNode && normalized.sourceInterface) {
      const iface = sourceNode.interfaces.find(i => i.name === normalized.sourceInterface);
      if (iface) iface.connectedLinkId = normalized.id;
    }

    if (targetNode && !normalized.targetInterface) {
      const iface = findAvailableInterface(targetNode.interfaces);
      if (iface) {
        normalized.targetInterface = iface.name;
        iface.connectedLinkId = normalized.id;
      }
    } else if (targetNode && normalized.targetInterface) {
      const iface = targetNode.interfaces.find(i => i.name === normalized.targetInterface);
      if (iface) iface.connectedLinkId = normalized.id;
    }

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
      hostname: node.hostname,
      type: node.type,
      position: node.position,
      status: node.status,
      interfaces: node.interfaces.map(iface => ({
        name: iface.name,
        shortName: iface.shortName,
        mac: iface.mac,
        ipAddress: iface.ipAddress,
        subnetMask: iface.subnetMask,
        status: iface.status,
        speed: iface.speed,
        type: iface.type,
        connectedLinkId: iface.connectedLinkId,
      })),
      defaultGateway: node.defaultGateway,
      routingTable: node.routingTable,
      arpTable: node.arpTable,
      macTable: node.macTable,
      notes: node.notes,
    })),
    links: links.map((link) => ({
      id: link.id,
      source: link.source,
      target: link.target,
      sourceInterface: link.sourceInterface,
      targetInterface: link.targetInterface,
      type: link.type,
      bandwidth: link.bandwidth,
      status: link.status,
    })),
  };
}
