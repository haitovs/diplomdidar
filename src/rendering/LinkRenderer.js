/**
 * Enhanced Link Renderer
 * Network connection visualization with interface labels.
 */

export const LINK_CONFIG = {
  fiber: { width: 4, color: '#8b5cf6', gradient: ['#8b5cf6', '#6366f1'], dash: [], label: 'Fiber' },
  ethernet: { width: 3, color: '#22c55e', gradient: ['#22c55e', '#14b8a6'], dash: [], label: 'Ethernet' },
  wireless: { width: 2, color: '#0ea5e9', gradient: ['#0ea5e9', '#06b6d4'], dash: [10, 6], label: 'Wireless' },
  wan: { width: 3, color: '#f59e0b', gradient: ['#f59e0b', '#f97316'], dash: [15, 5], label: 'WAN' },
  vpn: { width: 2, color: '#ef4444', gradient: ['#ef4444', '#dc2626'], dash: [5, 5], label: 'VPN Tunnel' },
};

export const LINK_STATUS = {
  up: { color: '#22c55e', opacity: 1.0 },
  degraded: { color: '#eab308', opacity: 0.8 },
  down: { color: '#ef4444', opacity: 0.3 },
};

export class LinkRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.frame = 0;
  }

  tick() {
    this.frame++;
  }

  render(link, source, target, control, health = { status: 'up' }, isSelected = false) {
    if (!source || !target) return;

    const config = LINK_CONFIG[link.type] || LINK_CONFIG.ethernet;
    const statusConfig = LINK_STATUS[health.status] || LINK_STATUS.up;

    if (isSelected) {
      this.drawSelectionGlow(source, target, control);
    }

    this.drawLink(source, target, control, config, statusConfig, health);

    // Draw interface labels near endpoints
    if (link.sourceInterface || link.targetInterface) {
      this.drawInterfaceLabels(source, target, control, link);
    }

    // Draw bandwidth label
    if (link.bandwidth) {
      this.drawBandwidthLabel(source, target, control, link.bandwidth, health.status);
    }
  }

  drawSelectionGlow(source, target, control) {
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    this.ctx.lineWidth = 12;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(source.x, source.y);
    this.ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
    this.ctx.stroke();
    this.ctx.lineCap = 'butt';
  }

  drawLink(source, target, control, config, statusConfig, health) {
    const gradient = this.ctx.createLinearGradient(source.x, source.y, target.x, target.y);
    gradient.addColorStop(0, config.gradient[0]);
    gradient.addColorStop(1, config.gradient[1]);

    this.ctx.globalAlpha = statusConfig.opacity;
    this.ctx.strokeStyle = health.status === 'down' ? statusConfig.color : gradient;
    this.ctx.lineWidth = config.width;

    if (config.dash.length > 0) {
      this.ctx.setLineDash(config.dash);
      this.ctx.lineDashOffset = -(this.frame * 0.5) % 20;
    } else {
      this.ctx.setLineDash([]);
    }

    this.ctx.beginPath();
    this.ctx.moveTo(source.x, source.y);
    this.ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;

    if (health.status === 'down') {
      this.drawDownIndicator(source, target);
    }
  }

  drawDownIndicator(source, target) {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const size = 10;

    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(midX - size, midY - size);
    this.ctx.lineTo(midX + size, midY + size);
    this.ctx.moveTo(midX + size, midY - size);
    this.ctx.lineTo(midX - size, midY + size);
    this.ctx.stroke();
    this.ctx.lineCap = 'butt';
  }

  /**
   * Draw interface short names near each endpoint.
   */
  drawInterfaceLabels(source, target, control, link) {
    this.ctx.font = '9px Inter, monospace';
    this.ctx.textBaseline = 'middle';

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 80) return; // Too close, skip labels

    const nx = dx / len;
    const ny = dy / len;
    const perpX = -ny;
    const perpY = nx;
    const offset = 12;
    const dist = 40;

    // Source interface label
    if (link.sourceInterface) {
      const sx = source.x + nx * dist + perpX * offset;
      const sy = source.y + ny * dist + perpY * offset;
      const shortName = abbreviateInterface(link.sourceInterface);
      this.ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      this.ctx.textAlign = dx > 0 ? 'left' : 'right';
      this.ctx.fillText(shortName, sx, sy);
    }

    // Target interface label
    if (link.targetInterface) {
      const tx = target.x - nx * dist + perpX * offset;
      const ty = target.y - ny * dist + perpY * offset;
      const shortName = abbreviateInterface(link.targetInterface);
      this.ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      this.ctx.textAlign = dx > 0 ? 'right' : 'left';
      this.ctx.fillText(shortName, tx, ty);
    }
  }

  drawBandwidthLabel(source, target, control, bandwidth, status) {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2 - 15;

    const text = `${bandwidth} Mbps`;
    this.ctx.font = '10px Inter';
    const textWidth = this.ctx.measureText(text).width;

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.roundRect(midX - textWidth / 2 - 6, midY - 8, textWidth + 12, 16, 4);
    this.ctx.fill();

    const textColor = status === 'down' ? '#ef4444' : '#94a3b8';
    this.ctx.fillStyle = textColor;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, midX, midY);
  }

  getQuadraticPoint(p0, p1, p2, t) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  }

  roundRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}

function abbreviateInterface(name) {
  return name
    .replace('GigabitEthernet', 'Gig')
    .replace('FastEthernet', 'Fa')
    .replace('Wireless', 'Wlan');
}
