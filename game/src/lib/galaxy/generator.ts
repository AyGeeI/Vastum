/**
 * Procedural Galaxy Generator
 * Creates a spiral galaxy with logarithmic arms and Gaussian distribution
 */

export interface Sector {
    id: string;
    x: number;           // World coordinates
    y: number;
    armIndex: number;    // Which spiral arm (0-3)
    distanceFromCore: number;
    brightness: number;  // 0-1
    size: number;        // Render size
    color: string;
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
}

const DEFAULT_CONFIG: GalaxyConfig = {
    numSectors: 500,
    numStars: 3000,
    numArms: 4,
    armSpread: 0.5,
    coreSize: 100,
    galaxyRadius: 2000,
    rotationFactor: 3,
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
    // Base angle for this arm
    const armAngle = (2 * Math.PI * armIndex) / numArms;

    // Logarithmic spiral: r = a * e^(b*theta)
    const theta = angle + armAngle;
    const spiralTwist = rotationFactor * (radius / 1000);

    // Add jitter for natural look
    const jitterAngle = (Math.random() - 0.5) * armSpread;
    const jitterRadius = gaussianRandom(0, radius * 0.1);

    const finalRadius = radius + jitterRadius;
    const finalAngle = theta + spiralTwist + jitterAngle;

    return {
        x: Math.cos(finalAngle) * finalRadius,
        y: Math.sin(finalAngle) * finalRadius * 0.6, // Flatten for perspective
    };
}

/**
 * Generate galaxy sectors (interactive objects)
 */
export function generateSectors(config: Partial<GalaxyConfig> = {}): Sector[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const sectors: Sector[] = [];

    // Core sectors (dense center)
    const numCoreSectors = Math.floor(cfg.numSectors * 0.2);
    for (let i = 0; i < numCoreSectors; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.abs(gaussianRandom(0, cfg.coreSize * 0.5));

        sectors.push({
            id: `core-${i}`,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance * 0.6,
            armIndex: -1,
            distanceFromCore: distance,
            brightness: 0.8 + Math.random() * 0.2,
            size: 8 + Math.random() * 6,
            color: `hsl(${180 + Math.random() * 40}, 70%, ${60 + Math.random() * 20}%)`,
            type: 'core',
            totalPlanets: Math.floor(Math.random() * 20) + 10,
            colonizedPlanets: Math.floor(Math.random() * 10),
            myPlanets: 0,
        });
    }

    // Arm sectors
    const numArmSectors = Math.floor(cfg.numSectors * 0.7);
    for (let i = 0; i < numArmSectors; i++) {
        const armIndex = i % cfg.numArms;
        // Use Gaussian distribution for distance (more near core)
        const distance = Math.abs(gaussianRandom(cfg.galaxyRadius * 0.4, cfg.galaxyRadius * 0.25));
        const clampedDistance = clamp(distance, cfg.coreSize, cfg.galaxyRadius);

        const angle = (distance / cfg.galaxyRadius) * Math.PI * 2;
        const point = spiralPoint(angle, armIndex, cfg.numArms, clampedDistance, cfg.rotationFactor, cfg.armSpread);

        const brightness = 1 - (clampedDistance / cfg.galaxyRadius) * 0.5;

        sectors.push({
            id: `arm-${armIndex}-${i}`,
            x: point.x,
            y: point.y,
            armIndex,
            distanceFromCore: clampedDistance,
            brightness: brightness * (0.7 + Math.random() * 0.3),
            size: 4 + Math.random() * 4,
            color: `hsl(${170 + armIndex * 20 + Math.random() * 20}, ${50 + Math.random() * 30}%, ${50 + Math.random() * 20}%)`,
            type: 'arm',
            totalPlanets: Math.floor(Math.random() * 15) + 5,
            colonizedPlanets: Math.floor(Math.random() * 5),
            myPlanets: 0,
        });
    }

    // Outer sectors (sparse)
    const numOuterSectors = cfg.numSectors - numCoreSectors - numArmSectors;
    for (let i = 0; i < numOuterSectors; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = cfg.galaxyRadius * 0.7 + Math.random() * cfg.galaxyRadius * 0.3;

        sectors.push({
            id: `outer-${i}`,
            x: Math.cos(angle) * distance + (Math.random() - 0.5) * 200,
            y: Math.sin(angle) * distance * 0.6 + (Math.random() - 0.5) * 100,
            armIndex: -1,
            distanceFromCore: distance,
            brightness: 0.3 + Math.random() * 0.3,
            size: 2 + Math.random() * 3,
            color: `hsl(${200 + Math.random() * 40}, 30%, ${40 + Math.random() * 20}%)`,
            type: 'outer',
            totalPlanets: Math.floor(Math.random() * 8) + 2,
            colonizedPlanets: Math.floor(Math.random() * 2),
            myPlanets: 0,
        });
    }

    return sectors;
}

/**
 * Generate background stars (non-interactive)
 */
export function generateStars(config: Partial<GalaxyConfig> = {}): Star[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const stars: Star[] = [];

    for (let i = 0; i < cfg.numStars; i++) {
        const layer = Math.floor(Math.random() * 3); // 0, 1, or 2
        const spreadFactor = 1 + layer * 0.3; // Far layers are more spread out

        // More stars near center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.abs(gaussianRandom(0, cfg.galaxyRadius * 0.6 * spreadFactor));

        stars.push({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance * 0.6,
            size: 0.5 + Math.random() * (1.5 - layer * 0.3),
            brightness: 0.3 + Math.random() * 0.7,
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
            if (dist < minDist && dist <= sector.size * 2) {
                minDist = dist;
                nearest = sector;
            }
        }

        return nearest;
    }
}
