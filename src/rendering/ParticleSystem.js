/**
 * Particle System
 * Advanced animated data flow visualization with physics-based particles
 */

// Particle configuration
const PARTICLE_CONFIG = {
  minSpeed: 0.003,
  maxSpeed: 0.012,
  minSize: 3,
  maxSize: 8,
  trailLength: 5,
  colors: {
    normal: ['#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6'],
    warning: ['#f59e0b', '#eab308'],
    error: ['#ef4444', '#dc2626'],
    data: ['#8b5cf6', '#a855f7'],
  },
};

/**
 * Single Particle class
 */
class Particle {
  constructor(linkId, config = {}) {
    this.linkId = linkId;
    this.t = config.startT ?? Math.random();
    this.speed = config.speed ?? PARTICLE_CONFIG.minSpeed + Math.random() * (PARTICLE_CONFIG.maxSpeed - PARTICLE_CONFIG.minSpeed);
    this.size = config.size ?? PARTICLE_CONFIG.minSize + Math.random() * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize);
    this.color = config.color ?? this.randomColor('normal');
    this.alpha = 1;
    this.trail = [];
    this.lost = false;
    this.lostProgress = 0;
    this.direction = config.direction ?? 1; // 1 = forward, -1 = backward
    this.type = config.type ?? 'data'; // 'data', 'control', 'error'
  }

  randomColor(type = 'normal') {
    const colors = PARTICLE_CONFIG.colors[type] || PARTICLE_CONFIG.colors.normal;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(flow = 1) {
    // Handle lost packets
    if (this.lost) {
      this.lostProgress += 0.05;
      this.alpha = 1 - this.lostProgress;
      if (this.lostProgress >= 1) {
        this.reset();
      }
      return;
    }

    // Move particle along path
    this.t += this.speed * flow * this.direction;

    // Wrap around
    if (this.t > 1) {
      this.t = 0;
      this.direction = 1;
    } else if (this.t < 0) {
      this.t = 1;
      this.direction = -1;
    }
  }

  reset() {
    this.t = this.direction === 1 ? 0 : 1;
    this.lost = false;
    this.lostProgress = 0;
    this.alpha = 1;
    this.trail = [];
  }

  markLost() {
    if (!this.lost) {
      this.lost = true;
      this.color = PARTICLE_CONFIG.colors.error[0];
    }
  }
}

/**
 * Particle System Manager
 */
export class ParticleSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.particles = [];
    this.links = new Map(); // linkId -> { source, target, control, health }
  }

  /**
   * Initialize particles for a set of links
   * @param {Array} links - Link definitions
   * @param {Map} nodeMap - Node lookup map
   * @param {number} intensity - Traffic intensity multiplier
   */
  initialize(links, nodeMap, intensity = 1) {
    this.particles = [];
    this.links.clear();

    links.forEach(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      
      if (!source || !target) return;

      // Store link data
      this.links.set(link.id, {
        source,
        target,
        control: link.control || { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 - 30 },
        health: link.health || { status: 'up', flow: 1, loss: 0 },
        type: link.type || 'ethernet',
      });

      // Create particles for this link
      const particleCount = Math.max(3, Math.round(intensity * 4 + Math.random() * 3));
      
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(new Particle(link.id, {
          startT: i / particleCount,
          direction: i % 2 === 0 ? 1 : -1, // Bidirectional traffic
          type: Math.random() > 0.8 ? 'control' : 'data',
        }));
      }
    });
  }

  /**
   * Update link data (for dynamic updates)
   */
  updateLink(linkId, data) {
    const linkData = this.links.get(linkId);
    if (linkData) {
      Object.assign(linkData, data);
    }
  }

  /**
   * Update all particles
   * @param {number} intensity - Global intensity multiplier
   */
  update(intensity = 1) {
    this.particles.forEach(particle => {
      const linkData = this.links.get(particle.linkId);
      if (!linkData) return;

      const health = linkData.health;
      
      // Skip if link is down
      if (health.status === 'down') {
        particle.lost = true;
        return;
      }

      // Apply flow modifier
      const flow = health.flow * intensity;
      particle.update(flow);

      // Random packet loss
      if (health.loss && Math.random() < health.loss * 0.01) {
        particle.markLost();
      }
    });
  }

  /**
   * Render all particles
   */
  render() {
    this.particles.forEach(particle => {
      const linkData = this.links.get(particle.linkId);
      if (!linkData) return;

      // Don't render on down links unless showing loss animation
      if (linkData.health.status === 'down' && !particle.lost) return;

      const { source, target, control } = linkData;
      const pos = this.getQuadraticPoint(source, target, control, particle.t);

      // Draw trail
      this.drawTrail(particle, linkData);

      // Draw particle
      this.drawParticle(pos, particle);
    });
  }

  /**
   * Draw particle with glow effect
   */
  drawParticle(pos, particle) {
    const { x, y } = pos;
    const size = particle.size;

    // Glow
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.globalAlpha = particle.alpha * 0.5;
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Core
    this.ctx.globalAlpha = particle.alpha;
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fill();

    // Highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = 1;

    // Update trail
    particle.trail.push({ x, y });
    if (particle.trail.length > PARTICLE_CONFIG.trailLength) {
      particle.trail.shift();
    }
  }

  /**
   * Draw particle trail
   */
  drawTrail(particle, linkData) {
    if (particle.trail.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
    
    for (let i = 1; i < particle.trail.length; i++) {
      const alpha = (i / particle.trail.length) * 0.3 * particle.alpha;
      this.ctx.globalAlpha = alpha;
      this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
    }
    
    this.ctx.strokeStyle = particle.color;
    this.ctx.lineWidth = particle.size * 0.5;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
    this.ctx.lineCap = 'butt';
    this.ctx.globalAlpha = 1;
  }

  /**
   * Get point on quadratic bezier curve
   */
  getQuadraticPoint(source, target, control, t) {
    const ctrlX = control.x ?? (source.x + target.x) / 2;
    const ctrlY = control.y ?? (source.y + target.y) / 2;
    
    const x = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * ctrlX + t * t * target.x;
    const y = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * ctrlY + t * t * target.y;
    return { x, y };
  }

  /**
   * Add burst of particles (for events)
   * @param {string} linkId - Link to add burst to
   * @param {number} count - Number of particles
   * @param {string} type - Particle type
   */
  addBurst(linkId, count = 5, type = 'data') {
    const colors = type === 'error' ? PARTICLE_CONFIG.colors.error : PARTICLE_CONFIG.colors.data;
    
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(linkId, {
        startT: Math.random(),
        speed: PARTICLE_CONFIG.maxSpeed,
        size: PARTICLE_CONFIG.maxSize,
        color: colors[Math.floor(Math.random() * colors.length)],
        type,
      }));
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
    this.links.clear();
  }

  /**
   * Get particle count for debugging
   */
  getCount() {
    return this.particles.length;
  }
}
