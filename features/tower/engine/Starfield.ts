export class Starfield {
    stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];
    width: number;
    height: number;

    constructor(width: number, height: number, count: number = 200) {
        this.width = width;
        this.height = height;
        this.initStars(count);
    }

    initStars(count: number) {
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                brightness: Math.random()
            });
        }
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        // Re-distribute stars or add more if needed, for now just keep them
    }

    update() {
        // Parallax effect: move stars slowly
        // For a static tower game, maybe they just twinkle or drift slowly
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
            // Twinkle
            star.brightness += (Math.random() - 0.5) * 0.1;
            if (star.brightness > 1) star.brightness = 1;
            if (star.brightness < 0.3) star.brightness = 0.3;
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#000000'; // Deep space black
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw Nebula/Gradient background (optional, for depth)
        const gradient = ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, this.width);
        gradient.addColorStop(0, '#1a103c'); // Deep purple center
        gradient.addColorStop(1, '#000000'); // Black edges
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
