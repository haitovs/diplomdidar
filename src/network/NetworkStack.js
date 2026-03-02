/**
 * Network Stack
 * Master orchestrator: holds all device tables, initializes from topology.
 */

import { ArpTable } from './ArpTable.js';
import { RoutingTable, applyMask } from './RoutingTable.js';
import { MacTable } from './MacTable.js';
import { isRouterType, isSwitchType } from './InterfaceManager.js';

export class NetworkStack {
  constructor() {
    this.arpTables = new Map();   // nodeId -> ArpTable
    this.routingTables = new Map(); // nodeId -> RoutingTable
    this.macTables = new Map();   // nodeId -> MacTable
    this.nodes = new Map();       // nodeId -> node
    this.links = new Map();       // linkId -> link
  }

  /**
   * Initialize from a normalized topology.
   */
  initialize(topology) {
    this.arpTables.clear();
    this.routingTables.clear();
    this.macTables.clear();
    this.nodes.clear();
    this.links.clear();

    const nodes = topology.nodes || [];
    const links = topology.links || [];

    // Store nodes and links
    for (const node of nodes) {
      this.nodes.set(node.id, node);
      this.arpTables.set(node.id, new ArpTable());

      if (isRouterType(node.type)) {
        const rt = new RoutingTable();
        // Restore saved static routes
        if (Array.isArray(node.routingTable)) {
          for (const route of node.routingTable) {
            if (route.type === 'static' && route.nextHop) {
              rt.addStaticRoute(route.network, route.mask, route.nextHop);
            }
          }
        }
        this.routingTables.set(node.id, rt);
      }

      if (isSwitchType(node.type)) {
        this.macTables.set(node.id, new MacTable());
      }
    }

    for (const link of links) {
      this.links.set(link.id, link);
    }

    // Build connected routes for routers
    this.rebuildConnectedRoutes();
  }

  /**
   * Rebuild connected routes based on current interface IPs.
   */
  rebuildConnectedRoutes() {
    for (const [nodeId, node] of this.nodes) {
      if (!isRouterType(node.type)) continue;
      const rt = this.routingTables.get(nodeId);
      if (!rt) continue;

      rt.clearConnected();
      for (const iface of node.interfaces) {
        if (iface.ipAddress && iface.subnetMask && iface.status !== 'down') {
          rt.addConnectedRoute(iface.ipAddress, iface.subnetMask, iface.name);
        }
      }
    }
  }

  /**
   * Update a specific interface's IP configuration and rebuild routes.
   */
  setInterfaceIp(nodeId, interfaceName, ipAddress, subnetMask) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const iface = node.interfaces.find(i => i.name === interfaceName);
    if (!iface) return;

    iface.ipAddress = ipAddress;
    iface.subnetMask = subnetMask;

    if (isRouterType(node.type)) {
      this.rebuildConnectedRoutes();
    }
  }

  /**
   * Set interface status.
   */
  setInterfaceStatus(nodeId, interfaceName, status) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const iface = node.interfaces.find(i => i.name === interfaceName);
    if (!iface) return;

    iface.status = status;

    if (isRouterType(node.type)) {
      this.rebuildConnectedRoutes();
    }
  }

  /**
   * Set default gateway for endpoint devices.
   */
  setDefaultGateway(nodeId, gateway) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.defaultGateway = gateway;
    }
  }

  /**
   * Set hostname.
   */
  setHostname(nodeId, hostname) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.hostname = hostname;
      node.label = hostname;
    }
  }

  // Accessors
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getArpTable(nodeId) {
    let table = this.arpTables.get(nodeId);
    if (!table) {
      table = new ArpTable();
      this.arpTables.set(nodeId, table);
    }
    return table;
  }

  getRoutingTable(nodeId) {
    return this.routingTables.get(nodeId);
  }

  getMacTable(nodeId) {
    let table = this.macTables.get(nodeId);
    if (!table) {
      table = new MacTable();
      this.macTables.set(nodeId, table);
    }
    return table;
  }

  getLinkById(linkId) {
    return this.links.get(linkId);
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getAllLinks() {
    return Array.from(this.links.values());
  }

  /**
   * Find which interface on a node connects to a given link.
   */
  getInterfaceForLink(nodeId, linkId) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    return node.interfaces.find(i => i.connectedLinkId === linkId);
  }

  /**
   * Find the link connecting two nodes (if any).
   */
  findLinkBetween(nodeA, nodeB) {
    for (const link of this.links.values()) {
      if ((link.source === nodeA && link.target === nodeB) ||
          (link.source === nodeB && link.target === nodeA)) {
        return link;
      }
    }
    return null;
  }

  /**
   * Get the node ID on the other end of a link.
   */
  getOtherEnd(linkId, nodeId) {
    const link = this.links.get(linkId);
    if (!link) return null;
    return link.source === nodeId ? link.target : link.source;
  }

  /**
   * Find which interface on the receiving end of a link gets the packet.
   */
  getReceivingInterface(linkId, receivingNodeId) {
    const link = this.links.get(linkId);
    if (!link) return null;

    const node = this.nodes.get(receivingNodeId);
    if (!node) return null;

    // The receiving interface is the one that corresponds to this link
    if (link.source === receivingNodeId) {
      return node.interfaces.find(i => i.name === link.sourceInterface);
    }
    return node.interfaces.find(i => i.name === link.targetInterface);
  }

  /**
   * Add a static route to a router.
   */
  addStaticRoute(nodeId, network, mask, nextHop) {
    const rt = this.routingTables.get(nodeId);
    if (rt) {
      rt.addStaticRoute(network, mask, nextHop);
      // Persist to node data
      const node = this.nodes.get(nodeId);
      if (node) {
        if (!node.routingTable) node.routingTable = [];
        node.routingTable.push({ network: applyMask(network, mask), mask, nextHop, type: 'static' });
      }
    }
  }

  /**
   * Remove a static route from a router.
   */
  removeStaticRoute(nodeId, network, mask, nextHop) {
    const rt = this.routingTables.get(nodeId);
    if (rt) {
      rt.removeRoute(network, mask, nextHop);
      const node = this.nodes.get(nodeId);
      if (node && node.routingTable) {
        const normalizedNet = applyMask(network, mask);
        node.routingTable = node.routingTable.filter(r =>
          !(r.network === normalizedNet && r.mask === mask && r.nextHop === nextHop)
        );
      }
    }
  }

  /**
   * Reset all dynamic state (ARP, MAC tables) but keep static config.
   */
  resetDynamicState() {
    for (const arp of this.arpTables.values()) {
      arp.clear();
    }
    for (const mac of this.macTables.values()) {
      mac.clear();
    }
  }
}
