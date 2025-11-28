export class Tower {
    x: number;
    y: number;
    range: number = 150;
    damage: number = 10;
    fireRate: number = 60; // Frames between shots
    cooldown: number = 0;
    color: string = '#3b82f6';
    target: any = null; // Enemy type

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update(enemies: any[]) {
        if (this.cooldown > 0) this.cooldown--;

        // Find target
        this.target = null;
        let minDist = this.range;

        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.range && dist < minDist) {
                minDist = dist;
                this.target = enemy;
            }
        }

        if (this.target && this.cooldown <= 0) {
            this.shoot();
            this.cooldown = this.fireRate;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Draw Range
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Tower
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Draw Turret
        if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(0, -5, 25, 10);
            ctx.restore();
        }
    }

    shoot() {
        // Projectile logic will be handled by GameEngine or Projectile class
        // For now, instant hit
        if (this.target) {
            this.target.takeDamage(this.damage);
            // Draw laser line in draw method or here temporarily? 
            // Better to spawn a projectile.
        }
    }
}
