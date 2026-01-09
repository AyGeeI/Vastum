import { BuildingDefinition, BuildingType, Resources } from "@/types";

/**
 * Base resource costs for all buildings at level 1
 */
export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
    // ========================================
    // RESOURCE PRODUCTION
    // ========================================
    metal_mine: {
        type: "metal_mine",
        name: "Metallmine",
        description: "Fördert Metall aus der Planetenkruste. Grundlage jeder Kolonie.",
        category: "production",
        baseCost: { metal: 60, crystal: 15, deuterium: 0, energy: 0, rare_earth: 0 },
        costMultiplier: 1.5,
        baseBuildTime: 60, // 1 minute at level 1
        maxLevel: 50,
        requirements: [],
    },
    crystal_mine: {
        type: "crystal_mine",
        name: "Kristallmine",
        description: "Extrahiert Kristalle für fortschrittliche Technologien.",
        category: "production",
        baseCost: { metal: 48, crystal: 24, deuterium: 0, energy: 0, rare_earth: 0 },
        costMultiplier: 1.6,
        baseBuildTime: 75,
        maxLevel: 50,
        requirements: [],
    },
    deuterium_synthesizer: {
        type: "deuterium_synthesizer",
        name: "Deuterium-Synthesizer",
        description: "Gewinnt Deuterium aus der Atmosphäre. Treibstoff für Raumschiffe.",
        category: "production",
        baseCost: { metal: 225, crystal: 75, deuterium: 0, energy: 0, rare_earth: 0 },
        costMultiplier: 1.5,
        baseBuildTime: 120,
        maxLevel: 50,
        requirements: [{ building: "metal_mine", level: 3 }],
    },
    solar_plant: {
        type: "solar_plant",
        name: "Solarkraftwerk",
        description: "Wandelt Sonnenlicht in Energie um. Grundlegende Energieversorgung.",
        category: "production",
        baseCost: { metal: 75, crystal: 30, deuterium: 0, energy: 0, rare_earth: 0 },
        costMultiplier: 1.5,
        baseBuildTime: 60,
        maxLevel: 50,
        requirements: [],
    },
    fusion_reactor: {
        type: "fusion_reactor",
        name: "Fusionsreaktor",
        description: "Erzeugt massive Energiemengen durch Kernfusion. Verbraucht Deuterium.",
        category: "production",
        baseCost: { metal: 900, crystal: 360, deuterium: 180, energy: 0, rare_earth: 0 },
        costMultiplier: 1.8,
        baseBuildTime: 300,
        maxLevel: 30,
        requirements: [
            { building: "deuterium_synthesizer", level: 5 },
            { building: "research_lab", level: 3 },
        ],
    },

    // ========================================
    // STORAGE
    // ========================================
    metal_storage: {
        type: "metal_storage",
        name: "Metallspeicher",
        description: "Lagert überschüssiges Metall sicher ein.",
        category: "storage",
        baseCost: { metal: 1000, crystal: 0, deuterium: 0, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 90,
        maxLevel: 20,
        requirements: [],
    },
    crystal_storage: {
        type: "crystal_storage",
        name: "Kristallspeicher",
        description: "Spezielle Lagerhallen für empfindliche Kristalle.",
        category: "storage",
        baseCost: { metal: 1000, crystal: 500, deuterium: 0, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 90,
        maxLevel: 20,
        requirements: [],
    },
    deuterium_tank: {
        type: "deuterium_tank",
        name: "Deuteriumtank",
        description: "Druckbehälter zur Lagerung von flüssigem Deuterium.",
        category: "storage",
        baseCost: { metal: 1000, crystal: 1000, deuterium: 0, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 90,
        maxLevel: 20,
        requirements: [{ building: "deuterium_synthesizer", level: 1 }],
    },

    // ========================================
    // INFRASTRUCTURE
    // ========================================
    command_center: {
        type: "command_center",
        name: "Kommandozentrale",
        description: "Koordiniert alle planetaren Operationen. Erhöht Bauslots.",
        category: "infrastructure",
        baseCost: { metal: 400, crystal: 200, deuterium: 100, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 180,
        maxLevel: 10,
        requirements: [],
    },
    research_lab: {
        type: "research_lab",
        name: "Forschungslabor",
        description: "Ermöglicht die Erforschung neuer Technologien.",
        category: "infrastructure",
        baseCost: { metal: 200, crystal: 400, deuterium: 200, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 240,
        maxLevel: 20,
        requirements: [{ building: "command_center", level: 1 }],
    },
    shipyard: {
        type: "shipyard",
        name: "Raumschiffwerft",
        description: "Baut und repariert Raumschiffe aller Klassen.",
        category: "infrastructure",
        baseCost: { metal: 400, crystal: 200, deuterium: 100, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 300,
        maxLevel: 20,
        requirements: [{ building: "command_center", level: 2 }],
    },
    defense_factory: {
        type: "defense_factory",
        name: "Verteidigungsanlage",
        description: "Produziert planetare Verteidigungssysteme.",
        category: "infrastructure",
        baseCost: { metal: 300, crystal: 300, deuterium: 150, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 300,
        maxLevel: 20,
        requirements: [{ building: "shipyard", level: 2 }],
    },

    // ========================================
    // SPECIAL
    // ========================================
    sensor_station: {
        type: "sensor_station",
        name: "Sensorstation",
        description: "Erkennt eingehende Flotten frühzeitig. Höheres Level = frühere Warnung.",
        category: "special",
        baseCost: { metal: 500, crystal: 1000, deuterium: 500, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 600,
        maxLevel: 15,
        requirements: [{ building: "research_lab", level: 5 }],
    },
    trade_post: {
        type: "trade_post",
        name: "Handelsposten",
        description: "Ermöglicht Zugang zum galaktischen Marktplatz.",
        category: "special",
        baseCost: { metal: 1000, crystal: 500, deuterium: 500, energy: 0, rare_earth: 0 },
        costMultiplier: 2.0,
        baseBuildTime: 600,
        maxLevel: 10,
        requirements: [{ building: "command_center", level: 3 }],
    },
};

/**
 * Calculate the cost of upgrading a building to the next level
 */
export function calculateBuildingCost(
    type: BuildingType,
    currentLevel: number
): Resources {
    const def = BUILDING_DEFINITIONS[type];
    const multiplier = Math.pow(def.costMultiplier, currentLevel);

    return {
        metal: Math.floor(def.baseCost.metal * multiplier),
        crystal: Math.floor(def.baseCost.crystal * multiplier),
        deuterium: Math.floor(def.baseCost.deuterium * multiplier),
        energy: Math.floor(def.baseCost.energy * multiplier),
        rare_earth: Math.floor(def.baseCost.rare_earth * multiplier),
    };
}

/**
 * Calculate build time for a building upgrade (in seconds)
 * Formula: baseBuildTime * (level + 1)^1.5 / (1 + commandCenterLevel * 0.1)
 */
export function calculateBuildTime(
    type: BuildingType,
    targetLevel: number,
    commandCenterLevel: number = 0
): number {
    const def = BUILDING_DEFINITIONS[type];
    const baseTime = def.baseBuildTime * Math.pow(targetLevel, 1.5);
    const speedBonus = 1 + commandCenterLevel * 0.1;
    return Math.ceil(baseTime / speedBonus);
}

/**
 * Calculate resource production per hour for a mine at given level
 */
export function calculateProduction(
    type: "metal_mine" | "crystal_mine" | "deuterium_synthesizer",
    level: number,
    planetBonus: number = 1.0
): number {
    const baseProduction: Record<string, number> = {
        metal_mine: 30,
        crystal_mine: 20,
        deuterium_synthesizer: 10,
    };

    // Formula: base * level * 1.1^level * planetBonus
    const production = baseProduction[type] * level * Math.pow(1.1, level) * planetBonus;
    return Math.floor(production);
}

/**
 * Calculate energy production from solar plant
 */
export function calculateSolarEnergy(level: number, planetBonus: number = 1.0): number {
    // Formula: 20 * level * 1.1^level
    return Math.floor(20 * level * Math.pow(1.1, level) * planetBonus);
}

/**
 * Calculate energy consumption for a mine
 */
export function calculateEnergyConsumption(
    type: "metal_mine" | "crystal_mine" | "deuterium_synthesizer",
    level: number
): number {
    const baseConsumption: Record<string, number> = {
        metal_mine: 10,
        crystal_mine: 10,
        deuterium_synthesizer: 20,
    };

    // Formula: base * level * 1.1^level
    return Math.floor(baseConsumption[type] * level * Math.pow(1.1, level));
}

/**
 * Calculate storage capacity
 */
export function calculateStorageCapacity(level: number): number {
    // Formula: 5000 * floor(2.5 * e^(20*level/33))
    return Math.floor(5000 * Math.floor(2.5 * Math.exp((20 * level) / 33)));
}
