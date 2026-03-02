/**
 * Packet Simulation Engine
 * Event-driven engine that creates, queues, and advances packets step-by-step.
 */

import { NetworkStack } from '../network/NetworkStack.js';
import { forwardPacket } from '../network/PacketForwarder.js';
import {
  createArpRequest, createPingRequest,
  describePacket, getPacketTypeLabel, getPacketColor,
  ETHER_TYPE, ARP_OP, ICMP_TYPE,
} from '../network/PacketFactory.js';
import { isSameSubnet } from '../network/RoutingTable.js';
import { isEndpointType, isRouterType } from '../network/InterfaceManager.js';

const MAX_EVENT_LOG = 500;
const MAX_ACTIVE_PACKETS = 50;

export class PacketSimulationEngine {
  constructor() {
    this.networkStack = new NetworkStack();
    this.eventQueue = [];       // pending events sorted by timestamp
    this.eventLog = [];         // processed events (history)
    this.activePackets = [];    // currently animating on canvas
    this.pendingArp = new Map(); // nodeId -> [{ frame, outInterface, arpTargetIp }]
    this.mode = 'simulation';   // 'realtime' or 'simulation'
    this.currentTime = 0;
    this.stepCount = 0;
    this.timerId = null;
    this.speed = 1;
    this.listeners = new Map();
    this.pingResults = new Map(); // identifier -> { sent, received, lost }
  }

  /**
   * Initialize from a normalized topology.
   */
  initialize(topology) {
    this.networkStack.initialize(topology);
    this.eventQueue = [];
    this.eventLog = [];
    this.activePackets = [];
    this.pendingArp.clear();
    this.currentTime = 0;
    this.stepCount = 0;
    this.pingResults.clear();
    this.emit('reset');
  }

  /**
   * Set simulation mode.
   */
  setMode(mode) {
    this.mode = mode;
    if (mode === 'realtime') {
      this.startRealtime();
    } else {
      this.stopRealtime();
    }
    this.emit('modeChange', mode);
  }

  /**
   * Set simulation speed (for realtime mode).
   */
  setSpeed(speed) {
    this.speed = speed;
    if (this.mode === 'realtime' && this.timerId) {
      this.stopRealtime();
      this.startRealtime();
    }
  }

