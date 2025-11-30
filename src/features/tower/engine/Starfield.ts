export class Starfield {
    stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];
    width: number;
    height: number;

    constructor(width: number, height: number, count: number = 300) {
        this.width = width;
        this.height = height;
        this.initStars(count);
    }

    initStars(count: number) {
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 1.5 + 0.5, // Smaller stars for depth
                speed: Math.random() * 0.2 + 0.05, // Slower movement
                brightness: Math.random() * 0.8 // Slightly dimmer
            });
        }
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    update() {
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
            // Subtle Twinkle
            star.brightness += (Math.random() - 0.5) * 0.05;
            if (star.brightness > 0.8) star.brightness = 0.8;
            if (star.brightness < 0.2) star.brightness = 0.2;
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Deep Space Black - No Gradient
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.width, this.height);

        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
