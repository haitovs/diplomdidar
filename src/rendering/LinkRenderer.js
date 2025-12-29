/**
 * Enhanced Link Renderer
 * Professional network connection visualization with traffic flow and bandwidth indicators
 */

// Link type configurations
export const LINK_CONFIG = {
  fiber: {
    width: 4,
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#6366f1'],
    dash: [],
    label: 'Fiber',
  },
  ethernet: {
    width: 3,
    color: '#22c55e',
    gradient: ['#22c55e', '#14b8a6'],
    dash: [],
    label: 'Ethernet',
  },
  wireless: {
    width: 2,
    color: '#0ea5e9',
    gradient: ['#0ea5e9', '#06b6d4'],
    dash: [10, 6],
    label: 'Wireless',
  },
  wan: {
    width: 3,
    color: '#f59e0b',
    gradient: ['#f59e0b', '#f97316'],
    dash: [15, 5],
    label: 'WAN',
  },
  vpn: {
    width: 2,
    color: '#ef4444',
    gradient: ['#ef4444', '#dc2626'],
    dash: [5, 5],
    label: 'VPN Tunnel',
  },
};

// Link health status
export const LINK_STATUS = {
  up: { color: '#22c55e', opacity: 1.0 },
  degraded: { color: '#eab308', opacity: 0.8 },
  lossy: { color: '#f59e0b', opacity: 0.6 },
  down: { color: '#ef4444', opacity: 0.3 },
};

/**
 * Enhanced Link Renderer Class
 */
export class LinkRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.frame = 0;
  }

  /**
   * Update frame counter for animations
   */
  tick() {
    this.frame++;
  }

  /**
   * Render a single link with all effects
   * @param {Object} link - Link data
   * @param {Object} source - Source node
   * @param {Object} target - Target node
   * @param {Object} control - Control point for curve
   * @param {Object} health - Link health status
   * @param {boolean} isSelected - Whether link is selected
   */
  render(link, source, target, control, health = { status: 'up', flow: 1 }, isSelected = false) {
    if (!source || !target) return;

    const config = LINK_CONFIG[link.type] || LINK_CONFIG.ethernet;
    const statusConfig = LINK_STATUS[health.status] || LINK_STATUS.up;

    // Draw link shadow/glow for selected
    if (isSelected) {
      this.drawSelectionGlow(source, target, control);
    }

    // Draw main link line
    this.drawLink(source, target, control, config, statusConfig, health);

    // Draw traffic direction arrows
    if (health.status !== 'down') {
      this.drawTrafficArrows(source, target, control, config.color, health.flow);
    }

    // Draw bandwidth indicator
    if (link.bandwidth) {
      this.drawBandwidthLabel(source, target, control, link.bandwidth, health.status);
    }

    // Draw latency indicator if high
    if (link.latency && link.latency > 10) {
      this.drawLatencyIndicator(source, target, control, link.latency);
    }
  }

  /**
   * Draw selection glow effect
   */
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

  /**
   * Draw main link line with gradient and status
   */
  drawLink(source, target, control, config, statusConfig, health) {
    // Create gradient along the link
    const gradient = this.ctx.createLinearGradient(source.x, source.y, target.x, target.y);
    gradient.addColorStop(0, config.gradient[0]);
    gradient.addColorStop(1, config.gradient[1]);

    // Apply status opacity
    this.ctx.globalAlpha = statusConfig.opacity;

    // Draw main line
    this.ctx.strokeStyle = health.status === 'down' ? statusConfig.color : gradient;
    this.ctx.lineWidth = config.width;
    
    // Set dash pattern
    if (config.dash.length > 0 || health.status === 'lossy') {
      const dash = health.status === 'lossy' ? [8, 4] : config.dash;
      this.ctx.setLineDash(dash);
      this.ctx.lineDashOffset = -(this.frame * 0.5) % 20;
    } else {
      this.ctx.setLineDash([]);
    }

    this.ctx.beginPath();
    this.ctx.moveTo(source.x, source.y);
    this.ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
    this.ctx.stroke();

    // Reset
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;

    // Draw down X indicator
    if (health.status === 'down') {
      this.drawDownIndicator(source, target, control);
    }
  }

  /**
   * Draw X for down link
   */
  drawDownIndicator(source, target, control) {
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
   * Draw animated traffic direction arrows
   */
  drawTrafficArrows(source, target, control, color, flow) {
    const numArrows = Math.max(2, Math.round(flow * 4));
    const progress = (this.frame * 0.01 * flow) % 1;

    for (let i = 0; i < numArrows; i++) {
      const t = (progress + i / numArrows) % 1;
      const pos = this.getQuadraticPoint(source, control, target, t);
      const nextPos = this.getQuadraticPoint(source, control, target, Math.min(t + 0.05, 1));
      
      const angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);
      
      this.ctx.save();
      this.ctx.translate(pos.x, pos.y);
      this.ctx.rotate(angle);
      
      // Draw arrow
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.6 + (1 - Math.abs(t - 0.5) * 2) * 0.4;
      this.ctx.beginPath();
      this.ctx.moveTo(6, 0);
      this.ctx.lineTo(-4, -4);
      this.ctx.lineTo(-4, 4);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw bandwidth label
   */
  drawBandwidthLabel(source, target, control, bandwidth, status) {
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2 - 15;

    // Background pill
    const text = `${bandwidth} Mbps`;
    this.ctx.font = '10px Inter';
    const textWidth = this.ctx.measureText(text).width;
    
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.roundRect(midX - textWidth / 2 - 6, midY - 8, textWidth + 12, 16, 4);
    this.ctx.fill();

    // Text
    const textColor = status === 'down' ? '#ef4444' : status === 'lossy' ? '#f59e0b' : '#94a3b8';
    this.ctx.fillStyle = textColor;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, midX, midY);
  }

  /**
   * Draw latency warning indicator
   */
  drawLatencyIndicator(source, target, control, latency) {
    const midX = (source.x + 2 * control.x + target.x) / 4;
    const midY = (source.y + 2 * control.y + target.y) / 4;

    // Warning icon
    this.ctx.fillStyle = latency > 50 ? '#ef4444' : '#f59e0b';
    this.ctx.font = 'bold 12px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${latency}ms`, midX, midY + 20);
  }

  /**
   * Get point on quadratic bezier curve
   */
  getQuadraticPoint(p0, p1, p2, t) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  }

  /**
   * Helper to draw rounded rectangle
   */
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
