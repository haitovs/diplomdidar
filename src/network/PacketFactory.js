/**
 * Packet Factory
 * Creates Ethernet frames, ARP request/reply, IPv4/ICMP packets.
 */

export const ETHER_TYPE = {
  ARP: 0x0806,
  IPv4: 0x0800,
};

export const ARP_OP = {
  REQUEST: 1,
  REPLY: 2,
};

export const ICMP_TYPE = {
  ECHO_REPLY: 0,
  DEST_UNREACHABLE: 3,
  ECHO_REQUEST: 8,
  TIME_EXCEEDED: 11,
};

export const BROADCAST_MAC = 'FF:FF:FF:FF:FF:FF';

let packetIdCounter = 0;

/**
 * Create an Ethernet frame.
 */
export function createEthernetFrame(srcMac, dstMac, etherType, payload) {
  return {
    id: ++packetIdCounter,
    srcMac,
    dstMac,
    etherType,
    payload,
  };
}

/**
 * Create an ARP packet.
 */
export function createArpPacket(operation, senderMac, senderIp, targetMac, targetIp) {
  return {
    protocol: 'ARP',
    operation,
    senderMac,
    senderIp,
    targetMac: targetMac || '00:00:00:00:00:00',
    targetIp,
  };
}

/**
 * Create an ARP request wrapped in an Ethernet frame.
 */
export function createArpRequest(senderMac, senderIp, targetIp) {
  const arp = createArpPacket(ARP_OP.REQUEST, senderMac, senderIp, '00:00:00:00:00:00', targetIp);
  return createEthernetFrame(senderMac, BROADCAST_MAC, ETHER_TYPE.ARP, arp);
}

/**
 * Create an ARP reply wrapped in an Ethernet frame.
 */
export function createArpReply(senderMac, senderIp, targetMac, targetIp) {
  const arp = createArpPacket(ARP_OP.REPLY, senderMac, senderIp, targetMac, targetIp);
  return createEthernetFrame(senderMac, targetMac, ETHER_TYPE.ARP, arp);
}

/**
 * Create an IPv4 packet.
 */
export function createIPv4Packet(srcIp, dstIp, ttl, protocol, payload) {
  return {
    protocol: 'IPv4',
    srcIp,
    dstIp,
    ttl: ttl || 64,
    ipProtocol: protocol,
    payload,
  };
}

/**
 * Create an ICMP packet.
 */
export function createIcmpPacket(icmpType, icmpCode, sequence, identifier) {
  return {
    protocol: 'ICMP',
    icmpType,
    icmpCode: icmpCode || 0,
    sequence: sequence || 0,
    identifier: identifier || 1,
  };
}

/**
 * Create a full ICMP Echo Request (ping) wrapped in IPv4 + Ethernet.
 */
export function createPingRequest(srcMac, dstMac, srcIp, dstIp, sequence) {
  const icmp = createIcmpPacket(ICMP_TYPE.ECHO_REQUEST, 0, sequence, 1);
  const ipv4 = createIPv4Packet(srcIp, dstIp, 64, 'ICMP', icmp);
  return createEthernetFrame(srcMac, dstMac, ETHER_TYPE.IPv4, ipv4);
}

/**
 * Create a full ICMP Echo Reply wrapped in IPv4 + Ethernet.
 */
export function createPingReply(srcMac, dstMac, srcIp, dstIp, sequence) {
  const icmp = createIcmpPacket(ICMP_TYPE.ECHO_REPLY, 0, sequence, 1);
  const ipv4 = createIPv4Packet(srcIp, dstIp, 64, 'ICMP', icmp);
  return createEthernetFrame(srcMac, dstMac, ETHER_TYPE.IPv4, ipv4);
}

/**
 * Get a human-readable description of a packet.
 */
export function describePacket(frame) {
  if (!frame) return 'Unknown';
  if (frame.etherType === ETHER_TYPE.ARP) {
    const arp = frame.payload;
    if (arp.operation === ARP_OP.REQUEST) {
      return `ARP Request: Who has ${arp.targetIp}? Tell ${arp.senderIp}`;
    }
    return `ARP Reply: ${arp.senderIp} is at ${arp.senderMac}`;
  }
  if (frame.etherType === ETHER_TYPE.IPv4 && frame.payload?.ipProtocol === 'ICMP') {
    const icmp = frame.payload.payload;
    if (icmp.icmpType === ICMP_TYPE.ECHO_REQUEST) {
      return `ICMP Echo Request: ${frame.payload.srcIp} -> ${frame.payload.dstIp} seq=${icmp.sequence}`;
    }
    if (icmp.icmpType === ICMP_TYPE.ECHO_REPLY) {
      return `ICMP Echo Reply: ${frame.payload.srcIp} -> ${frame.payload.dstIp} seq=${icmp.sequence}`;
    }
    if (icmp.icmpType === ICMP_TYPE.TIME_EXCEEDED) {
      return `ICMP Time Exceeded: from ${frame.payload.srcIp}`;
    }
    if (icmp.icmpType === ICMP_TYPE.DEST_UNREACHABLE) {
      return `ICMP Destination Unreachable: from ${frame.payload.srcIp}`;
    }
  }
  return `Ethernet frame: ${frame.srcMac} -> ${frame.dstMac}`;
}

/**
 * Get the packet type label for display.
 */
export function getPacketTypeLabel(frame) {
  if (!frame) return 'Unknown';
  if (frame.etherType === ETHER_TYPE.ARP) {
    return frame.payload.operation === ARP_OP.REQUEST ? 'ARP REQ' : 'ARP REP';
  }
  if (frame.etherType === ETHER_TYPE.IPv4 && frame.payload?.ipProtocol === 'ICMP') {
    const icmp = frame.payload.payload;
    if (icmp.icmpType === ICMP_TYPE.ECHO_REQUEST) return 'ICMP REQ';
    if (icmp.icmpType === ICMP_TYPE.ECHO_REPLY) return 'ICMP REP';
    if (icmp.icmpType === ICMP_TYPE.TIME_EXCEEDED) return 'TTL EXP';
    if (icmp.icmpType === ICMP_TYPE.DEST_UNREACHABLE) return 'UNREACH';
  }
  return 'DATA';
}

/**
 * Get color for packet type (for canvas rendering).
 */
export function getPacketColor(frame) {
  if (!frame) return '#888';
  if (frame.etherType === ETHER_TYPE.ARP) return '#fbbf24'; // yellow
  if (frame.etherType === ETHER_TYPE.IPv4 && frame.payload?.ipProtocol === 'ICMP') {
    const icmp = frame.payload.payload;
    if (icmp.icmpType === ICMP_TYPE.ECHO_REQUEST) return '#3b82f6'; // blue
    if (icmp.icmpType === ICMP_TYPE.ECHO_REPLY) return '#22c55e'; // green
    return '#ef4444'; // red for errors
  }
  return '#888';
}
