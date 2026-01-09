"use client";

import { useRef, useEffect, useCallback } from "react";

interface Star {
    x: number;
    y: number;
    size: number;
    brightness: number;
    twinkleSpeed: number;
    twinkleOffset: number;
}

interface GalaxyCanvasProps {
    width: number;
    height: number;
    starCount?: number;
}

export function GalaxyCanvas({ width, height, starCount = 800 }: GalaxyCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star[]>([]);
    const animationRef = useRef<number | undefined>(undefined);

    // Generate stars in elliptical distribution
    const generateStars = useCallback(() => {
        const stars: Star[] = [];
        const centerX = width / 2;
        const centerY = height / 2;
        const radiusX = width * 0.45;
        const radiusY = height * 0.35;

        for (let i = 0; i < starCount; i++) {
            // Elliptical distribution with higher density in center
            const angle = Math.random() * Math.PI * 2;
            const distanceRatio = Math.pow(Math.random(), 0.5); // More stars near center

            const x = centerX + Math.cos(angle) * radiusX * distanceRatio;
            const y = centerY + Math.sin(angle) * radiusY * distanceRatio;

            // Skip stars outside canvas
            if (x < 0 || x > width || y < 0 || y > height) continue;

            stars.push({
                x,
                y,
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
            });
        }

        // Add some brighter "key" stars
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distanceRatio = Math.random() * 0.8;

            stars.push({
                x: centerX + Math.cos(angle) * radiusX * distanceRatio,
                y: centerY + Math.sin(angle) * radiusY * distanceRatio,
                size: Math.random() * 2 + 2,
                brightness: 1,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                twinkleOffset: Math.random() * Math.PI * 2,
            });
        }

        return stars;
    }, [width, height, starCount]);

    // Draw frame
    const draw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw elliptical nebula gradient
        const centerX = width / 2;
        const centerY = height / 2;

        // Create radial gradient for nebula
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(width, height) * 0.5
        );
        gradient.addColorStop(0, "rgba(69, 162, 158, 0.15)");
        gradient.addColorStop(0.3, "rgba(102, 252, 241, 0.08)");
        gradient.addColorStop(0.6, "rgba(155, 89, 182, 0.05)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        // Draw elliptical shape
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, 0.7); // Flatten to ellipse
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.45, 0, Math.PI * 2);
        ctx.restore();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw stars
        starsRef.current.forEach((star) => {
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
            const alpha = star.brightness * (0.7 + twinkle * 0.3);

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
            ctx.fill();

            // Add glow for larger stars
            if (star.size > 2) {
                const glowGradient = ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.size * 3
                );
                glowGradient.addColorStop(0, `rgba(102, 252, 241, ${alpha * 0.3})`);
                glowGradient.addColorStop(1, "rgba(102, 252, 241, 0)");
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = glowGradient;
                ctx.fill();
            }
        });
    }, [width, height]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Generate stars on mount
        starsRef.current = generateStars();

        let startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = (currentTime - startTime) / 1000;
            draw(ctx, elapsed);
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [generateStars, draw]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 pointer-events-none"
            style={{
                filter: "blur(0.5px)",
                opacity: 0.9,
            }}
        />
    );
}
