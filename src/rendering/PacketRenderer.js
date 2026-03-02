/**
 * Packet Renderer
 * Renders colored envelope rectangles moving along links with smooth easing.
 */

/** Ease-in-out cubic for smooth acceleration/deceleration */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class PacketRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.packets = []; // { id, fromNodeId, toNodeId, linkId, progress, color, label }
    this.nodeMap = new Map();
    this.frame = 0;
  }

  /**
   * Update active packets from simulation engine.
   */
  setPackets(packets) {
    this.packets = packets || [];
  }

  /**
   * Set node map for position lookups.
   */
  setNodeMap(nodeMap) {
    this.nodeMap = nodeMap;
  }

  /**
   * Animate packets (increment progress).
   */
  update(dt) {
    this.frame++;
    for (const packet of this.packets) {
      packet.progress = Math.min(1, packet.progress + dt * 0.055);
    }
  }

  /**
   * Render all active packets.
   */
  render() {
    for (const packet of this.packets) {
      this.renderPacket(packet);
    }
  }

  /**
   * Render a single packet envelope.
   */
  renderPacket(packet) {
    const fromNode = this.nodeMap.get(packet.fromNodeId);
    const toNode = this.nodeMap.get(packet.toNodeId);
    if (!fromNode || !toNode) return;

    // Apply easing to the linear progress for smooth motion
    const t = easeInOutCubic(packet.progress);
    const x = fromNode.x + (toNode.x - fromNode.x) * t;
    const y = fromNode.y + (toNode.y - fromNode.y) * t;

    // Slight vertical bob for liveliness
    const bob = Math.sin(packet.progress * Math.PI) * 4;

    const width = 36;
    const height = 18;
    const drawY = y + bob;

    // Envelope shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.fillRect(x - width / 2 + 2, drawY - height / 2 + 3, width, height);

    // Glow around the packet
    this.ctx.save();
    this.ctx.shadowColor = packet.color || '#3b82f6';
    this.ctx.shadowBlur = 10;

    // Envelope body
    this.ctx.fillStyle = packet.color || '#3b82f6';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(x - width / 2, drawY - height / 2, width, height, 4);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();

    // Envelope flap (triangle)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x - width / 2, drawY - height / 2);
    this.ctx.lineTo(x, drawY - 2);
    this.ctx.lineTo(x + width / 2, drawY - height / 2);
    this.ctx.closePath();
    this.ctx.fill();

    // Label
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 8px Inter, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(packet.label || '?', x, drawY + 1);
  }

  clear() {
    this.packets = [];
  }
}
