import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient, findUserByGoogleId } from "@/lib/supabase";

/**
 * POST /api/planet/colonize
 * Colonize an unoccupied planet
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

        // Check if planet exists and is uncolonized
        const { data: planet, error: planetError } = await supabase
            .from("planets")
            .select("id, name, owner_id, is_starter")
            .eq("id", planetId)
            .single();

        if (planetError || !planet) {
            return NextResponse.json(
                { error: "Planet nicht gefunden" },
                { status: 404 }
            );
        }

        if (planet.owner_id) {
            return NextResponse.json(
                { error: "Dieser Planet ist bereits kolonisiert" },
                { status: 400 }
            );
        }

        // Check colonization cost (requires resources from user's main planet)
        const { data: userPlanets } = await supabase
            .from("planets")
            .select("id")
            .eq("owner_id", user.id);

        const colonyCost = {
            metal: 10000,
            crystal: 5000,
            deuterium: 2500,
        };

        // For first planet (starter), no cost
        const isFirstPlanet = !userPlanets || userPlanets.length === 0;

        if (!isFirstPlanet && userPlanets && userPlanets.length > 0) {
            // Get resources from main planet
            const mainPlanetId = userPlanets[0].id;
            const { data: resources } = await supabase
                .from("planet_resources")
                .select("metal, crystal, deuterium")
                .eq("planet_id", mainPlanetId)
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
                        error: `Nicht genug Ressourcen. Benötigt: ${colonyCost.metal} Metall, ${colonyCost.crystal} Kristall, ${colonyCost.deuterium} Deuterium`,
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
                .eq("planet_id", mainPlanetId);
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
            message: `Planet "${planet.name}" erfolgreich kolonisiert!`,
            planetId,
            cost: isFirstPlanet ? null : colonyCost,
        });
    } catch (error) {
        console.error("Error colonizing planet:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
