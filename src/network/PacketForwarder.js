/**
 * Packet Forwarder
 * Per-device-type forwarding logic: switch, router, endpoint.
 */

import { isRouterType, isSwitchType, isEndpointType } from './InterfaceManager.js';
import {
  ETHER_TYPE, ARP_OP, ICMP_TYPE, BROADCAST_MAC,
  createArpReply, createPingReply, createEthernetFrame, createIPv4Packet, createIcmpPacket,
} from './PacketFactory.js';
import { isSameSubnet } from './RoutingTable.js';

/**
 * Process a frame arriving at a device.
 * Returns an array of { frame, outInterface, nextNodeId, drop, reason, info } objects.
 */
export function forwardPacket(frame, inInterface, device, networkStack) {
  const deviceType = device.type;

  if (isSwitchType(deviceType)) {
    return switchForward(frame, inInterface, device, networkStack);
  }
  if (isRouterType(deviceType)) {
    return routerForward(frame, inInterface, device, networkStack);
  }
  return endpointForward(frame, inInterface, device, networkStack);
}

/**
 * Switch forwarding: learn source MAC, lookup dest MAC or flood.
 */
function switchForward(frame, inInterface, device, networkStack) {
  const macTable = networkStack.getMacTable(device.id);
  const results = [];

  // Learn source MAC on ingress port
  macTable.learn(frame.srcMac, inInterface);

  // If broadcast, flood to all ports except ingress
  if (frame.dstMac === BROADCAST_MAC) {
    const connectedInterfaces = device.interfaces.filter(
      iface => iface.connectedLinkId && iface.name !== inInterface && iface.status !== 'down'
    );
    for (const iface of connectedInterfaces) {
      const link = networkStack.getLinkById(iface.connectedLinkId);
      if (!link) continue;
      const nextNodeId = link.source === device.id ? link.target : link.source;
      results.push({
        frame: { ...frame },
        outInterface: iface.name,
        nextNodeId,
        info: `Switch ${device.hostname}: flooding on ${iface.shortName}`,
      });
    }
    return results;
  }

  // Lookup destination MAC
  const outPort = macTable.lookup(frame.dstMac);
  if (outPort) {
    const outIface = device.interfaces.find(i => i.name === outPort);
    if (outIface && outIface.connectedLinkId) {
      const link = networkStack.getLinkById(outIface.connectedLinkId);
      if (link) {
        const nextNodeId = link.source === device.id ? link.target : link.source;
        results.push({
          frame,
          outInterface: outPort,
          nextNodeId,
          info: `Switch ${device.hostname}: forwarding to ${outIface.shortName}`,
        });
        return results;
      }
    }
  }

  // Unknown unicast: flood
  const connectedInterfaces = device.interfaces.filter(
    iface => iface.connectedLinkId && iface.name !== inInterface && iface.status !== 'down'
  );
  for (const iface of connectedInterfaces) {
    const link = networkStack.getLinkById(iface.connectedLinkId);
    if (!link) continue;
    const nextNodeId = link.source === device.id ? link.target : link.source;
    results.push({
      frame: { ...frame },
      outInterface: iface.name,
      nextNodeId,
      info: `Switch ${device.hostname}: unknown dest, flooding on ${iface.shortName}`,
    });
  }
  return results;
}

/**
 * Router forwarding: ARP handling, IP routing, TTL decrement.
 */
