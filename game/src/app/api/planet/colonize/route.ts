import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient, findUserByGoogleId } from "@/lib/supabase";

/**
 * Calculate distance between two sectors
 */
function calculateSectorDistance(sector1: number, sector2: number): number {
    // Convert sector number to grid position (5x5 grid)
    const row1 = Math.floor((sector1 - 1) / 5);
    const col1 = (sector1 - 1) % 5;
    const row2 = Math.floor((sector2 - 1) / 5);
    const col2 = (sector2 - 1) % 5;

    // Euclidean distance
    return Math.sqrt(Math.pow(row2 - row1, 2) + Math.pow(col2 - col1, 2));
}

/**
 * Calculate colonization cost based on distance
 */
function calculateColonizationCost(distance: number) {
    const baseCost = {
        metal: 10000,
        crystal: 5000,
        deuterium: 2500,
    };

    // Distance multiplier: 1.0 for same sector, up to 3.0 for max distance
    const distanceMultiplier = 1 + (distance * 0.5);

    return {
        metal: Math.floor(baseCost.metal * distanceMultiplier),
        crystal: Math.floor(baseCost.crystal * distanceMultiplier),
        deuterium: Math.floor(baseCost.deuterium * distanceMultiplier),
        distanceMultiplier: Math.round(distanceMultiplier * 100) / 100,
    };
}

/**
 * POST /api/planet/colonize
 * Colonize an unoccupied planet with distance-based costs
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        const user = await findUserByGoogleId(session.user.id);
        if (!user) {
            return NextResponse.json(
                { error: "Benutzer nicht gefunden" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { planetId } = body;

        if (!planetId) {
            return NextResponse.json(
                { error: "Planet ID fehlt" },
                { status: 400 }
            );
        }

        const supabase = await createServerClient();

        // Check if planet exists and is uncolonized - include coordinates
        const { data: targetPlanet, error: planetError } = await supabase
            .from("planets")
            .select("id, name, owner_id, is_starter, sector, system_pos, galaxy")
            .eq("id", planetId)
            .single();

        if (planetError || !targetPlanet) {
            return NextResponse.json(
                { error: "Planet nicht gefunden" },
                { status: 404 }
            );
        }

        if (targetPlanet.owner_id) {
            return NextResponse.json(
                { error: "Dieser Planet ist bereits kolonisiert" },
                { status: 400 }
            );
        }

        // Get user's planets with coordinates
        const { data: userPlanets } = await supabase
            .from("planets")
            .select("id, sector, system_pos, galaxy")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true });

        // For first planet (starter), no cost
        const isFirstPlanet = !userPlanets || userPlanets.length === 0;

        if (!isFirstPlanet && userPlanets && userPlanets.length > 0) {
            // Calculate distance from main planet (first planet)
            const mainPlanet = userPlanets[0];

            // Calculate sector distance
            const sectorDistance = calculateSectorDistance(
                mainPlanet.sector || 1,
                targetPlanet.sector || 1
            );

            // Calculate cost based on distance
            const colonyCost = calculateColonizationCost(sectorDistance);

            // Get resources from main planet
            const { data: resources } = await supabase
                .from("planet_resources")
                .select("metal, crystal, deuterium")
                .eq("planet_id", mainPlanet.id)
                .single();

            if (!resources) {
                return NextResponse.json(
                    { error: "Keine Ressourcen verfügbar" },
                    { status: 400 }
                );
            }

            if (
                resources.metal < colonyCost.metal ||
                resources.crystal < colonyCost.crystal ||
                resources.deuterium < colonyCost.deuterium
            ) {
                return NextResponse.json(
                    {
                        error: `Nicht genug Ressourcen. Benötigt: ${colonyCost.metal.toLocaleString()} Metall, ${colonyCost.crystal.toLocaleString()} Kristall, ${colonyCost.deuterium.toLocaleString()} Deuterium (Entfernungsfaktor: ${colonyCost.distanceMultiplier}x)`,
                    },
                    { status: 400 }
                );
            }

            // Deduct resources
            await supabase
                .from("planet_resources")
                .update({
                    metal: resources.metal - colonyCost.metal,
                    crystal: resources.crystal - colonyCost.crystal,
                    deuterium: resources.deuterium - colonyCost.deuterium,
                    last_updated: new Date().toISOString(),
                })
                .eq("planet_id", mainPlanet.id);
        }

        // Colonize the planet
        const { error: updateError } = await supabase
            .from("planets")
            .update({
                owner_id: user.id,
                name: `Kolonie ${(userPlanets?.length || 0) + 1}`,
                updated_at: new Date().toISOString(),
            })
            .eq("id", planetId);

        if (updateError) {
            console.error("Error colonizing planet:", updateError);
            return NextResponse.json(
                { error: "Fehler bei der Kolonisierung" },
                { status: 500 }
            );
        }

        // Initialize resources for the new colony
        await supabase.from("planet_resources").insert({
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
            last_updated: new Date().toISOString(),
        });

        // Initialize basic buildings
        const basicBuildings = [
            { type: "metal_mine", level: 0 },
            { type: "crystal_mine", level: 0 },
            { type: "solar_plant", level: 0 },
        ];

        for (const building of basicBuildings) {
            await supabase.from("buildings").insert({
                planet_id: planetId,
                type: building.type,
                level: building.level,
                is_upgrading: false,
            });
        }

        return NextResponse.json({
            success: true,
            message: `Planet "${targetPlanet.name}" erfolgreich kolonisiert!`,
            planetId,
        });
    } catch (error) {
        console.error("Error colonizing planet:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/planet/colonize?planetId=xxx
 * Calculate colonization cost for a planet
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        const user = await findUserByGoogleId(session.user.id);
        if (!user) {
            return NextResponse.json(
                { error: "Benutzer nicht gefunden" },
                { status: 404 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const planetId = searchParams.get("planetId");

        if (!planetId) {
            return NextResponse.json(
                { error: "Planet ID fehlt" },
                { status: 400 }
            );
        }

        const supabase = await createServerClient();

        // Get target planet coordinates
        const { data: targetPlanet } = await supabase
            .from("planets")
            .select("sector")
            .eq("id", planetId)
            .single();

        // Get user's main planet
        const { data: userPlanets } = await supabase
            .from("planets")
            .select("sector")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1);

        if (!userPlanets || userPlanets.length === 0) {
            // First planet is free
            return NextResponse.json({
                cost: { metal: 0, crystal: 0, deuterium: 0 },
                distance: 0,
                multiplier: 0,
                isFirstPlanet: true,
            });
        }

        const mainPlanet = userPlanets[0];
        const distance = calculateSectorDistance(
            mainPlanet.sector || 1,
            targetPlanet?.sector || 1
        );
        const cost = calculateColonizationCost(distance);

        return NextResponse.json({
            cost: {
                metal: cost.metal,
                crystal: cost.crystal,
                deuterium: cost.deuterium,
            },
            distance: Math.round(distance * 10) / 10,
            multiplier: cost.distanceMultiplier,
            isFirstPlanet: false,
        });
    } catch (error) {
        console.error("Error calculating colonization cost:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
