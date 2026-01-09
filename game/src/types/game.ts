// ========================================
// User & Authentication Types
// ========================================

export interface User {
    id: string;
    google_id: string;
    name: string;
    email: string;
    avatar_url?: string;
    alliance_id?: string;
    created_at: string;
    last_login: string;
    is_protected: boolean; // Newbie protection
    protection_until?: string;
}

// ========================================
// Galaxy & Planet Types
// ========================================

export type PlanetType =
    | "terra"      // Balanced, starter planets
    | "desert"     // +30% energy, -20% crystal
    | "ice"        // +50% deuterium, less energy
    | "volcano"    // +40% metal, expensive to build
    | "gas_giant"  // Deuterium only
    | "asteroid";  // High rare earth

export interface Planet {
    id: string;
    name: string;
    owner_id?: string;
    type: PlanetType;
    position_x: number;
    position_y: number;
    size: number; // Affects max buildings
    temperature: number;
    is_starter: boolean;

    // Resource bonuses (multipliers)
    metal_bonus: number;
    crystal_bonus: number;
    deuterium_bonus: number;
    energy_bonus: number;
    rare_earth_bonus: number;

    created_at: string;
    updated_at: string;
}

// ========================================
// Resource Types
// ========================================

export interface Resources {
    metal: number;
    crystal: number;
    deuterium: number;
    energy: number;
    rare_earth: number;
}

export interface PlanetResources {
    id: string;
    planet_id: string;

    // Current amounts
    metal: number;
    crystal: number;
    deuterium: number;
    rare_earth: number;

    // Production per hour
    metal_production: number;
    crystal_production: number;
    deuterium_production: number;
    energy_production: number;
    energy_consumption: number;

    // Storage capacity
    metal_capacity: number;
    crystal_capacity: number;
    deuterium_capacity: number;

    last_updated: string;
}

// ========================================
// Building Types
// ========================================

export type BuildingType =
    // Resource Production
    | "metal_mine"
    | "crystal_mine"
    | "deuterium_synthesizer"
    | "solar_plant"
    | "fusion_reactor"
    // Storage
    | "metal_storage"
    | "crystal_storage"
    | "deuterium_tank"
    // Infrastructure
    | "command_center"
    | "research_lab"
    | "shipyard"
    | "defense_factory"
    // Special
    | "sensor_station"
    | "trade_post";

export interface BuildingDefinition {
    type: BuildingType;
    name: string;
    description: string;
    category: "production" | "storage" | "infrastructure" | "special";
    baseCost: Resources;
    costMultiplier: number; // Cost = baseCost * multiplier^level
    baseBuildTime: number; // in seconds
    maxLevel: number;
    requirements: { building: BuildingType; level: number }[];
}

export interface Building {
    id: string;
    planet_id: string;
    type: BuildingType;
    level: number;
    is_upgrading: boolean;
    upgrade_finish_at?: string;
    created_at: string;
    updated_at: string;
}

// ========================================
// Fleet & Ship Types
// ========================================

export type ShipType =
    | "fighter"      // Fast, cheap, anti-bomber
    | "bomber"       // High damage, anti-capital
    | "cruiser"      // Balanced allrounder
    | "battleship"   // Heavy armor, high firepower
    | "transporter"  // Resource transport, no weapons
    | "spy_probe";   // Reconnaissance, invisible

export interface ShipDefinition {
    type: ShipType;
    name: string;
    description: string;
    attack: number;
    defense: number;
    shields: number;
    speed: number;
    cargo_capacity: number;
    fuel_consumption: number;
    cost: Resources;
    buildTime: number;
    requirements: { building: BuildingType; level: number }[];
}

export interface Fleet {
    id: string;
    owner_id: string;
    name: string;
    current_planet_id: string;
    ships: Record<ShipType, number>;
    created_at: string;
}

export type FleetMissionType =
    | "attack"
    | "transport"
    | "spy"
    | "colonize"
    | "deploy";

export interface FleetMovement {
    id: string;
    fleet_id: string;
    owner_id: string;
    mission: FleetMissionType;
    origin_planet_id: string;
    destination_planet_id: string;
    ships: Record<ShipType, number>;
    cargo: Resources;
    departure_time: string;
    arrival_time: string;
    return_time?: string;
    is_returning: boolean;
    status: "traveling" | "arrived" | "returning" | "completed";
}

// ========================================
// Combat Types
// ========================================

export interface CombatReport {
    id: string;
    attacker_id: string;
    defender_id: string;
    planet_id: string;
    occurred_at: string;

    // Initial forces
    attacker_ships: Record<ShipType, number>;
    defender_ships: Record<ShipType, number>;
    defender_defenses: Record<string, number>;

    // Losses
    attacker_losses: Record<ShipType, number>;
    defender_losses: Record<ShipType, number>;

    // Result
    winner: "attacker" | "defender" | "draw";
    loot: Resources;
    debris: Resources;

    is_read: boolean;
}

// ========================================
// Alliance Types
// ========================================

export interface Alliance {
    id: string;
    name: string;
    tag: string; // Short tag like [ABC]
    description?: string;
    founder_id: string;
    member_count: number;
    created_at: string;
}

export interface AllianceMember {
    id: string;
    alliance_id: string;
    user_id: string;
    role: "founder" | "leader" | "officer" | "member";
    joined_at: string;
}

export interface AllianceMessage {
    id: string;
    alliance_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    created_at: string;
}

export interface SharedStorage {
    id: string;
    alliance_id: string;
    metal: number;
    crystal: number;
    deuterium: number;
    rare_earth: number;
    updated_at: string;
}

// ========================================
// Market Types
// ========================================

export interface MarketOffer {
    id: string;
    seller_id: string;
    seller_name: string;

    // What they're offering
    offer_resource: keyof Resources;
    offer_amount: number;

    // What they want
    request_resource: keyof Resources;
    request_amount: number;

    created_at: string;
    expires_at: string;
    status: "active" | "completed" | "cancelled" | "expired";
}

export interface TradeTransaction {
    id: string;
    offer_id?: string;
    sender_id: string;
    receiver_id: string;
    resources: Partial<Resources>;
    departure_time: string;
    arrival_time: string;
    status: "in_transit" | "delivered";
}
