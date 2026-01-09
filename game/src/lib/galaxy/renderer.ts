/**
 * Galaxy Renderer
 * Multi-layer Canvas rendering with parallax - OPTIMIZED
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

// Color constants matching legend
const COLORS = {
    ownPlanet: "#66FCF1",      // Cyan - Eigene Planeten
    ownPlanetDim: "#45A29E",
    otherPlayer: "#FF6B6B",    // Red - Andere Spieler  
    otherPlayerDim: "#CC5555",
    uncolonized: "#8899AA",    // Gray-blue - Unbesiedelt
    uncolonizedDim: "#667788",
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
    const offsetX = camera.state.x * 0.01;
    const offsetY = camera.state.y * 0.01;

    const coreGradient = ctx.createRadialGradient(
        width / 2 - offsetX, height / 2 - offsetY, 0,
        width / 2 - offsetX, height / 2 - offsetY, Math.max(width, height) * 0.5
    );
    coreGradient.addColorStop(0, "rgba(69, 162, 158, 0.12)");
    coreGradient.addColorStop(0.4, "rgba(102, 252, 241, 0.05)");
    coreGradient.addColorStop(0.7, "rgba(100, 80, 140, 0.03)");
    coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = coreGradient;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Render starfield with parallax - culled
 */
export function renderStars(
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    camera: Camera,
    config: RenderConfig = DEFAULT_RENDER_CONFIG
): void {
    const viewport = camera.getViewport();
    const margin = 100;

    for (const star of stars) {
        const parallaxFactor = 1 - star.layer * config.parallaxStrength;
        const worldX = star.x * parallaxFactor;
        const worldY = star.y * parallaxFactor;

        // Viewport culling in world space
        if (worldX < viewport.left - margin || worldX > viewport.right + margin ||
            worldY < viewport.top - margin || worldY > viewport.bottom + margin) {
            continue;
        }

        const x = camera.worldToScreenX(worldX);
        const y = camera.worldToScreenY(worldY);
        const size = star.size * Math.min(1, camera.state.zoom * 0.8);

        // Very small stars just as pixels
        if (size < 0.5) {
            ctx.fillStyle = `rgba(200, 210, 230, ${star.brightness * 0.5})`;
            ctx.fillRect(x, y, 1, 1);
        } else {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 210, 230, ${star.brightness * 0.7})`;
            ctx.fill();
        }
    }
}

/**
 * Render interactive sectors - with proper colors
 */
export function renderSectors(
    ctx: CanvasRenderingContext2D,
    sectors: Sector[],
    camera: Camera,
    hoveredSector: Sector | null,
    config: RenderConfig = DEFAULT_RENDER_CONFIG
): void {
    // Filter visible sectors first
    const visibleSectors = sectors.filter(s => camera.isVisible(s.x, s.y, 50));

    for (const sector of visibleSectors) {
        const screenX = camera.worldToScreenX(sector.x);
        const screenY = camera.worldToScreenY(sector.y);
        const baseSize = sector.size * camera.state.zoom;
        const isHovered = hoveredSector?.id === sector.id;
        const size = isHovered ? baseSize * 1.3 : baseSize;

        // Skip if too small
        if (size < 1) continue;

        // Determine color based on ownership
        let mainColor: string;
        let glowColor: string;

        if (sector.myPlanets > 0) {
            mainColor = isHovered ? COLORS.ownPlanet : COLORS.ownPlanetDim;
            glowColor = "rgba(102, 252, 241, ";
        } else if (sector.colonizedPlanets > 0) {
            mainColor = isHovered ? COLORS.otherPlayer : COLORS.otherPlayerDim;
            glowColor = "rgba(255, 107, 107, ";
        } else {
            mainColor = isHovered ? COLORS.uncolonized : COLORS.uncolonizedDim;
            glowColor = "rgba(136, 153, 170, ";
        }

        // Glow effect (only for visible size)
        if (config.glowEnabled && size > 2) {
            const glowSize = size * 2;
            const glowGradient = ctx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, glowSize
            );
            glowGradient.addColorStop(0, glowColor + (isHovered ? "0.4)" : "0.2)"));
            glowGradient.addColorStop(0.6, glowColor + "0.05)");
            glowGradient.addColorStop(1, glowColor + "0)");

            ctx.beginPath();
            ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = glowGradient;
            ctx.fill();
        }

        // Core of sector
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();

        // Brighter center
        if (size > 3) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, size * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fill();
        }

        // Hover ring
        if (isHovered) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, size + 4, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.ownPlanet;
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
    ctx.fillStyle = "rgba(200, 200, 220, 0.5)";
    ctx.font = "11px monospace";
    ctx.fillText(`Zoom: ${Math.round(camera.state.zoom * 100)}%`, 10, 20);

    // Hovered sector tooltip
    if (hoveredSector) {
        const screenX = camera.worldToScreenX(hoveredSector.x);
        const screenY = camera.worldToScreenY(hoveredSector.y);

        const tooltipX = Math.min(screenX + 15, width - 160);
        const tooltipY = Math.max(screenY - 55, 10);

        // Background
        ctx.fillStyle = "rgba(11, 12, 16, 0.92)";
        ctx.strokeStyle = "rgba(102, 252, 241, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, 150, 70, 6);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = "#66FCF1";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`Sektor ${hoveredSector.id.split("-").pop()}`, tooltipX + 10, tooltipY + 18);

        // Stats
        ctx.fillStyle = "#C5C6C7";
        ctx.font = "11px sans-serif";
        ctx.fillText(`Planeten: ${hoveredSector.totalPlanets}`, tooltipX + 10, tooltipY + 36);

        if (hoveredSector.myPlanets > 0) {
            ctx.fillStyle = COLORS.ownPlanet;
            ctx.fillText(`Eigene: ${hoveredSector.myPlanets}`, tooltipX + 10, tooltipY + 50);
        } else if (hoveredSector.colonizedPlanets > 0) {
            ctx.fillStyle = COLORS.otherPlayer;
            ctx.fillText(`Kolonisiert: ${hoveredSector.colonizedPlanets}`, tooltipX + 10, tooltipY + 50);
        } else {
            ctx.fillStyle = COLORS.uncolonizedDim;
            ctx.fillText(`Unbesiedelt`, tooltipX + 10, tooltipY + 50);
        }

        ctx.fillStyle = "#888";
        ctx.font = "10px sans-serif";
        ctx.fillText(`Klicke zum Erkunden`, tooltipX + 10, tooltipY + 64);
    }
}
