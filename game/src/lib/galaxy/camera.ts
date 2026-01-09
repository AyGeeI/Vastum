/**
 * Camera system for galaxy map
 * Handles zoom, pan, and coordinate transformations
 */

export interface CameraState {
    x: number;          // Camera center X (world coords)
    y: number;          // Camera center Y (world coords)
    zoom: number;       // Zoom level (1 = 100%)
    targetX: number;    // Smooth pan target
    targetY: number;
    targetZoom: number; // Smooth zoom target
}

export interface Viewport {
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export class Camera {
    state: CameraState;
    private viewportWidth: number = 800;
    private viewportHeight: number = 600;
    private minZoom: number = 0.2;
    private maxZoom: number = 5;
    private easing: number = 0.1;

    constructor(initialX: number = 0, initialY: number = 0, initialZoom: number = 1) {
        this.state = {
            x: initialX,
            y: initialY,
            zoom: initialZoom,
            targetX: initialX,
            targetY: initialY,
            targetZoom: initialZoom,
        };
    }

    setViewport(width: number, height: number): void {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    /**
     * Update camera position with smooth easing
     */
    update(): void {
        const dx = this.state.targetX - this.state.x;
        const dy = this.state.targetY - this.state.y;
        const dz = this.state.targetZoom - this.state.zoom;

        this.state.x += dx * this.easing;
        this.state.y += dy * this.easing;
        this.state.zoom += dz * this.easing;
    }

    /**
     * Move camera to position
     */
    moveTo(x: number, y: number): void {
        this.state.targetX = x;
        this.state.targetY = y;
    }

    /**
     * Pan camera by delta
     */
    pan(dx: number, dy: number): void {
        this.state.targetX += dx / this.state.zoom;
        this.state.targetY += dy / this.state.zoom;
    }

    /**
     * Zoom camera, centered on a point
     */
    zoomAt(delta: number, screenX: number, screenY: number): void {
        const oldZoom = this.state.targetZoom;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, oldZoom * (1 + delta)));

        // Zoom toward mouse position
        const worldX = this.screenToWorldX(screenX);
        const worldY = this.screenToWorldY(screenY);

        this.state.targetZoom = newZoom;

        // Adjust position to zoom toward point
        const zoomFactor = newZoom / oldZoom;
        this.state.targetX = worldX - (worldX - this.state.targetX) / zoomFactor;
        this.state.targetY = worldY - (worldY - this.state.targetY) / zoomFactor;
    }

    /**
     * Set zoom level directly
     */
    setZoom(zoom: number): void {
        this.state.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }

    /**
     * Get visible viewport in world coordinates
     */
    getViewport(): Viewport {
        const halfWidth = (this.viewportWidth / 2) / this.state.zoom;
        const halfHeight = (this.viewportHeight / 2) / this.state.zoom;

        return {
            width: this.viewportWidth,
            height: this.viewportHeight,
            left: this.state.x - halfWidth,
            right: this.state.x + halfWidth,
            top: this.state.y - halfHeight,
            bottom: this.state.y + halfHeight,
        };
    }

    /**
     * Check if a point is visible
     */
    isVisible(x: number, y: number, margin: number = 50): boolean {
        const vp = this.getViewport();
        return x >= vp.left - margin && x <= vp.right + margin &&
            y >= vp.top - margin && y <= vp.bottom + margin;
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorldX(screenX: number): number {
        return this.state.x + (screenX - this.viewportWidth / 2) / this.state.zoom;
    }

    screenToWorldY(screenY: number): number {
        return this.state.y + (screenY - this.viewportHeight / 2) / this.state.zoom;
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreenX(worldX: number): number {
        return (worldX - this.state.x) * this.state.zoom + this.viewportWidth / 2;
    }

    worldToScreenY(worldY: number): number {
        return (worldY - this.state.y) * this.state.zoom + this.viewportHeight / 2;
    }

    /**
     * Apply camera transformation to canvas context
     */
    applyTransform(ctx: CanvasRenderingContext2D): void {
        ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);
        ctx.scale(this.state.zoom, this.state.zoom);
        ctx.translate(-this.state.x, -this.state.y);
    }

    /**
     * Reset camera transformation
     */
    resetTransform(ctx: CanvasRenderingContext2D): void {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
