/**
 * Procedural Galaxy Generator
 * Creates a spiral galaxy with logarithmic arms and Gaussian distribution
 * OPTIMIZED for performance with spacing and culling
 */

export interface Sector {
    id: string;
    x: number;           // World coordinates
    y: number;
    armIndex: number;    // Which spiral arm (0-3)
    distanceFromCore: number;
    brightness: number;  // 0-1
    size: number;        // Render size
    type: 'core' | 'arm' | 'outer';
    // Game data
    totalPlanets: number;
    colonizedPlanets: number;
    myPlanets: number;
}

export interface Star {
    x: number;
    y: number;
    size: number;
    brightness: number;
    layer: number;  // For parallax (0 = far, 2 = close)
}

export interface GalaxyConfig {
    numSectors: number;      // Total interactive sectors
    numStars: number;        // Background stars
    numArms: number;         // Spiral arms (2-6)
    armSpread: number;       // How tight the arms are (0.3-0.8)
    coreSize: number;        // Radius of dense core
    galaxyRadius: number;    // Total radius
    rotationFactor: number;  // How much the arms wind
    minSectorSpacing: number; // Minimum distance between sectors
}

const DEFAULT_CONFIG: GalaxyConfig = {
    numSectors: 150,         // Reduced from 800
    numStars: 1000,          // Reduced from 4000
    numArms: 4,
    armSpread: 0.4,
    coreSize: 150,
    galaxyRadius: 1500,
    rotationFactor: 2.5,
    minSectorSpacing: 60,    // Minimum pixels between sectors
};

/**
 * Gaussian random number (Box-Muller transform)
 */
function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Check if a point is too close to existing sectors
 */
function isTooClose(x: number, y: number, sectors: Sector[], minDistance: number): boolean {
    for (const sector of sectors) {
        const dx = sector.x - x;
        const dy = sector.y - y;
        if (dx * dx + dy * dy < minDistance * minDistance) {
            return true;
        }
    }
    return false;
}

/**
 * Generate a logarithmic spiral point
 */
function spiralPoint(
    angle: number,
    armIndex: number,
    numArms: number,
    radius: number,
    rotationFactor: number,
    armSpread: number
): { x: number; y: number } {
    const armAngle = (2 * Math.PI * armIndex) / numArms;
    const theta = angle + armAngle;
    const spiralTwist = rotationFactor * (radius / 1000);

    // Reduced jitter for cleaner spacing
    const jitterAngle = (Math.random() - 0.5) * armSpread * 0.5;
    const jitterRadius = gaussianRandom(0, radius * 0.05);

    const finalRadius = radius + jitterRadius;
    const finalAngle = theta + spiralTwist + jitterAngle;

    return {
        x: Math.cos(finalAngle) * finalRadius,
        y: Math.sin(finalAngle) * finalRadius * 0.6,
    };
}

/**
 * Generate galaxy sectors with proper spacing
 */