  /**
   * Start a ping from sourceNodeId to destIp.
   */
  ping(sourceNodeId, destIp, count = 4) {
    const sourceNode = this.networkStack.getNode(sourceNodeId);
    if (!sourceNode) return;

    // Find the source interface with an IP
    const srcIface = sourceNode.interfaces.find(i => i.ipAddress && i.status !== 'down');
    if (!srcIface) {
      this.addEventLog({
        type: 'error',
        source: sourceNode.hostname,
        destination: destIp,
        info: 'No configured interface on source device',
      });
      return;
    }

    // Check if pinging self
    const selfIface = sourceNode.interfaces.find(i => i.ipAddress === destIp);
    if (selfIface) {
      for (let seq = 0; seq < count; seq++) {
        this.addEventLog({
          type: 'ICMP',
          source: sourceNode.hostname,
          destination: destIp,
          info: `Ping to self: reply from ${destIp} seq=${seq}`,
          subtype: 'reply',
        });
      }
      this.emit('step');
      return;
    }

    const srcIp = srcIface.ipAddress;
    const srcMask = srcIface.subnetMask;

    // Determine next-hop
    let nextHopIp;
    let needsArpForNextHop = false;

    if (srcMask && isSameSubnet(srcIp, destIp, srcMask)) {
      // Same subnet - ARP for destination directly
      nextHopIp = destIp;
    } else if (isEndpointType(sourceNode.type)) {
      // Different subnet - use default gateway
      if (!sourceNode.defaultGateway) {
        this.addEventLog({
          type: 'error',
          source: sourceNode.hostname,
          destination: destIp,
          info: 'No default gateway configured',
        });
        return;
      }
      nextHopIp = sourceNode.defaultGateway;
    } else if (isRouterType(sourceNode.type)) {
      const rt = this.networkStack.getRoutingTable(sourceNodeId);
      const route = rt?.lookup(destIp);
      if (!route) {
        this.addEventLog({
          type: 'error',
          source: sourceNode.hostname,
          destination: destIp,
          info: `No route to ${destIp}`,
        });
        return;
      }
      nextHopIp = route.nextHop || destIp;
    } else {
      nextHopIp = destIp;
    }

    // Check ARP cache for next-hop
    const arpTable = this.networkStack.getArpTable(sourceNodeId);
    const nextHopMac = arpTable.lookup(nextHopIp);

    if (!nextHopMac) {
      // Need ARP resolution first
      const arpReq = createArpRequest(srcIface.mac, srcIp, nextHopIp);

      // Find outgoing link
      const outLink = this._findOutgoingLink(sourceNode, srcIface);
      if (!outLink) {
        this.addEventLog({
          type: 'error',
          source: sourceNode.hostname,
          destination: destIp,
          info: 'Interface not connected',
        });
        return;
      }
      const nextNodeId = outLink.source === sourceNodeId ? outLink.target : outLink.source;

      this.enqueueEvent({
        time: this.currentTime + 1,
        type: 'transit',
        frame: arpReq,
        fromNodeId: sourceNodeId,
        toNodeId: nextNodeId,
        outInterface: srcIface.name,
        linkId: outLink.id,
      });

      // Queue the pings as pending ARP
      for (let seq = 0; seq < count; seq++) {
        if (!this.pendingArp.has(sourceNodeId)) {
          this.pendingArp.set(sourceNodeId, []);
        }
        this.pendingArp.get(sourceNodeId).push({
          destIp,
          srcIp,
          srcMac: srcIface.mac,
          srcIface: srcIface.name,
          nextHopIp,
          sequence: seq,
        });
      }
    } else {
      // ARP cached - send pings directly
      for (let seq = 0; seq < count; seq++) {
        const ping = createPingRequest(srcIface.mac, nextHopMac, srcIp, destIp, seq);
        const outLink = this._findOutgoingLink(sourceNode, srcIface);
        if (!outLink) continue;
        const nextNodeId = outLink.source === sourceNodeId ? outLink.target : outLink.source;

        this.enqueueEvent({
          time: this.currentTime + 1 + seq * 2,
          type: 'transit',
          frame: ping,
          fromNodeId: sourceNodeId,
          toNodeId: nextNodeId,
          outInterface: srcIface.name,
          linkId: outLink.id,
        });
      }
    }

    this.emit('step');
  }

  /**
   * Enqueue an event.
   */
  enqueueEvent(event) {
    this.eventQueue.push(event);
    this.eventQueue.sort((a, b) => a.time - b.time);
  }

  /**
   * Step forward: process the next event.
   */
  stepForward() {
    if (this.eventQueue.length === 0) return false;

    const event = this.eventQueue.shift();
    this.currentTime = event.time;
    this.stepCount++;

    this._processEvent(event);
    this.emit('step');
    return true;
  }

  /**
   * Process a single event.
   */
  _processEvent(event) {
    if (event.type === 'transit') {
      this._processTransit(event);
    } else if (event.type === 'arrive') {
      this._processArrive(event);
    }
  }

  /**
   * Process transit event: packet moving from one node to another along a link.
   */
  _processTransit(event) {
    const { frame, fromNodeId, toNodeId, linkId } = event;
    const fromNode = this.networkStack.getNode(fromNodeId);
    const toNode = this.networkStack.getNode(toNodeId);

    // Add to active packets for animation
    if (this.activePackets.length < MAX_ACTIVE_PACKETS) {
      this.activePackets.push({
        id: frame.id,
        frame,
        fromNodeId,
        toNodeId,
        linkId,
        progress: 0,
        startTime: this.currentTime,
        color: getPacketColor(frame),
        label: getPacketTypeLabel(frame),
      });
    }

    // Log the event
    this.addEventLog({
      type: getPacketTypeLabel(frame),
      source: fromNode?.hostname || fromNodeId,
      destination: toNode?.hostname || toNodeId,
      info: describePacket(frame),
      frame,
      subtype: 'transit',
    });

    // Schedule arrival
    this.enqueueEvent({
      time: this.currentTime + 1,
      type: 'arrive',
      frame,
      nodeId: toNodeId,
      fromNodeId,
      linkId,
    });
  }

