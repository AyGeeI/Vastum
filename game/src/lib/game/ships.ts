import { ShipDefinition, ShipType, Resources } from "@/types";

/**
 * Ship definitions with combat stats, costs, and requirements
 */
export const SHIP_DEFINITIONS: Record<ShipType, ShipDefinition> = {
    fighter: {
        type: "fighter",
        name: "Jäger",
        description: "Schneller, wendiger Abfangjäger. Effektiv gegen Bomber.",
        attack: 50,
        defense: 40,
        shields: 10,
        speed: 12500,
        cargo_capacity: 50,
        fuel_consumption: 20,
        cost: { metal: 3000, crystal: 1000, deuterium: 0, energy: 0, rare_earth: 0 },
        buildTime: 120,
        requirements: [{ building: "shipyard", level: 1 }],
    },
    bomber: {
        type: "bomber",
        name: "Bomber",
        description: "Schwerer Angriffsträger mit verheerender Feuerkraft gegen große Ziele.",
        attack: 1000,
        defense: 75,
        shields: 500,
        speed: 4000,
        cargo_capacity: 500,
        fuel_consumption: 700,
        cost: { metal: 50000, crystal: 25000, deuterium: 15000, energy: 0, rare_earth: 0 },
        buildTime: 1800,
        requirements: [{ building: "shipyard", level: 8 }],
    },
    cruiser: {
        type: "cruiser",
        name: "Kreuzer",
        description: "Ausgewogenes Kampfschiff für vielseitige Einsätze.",
        attack: 400,
        defense: 120,
        shields: 50,
        speed: 15000,
        cargo_capacity: 800,
        fuel_consumption: 300,
        cost: { metal: 20000, crystal: 7000, deuterium: 2000, energy: 0, rare_earth: 0 },
        buildTime: 600,
        requirements: [{ building: "shipyard", level: 5 }],
    },
    battleship: {
        type: "battleship",
        name: "Schlachtschiff",
        description: "Schwer gepanzertes Flaggschiff mit massiver Feuerkraft.",
        attack: 1000,
        defense: 700,
        shields: 400,
        speed: 10000,
        cargo_capacity: 1500,
        fuel_consumption: 500,
        cost: { metal: 45000, crystal: 15000, deuterium: 0, energy: 0, rare_earth: 0 },
        buildTime: 1200,
        requirements: [{ building: "shipyard", level: 7 }],
    },
    transporter: {
        type: "transporter",
        name: "Großer Transporter",
        description: "Unbewaffnetes Frachtschiff mit hoher Ladekapazität.",
        attack: 5,
        defense: 35,
        shields: 25,
        speed: 7500,
        cargo_capacity: 25000,
        fuel_consumption: 250,
        cost: { metal: 6000, crystal: 6000, deuterium: 0, energy: 0, rare_earth: 0 },
        buildTime: 300,
        requirements: [{ building: "shipyard", level: 4 }],
    },
    spy_probe: {
        type: "spy_probe",
        name: "Spionagesonde",
        description: "Unsichtbare Aufklärungsdrohne. Sammelt Informationen über feindliche Planeten.",
        attack: 0,
        defense: 1,
        shields: 0,
        speed: 100000000, // Very fast
        cargo_capacity: 5,
        fuel_consumption: 1,
        cost: { metal: 0, crystal: 1000, deuterium: 0, energy: 0, rare_earth: 0 },
        buildTime: 30,
        requirements: [{ building: "shipyard", level: 3 }],
    },
};

/**
 * Calculate the cost to build a number of ships
 */
export function calculateShipCost(type: ShipType, count: number): Resources {
    const def = SHIP_DEFINITIONS[type];
    return {
        metal: def.cost.metal * count,
        crystal: def.cost.crystal * count,
        deuterium: def.cost.deuterium * count,
        energy: 0,
        rare_earth: def.cost.rare_earth * count,
    };
}

/**
 * Calculate build time for ships (in seconds)
 * Shipyard level reduces build time
 */
export function calculateShipBuildTime(
    type: ShipType,
    count: number,
    shipyardLevel: number
): number {
    const def = SHIP_DEFINITIONS[type];
    const speedBonus = 1 + shipyardLevel * 0.1;
    return Math.ceil((def.buildTime * count) / speedBonus);
}

/**
 * Calculate fuel consumption for a fleet movement
 */
export function calculateFuelConsumption(
    ships: Partial<Record<ShipType, number>>,
    distance: number
): number {
    let totalFuel = 0;

    for (const [type, count] of Object.entries(ships)) {
        if (count && count > 0) {
            const def = SHIP_DEFINITIONS[type as ShipType];
            // Fuel = baseConsumption * count * (distance / 1000)
            totalFuel += def.fuel_consumption * count * (distance / 1000);
        }
    }

    return Math.ceil(totalFuel);
}

/**
 * Calculate fleet travel time based on slowest ship
 */
export function calculateFleetSpeed(ships: Partial<Record<ShipType, number>>): number {
    let slowestSpeed = Infinity;

    for (const [type, count] of Object.entries(ships)) {
        if (count && count > 0) {
            const def = SHIP_DEFINITIONS[type as ShipType];
            slowestSpeed = Math.min(slowestSpeed, def.speed);
        }
    }

    return slowestSpeed === Infinity ? 0 : slowestSpeed;
}

/**
 * Calculate total cargo capacity of a fleet
 */
export function calculateCargoCapacity(ships: Partial<Record<ShipType, number>>): number {
    let totalCargo = 0;

    for (const [type, count] of Object.entries(ships)) {
        if (count && count > 0) {
            const def = SHIP_DEFINITIONS[type as ShipType];
            totalCargo += def.cargo_capacity * count;
        }
    }

    return totalCargo;
}
