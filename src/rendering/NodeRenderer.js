/**
 * Enhanced Node Renderer
 * Professional-grade network device visualization with glow effects and state indicators
 */

// Device configuration with icons, colors, and rendering properties
export const DEVICE_CONFIG = {
  // Core network devices
  router: {
    icon: 'router',
    label: 'Router',
    color: '#6366f1', // Indigo
    glowColor: 'rgba(99, 102, 241, 0.6)',
    radius: 32,
    category: 'core',
  },
  coreRouter: {
    icon: 'router',
    label: 'Core Router',
    color: '#8b5cf6', // Purple
    glowColor: 'rgba(139, 92, 246, 0.6)',
    radius: 36,
    category: 'core',
  },
  switch: {
    icon: 'switch',
    label: 'Switch',
    color: '#22c55e', // Green
    glowColor: 'rgba(34, 197, 94, 0.6)',
    radius: 28,
    category: 'access',
  },
  firewall: {
    icon: 'firewall',
    label: 'Firewall',
    color: '#ef4444', // Red
    glowColor: 'rgba(239, 68, 68, 0.6)',
    radius: 30,
    category: 'security',
  },
  server: {
    icon: 'server',
    label: 'Server',
    color: '#3b82f6', // Blue
    glowColor: 'rgba(59, 130, 246, 0.6)',
    radius: 28,
    category: 'server',
  },
  accessPoint: {
    icon: 'wifi',
    label: 'Access Point',
    color: '#14b8a6', // Teal
    glowColor: 'rgba(20, 184, 166, 0.6)',
    radius: 26,
    category: 'access',
  },
  iot: {
    icon: 'sensor',
    label: 'IoT Sensor',
    color: '#f59e0b', // Amber
    glowColor: 'rgba(245, 158, 11, 0.6)',
    radius: 22,
    category: 'endpoint',
  },
  pc: {
    icon: 'pc',
    label: 'Workstation',
    color: '#64748b', // Slate
    glowColor: 'rgba(100, 116, 139, 0.6)',
    radius: 24,
    category: 'endpoint',
  },
  cloud: {
    icon: 'cloud',
    label: 'Cloud',
    color: '#0ea5e9', // Sky
    glowColor: 'rgba(14, 165, 233, 0.6)',
    radius: 34,
    category: 'cloud',
  },
  internet: {
    icon: 'globe',
    label: 'Internet',
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.6)',
    radius: 36,
    category: 'cloud',
  },
  lab: {
    icon: 'lab',
    label: 'Lab',
    color: '#f97316', // Orange
    glowColor: 'rgba(249, 115, 22, 0.6)',
    radius: 30,
    category: 'server',
  },
};

// Status colors and effects
export const STATUS_CONFIG = {
  healthy: {
    color: '#22c55e',
    pulseColor: 'rgba(34, 197, 94, 0.4)',
    label: 'Healthy',
    pulseSpeed: 0,
  },
  warning: {
    color: '#f59e0b',
    pulseColor: 'rgba(245, 158, 11, 0.5)',
    label: 'Warning',
    pulseSpeed: 2000,
  },
  critical: {
    color: '#ef4444',
    pulseColor: 'rgba(239, 68, 68, 0.6)',
    label: 'Critical',
    pulseSpeed: 800,
  },
  degraded: {
    color: '#eab308',
    pulseColor: 'rgba(234, 179, 8, 0.4)',
    label: 'Degraded',
    pulseSpeed: 3000,
  },
  offline: {
    color: '#6b7280',
    pulseColor: 'rgba(107, 114, 128, 0.3)',
    label: 'Offline',
    pulseSpeed: 0,
  },
};

/**
 * Enhanced Node Renderer Class
 */
export class NodeRenderer {
  constructor(ctx, iconCache) {
    this.ctx = ctx;
    this.iconCache = iconCache;
    this.frame = 0;
  }

  /**
   * Update frame counter for animations
   */
  tick() {
    this.frame++;
  }

  /**
   * Get status based on load
   * @param {number} load - Node load (0-1)
   * @returns {string} Status key
   */
  getStatusFromLoad(load) {
    if (load >= 0.9) return 'critical';
    if (load >= 0.75) return 'warning';
    if (load >= 0.6) return 'degraded';
    return 'healthy';
  }