export function generateSectors(config: Partial<GalaxyConfig> = {}): Sector[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const sectors: Sector[] = [];
    const maxAttempts = cfg.numSectors * 10;
    let attempts = 0;

    // Core sectors (dense center) - fewer sectors
    const numCoreSectors = Math.floor(cfg.numSectors * 0.15);
    while (sectors.filter(s => s.type === 'core').length < numCoreSectors && attempts < maxAttempts) {
        attempts++;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.abs(gaussianRandom(0, cfg.coreSize * 0.4));
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance * 0.6;

        if (!isTooClose(x, y, sectors, cfg.minSectorSpacing * 0.8)) {
            sectors.push({
                id: `core-${sectors.length}`,
                x,
                y,
                armIndex: -1,
                distanceFromCore: distance,
                brightness: 0.9,
                size: 6,
                type: 'core',
                totalPlanets: Math.floor(Math.random() * 15) + 10,
                colonizedPlanets: Math.floor(Math.random() * 8),
                myPlanets: Math.random() < 0.1 ? 1 : 0,  // 10% chance of having own planet
            });
        }
    }

    // Arm sectors - spread along spiral arms
    const numArmSectors = Math.floor(cfg.numSectors * 0.7);
    attempts = 0;
    while (sectors.filter(s => s.type === 'arm').length < numArmSectors && attempts < maxAttempts) {
        attempts++;
        const armIndex = Math.floor(Math.random() * cfg.numArms);
        const distance = cfg.coreSize + Math.random() * (cfg.galaxyRadius - cfg.coreSize);
        const angle = (distance / cfg.galaxyRadius) * Math.PI * 2.5;
        const point = spiralPoint(angle, armIndex, cfg.numArms, distance, cfg.rotationFactor, cfg.armSpread);

        if (!isTooClose(point.x, point.y, sectors, cfg.minSectorSpacing)) {
            const brightness = 1 - (distance / cfg.galaxyRadius) * 0.4;
            sectors.push({
                id: `arm-${sectors.length}`,
                x: point.x,
                y: point.y,
                armIndex,
                distanceFromCore: distance,
                brightness,
                size: 4 + Math.random() * 2,
                type: 'arm',
                totalPlanets: Math.floor(Math.random() * 12) + 5,
                colonizedPlanets: Math.floor(Math.random() * 4),
                myPlanets: Math.random() < 0.05 ? 1 : 0,  // 5% chance
            });
        }
    }

    // Outer sectors (sparse)
    const numOuterSectors = cfg.numSectors - sectors.length;
    attempts = 0;
    while (sectors.filter(s => s.type === 'outer').length < numOuterSectors && attempts < maxAttempts) {
        attempts++;
        const angle = Math.random() * Math.PI * 2;
        const distance = cfg.galaxyRadius * 0.8 + Math.random() * cfg.galaxyRadius * 0.2;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance * 0.6;

        if (!isTooClose(x, y, sectors, cfg.minSectorSpacing * 1.2)) {
            sectors.push({
                id: `outer-${sectors.length}`,
                x,
                y,
                armIndex: -1,
                distanceFromCore: distance,
                brightness: 0.4,
                size: 3,
                type: 'outer',
                totalPlanets: Math.floor(Math.random() * 6) + 2,
                colonizedPlanets: Math.floor(Math.random() * 2),
                myPlanets: 0,
            });
        }
    }

    console.log(`Generated ${sectors.length} sectors`);
    return sectors;
}

/**
 * Generate background stars (non-interactive) - optimized
 */
export function generateStars(config: Partial<GalaxyConfig> = {}): Star[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const stars: Star[] = [];

    for (let i = 0; i < cfg.numStars; i++) {
        const layer = Math.floor(Math.random() * 3);
        const spreadFactor = 1 + layer * 0.4;

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.abs(gaussianRandom(0, cfg.galaxyRadius * 0.7 * spreadFactor));

        stars.push({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance * 0.6,
            size: 0.3 + Math.random() * (1 - layer * 0.2),
            brightness: 0.2 + Math.random() * 0.5,
            layer,
        });
    }

    return stars;
}

/**
 * Spatial hash for fast sector lookup
 */
export class SpatialHash {
    private cellSize: number;
    private grid: Map<string, Sector[]> = new Map();

    constructor(cellSize: number = 100) {
        this.cellSize = cellSize;
    }

    private getKey(x: number, y: number): string {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    insert(sector: Sector): void {
        const key = this.getKey(sector.x, sector.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key)!.push(sector);
    }

    insertAll(sectors: Sector[]): void {
        sectors.forEach(s => this.insert(s));
    }

    query(x: number, y: number, radius: number): Sector[] {
        const results: Sector[] = [];
        const minCellX = Math.floor((x - radius) / this.cellSize);
        const maxCellX = Math.floor((x + radius) / this.cellSize);
        const minCellY = Math.floor((y - radius) / this.cellSize);
        const maxCellY = Math.floor((y + radius) / this.cellSize);

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const sector of cell) {
                        const dx = sector.x - x;
                        const dy = sector.y - y;
                        if (dx * dx + dy * dy <= radius * radius) {
                            results.push(sector);
                        }
                    }
                }
            }
        }

        return results;
    }

    findNearest(x: number, y: number, maxDistance: number = 50): Sector | null {
        const candidates = this.query(x, y, maxDistance);
        if (candidates.length === 0) return null;

        let nearest: Sector | null = null;
        let minDist = Infinity;

        for (const sector of candidates) {
            const dx = sector.x - x;
            const dy = sector.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist && dist <= sector.size * 3) {
                minDist = dist;
                nearest = sector;
            }
        }

        return nearest;
    }
}
