/**
 * Enhanced Node Renderer
 * Network device visualization with interface ports.
 */

function isLightTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

// Device configuration with icons, colors, and rendering properties
export const DEVICE_CONFIG = {
  router: {
    icon: 'router',
    label: 'Router',
    color: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.6)',
    radius: 32,
    category: 'core',
  },
  coreRouter: {
    icon: 'router',
    label: 'Core Router',
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    radius: 36,
    category: 'core',
  },
  switch: {
    icon: 'switch',
    label: 'Switch',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.6)',
    radius: 28,
    category: 'access',
  },
  firewall: {
    icon: 'firewall',
    label: 'Firewall',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    radius: 30,
    category: 'security',
  },
  server: {
    icon: 'server',
    label: 'Server',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    radius: 28,
    category: 'server',
  },
  accessPoint: {
    icon: 'wifi',
    label: 'Access Point',
    color: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.6)',
    radius: 26,
    category: 'access',
  },
  iot: {
    icon: 'sensor',
    label: 'IoT Sensor',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    radius: 22,
    category: 'endpoint',
  },
  pc: {
    icon: 'pc',
    label: 'Workstation',
    color: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.6)',
    radius: 24,
    category: 'endpoint',
  },
  cloud: {
    icon: 'cloud',
    label: 'Cloud',
    color: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.6)',
    radius: 34,
    category: 'cloud',
  },
  internet: {
    icon: 'globe',
    label: 'Internet',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    radius: 36,
    category: 'cloud',
  },
  lab: {
    icon: 'lab',
    label: 'Lab',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    radius: 30,
    category: 'server',
  },
};

export const STATUS_CONFIG = {
  up: { color: '#22c55e', pulseSpeed: 0 },
  down: { color: '#6b7280', pulseSpeed: 0 },
  healthy: { color: '#22c55e', pulseSpeed: 0 },
  warning: { color: '#f59e0b', pulseSpeed: 2000 },
  critical: { color: '#ef4444', pulseSpeed: 800 },
  degraded: { color: '#eab308', pulseSpeed: 3000 },
  offline: { color: '#6b7280', pulseSpeed: 0 },
};

/**
 * Node Renderer Class
 */
export class NodeRenderer {
  constructor(ctx, iconCache) {
    this.ctx = ctx;
    this.iconCache = iconCache;
    this.frame = 0;
  }

  tick() {
    this.frame++;
  }

  render(node, isSelected = false, isHovered = false, isPduSource = false) {
    const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
    const statusConfig = STATUS_CONFIG[node.status] || STATUS_CONFIG.up;
    const x = node.x;
    const y = node.y;
    const radius = config.radius;

    // Draw outer glow
    this.drawGlow(x, y, radius, config.glowColor);

    // Draw PDU source ring
    if (isPduSource) {
      this.drawPduSourceRing(x, y, radius);
    }

    // Draw selection ring
    if (isSelected) {
      this.drawSelectionRing(x, y, radius);
    }

    // Draw hover effect
    if (isHovered && !isSelected) {
      this.drawHoverEffect(x, y, radius);
    }

    // Draw base circle
    this.drawBase(x, y, radius, config.color, statusConfig.color);

    // Draw icon
    this.drawIcon(x, y, radius, node.icon || config.icon);

    // Draw interface ports
    if (node.interfaces) {
      this.drawInterfacePorts(x, y, radius, node.interfaces);
    }

    // Draw status dot
    this.drawStatusDot(x, y, radius, statusConfig.color);

    // Draw hostname label
    this.drawLabel(x, y, radius, node.hostname || node.label);
  }

  drawGlow(x, y, radius, glowColor) {
    const glowRadius = radius + 15;
    const gradient = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawSelectionRing(x, y, radius) {
    const dashOffset = (this.frame * 0.5) % 20;
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 4]);
    this.ctx.lineDashOffset = dashOffset;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawHoverEffect(x, y, radius) {
    this.ctx.strokeStyle = isLightTheme() ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  drawBase(x, y, radius, color, statusColor) {
    this.ctx.fillStyle = isLightTheme() ? '#f1f5f9' : '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    const gradient = this.ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, statusColor);
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  drawIcon(x, y, radius, iconKey) {
    const icon = this.iconCache?.get(iconKey + '.svg') || this.iconCache?.get(iconKey);
    if (icon && icon.complete && icon.naturalWidth > 0) {
      const size = radius * 1.2;
      this.ctx.drawImage(icon, x - size / 2, y - size / 2, size, size);
    } else {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.font = `${radius * 0.6}px Inter`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(iconKey.charAt(0).toUpperCase(), x, y);
    }
  }

  /**
   * Draw interface port dots around the node circle.
   */
  drawInterfacePorts(x, y, radius, interfaces) {
    const portRadius = 4;
    const portDist = radius + 3;
    const count = interfaces.length;
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const angle = (-Math.PI / 2) + (i / count) * Math.PI * 2;
      const px = x + Math.cos(angle) * portDist;
      const py = y + Math.sin(angle) * portDist;

      const iface = interfaces[i];
      let color;
      if (iface.status === 'down') {
        color = '#ef4444'; // red
      } else if (iface.connectedLinkId) {
        color = '#22c55e'; // green
      } else {
        color = '#4b5563'; // gray
      }

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(px, py, portRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  drawStatusDot(x, y, radius, color) {
    const dotX = x + radius * 0.7;
    const dotY = y - radius * 0.7;

    const gradient = this.ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw hostname label below the node with pill background.
   */
  drawLabel(x, y, radius, hostname) {
    const text = hostname || 'Unknown';
    this.ctx.font = '12px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const metrics = this.ctx.measureText(text);
    const tw = metrics.width;
    const th = 18;
    const ty = y + radius + 16;

    const light = isLightTheme();
    // Pill background
    this.ctx.fillStyle = light ? 'rgba(255, 255, 255, 0.92)' : 'rgba(10, 15, 30, 0.85)';
    this.ctx.beginPath();
    const px = x - tw / 2 - 6;
    const py = ty - th / 2;
    const pw = tw + 12;
    const pr = 5;
    this.ctx.moveTo(px + pr, py);
    this.ctx.lineTo(px + pw - pr, py);
    this.ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr);
    this.ctx.lineTo(px + pw, py + th - pr);
    this.ctx.quadraticCurveTo(px + pw, py + th, px + pw - pr, py + th);
    this.ctx.lineTo(px + pr, py + th);
    this.ctx.quadraticCurveTo(px, py + th, px, py + th - pr);
    this.ctx.lineTo(px, py + pr);
    this.ctx.quadraticCurveTo(px, py, px + pr, py);
    this.ctx.closePath();
    this.ctx.fill();

    // Border
    this.ctx.strokeStyle = light ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Text
    this.ctx.fillStyle = light ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.85)';
    this.ctx.fillText(text, x, ty);
  }

  /**
   * Draw animated green dashed ring for PDU source selection.
   */
  drawPduSourceRing(x, y, radius) {
    const dashOffset = (this.frame * 0.8) % 20;
    this.ctx.strokeStyle = '#22c55e';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([6, 4]);
    this.ctx.lineDashOffset = dashOffset;

    // Pulsing radius
    const pulse = 1 + Math.sin(this.frame * 0.06) * 0.06;
    this.ctx.beginPath();
    this.ctx.arc(x, y, (radius + 12) * pulse, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
}