function routerForward(frame, inInterface, device, networkStack) {
  const arpTable = networkStack.getArpTable(device.id);
  const routingTable = networkStack.getRoutingTable(device.id);
  const results = [];

  // Find the interface this came in on
  const inIface = device.interfaces.find(i => i.name === inInterface);

  // Handle ARP
  if (frame.etherType === ETHER_TYPE.ARP) {
    const arp = frame.payload;
    // Learn sender
    arpTable.add(arp.senderIp, arp.senderMac, inInterface);

    if (arp.operation === ARP_OP.REQUEST) {
      // Check if ARP is for one of our interfaces
      const targetIface = device.interfaces.find(i => i.ipAddress === arp.targetIp);
      if (targetIface) {
        const reply = createArpReply(targetIface.mac, targetIface.ipAddress, arp.senderMac, arp.senderIp);
        // Send reply back on the same interface
        if (inIface && inIface.connectedLinkId) {
          const link = networkStack.getLinkById(inIface.connectedLinkId);
          if (link) {
            const nextNodeId = link.source === device.id ? link.target : link.source;
            results.push({
              frame: reply,
              outInterface: inInterface,
              nextNodeId,
              info: `Router ${device.hostname}: ARP reply for ${arp.targetIp}`,
            });
          }
        }
      }
      // Else: ignore ARP not for us
    } else if (arp.operation === ARP_OP.REPLY) {
      // ARP reply learned above, check if we have pending packets
      // (handled by the simulation engine via pendingArp)
    }
    return results;
  }

  // Handle IPv4
  if (frame.etherType === ETHER_TYPE.IPv4) {
    const ipPacket = frame.payload;

    // Check if destined for this router (any of our interfaces)
    const localIface = device.interfaces.find(i => i.ipAddress === ipPacket.dstIp);
    if (localIface) {
      // Local delivery
      if (ipPacket.ipProtocol === 'ICMP') {
        const icmp = ipPacket.payload;
        if (icmp.icmpType === ICMP_TYPE.ECHO_REQUEST) {
          // Reply to ping
          const reply = createPingReply(localIface.mac, frame.srcMac, localIface.ipAddress, ipPacket.srcIp, icmp.sequence);
          if (inIface && inIface.connectedLinkId) {
            const link = networkStack.getLinkById(inIface.connectedLinkId);
            if (link) {
              const nextNodeId = link.source === device.id ? link.target : link.source;
              results.push({
                frame: reply,
                outInterface: inInterface,
                nextNodeId,
                info: `Router ${device.hostname}: ICMP echo reply to ${ipPacket.srcIp}`,
              });
            }
          }
        }
      }
      return results;
    }

    // TTL check
    if (ipPacket.ttl <= 1) {
      // Send ICMP Time Exceeded back
      if (inIface) {
        const icmp = createIcmpPacket(ICMP_TYPE.TIME_EXCEEDED, 0, 0, 0);
        const icmpIp = createIPv4Packet(inIface.ipAddress, ipPacket.srcIp, 64, 'ICMP', icmp);
        const icmpFrame = createEthernetFrame(inIface.mac, frame.srcMac, ETHER_TYPE.IPv4, icmpIp);
        if (inIface.connectedLinkId) {
          const link = networkStack.getLinkById(inIface.connectedLinkId);
          if (link) {
            const nextNodeId = link.source === device.id ? link.target : link.source;
            results.push({
              frame: icmpFrame,
              outInterface: inInterface,
              nextNodeId,
              info: `Router ${device.hostname}: TTL exceeded, notifying ${ipPacket.srcIp}`,
            });
          }
        }
      }
      results.push({ drop: true, reason: 'TTL expired', info: `Router ${device.hostname}: packet dropped, TTL=0` });
      return results;
    }

    // Route lookup
    const route = routingTable.lookup(ipPacket.dstIp);
    if (!route) {
      // No route - send ICMP Destination Unreachable
      if (inIface) {
        const icmp = createIcmpPacket(ICMP_TYPE.DEST_UNREACHABLE, 0, 0, 0);
        const icmpIp = createIPv4Packet(inIface.ipAddress, ipPacket.srcIp, 64, 'ICMP', icmp);
        const icmpFrame = createEthernetFrame(inIface.mac, frame.srcMac, ETHER_TYPE.IPv4, icmpIp);
        if (inIface.connectedLinkId) {
          const link = networkStack.getLinkById(inIface.connectedLinkId);
          if (link) {
            const nextNodeId = link.source === device.id ? link.target : link.source;
            results.push({
              frame: icmpFrame,
              outInterface: inInterface,
              nextNodeId,
              info: `Router ${device.hostname}: no route, dest unreachable for ${ipPacket.dstIp}`,
            });
          }
        }
      }
      results.push({ drop: true, reason: 'No route', info: `Router ${device.hostname}: no route to ${ipPacket.dstIp}` });
      return results;
    }

    // Determine outgoing interface and next-hop
    let outIfaceName = route.iface;
    let nextHopIp = route.nextHop || ipPacket.dstIp;

    // For connected routes, the next-hop is the destination itself
    if (route.type === 'connected') {
      nextHopIp = ipPacket.dstIp;
      outIfaceName = route.iface;
    }

    // If we have a next-hop but no interface, find the interface
    if (!outIfaceName && route.nextHop) {
      const nhRoute = routingTable.lookup(route.nextHop);
      if (nhRoute && nhRoute.iface) outIfaceName = nhRoute.iface;
    }

    const outIface = device.interfaces.find(i => i.name === outIfaceName);
    if (!outIface || !outIface.connectedLinkId) {
      results.push({ drop: true, reason: 'Output interface down', info: `Router ${device.hostname}: output interface not connected` });
      return results;
    }

    // Check ARP for next-hop MAC
    const nextHopMac = arpTable.lookup(nextHopIp);
    if (!nextHopMac) {
      // Need ARP resolution - return a special result
      results.push({
        needsArp: true,
        arpTargetIp: nextHopIp,
        outInterface: outIfaceName,
        originalFrame: frame,
        ttlDecremented: true,
        info: `Router ${device.hostname}: ARP needed for ${nextHopIp}`,
      });
      return results;
    }

    // Decrement TTL and re-encapsulate
    const newIpPacket = { ...ipPacket, ttl: ipPacket.ttl - 1 };
    const newFrame = createEthernetFrame(outIface.mac, nextHopMac, ETHER_TYPE.IPv4, newIpPacket);

    const link = networkStack.getLinkById(outIface.connectedLinkId);
    if (link) {
      const nextNodeId = link.source === device.id ? link.target : link.source;
      results.push({
        frame: newFrame,
        outInterface: outIfaceName,
        nextNodeId,
        info: `Router ${device.hostname}: forwarding to ${nextHopIp} via ${outIface.shortName}`,
      });
    }
  }

  return results;
}

