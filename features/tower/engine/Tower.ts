export class Tower {
    x: number;
    y: number;
    range: number = 150;
    damage: number = 10;
    fireRate: number = 60;
    cooldown: number = 0;
    color: string = '#3b82f6';
    target: any = null;
    rotation: number = 0;
    scanAngle: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update(enemies: any[], spawnProjectile: (x: number, y: number, target: any) => void) {
        if (this.cooldown > 0) this.cooldown--;

        // Update Scanner
        this.scanAngle += 0.02;

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

        if (this.target) {
            // Rotate towards target
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.rotation = targetAngle;

            if (this.cooldown <= 0) {
                this.shoot(spawnProjectile);
                this.cooldown = this.fireRate;
            }
        }
        // If no target, keep last rotation (no idle spin)
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Draw Range (Holographic Scanner)
        ctx.save();
        ctx.translate(this.x, this.y);

        // Outer Ring
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.range, 0, Math.PI * 2);
        ctx.stroke();

        // Scanner Sweep
        const gradient = ctx.createConicGradient(this.scanAngle, 0, 0);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
        gradient.addColorStop(0.1, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(0.2, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.range, 0, Math.PI * 2);
        ctx.fill();

        // Inner Tech Circles
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, this.range * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Draw Base (Space Station Hub)
        const baseGradient = ctx.createRadialGradient(this.x - 10, this.y - 10, 5, this.x, this.y, 30);
        baseGradient.addColorStop(0, '#60a5fa');
        baseGradient.addColorStop(0.5, '#2563eb');
        baseGradient.addColorStop(1, '#1e3a8a');

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Turret
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Turret Barrels
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(10, -8, 20, 6);
        ctx.fillRect(10, 2, 20, 6);

        // Turret Body
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Center Light
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Laser Beam (Instant)
        if (this.target && this.cooldown > this.fireRate - 5) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#60a5fa';
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1;
        }
    }

    shoot(spawnProjectile: (x: number, y: number, target: any) => void) {
        if (this.target) {
            this.target.takeDamage(this.damage);
        }
    }
}
