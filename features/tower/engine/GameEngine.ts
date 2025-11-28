import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { Starfield } from './Starfield';
import { Particle } from './Particle';

export interface GameStats {
    cash: number;
    wave: number;
    health: number;
    maxHealth: number;
    // Tower Stats
    damage: number;
    range: number;
    fireRate: number;
    critChance: number;
    critMult: number;
    // Wave Stats
    enemiesAlive: number;
}

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private isRunning: boolean = false;
    private animationId: number = 0;

    private tower: Tower | null = null;
    private enemies: Enemy[] = [];
    private particles: Particle[] = [];
    private starfield: Starfield;

    private frameCount: number = 0;
    private wave: number = 1;
    private cash: number = 100;
    private health: number = 100;
    private maxHealth: number = 100;

    // New Stats
    private critChance: number = 0.1; // 10%
    private critMult: number = 2.0; // 2x damage

    private onStatsUpdate: ((stats: GameStats) => void) | null = null;

    constructor(canvas: HTMLCanvasElement, onStatsUpdate?: (stats: GameStats) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onStatsUpdate = onStatsUpdate || null;

        this.starfield = new Starfield(this.canvas.width, this.canvas.height);

        this.resize();
        window.addEventListener('resize', this.resize.bind(this));

        // Initialize Tower in center
        this.tower = new Tower(this.canvas.width / 2, this.canvas.height / 2);
    }

    private resize() {
        this.canvas.width = this.canvas.parentElement?.clientWidth || 800;
        this.canvas.height = this.canvas.parentElement?.clientHeight || 600;
        this.starfield.resize(this.canvas.width, this.canvas.height);
        if (this.tower) {
            this.tower.x = this.canvas.width / 2;
            this.tower.y = this.canvas.height / 2;
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.resize.bind(this));
    }

    private loop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        if (this.frameCount % 10 === 0 && this.onStatsUpdate && this.tower) {
            this.onStatsUpdate({
                cash: this.cash,
                wave: this.wave,
                health: this.health,
                maxHealth: this.maxHealth,
                damage: this.tower.damage,
                range: this.tower.range,
                fireRate: this.tower.fireRate,
                critChance: this.critChance,
                critMult: this.critMult,
                enemiesAlive: this.enemies.length
            });
        }

        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    private update() {
        this.frameCount++;
        this.starfield.update();

        // Spawn Enemies
        if (this.frameCount % 100 === 0) {
            this.spawnEnemy();
        }

        // Update Tower
        if (this.tower) {
            this.tower.update(this.enemies, this.spawnProjectile.bind(this));
        }

        // Update Enemies
        this.enemies.forEach(enemy => {
            enemy.update();
            // Check collision with tower
            const dist = Math.hypot(this.tower!.x - enemy.x, this.tower!.y - enemy.y);
            if (dist < 30 + enemy.radius) {
                enemy.active = false;
                this.takeDamage(10);
                this.spawnExplosion(enemy.x, enemy.y, '#ff4444');
            }
        });

        // Update Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        // Remove inactive enemies and give rewards
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.health <= 0) {
                this.cash += 10; // Reward
                this.spawnExplosion(enemy.x, enemy.y, enemy.color);
                return false;
            }
            if (!enemy.active) {
                return false;
            }
            return true;
        });
    }

    private takeDamage(amount: number) {
        this.health -= amount;
        this.spawnExplosion(this.tower!.x, this.tower!.y, '#3b82f6', 20); // Shield hit effect
        if (this.health <= 0) {
            this.health = 0;
            // Game Over logic
        }
    }

    private spawnEnemy() {
        if (!this.tower) return;

        // Spawn from random edge
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -50 : this.canvas.width + 50;
            y = Math.random() * this.canvas.height;
        } else {
            x = Math.random() * this.canvas.width;
            y = Math.random() < 0.5 ? -50 : this.canvas.height + 50;
        }

        this.enemies.push(new Enemy(x, y, this.tower.x, this.tower.y));
    }

    private spawnExplosion(x: number, y: number, color: string, count: number = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, Math.random() * 3 + 1, Math.random() * 3 + 1));
        }
    }

    private spawnProjectile(x: number, y: number, target: Enemy) {
        // Instant hit logic with Crit
        if (this.tower) {
            let damage = this.tower.damage;
            let isCrit = Math.random() < this.critChance;
            let color = '#60a5fa'; // Blue

            if (isCrit) {
                damage *= this.critMult;
                color = '#facc15'; // Yellow/Gold for crit
                this.spawnExplosion(target.x, target.y, color, 5); // Small crit spark
            }

            target.takeDamage(damage);

            // Draw beam (handled in Tower.draw, but we can add special effects here)
        }
    }

    private draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Background
        this.starfield.draw(this.ctx);

        // Draw Tower
        if (this.tower) {
            this.tower.draw(this.ctx);
        }

        // Draw Enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));
    }

    // Upgrade Methods
    upgradeDamage() {
        if (this.cash >= 50 && this.tower) {
            this.cash -= 50;
            this.tower.damage += 5;
        }
    }

    upgradeSpeed() {
        if (this.cash >= 50 && this.tower) {
            this.cash -= 50;
            this.tower.fireRate = Math.max(5, this.tower.fireRate - 5);
        }
    }

    upgradeRange() {
        if (this.cash >= 50 && this.tower) {
            this.cash -= 50;
            this.tower.range += 20;
        }
    }

    upgradeCritChance() {
        if (this.cash >= 100) {
            this.cash -= 100;
            this.critChance = Math.min(1.0, this.critChance + 0.05);
        }
    }

    upgradeCritMult() {
        if (this.cash >= 100) {
            this.cash -= 100;
            this.critMult += 0.5;
        }
    }
}
