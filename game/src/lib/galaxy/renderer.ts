/**
 * Galaxy Renderer
 * Multi-layer Canvas rendering with parallax
 */

import type { Sector, Star } from "./generator";
import type { Camera } from "./camera";

export interface RenderConfig {
    showGrid: boolean;
    showCoordinates: boolean;
    glowEnabled: boolean;
    parallaxStrength: number;
}

const DEFAULT_RENDER_CONFIG: RenderConfig = {
    showGrid: false,
    showCoordinates: false,
    glowEnabled: true,
    parallaxStrength: 0.3,
};

/**
 * Render nebula background
 */
export function renderNebula(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Camera
): void {
    // Subtle gradient that moves with camera
    const offsetX = camera.state.x * 0.02;
    const offsetY = camera.state.y * 0.02;

    // Core glow
    const coreGradient = ctx.createRadialGradient(
        width / 2 - offsetX, height / 2 - offsetY, 0,
        width / 2 - offsetX, height / 2 - offsetY, Math.max(width, height) * 0.6
    );
    coreGradient.addColorStop(0, "rgba(69, 162, 158, 0.15)");
    coreGradient.addColorStop(0.3, "rgba(102, 252, 241, 0.08)");
    coreGradient.addColorStop(0.6, "rgba(155, 89, 182, 0.04)");
    coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = coreGradient;
    ctx.fillRect(0, 0, width, height);

    // Secondary nebula patches
    const patch1 = ctx.createRadialGradient(
        width * 0.3 - offsetX * 0.5, height * 0.4 - offsetY * 0.5, 0,
        width * 0.3 - offsetX * 0.5, height * 0.4 - offsetY * 0.5, width * 0.3
    );
    patch1.addColorStop(0, "rgba(155, 89, 182, 0.1)");
    patch1.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = patch1;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Render starfield with parallax
 */
export function renderStars(
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    camera: Camera,
    config: RenderConfig = DEFAULT_RENDER_CONFIG
): void {
    const viewport = camera.getViewport();

    for (const star of stars) {
        // Apply parallax based on layer (far stars move less)
        const parallaxFactor = 1 - star.layer * config.parallaxStrength;
        const x = camera.worldToScreenX(star.x * parallaxFactor);
        const y = camera.worldToScreenY(star.y * parallaxFactor);

        // Simple culling
        if (x < -10 || x > viewport.width + 10 || y < -10 || y > viewport.height + 10) {
            continue;
        }

        const size = star.size * (0.5 + camera.state.zoom * 0.5);
        const alpha = star.brightness * (0.5 + star.layer * 0.2);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.fill();
    }
}

/**
 * Render interactive sectors
 */
export function renderSectors(
    ctx: CanvasRenderingContext2D,
    sectors: Sector[],
    camera: Camera,
    hoveredSector: Sector | null,
    config: RenderConfig = DEFAULT_RENDER_CONFIG
): void {
    const viewport = camera.getViewport();

    // Sort by distance for proper z-ordering
    const visibleSectors = sectors.filter(s => camera.isVisible(s.x, s.y, 100));

    for (const sector of visibleSectors) {
        const screenX = camera.worldToScreenX(sector.x);
        const screenY = camera.worldToScreenY(sector.y);
        const size = sector.size * camera.state.zoom;
        const isHovered = hoveredSector?.id === sector.id;

        // Skip if too small
        if (size < 1) continue;

        // Glow effect
        if (config.glowEnabled && size > 3) {
            const glowSize = size * (isHovered ? 4 : 2.5);
            const glowGradient = ctx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, glowSize
            );

            let glowColor: string;
            if (sector.myPlanets > 0) {
                glowColor = "rgba(102, 252, 241, ";
            } else if (sector.colonizedPlanets > 0) {
                glowColor = "rgba(255, 107, 107, ";
            } else {
                glowColor = "rgba(200, 200, 220, ";
            }

            glowGradient.addColorStop(0, glowColor + (isHovered ? "0.6)" : "0.3)"));
            glowGradient.addColorStop(0.5, glowColor + (isHovered ? "0.2)" : "0.1)"));
            glowGradient.addColorStop(1, glowColor + "0)");

            ctx.beginPath();
            ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
        }

        // Core of sector
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);

        if (sector.myPlanets > 0) {
            ctx.fillStyle = isHovered ? "#66FCF1" : "#45A29E";
        } else if (sector.colonizedPlanets > 0) {
            ctx.fillStyle = isHovered ? "#FF8888" : "#FF6B6B";
        } else {
            ctx.fillStyle = isHovered ? "#CCCCDD" : sector.color;
        }
        ctx.fill();

        // Brighter center
        if (size > 4) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, size * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fill();
        }

        // Hover ring
        if (isHovered) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, size * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = "#66FCF1";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

/**
 * Render UI overlays (sector info, coordinates)
 */
export function renderOverlay(
    ctx: CanvasRenderingContext2D,
    hoveredSector: Sector | null,
    camera: Camera,
    width: number,
    height: number
): void {
    // Zoom indicator
    ctx.fillStyle = "rgba(200, 200, 220, 0.6)";
    ctx.font = "12px monospace";
    ctx.fillText(`Zoom: ${Math.round(camera.state.zoom * 100)}%`, 10, 20);
    ctx.fillText(`Pos: ${Math.round(camera.state.x)}, ${Math.round(camera.state.y)}`, 10, 36);

    // Hovered sector tooltip
    if (hoveredSector) {
        const screenX = camera.worldToScreenX(hoveredSector.x);
        const screenY = camera.worldToScreenY(hoveredSector.y);

        const tooltipX = Math.min(screenX + 20, width - 180);
        const tooltipY = Math.max(screenY - 60, 10);

        // Background
        ctx.fillStyle = "rgba(11, 12, 16, 0.9)";
        ctx.strokeStyle = "rgba(102, 252, 241, 0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, 170, 80, 8);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = "#66FCF1";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(`Sektor ${hoveredSector.id.split("-")[1] || hoveredSector.id}`, tooltipX + 10, tooltipY + 20);

        ctx.fillStyle = "#C5C6C7";
        ctx.font = "12px sans-serif";
        ctx.fillText(`Planeten: ${hoveredSector.totalPlanets}`, tooltipX + 10, tooltipY + 40);
        ctx.fillText(`Kolonisiert: ${hoveredSector.colonizedPlanets}`, tooltipX + 10, tooltipY + 55);
        ctx.fillText(`Eigene: ${hoveredSector.myPlanets}`, tooltipX + 10, tooltipY + 70);
    }
}