  /**
   * Process arrive event: packet arrives at a node.
   */
  _processArrive(event) {
    const { frame, nodeId, fromNodeId, linkId } = event;
    const device = this.networkStack.getNode(nodeId);
    if (!device) return;

    // Remove from active packets
    this.activePackets = this.activePackets.filter(p => p.id !== frame.id);

    // Determine incoming interface
    const inIface = this.networkStack.getReceivingInterface(linkId, nodeId);
    const inInterfaceName = inIface ? inIface.name : null;

    if (!inInterfaceName) return;

    // Check interface status
    if (inIface.status === 'down') {
      this.addEventLog({
        type: 'DROP',
        source: device.hostname,
        destination: '',
        info: `${device.hostname}: interface ${inIface.shortName} is down, packet dropped`,
        subtype: 'drop',
      });
      this.emit('drop', { nodeId, frame });
      return;
    }

    // Forward through the device
    const results = forwardPacket(frame, inInterfaceName, device, this.networkStack);

    for (const result of results) {
      if (result.drop) {
        this.addEventLog({
          type: 'DROP',
          source: device.hostname,
          destination: '',
          info: result.info || result.reason,
          subtype: 'drop',
        });
        this.emit('drop', { nodeId, frame, reason: result.reason });
        continue;
      }

      if (result.delivered) {
        this.addEventLog({
          type: 'DELIVER',
          source: device.hostname,
          destination: '',
          info: result.info,
          subtype: 'deliver',
        });
        this.emit('deliver', { nodeId, frame });
        continue;
      }

      if (result.needsArp) {
        // Send ARP request
        const outIface = device.interfaces.find(i => i.name === result.outInterface);
        if (!outIface || !outIface.connectedLinkId) continue;

        const arpReq = createArpRequest(outIface.mac, outIface.ipAddress, result.arpTargetIp);
        const link = this.networkStack.getLinkById(outIface.connectedLinkId);
        if (!link) continue;
        const nextNodeId = link.source === nodeId ? link.target : link.source;

        this.enqueueEvent({
          time: this.currentTime + 1,
          type: 'transit',
          frame: arpReq,
          fromNodeId: nodeId,
          toNodeId: nextNodeId,
          outInterface: result.outInterface,
          linkId: link.id,
        });

        // Store original frame as pending
        if (!this.pendingArp.has(nodeId)) {
          this.pendingArp.set(nodeId, []);
        }
        this.pendingArp.get(nodeId).push({
          originalFrame: result.originalFrame,
          outInterface: result.outInterface,
          arpTargetIp: result.arpTargetIp,
        });
        continue;
      }

      if (result.frame && result.nextNodeId) {
        // Check if this is an ARP reply that resolves pending packets
        if (result.frame.etherType === ETHER_TYPE.ARP &&
            result.frame.payload.operation === ARP_OP.REPLY) {
          // The recipient will learn the ARP - check pending on recipient side
          this._scheduleArpPendingCheck(result.nextNodeId, result.frame.payload.senderIp, result.frame.payload.senderMac);
        }

        // Find the link for this forwarding
        const outIface = device.interfaces.find(i => i.name === result.outInterface);
        const linkId = outIface?.connectedLinkId;

        this.enqueueEvent({
          time: this.currentTime + 1,
          type: 'transit',
          frame: result.frame,
          fromNodeId: nodeId,
          toNodeId: result.nextNodeId,
          outInterface: result.outInterface,
          linkId: linkId,
        });
      }
    }

    // Check if this arrival was an ARP reply that resolves our pending packets
    if (frame.etherType === ETHER_TYPE.ARP && frame.payload.operation === ARP_OP.REPLY) {
      this._processPendingArp(nodeId, frame.payload.senderIp, frame.payload.senderMac);
    }
  }