  /**
   * Render a single node with all effects
   * @param {Object} node - Node data
   * @param {boolean} isSelected - Whether node is selected
   * @param {boolean} isHovered - Whether node is hovered
   */
  render(node, isSelected = false, isHovered = false) {
    const config = DEVICE_CONFIG[node.type] || DEVICE_CONFIG.switch;
    const status = node.status || this.getStatusFromLoad(node.displayLoad || 0);
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
    
    const x = node.x;
    const y = node.y;
    const radius = config.radius;

    // Draw outer glow
    this.drawGlow(x, y, radius, config.glowColor, node.displayLoad || 0.5);

    // Draw status pulse (if warning/critical)
    if (statusConfig.pulseSpeed > 0) {
      this.drawStatusPulse(x, y, radius, statusConfig, this.frame);
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

    // Draw load indicator arc
    this.drawLoadArc(x, y, radius, node.displayLoad || 0);

    // Draw status indicator dot
    this.drawStatusDot(x, y, radius, statusConfig.color);

    // Draw label
    this.drawLabel(x, y, radius, node.label, node.displayLoad);
  }

  /**
   * Draw outer glow effect
   */
  drawGlow(x, y, radius, glowColor, intensity) {
    const glowRadius = radius + 15 + intensity * 10;
    const gradient = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw pulsing status effect
   */
  drawStatusPulse(x, y, radius, statusConfig, frame) {
    const pulsePhase = (frame * (1000 / 60)) % statusConfig.pulseSpeed;
    const pulseProgress = pulsePhase / statusConfig.pulseSpeed;
    const pulseRadius = radius + 5 + pulseProgress * 20;
    const pulseAlpha = 1 - pulseProgress;

    this.ctx.strokeStyle = statusConfig.pulseColor.replace(')', `, ${pulseAlpha})`).replace('rgba', 'rgba');
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Draw selection ring
   */
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

  /**
   * Draw hover effect
   */
  drawHoverEffect(x, y, radius) {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Draw base circle
   */
  drawBase(x, y, radius, color, statusColor) {
    // Dark background
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Border
    const gradient = this.ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, statusColor);
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  /**
   * Draw device icon
   */
  drawIcon(x, y, radius, iconKey) {
    const icon = this.iconCache?.get(iconKey + '.svg') || this.iconCache?.get(iconKey);
    
    if (icon && icon.complete && icon.naturalWidth > 0) {
      const size = radius * 1.2;
      this.ctx.drawImage(icon, x - size / 2, y - size / 2, size, size);
    } else {
      // Fallback: draw simple shape
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.font = `${radius * 0.6}px Inter`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(iconKey.charAt(0).toUpperCase(), x, y);
    }
  }

  /**
   * Draw load indicator arc around node
   */
  drawLoadArc(x, y, radius, load) {
    const arcRadius = radius + 2;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (load * Math.PI * 2);

    // Background arc
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(x, y, arcRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Load arc
    let arcColor = '#22c55e'; // Green
    if (load >= 0.9) arcColor = '#ef4444'; // Red
    else if (load >= 0.75) arcColor = '#f59e0b'; // Amber
    else if (load >= 0.5) arcColor = '#eab308'; // Yellow

    this.ctx.strokeStyle = arcColor;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.arc(x, y, arcRadius, startAngle, endAngle);
    this.ctx.stroke();
    this.ctx.lineCap = 'butt';
  }

  /**
   * Draw status indicator dot
   */
  drawStatusDot(x, y, radius, color) {
    const dotX = x + radius * 0.7;
    const dotY = y - radius * 0.7;
    
    // Dot glow
    const gradient = this.ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // Dot
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // White center
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw node label and load percentage
   */
  drawLabel(x, y, radius, label, load) {
    // Load percentage above
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = 'bold 12px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.round((load || 0) * 100)}%`, x, y - radius - 12);

    // Label below
    this.ctx.font = '11px Inter';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText(label || 'Unknown', x, y + radius + 16);
  }
}
