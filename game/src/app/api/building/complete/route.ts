import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    createServerClient,
    findUserByGoogleId,
    getPlanetBuildings
} from "@/lib/supabase";
import {
    calculateProduction,
    calculateSolarEnergy,
    calculateEnergyConsumption,
    calculateStorageCapacity
} from "@/lib/game";

/**
 * Check and complete any finished building upgrades
 * This implements "lazy evaluation" - upgrades complete when checked, not via background jobs
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

        const body = await request.json();
        const { planetId } = body;

        if (!planetId) {
            return NextResponse.json(
                { error: "Fehlende Parameter" },
                { status: 400 }
            );
        }

        // Find user
        const user = await findUserByGoogleId(session.user.id);
        if (!user) {
            return NextResponse.json(
                { error: "Benutzer nicht gefunden" },
                { status: 404 }
            );
        }

        const supabase = await createServerClient();

        // Verify user owns the planet
        const { data: planet } = await supabase
            .from("planets")
            .select("id, owner_id")
            .eq("id", planetId)
            .eq("owner_id", user.id)
            .single();

        if (!planet) {
            return NextResponse.json(
                { error: "Planet nicht gefunden" },
                { status: 403 }
            );
        }

        // Get all buildings that are upgrading and have finished
        const { data: finishedBuildings, error } = await supabase
            .from("buildings")
            .select("*")
            .eq("planet_id", planetId)
            .eq("is_upgrading", true)
            .lte("upgrade_finish_at", new Date().toISOString());

        if (error) {
            console.error("Error checking buildings:", error);
            return NextResponse.json({ completed: [] });
        }

        const completedBuildings = [];

        for (const building of finishedBuildings || []) {
            const newLevel = building.level + 1;

            // Complete the upgrade
            const { error: updateError } = await supabase
                .from("buildings")
                .update({
                    level: newLevel,
                    is_upgrading: false,
                    upgrade_finish_at: null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", building.id);

            if (updateError) {
                console.error("Error completing upgrade:", updateError);
                continue;
            }

            completedBuildings.push({
                id: building.id,
                type: building.type,
                newLevel,
            });

            // Update production/storage based on building type
            await updatePlanetStats(supabase, planetId, building.type, newLevel);
        }

        return NextResponse.json({
            completed: completedBuildings,
            hasCompleted: completedBuildings.length > 0,
        });
    } catch (error) {
        console.error("Error completing buildings:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

async function updatePlanetStats(
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    planetId: string,
    buildingType: string,
    newLevel: number
) {
    // Update production rates for production buildings
    if (["metal_mine", "crystal_mine", "deuterium_synthesizer", "solar_plant"].includes(buildingType)) {
        const buildings = await getPlanetBuildings(planetId);

        const metalMine = buildings.find(b => b.type === "metal_mine");
        const crystalMine = buildings.find(b => b.type === "crystal_mine");
        const deuteriumSynth = buildings.find(b => b.type === "deuterium_synthesizer");
        const solarPlant = buildings.find(b => b.type === "solar_plant");

        const metalLevel = buildingType === "metal_mine" ? newLevel : (metalMine?.level || 0);
        const crystalLevel = buildingType === "crystal_mine" ? newLevel : (crystalMine?.level || 0);
        const deuteriumLevel = buildingType === "deuterium_synthesizer" ? newLevel : (deuteriumSynth?.level || 0);
        const solarLevel = buildingType === "solar_plant" ? newLevel : (solarPlant?.level || 0);

        const metalProduction = metalLevel > 0 ? calculateProduction("metal_mine", metalLevel) : 30;
        const crystalProduction = crystalLevel > 0 ? calculateProduction("crystal_mine", crystalLevel) : 15;
        const deuteriumProduction = deuteriumLevel > 0 ? calculateProduction("deuterium_synthesizer", deuteriumLevel) : 0;
        const energyProduction = solarLevel > 0 ? calculateSolarEnergy(solarLevel) : 0;

        const energyConsumption =
            (metalLevel > 0 ? calculateEnergyConsumption("metal_mine", metalLevel) : 0) +
            (crystalLevel > 0 ? calculateEnergyConsumption("crystal_mine", crystalLevel) : 0) +
            (deuteriumLevel > 0 ? calculateEnergyConsumption("deuterium_synthesizer", deuteriumLevel) : 0);

        await supabase
            .from("planet_resources")
            .update({
                metal_production: metalProduction,
                crystal_production: crystalProduction,
                deuterium_production: deuteriumProduction,
                energy_production: energyProduction,
                energy_consumption: energyConsumption,
            })
            .eq("planet_id", planetId);
    }

    // Update storage capacity
    if (["metal_storage", "crystal_storage", "deuterium_tank"].includes(buildingType)) {
        const newCapacity = calculateStorageCapacity(newLevel);
        const capacityFieldMap: Record<string, string> = {
            metal_storage: "metal_capacity",
            crystal_storage: "crystal_capacity",
            deuterium_tank: "deuterium_capacity",
        };
        const capacityField = capacityFieldMap[buildingType];

        if (capacityField) {
            await supabase
                .from("planet_resources")
                .update({ [capacityField]: newCapacity })
                .eq("planet_id", planetId);
        }
    }
}
