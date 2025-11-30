export class Enemy {
    x: number;
    y: number;
    speed: number = 1;
    health: number = 20;
    maxHealth: number = 20;
    radius: number = 12;
    color: string = '#ef4444';
    active: boolean = true;
    targetX: number;
    targetY: number;
    rotation: number = 0;
    rotationSpeed: number;

    constructor(x: number, y: number, targetX: number, targetY: number) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw Asteroid/Ship Body (Pseudo-3D)
        const gradient = ctx.createRadialGradient(-5, -5, 2, 0, 0, this.radius);
        gradient.addColorStop(0, '#ff8888'); // Highlight
        gradient.addColorStop(0.5, this.color); // Base color
        gradient.addColorStop(1, '#550000'); // Shadow

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Irregular shape for asteroid look
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();

        // Health bar (Floating above)
        const hpPercent = this.health / this.maxHealth;
        if (hpPercent < 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x - 12, this.y - 20, 24, 4);
            ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : '#ff0000';
            ctx.fillRect(this.x - 12, this.y - 20, 24 * hpPercent, 4);
        }
    }

    takeDamage(amount: number) {
        this.health -= amount;
        // Don't set active = false here, let GameEngine handle death for rewards
    }
}