/**
 * Endpoint forwarding: respond to ARP, respond to ICMP echo.
 */
function endpointForward(frame, inInterface, device, networkStack) {
  const arpTable = networkStack.getArpTable(device.id);
  const results = [];
  const inIface = device.interfaces.find(i => i.name === inInterface);

  // Handle ARP
  if (frame.etherType === ETHER_TYPE.ARP) {
    const arp = frame.payload;
    arpTable.add(arp.senderIp, arp.senderMac, inInterface);

    if (arp.operation === ARP_OP.REQUEST) {
      // Check if ARP is for our IP
      const targetIface = device.interfaces.find(i => i.ipAddress === arp.targetIp);
      if (targetIface) {
        const reply = createArpReply(targetIface.mac, targetIface.ipAddress, arp.senderMac, arp.senderIp);
        if (inIface && inIface.connectedLinkId) {
          const link = networkStack.getLinkById(inIface.connectedLinkId);
          if (link) {
            const nextNodeId = link.source === device.id ? link.target : link.source;
            results.push({
              frame: reply,
              outInterface: inInterface,
              nextNodeId,
              info: `${device.hostname}: ARP reply for ${arp.targetIp}`,
            });
          }
        }
      }
    }
    return results;
  }

  // Handle IPv4
  if (frame.etherType === ETHER_TYPE.IPv4) {
    const ipPacket = frame.payload;
    const localIface = device.interfaces.find(i => i.ipAddress === ipPacket.dstIp);

    if (localIface && ipPacket.ipProtocol === 'ICMP') {
      const icmp = ipPacket.payload;
      if (icmp.icmpType === ICMP_TYPE.ECHO_REQUEST) {
        // Reply to ping
        const reply = createPingReply(localIface.mac, frame.srcMac, localIface.ipAddress, ipPacket.srcIp, icmp.sequence);
        if (inIface && inIface.connectedLinkId) {
          const link = networkStack.getLinkById(inIface.connectedLinkId);
          if (link) {
            const nextNodeId = link.source === device.id ? link.target : link.source;
            results.push({
              frame: reply,
              outInterface: inInterface,
              nextNodeId,
              info: `${device.hostname}: ICMP echo reply to ${ipPacket.srcIp}`,
            });
          }
        }
      }
      if (icmp.icmpType === ICMP_TYPE.ECHO_REPLY) {
        // Ping reply received - mark as delivered
        results.push({
          delivered: true,
          info: `${device.hostname}: received ping reply from ${ipPacket.srcIp} seq=${icmp.sequence}`,
        });
      }
      if (icmp.icmpType === ICMP_TYPE.DEST_UNREACHABLE) {
        results.push({
          delivered: true,
          info: `${device.hostname}: destination unreachable from ${ipPacket.srcIp}`,
        });
      }
      if (icmp.icmpType === ICMP_TYPE.TIME_EXCEEDED) {
        results.push({
          delivered: true,
          info: `${device.hostname}: TTL exceeded from ${ipPacket.srcIp}`,
        });
      }
    }
  }

  return results;
}
