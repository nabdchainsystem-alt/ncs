export type EntityType = 'player' | 'enemy_ship' | 'enemy_heli' | 'enemy_jet' | 'fuel' | 'bridge' | 'bullet' | 'explosion';

export interface Position {
  x: number;
  y: number;
}

export class Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  markedForDeletion: boolean = false;
  frame: number = 0; // For animation

  constructor(type: EntityType, x: number, y: number, width: number, height: number) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
  }

  update(dt: number, speed: number) {
    this.x += this.vx * dt;
    this.y += (this.vy + speed) * dt;
    this.frame += dt * 10; // 10 FPS animation
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Fallback
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getBounds() {
    // Hitbox slightly smaller than sprite for fairness
    const padding = 4;
    return {
      left: this.x + padding,
      right: this.x + this.width - padding,
      top: this.y + padding,
      bottom: this.y + this.height - padding
    };
  }

  collidesWith(other: Entity) {
    const a = this.getBounds();
    const b = other.getBounds();
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }
}

export class Player extends Entity {
  fuel: number = 100;
  maxFuel: number = 100;
  speedX: number = 200; // Slower, more precise
  speedY: number = 0;
  isAccelerating: boolean = false;
  bankAngle: number = 0; // Visual banking

  constructor(x: number, y: number) {
    super('player', x, y, 32, 36); // Authentic size ratio
  }

  update(dt: number, _scrollSpeed: number) {
    this.x += this.vx * dt;

    // Banking animation logic
    const targetBank = this.vx < 0 ? -0.3 : (this.vx > 0 ? 0.3 : 0);
    this.bankAngle += (targetBank - this.bankAngle) * 10 * dt;

    this.fuel -= 3 * dt; // Slower drain
    if (this.fuel < 0) this.fuel = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.bankAngle);

