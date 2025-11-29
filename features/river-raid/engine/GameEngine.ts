import { Entity, Player, Bullet, Enemy, FuelDepot, Bridge, Explosion } from './Entities';
import { LevelGenerator } from './LevelGenerator';
import { SoundManager } from './SoundManager';

export class GameEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    width: number;
    height: number;

    player: Player;
    entities: Entity[] = [];
    levelGenerator: LevelGenerator;
    soundManager: SoundManager;

    score: number = 0;
    lives: number = 3;
    isGameOver: boolean = false;
    isPaused: boolean = false;

    keys: { [key: string]: boolean } = {};

    scrollSpeed: number = 100;
    baseScrollSpeed: number = 100;

    lastTime: number = 0;
    animationId: number | null = null;

    onGameOver: (score: number) => void;

    constructor(canvas: HTMLCanvasElement, onGameOver: (score: number) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.width = canvas.width;
        this.height = canvas.height;
        this.onGameOver = onGameOver;

        this.player = new Player(this.width / 2 - 14, this.height - 120);
        this.levelGenerator = new LevelGenerator(this.width, this.height);
        this.soundManager = new SoundManager();

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        // Init Audio on first interaction (browser policy)
        const initAudio = () => {
            this.soundManager.init();
            window.removeEventListener('keydown', initAudio);
            window.removeEventListener('click', initAudio);
        };
        window.addEventListener('keydown', initAudio);
        window.addEventListener('click', initAudio);
    }

    handleKeyDown = (e: KeyboardEvent) => {
        this.keys[e.code] = true;
        if (e.code === 'Space') {
            this.shoot();
        }
    };

    handleKeyUp = (e: KeyboardEvent) => {
        this.keys[e.code] = false;
    };

    shoot() {
        if (this.isGameOver || this.isPaused) return;
        const bullets = this.entities.filter(e => e.type === 'bullet');
        if (bullets.length < 3) { // Allow 3 bullets for faster action
            this.entities.push(new Bullet(this.player.x + this.player.width / 2 - 2, this.player.y));
            this.soundManager.playShoot();
        }
    }

    start() {
        this.lastTime = performance.now();
        this.soundManager.startEngine();
        this.loop(this.lastTime);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.soundManager.stopEngine();
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    loop = (timestamp: number) => {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.isPaused && !this.isGameOver) {
            this.update(dt);
            this.draw();
        }

        this.animationId = requestAnimationFrame(this.loop);
    };

    update(dt: number) {
        // Handle Input
        if (this.keys['ArrowLeft']) this.player.vx = -this.player.speedX;
        else if (this.keys['ArrowRight']) this.player.vx = this.player.speedX;
        else this.player.vx = 0;

        if (this.keys['ArrowUp']) {
            this.scrollSpeed = this.baseScrollSpeed * 2.5;
            this.player.isAccelerating = true;
        } else if (this.keys['ArrowDown']) {
            this.scrollSpeed = this.baseScrollSpeed * 0.5;
            this.player.isAccelerating = false;
        } else {
            this.scrollSpeed = this.baseScrollSpeed;
            this.player.isAccelerating = false;
        }

        // Update Engine Sound Pitch
        this.soundManager.updateEnginePitch(this.scrollSpeed / this.baseScrollSpeed);

        this.player.update(dt, this.scrollSpeed);

        // Clamp Player
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.width) this.player.x = this.width - this.player.width;

        this.levelGenerator.update(this.scrollSpeed, dt, this.entities);

        this.entities.forEach(e => e.update(dt, this.scrollSpeed));
        // Fix: Allow entities to exist above the screen (negative Y) so they can scroll in.
        // Only cull if they are way below the screen.
        this.entities = this.entities.filter(e => e.y < this.height + 100 && e.y > -this.height * 2 && !e.markedForDeletion);

        this.checkCollisions();

        if (this.player.fuel <= 0) {
            this.handleDeath();
        }
    }

    checkCollisions() {
        if (this.levelGenerator.checkCollision(this.player)) {
            this.handleDeath();
        }

        for (const entity of this.entities) {
            if (entity.type === 'bullet' || entity.type === 'explosion') continue;

            if (this.player.collidesWith(entity)) {
                if (entity.type === 'fuel') {
                    // In original, colliding with fuel destroys it? No, you fly over it.
                    // But if you hit it, you might destroy it.
                    // Let's say physical collision = crash, but overlap = refuel?
                    // Actually, in River Raid, you fly OVER the fuel tank to refuel.
                    // It acts as a non-solid object for the player, but solid for bullets.

                    this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 0.5);
                    this.soundManager.playRefuel();
                } else if (entity.type === 'bridge') {
                    this.handleDeath();
                } else if (entity.type.startsWith('enemy')) {
                    this.handleDeath();
                    entity.markedForDeletion = true;
                    this.entities.push(new Explosion(entity.x, entity.y));
                }
            }
        }

        const bullets = this.entities.filter(e => e.type === 'bullet');
        for (const bullet of bullets) {
            for (const entity of this.entities) {
                if (entity === bullet || entity.type === 'bullet' || entity.type === 'explosion') continue;

                if (bullet.collidesWith(entity)) {
                    bullet.markedForDeletion = true;

                    if (entity.type === 'bridge') {
                        entity.markedForDeletion = true;
                        this.score += 500;
                        this.entities.push(new Explosion(entity.x + entity.width / 2, entity.y));
                        this.soundManager.playExplosion();
                    } else if (entity.type === 'fuel') {
                        entity.markedForDeletion = true;
                        this.score += 80; // Points for destroying fuel
                        this.entities.push(new Explosion(entity.x, entity.y));
                        this.soundManager.playExplosion();
                    } else if (entity.type.startsWith('enemy')) {
                        entity.markedForDeletion = true;
                        this.score += 100;
                        this.entities.push(new Explosion(entity.x, entity.y));
                        this.soundManager.playExplosion();
                    }
                }
            }
        }
    }

    handleDeath() {
        this.soundManager.playExplosion();
        // Visual Explosion at player position
        this.entities.push(new Explosion(this.player.x, this.player.y));

        this.lives--;
        if (this.lives <= 0) {
            this.isGameOver = true;
            this.soundManager.stopEngine();
            this.onGameOver(this.score);
        } else {
            this.player.x = this.width / 2 - 14;
            this.player.y = this.height - 120;
            this.player.fuel = 100;
            this.player.vx = 0;
            this.entities = this.entities.filter(e => e.y > this.height / 2);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.levelGenerator.draw(this.ctx);
        this.entities.forEach(e => e.draw(this.ctx));
        this.player.draw(this.ctx);

        this.drawHUD();
    }

    drawHUD() {
        // Authentic Grey Bottom Bar
        const hudHeight = 60;
        const hudY = this.height - hudHeight;

        this.ctx.fillStyle = '#888888';
        this.ctx.fillRect(0, hudY, this.width, hudHeight);

        // Fuel Gauge Box
        const gaugeWidth = 200;
        const gaugeHeight = 30;
        const gaugeX = this.width / 2 - gaugeWidth / 2;
        const gaugeY = hudY + 15;

        // Black background for gauge
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);

        // Markings E 1/2 F
        this.ctx.fillStyle = '#FFFFFF'; // Or yellow?
        this.ctx.font = '20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('E', gaugeX + 15, gaugeY + 22);
        this.ctx.fillText('1/2', gaugeX + gaugeWidth / 2, gaugeY + 22);
        this.ctx.fillText('F', gaugeX + gaugeWidth - 15, gaugeY + 22);

        // Needle
        const fuelRatio = this.player.fuel / this.player.maxFuel;
        const needleX = gaugeX + 15 + (gaugeWidth - 30) * fuelRatio;

        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(needleX, gaugeY + 25);
        this.ctx.lineTo(needleX, gaugeY + 5);
        this.ctx.stroke();

        // Score (Yellow, Top Center usually, but let's put it in HUD for now or overlay)
        // Original has score at bottom? Let's check images.
        // Image shows Score at bottom in yellow.

        this.ctx.fillStyle = '#FFFF00'; // Yellow
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillText(this.score.toString(), this.width / 2, hudY - 10); // Above HUD?

        // Lives (Icons?)
        this.ctx.fillText(this.lives.toString(), 30, hudY + 40);
    }
}