  /**
   * Check and process pending ARP entries after receiving an ARP reply.
   */
  _processPendingArp(nodeId, resolvedIp, resolvedMac) {
    const pending = this.pendingArp.get(nodeId);
    if (!pending || pending.length === 0) return;

    const device = this.networkStack.getNode(nodeId);
    if (!device) return;

    const remaining = [];
    for (const entry of pending) {
      if (entry.nextHopIp === resolvedIp || entry.arpTargetIp === resolvedIp) {
        // This entry can now be sent
        if (entry.originalFrame) {
          // Router pending - re-forward the original frame
          const outIface = device.interfaces.find(i => i.name === entry.outInterface);
          if (outIface && outIface.connectedLinkId) {
            // Re-encapsulate with resolved MAC
            const origIp = entry.originalFrame.payload;
            const newFrame = {
              ...entry.originalFrame,
              srcMac: outIface.mac,
              dstMac: resolvedMac,
            };
            if (origIp && origIp.ttl) {
              newFrame.payload = { ...origIp, ttl: origIp.ttl - 1 };
            }

            const link = this.networkStack.getLinkById(outIface.connectedLinkId);
            if (link) {
              const nextNodeId = link.source === nodeId ? link.target : link.source;
              this.enqueueEvent({
                time: this.currentTime + 1,
                type: 'transit',
                frame: newFrame,
                fromNodeId: nodeId,
                toNodeId: nextNodeId,
                outInterface: entry.outInterface,
                linkId: link.id,
              });
            }
          }
        } else if (entry.destIp) {
          // Endpoint pending ping
          const ping = createPingRequest(entry.srcMac, resolvedMac, entry.srcIp, entry.destIp, entry.sequence);
          const srcIface = device.interfaces.find(i => i.name === entry.srcIface);
          if (srcIface && srcIface.connectedLinkId) {
            const link = this.networkStack.getLinkById(srcIface.connectedLinkId);
            if (link) {
              const nextNodeId = link.source === nodeId ? link.target : link.source;
              this.enqueueEvent({
                time: this.currentTime + 1 + entry.sequence,
                type: 'transit',
                frame: ping,
                fromNodeId: nodeId,
                toNodeId: nextNodeId,
                outInterface: entry.srcIface,
                linkId: link.id,
              });
            }
          }
        }
      } else {
        remaining.push(entry);
      }
    }

    if (remaining.length === 0) {
      this.pendingArp.delete(nodeId);
    } else {
      this.pendingArp.set(nodeId, remaining);
    }
  }

  _scheduleArpPendingCheck(nodeId, ip, mac) {
    // Will be handled when the ARP reply arrives at nodeId
  }

  /**
   * Find outgoing link from a node's interface.
   */
  _findOutgoingLink(node, iface) {
    if (iface.connectedLinkId) {
      return this.networkStack.getLinkById(iface.connectedLinkId);
    }
    return null;
  }

  /**
   * Add an entry to the event log.
   */
  addEventLog(entry) {
    entry.step = this.stepCount;
    entry.time = this.currentTime;
    this.eventLog.push(entry);
    if (this.eventLog.length > MAX_EVENT_LOG) {
      this.eventLog.shift();
    }
  }

  /**
   * Start realtime mode auto-stepping.
   */
  startRealtime() {
    this.stopRealtime();
    const interval = Math.max(50, 500 / this.speed);
    this.timerId = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.stepForward();
      }
    }, interval);
  }

  /**
   * Stop realtime mode.
   */
  stopRealtime() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Reset simulation state.
   */
  reset() {
    this.stopRealtime();
    this.eventQueue = [];
    this.eventLog = [];
    this.activePackets = [];
    this.pendingArp.clear();
    this.currentTime = 0;
    this.stepCount = 0;
    this.pingResults.clear();
    this.networkStack.resetDynamicState();
    this.emit('reset');
  }

  /**
   * Get current state summary.
   */
  getState() {
    return {
      mode: this.mode,
      stepCount: this.stepCount,
      eventsQueued: this.eventQueue.length,
      packetsInFlight: this.activePackets.length,
      eventLogLength: this.eventLog.length,
    };
  }

  // Simple event emitter
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  emit(event, data) {
    const list = this.listeners.get(event);
    if (list) {
      for (const cb of list) {
        cb(data);
      }
    }
  }

  /**
   * Cleanup.
   */
  destroy() {
    this.stopRealtime();
    this.listeners.clear();
  }
}
