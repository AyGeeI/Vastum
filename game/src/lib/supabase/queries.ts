import { createServerClient } from "@/lib/supabase";
import type { Planet, PlanetResources, Building, User } from "@/types";

/**
 * Get or create a user in the database based on their Google profile
 */
export async function getOrCreateUser(googleId: string, name: string, email: string, avatarUrl?: string): Promise<User | null> {
    const supabase = await createServerClient();

    // Try to find existing user
    const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("google_id", googleId)
        .single();

    if (existingUser) {
        // Update last login
        await supabase
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("id", existingUser.id);

        return existingUser as User;
    }

    // Create new user
    const { data: newUser, error } = await supabase
        .from("users")
        .insert({
            google_id: googleId,
            name,
            email,
            avatar_url: avatarUrl,
            is_protected: true,
            protection_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating user:", error);
        return null;
    }

    return newUser as User;
}

/**
 * Find a user by their Google ID
 */
export async function findUserByGoogleId(googleId: string): Promise<User | null> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("google_id", googleId)
        .single();

    if (error) return null;
    return data as User;
}

/**
 * Get all planets owned by a user
 */
export async function getUserPlanets(userId: string): Promise<Planet[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("planets")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching user planets:", error);
        return [];
    }

    return data as Planet[];
}

/**
 * Get available starter planets (unowned terra planets)
 */
export async function getAvailableStarterPlanets(): Promise<Planet[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("planets")
        .select("*")
        .eq("is_starter", true)
        .is("owner_id", null)
        .limit(20);

    if (error) {
        console.error("Error fetching starter planets:", error);
        return [];
    }

    return data as Planet[];
}

/**
 * Claim a starter planet for a user
 */
export async function claimStarterPlanet(planetId: string, userId: string): Promise<Planet | null> {
    const supabase = await createServerClient();

    // Update planet ownership
    const { data: planet, error: planetError } = await supabase
        .from("planets")
        .update({
            owner_id: userId,
            updated_at: new Date().toISOString()
        })
        .eq("id", planetId)
        .is("owner_id", null) // Only claim if still unclaimed
        .select()
        .single();

    if (planetError || !planet) {
        console.error("Error claiming planet:", planetError);
        return null;
    }

    // Create initial resources for the planet
    const { error: resourceError } = await supabase
        .from("planet_resources")
        .insert({
            planet_id: planetId,
            metal: 500,
            crystal: 300,
            deuterium: 100,
            rare_earth: 0,
            metal_production: 30,
            crystal_production: 15,
            deuterium_production: 0,
            energy_production: 0,
            energy_consumption: 0,
            metal_capacity: 10000,
            crystal_capacity: 10000,
            deuterium_capacity: 10000,
        });

    if (resourceError) {
        console.error("Error creating planet resources:", resourceError);
    }

    // Create initial buildings (all at level 0)
    const initialBuildings = [
        "metal_mine",
        "crystal_mine",
        "solar_plant",
        "metal_storage",
        "crystal_storage",
    ];

    for (const buildingType of initialBuildings) {
        await supabase.from("buildings").insert({
            planet_id: planetId,
            type: buildingType,
            level: 0,
        });
    }

    return planet as Planet;
}

/**
 * Get a planet by ID with its resources
 */
export async function getPlanetWithResources(planetId: string): Promise<{
    planet: Planet;
    resources: PlanetResources;
} | null> {
    const supabase = await createServerClient();

    // First, update resources based on time passed
    await supabase.rpc("update_planet_resources", { p_planet_id: planetId });

    const { data: planet, error: planetError } = await supabase
        .from("planets")
        .select("*")
        .eq("id", planetId)
        .single();

    if (planetError || !planet) return null;

    const { data: resources, error: resourceError } = await supabase
        .from("planet_resources")
        .select("*")
        .eq("planet_id", planetId)
        .single();

    if (resourceError || !resources) return null;

    return {
        planet: planet as Planet,
        resources: resources as PlanetResources,
    };
}

/**
 * Get all buildings on a planet
 */
export async function getPlanetBuildings(planetId: string): Promise<Building[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq("planet_id", planetId)
        .order("type", { ascending: true });

    if (error) {
        console.error("Error fetching buildings:", error);
        return [];
    }

    return data as Building[];
}

/**
 * Start upgrading a building
 */
export async function startBuildingUpgrade(
    buildingId: string,
    upgradeFinishAt: Date
): Promise<Building | null> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("buildings")
        .update({
            is_upgrading: true,
            upgrade_finish_at: upgradeFinishAt.toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", buildingId)
        .select()
        .single();

    if (error) {
        console.error("Error starting upgrade:", error);
        return null;
    }

    return data as Building;
}

/**
 * Complete a building upgrade (called when upgrade time is reached)
 */
export async function completeBuildingUpgrade(buildingId: string): Promise<Building | null> {
    const supabase = await createServerClient();

    // Get current building
    const { data: building } = await supabase
        .from("buildings")
        .select("*")
        .eq("id", buildingId)
        .single();

    if (!building) return null;

    // Update building level
    const { data: updatedBuilding, error } = await supabase
        .from("buildings")
        .update({
            level: building.level + 1,
            is_upgrading: false,
            upgrade_finish_at: null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", buildingId)
        .select()
        .single();

    if (error) {
        console.error("Error completing upgrade:", error);
        return null;
    }

    return updatedBuilding as Building;
}

/**
 * Deduct resources from a planet
 */
export async function deductResources(
    planetId: string,
    metal: number,
    crystal: number,
    deuterium: number
): Promise<boolean> {
    const supabase = await createServerClient();

    // First update resources to current values
    await supabase.rpc("update_planet_resources", { p_planet_id: planetId });

    // Get current resources
    const { data: resources } = await supabase
        .from("planet_resources")
        .select("metal, crystal, deuterium")
        .eq("planet_id", planetId)
        .single();

    if (!resources) return false;

    // Check if enough resources
    if (
        resources.metal < metal ||
        resources.crystal < crystal ||
        resources.deuterium < deuterium
    ) {
        return false;
    }

    // Deduct resources
    const { error } = await supabase
        .from("planet_resources")
        .update({
            metal: resources.metal - metal,
            crystal: resources.crystal - crystal,
            deuterium: resources.deuterium - deuterium,
            last_updated: new Date().toISOString(),
        })
        .eq("planet_id", planetId);

    return !error;
}

/**
 * Get all planets in the galaxy (for the map)
 */
export async function getAllPlanets(): Promise<Planet[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("planets")
        .select("*")
        .order("position_x", { ascending: true });

    if (error) {
        console.error("Error fetching all planets:", error);
        return [];
    }

    return data as Planet[];
}
