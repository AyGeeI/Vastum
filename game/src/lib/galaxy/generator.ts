/**
 * Procedural Galaxy Generator
 * Creates a spiral galaxy with exactly 25 sectors (1-25) matching database
 * Uses seeded random for consistent appearance across page loads
 */

export interface Sector {
    id: string;
    dbSector: number;    // Maps to database sector (1-25)
    x: number;           // World coordinates
    y: number;
    armIndex: number;    // Which spiral arm (0-3)
    distanceFromCore: number;
    brightness: number;  // 0-1
    size: number;        // Render size
    type: 'core' | 'arm' | 'outer';
    // Game data (loaded from DB)
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
    numStars: number;        // Background stars
    numArms: number;         // Spiral arms (2-6)
    coreSize: number;        // Radius of dense core
    galaxyRadius: number;    // Total radius
    rotationFactor: number;  // How much the arms wind
    seed: number;            // Random seed for consistency
}

const DEFAULT_CONFIG: GalaxyConfig = {
    numStars: 1000,
    numArms: 4,
    coreSize: 120,
    galaxyRadius: 800,
    rotationFactor: 2.5,
    seed: 42,  // Fixed seed for consistent layout
};

/**
 * Seeded random number generator (mulberry32)
 */
function seededRandom(seed: number): () => number {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/**
 * Generate a spiral point with seeded random
 */
function spiralPoint(
    sectorIndex: number,
    numArms: number,
    coreSize: number,
    galaxyRadius: number,
    rotationFactor: number,
    random: () => number
): { x: number; y: number; armIndex: number; distance: number } {
    const armIndex = sectorIndex % numArms;

    // Distribute sectors along the radius with some variation
    const baseDistance = coreSize + ((sectorIndex / 25) * (galaxyRadius - coreSize));
    const distance = baseDistance + (random() - 0.5) * 100;

    // Base angle for this arm
    const armAngle = (2 * Math.PI * armIndex) / numArms;

    // Spiral twist increases with distance
    const spiralTwist = rotationFactor * (distance / galaxyRadius) * Math.PI;

    // Small jitter for natural look
    const jitterAngle = (random() - 0.5) * 0.4;

    const finalAngle = armAngle + spiralTwist + jitterAngle + (sectorIndex * 0.3);

    return {
        x: Math.cos(finalAngle) * distance,
        y: Math.sin(finalAngle) * distance * 0.6, // Flatten for perspective
        armIndex,
        distance,
    };
}

/**
 * Generate exactly 25 galaxy sectors (one per DB sector)
 */
export function generateSectors(config: Partial<GalaxyConfig> = {}): Sector[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const random = seededRandom(cfg.seed);
    const sectors: Sector[] = [];

    for (let dbSector = 1; dbSector <= 25; dbSector++) {
        const point = spiralPoint(
            dbSector - 1,
            cfg.numArms,
            cfg.coreSize,
            cfg.galaxyRadius,
            cfg.rotationFactor,
            random
        );

        // Determine type based on distance
        let type: 'core' | 'arm' | 'outer';
        if (point.distance < cfg.coreSize * 1.5) {
            type = 'core';
        } else if (point.distance > cfg.galaxyRadius * 0.75) {
            type = 'outer';
        } else {
            type = 'arm';
        }

        const brightness = 1 - (point.distance / cfg.galaxyRadius) * 0.4;

        sectors.push({
            id: `sector-${dbSector}`,
            dbSector,
            x: point.x,
            y: point.y,
            armIndex: point.armIndex,
            distanceFromCore: point.distance,
            brightness,
            size: type === 'core' ? 8 : type === 'arm' ? 6 : 5,
            type,
            totalPlanets: 0,  // Will be loaded from DB
            colonizedPlanets: 0,
            myPlanets: 0,
        });
    }

    console.log(`Generated ${sectors.length} unique sectors`);
    return sectors;
}

/**
 * Generate background stars with seeded random
 */
export function generateStars(config: Partial<GalaxyConfig> = {}): Star[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const random = seededRandom(cfg.seed + 1000); // Different seed for stars
    const stars: Star[] = [];

    for (let i = 0; i < cfg.numStars; i++) {
        const layer = Math.floor(random() * 3);
        const spreadFactor = 1 + layer * 0.4;

        const angle = random() * Math.PI * 2;
        // Gaussian-like distribution using Box-Muller approximation
        const u1 = random();
        const u2 = random();
        const gaussRandom = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
        const distance = Math.abs(gaussRandom * cfg.galaxyRadius * 0.6 * spreadFactor);

        stars.push({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance * 0.6,
            size: 0.3 + random() * (1 - layer * 0.2),
            brightness: 0.2 + random() * 0.5,
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
            if (dist < minDist && dist <= sector.size * 4) {
                minDist = dist;
                nearest = sector;
            }
        }

        return nearest;
    }
}