    // Detailed Fighter Jet
    // Main Body
    ctx.fillStyle = '#E0E0E0'; // Light Grey
    ctx.beginPath();
    ctx.moveTo(0, -18); // Nose
    ctx.lineTo(4, -6);
    ctx.lineTo(4, 10);
    ctx.lineTo(0, 16); // Tail end
    ctx.lineTo(-4, 10);
    ctx.lineTo(-4, -6);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#303030'; // Dark Grey
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(2, -4);
    ctx.lineTo(0, 0);
    ctx.lineTo(-2, -4);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = '#C0C0C0'; // Slightly darker grey
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(16, 8);
    ctx.lineTo(16, 12);
    ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-16, 12);
    ctx.lineTo(-4, 8);
    ctx.closePath();
    ctx.fill();

    // Tail Wings
    ctx.fillStyle = '#A0A0A0';
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.lineTo(8, 16);
    ctx.lineTo(2, 16);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-2, 10);
    ctx.lineTo(-8, 16);
    ctx.lineTo(-2, 16);
    ctx.closePath();
    ctx.fill();

    // Engine Glow
    if (this.isAccelerating) {
      ctx.fillStyle = '#FF8000';
      ctx.beginPath();
      ctx.moveTo(-2, 16);
      ctx.lineTo(0, 24 + Math.random() * 4);
      ctx.lineTo(2, 16);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

export class Bullet extends Entity {
  constructor(x: number, y: number) {
    super('bullet', x, y, 4, 12);
    this.vy = -1500; // 3x Speed
  }

  update(dt: number, _scrollSpeed: number) {
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#FFFF00'; // Yellow bullet
    ctx.shadowColor = '#FF8000';
    ctx.shadowBlur = 5;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }
}

export class Enemy extends Entity {
  constructor(type: EntityType, x: number, y: number) {
    super(type, x, y, 32, 32); // Standard enemy size
    if (type === 'enemy_heli') {
      this.vx = 60; // Patrol speed
    } else if (type === 'enemy_jet') {
      this.vx = 180; // Fast jet
    }
  }

  update(dt: number, scrollSpeed: number) {
    this.y += scrollSpeed * dt;

    if (this.type === 'enemy_heli') {
      this.x += this.vx * dt;
      // Simple bounce patrol
      // We rely on level generator or simple boundary checks in future
      // For now, just let them fly
    } else if (this.type === 'enemy_jet') {
      this.x += this.vx * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    if (this.type === 'enemy_ship') {
      // Detailed Ship
      ctx.fillStyle = '#202020'; // Dark Hull
      // Hull shape
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(16, -6);
      ctx.lineTo(12, 8);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();

      // Deck
      ctx.fillStyle = '#505050';
      ctx.fillRect(-10, -6, 20, 10);

      // Bridge
      ctx.fillStyle = '#808080';
      ctx.fillRect(-4, -10, 8, 6);

      // Windows
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(-2, -8, 4, 2);

    } else if (this.type === 'enemy_heli') {
      // Detailed Heli
      ctx.fillStyle = '#304030'; // Olive Drab Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.fillRect(-2, 8, 4, 10);
      ctx.fillStyle = '#202020';
      ctx.fillRect(-6, 16, 12, 2); // Tail rotor

      // Cockpit
      ctx.fillStyle = '#80C0FF';
      ctx.beginPath();
      ctx.arc(0, -4, 5, Math.PI, 0);
      ctx.fill();

      // Main Rotor (Animated)
      ctx.fillStyle = '#101010';
      ctx.save();
      ctx.rotate(this.frame * 5); // Spin
      ctx.fillRect(-18, -2, 36, 4);
      ctx.fillRect(-2, -18, 4, 36);
      ctx.restore();

    } else if (this.type === 'enemy_jet') {
      // Enemy Jet (Red/Black)
      ctx.rotate(Math.PI); // Facing down

      ctx.fillStyle = '#800000'; // Dark Red
      // Delta Wing shape
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(12, 12);
      ctx.lineTo(0, 8);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(3, 0);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

export class FuelDepot extends Entity {
  constructor(x: number, y: number) {
    super('fuel', x, y, 28, 48);
  }

  update(dt: number, scrollSpeed: number) {
    this.y += scrollSpeed * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // 3D-ish Fuel Tank
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
    gradient.addColorStop(0, '#B03030');
    gradient.addColorStop(0.5, '#FF5050');
    gradient.addColorStop(1, '#902020');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Top Cap
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, 6);

    // FUEL Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + 4);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('FUEL', 0, 0);
    ctx.restore();
  }
}

export class Bridge extends Entity {
  constructor(x: number, y: number, width: number) {
    super('bridge', x, y, width, 40);
  }

  update(dt: number, scrollSpeed: number) {
    this.y += scrollSpeed * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Concrete Bridge
    ctx.fillStyle = '#808080';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Road markings
    ctx.fillStyle = '#FFFF00';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height / 2);
    ctx.lineTo(this.x + this.width, this.y + this.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Side railings
    ctx.fillStyle = '#505050';
    ctx.fillRect(this.x, this.y, this.width, 4);
    ctx.fillRect(this.x, this.y + this.height - 4, this.width, 4);

    // Supports
    ctx.fillStyle = '#404040';
    for (let i = 20; i < this.width; i += 40) {
      ctx.fillRect(this.x + i, this.y + 4, 8, this.height - 8);
    }
  }
}

export class Explosion extends Entity {
  timer: number = 0;
  particles: { x: number, y: number, vx: number, vy: number, life: number, color: string }[] = [];

  constructor(x: number, y: number) {
    super('explosion', x, y, 0, 0);
    // Create particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: Math.random() > 0.5 ? '#FF4000' : '#FFFF00'
      });
    }
  }

  update(dt: number, scrollSpeed: number) {
    this.y += scrollSpeed * dt;
    this.timer += dt;
    if (this.timer > 1.0) this.markedForDeletion = true;

    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    this.particles.forEach(p => {
      if (p.life > 0) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.life * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }
}
