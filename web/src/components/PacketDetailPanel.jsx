import { useState } from 'react';
import { ETHER_TYPE, ARP_OP, ICMP_TYPE } from '@core/network/PacketFactory.js';

export default function PacketDetailPanel({ frame }) {
  const [expanded, setExpanded] = useState({ l2: true, l3: true, l4: true });

  if (!frame) {
    return (
      <div className="packet-detail">
        <div className="packet-detail-empty">Select an event to inspect packet layers.</div>
      </div>
    );
  }

  const toggle = (layer) => setExpanded(s => ({ ...s, [layer]: !s[layer] }));

  return (
    <div className="packet-detail">
      {/* Layer 2 - Ethernet */}
      <div className="packet-layer">
        <div className="layer-header" onClick={() => toggle('l2')}>
          <span className="layer-badge l2">L2</span>
          <span>Ethernet II</span>
          <span className="layer-toggle">{expanded.l2 ? '▼' : '▶'}</span>
        </div>
        {expanded.l2 && (
          <div className="layer-body">
            <div className="layer-field"><span>Source MAC</span><code>{frame.srcMac}</code></div>
            <div className="layer-field"><span>Dest MAC</span><code>{frame.dstMac}</code></div>
            <div className="layer-field"><span>EtherType</span><code>{formatEtherType(frame.etherType)}</code></div>
          </div>
        )}
      </div>

      {/* Layer 3 */}
      {frame.payload && (
        <div className="packet-layer">
          <div className="layer-header" onClick={() => toggle('l3')}>
            <span className="layer-badge l3">L3</span>
            <span>{frame.etherType === ETHER_TYPE.ARP ? 'ARP' : 'IPv4'}</span>
            <span className="layer-toggle">{expanded.l3 ? '▼' : '▶'}</span>
          </div>
          {expanded.l3 && (
            <div className="layer-body">
              {frame.etherType === ETHER_TYPE.ARP ? renderArp(frame.payload) : renderIpv4(frame.payload)}
            </div>
          )}
        </div>
      )}

      {/* Layer 4 - ICMP */}
      {frame.payload?.payload && frame.payload.ipProtocol === 'ICMP' && (
        <div className="packet-layer">
          <div className="layer-header" onClick={() => toggle('l4')}>
            <span className="layer-badge l4">L4</span>
            <span>ICMP</span>
            <span className="layer-toggle">{expanded.l4 ? '▼' : '▶'}</span>
          </div>
          {expanded.l4 && (
            <div className="layer-body">
              {renderIcmp(frame.payload.payload)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatEtherType(type) {
  if (type === ETHER_TYPE.ARP) return '0x0806 (ARP)';
  if (type === ETHER_TYPE.IPv4) return '0x0800 (IPv4)';
  return `0x${type?.toString(16) || '????'}`;
}

function renderArp(arp) {
  return (
    <>
      <div className="layer-field"><span>Operation</span><code>{arp.operation === ARP_OP.REQUEST ? 'Request (1)' : 'Reply (2)'}</code></div>
      <div className="layer-field"><span>Sender MAC</span><code>{arp.senderMac}</code></div>
      <div className="layer-field"><span>Sender IP</span><code>{arp.senderIp}</code></div>
      <div className="layer-field"><span>Target MAC</span><code>{arp.targetMac}</code></div>
      <div className="layer-field"><span>Target IP</span><code>{arp.targetIp}</code></div>
    </>
  );
}

function renderIpv4(ip) {
  return (
    <>
      <div className="layer-field"><span>Source IP</span><code>{ip.srcIp}</code></div>
      <div className="layer-field"><span>Dest IP</span><code>{ip.dstIp}</code></div>
      <div className="layer-field"><span>TTL</span><code>{ip.ttl}</code></div>
      <div className="layer-field"><span>Protocol</span><code>{ip.ipProtocol}</code></div>
    </>
  );
}

function renderIcmp(icmp) {
  const typeNames = {
    [ICMP_TYPE.ECHO_REQUEST]: 'Echo Request (8)',
    [ICMP_TYPE.ECHO_REPLY]: 'Echo Reply (0)',
    [ICMP_TYPE.DEST_UNREACHABLE]: 'Dest Unreachable (3)',
    [ICMP_TYPE.TIME_EXCEEDED]: 'Time Exceeded (11)',
  };
  return (
    <>
      <div className="layer-field"><span>Type</span><code>{typeNames[icmp.icmpType] || icmp.icmpType}</code></div>
      <div className="layer-field"><span>Code</span><code>{icmp.icmpCode}</code></div>
      <div className="layer-field"><span>Sequence</span><code>{icmp.sequence}</code></div>
      <div className="layer-field"><span>Identifier</span><code>{icmp.identifier}</code></div>
    </>
  );
}
