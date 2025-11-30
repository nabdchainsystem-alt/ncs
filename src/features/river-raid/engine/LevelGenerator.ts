import { Entity, Enemy, FuelDepot, Bridge, EntityType } from './Entities';

export class LevelGenerator {
    riverWidth: number = 400;
    screenWidth: number;
    screenHeight: number;

    // River segments: Blocky style
    riverSegments: { y: number, leftBank: number, rightBank: number }[] = [];

    lastGeneratedY: number = 0;
    segmentHeight: number = 40; // Taller segments for blocky look

    currentCenter: number;
    currentWidth: number;
    targetCenter: number;
    targetWidth: number;

    constructor(screenWidth: number, screenHeight: number) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.lastGeneratedY = -screenHeight;

        this.currentCenter = screenWidth / 2;
        this.currentWidth = 400; // Wider start
        this.targetCenter = screenWidth / 2;
        this.targetWidth = 400;

        // Initialize
        for (let y = screenHeight; y > -screenHeight * 2; y -= this.segmentHeight) {
            this.generateSegment(y);
        }
    }

    generateSegment(y: number) {
        // Straighter River Logic
        // Only change target occasionally
        if (Math.abs(this.currentCenter - this.targetCenter) < 5) {
            // Pick new target
            if (Math.random() < 0.1) { // Reduced chance to turn
                const dir = Math.random() > 0.5 ? 1 : -1;
                this.targetCenter += dir * 50; // Smaller turns
                // Clamp center to keep river on screen
                this.targetCenter = Math.max(200, Math.min(this.screenWidth - 200, this.targetCenter));
            }
        }

        if (Math.abs(this.currentWidth - this.targetWidth) < 5) {
            if (Math.random() < 0.1) {
                // Width variation
                this.targetWidth = 300 + Math.random() * 200; // Min width 300
            }
        }

        // Move towards target
        const step = 5; // Slower changes for smoother/straighter river
        if (this.currentCenter < this.targetCenter) this.currentCenter += step;
        else if (this.currentCenter > this.targetCenter) this.currentCenter -= step;

        if (this.currentWidth < this.targetWidth) this.currentWidth += step;
        else if (this.currentWidth > this.targetWidth) this.currentWidth -= step;

        const leftBank = this.currentCenter - this.currentWidth / 2;
        const rightBank = this.currentCenter + this.currentWidth / 2;

        this.riverSegments.push({
            y: y,
            leftBank: leftBank,
            rightBank: rightBank
        });
    }

    update(scrollSpeed: number, dt: number, entities: Entity[]): void {
        const dy = scrollSpeed * dt;

        this.riverSegments = this.riverSegments.filter(s => {
            s.y += dy;
            return s.y < this.screenHeight + 100;
        });

        let minY = this.riverSegments.reduce((min, s) => Math.min(min, s.y), Infinity);

        while (minY > -this.screenHeight) {
            minY -= this.segmentHeight;
            this.generateSegment(minY);

            // High spawn rate
            if (Math.random() < 0.8) { // 80% chance per segment
                this.spawnEntity(minY, entities);
            }
        }
    }

    spawnEntity(y: number, entities: Entity[]) {
        const segment = this.riverSegments.find(s => Math.abs(s.y - y) < this.segmentHeight);
        if (!segment) return;

        const riverWidth = segment.rightBank - segment.leftBank;

        // Ensure strictly within banks with padding
        const padding = 40;
        const playableWidth = riverWidth - (padding * 2);

        if (playableWidth <= 0) return; // Should not happen with min width 300

        const rand = Math.random();
        let type: EntityType | null = null;

        if (rand < 0.05) type = 'bridge';
        else if (rand < 0.35) type = 'fuel'; // 30% Fuel (Increased)
        else if (rand < 0.60) type = 'enemy_ship'; // 25% Ship
        else if (rand < 0.80) type = 'enemy_heli'; // 20% Heli
        else type = 'enemy_jet'; // 20% Jet

        if (type === 'bridge') {
            entities.push(new Bridge(segment.leftBank, y, riverWidth));
        } else if (type) {
            // Random position within playable area
            const rawX = segment.leftBank + padding + Math.random() * playableWidth;
            const x = Math.floor(rawX / 10) * 10; // Quantize

            if (type === 'fuel') entities.push(new FuelDepot(x, y));
            else entities.push(new Enemy(type, x, y));
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Gradient Banks
        const bankGradient = ctx.createLinearGradient(0, 0, this.screenWidth, 0);
        bankGradient.addColorStop(0, '#509000');
        bankGradient.addColorStop(0.2, '#64B000');
        bankGradient.addColorStop(0.8, '#64B000');
        bankGradient.addColorStop(1, '#509000');

        ctx.fillStyle = bankGradient;
        ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

        // Gradient River
        const riverGradient = ctx.createLinearGradient(0, 0, 0, this.screenHeight);
        riverGradient.addColorStop(0, '#3232FF');
        riverGradient.addColorStop(1, '#4040FF');

        ctx.fillStyle = riverGradient;

        ctx.beginPath();
        if (this.riverSegments.length === 0) return;

        // Draw blocky river
        ctx.moveTo(this.riverSegments[0].leftBank, this.riverSegments[0].y);
        for (let i = 0; i < this.riverSegments.length - 1; i++) {
            const curr = this.riverSegments[i];
            const next = this.riverSegments[i + 1];
            // Draw step
            ctx.lineTo(curr.leftBank, curr.y);
            ctx.lineTo(next.leftBank, curr.y); // Step horizontal
            ctx.lineTo(next.leftBank, next.y); // Step vertical
        }

        const last = this.riverSegments[this.riverSegments.length - 1];
        ctx.lineTo(last.rightBank, last.y);

        for (let i = this.riverSegments.length - 1; i > 0; i--) {
            const curr = this.riverSegments[i];
            const prev = this.riverSegments[i - 1];

            ctx.lineTo(curr.rightBank, curr.y);
            ctx.lineTo(curr.rightBank, prev.y); // Step vertical
            ctx.lineTo(prev.rightBank, prev.y); // Step horizontal
        }

        ctx.closePath();
        ctx.fill();

        // River Border/Shoreline
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    checkCollision(player: Entity): boolean {
        const segment = this.riverSegments.find(s => s.y >= player.y && s.y < player.y + this.segmentHeight * 2);
        if (!segment) return false;

        // Simple box check against bank walls
        if (player.x < segment.leftBank || player.x + player.width > segment.rightBank) {
            return true;
        }
        return false;
    }
}
