import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    createServerClient,
    findUserByGoogleId,
    getPlanetBuildings
} from "@/lib/supabase";
import {
    BUILDING_DEFINITIONS,
    calculateBuildingCost,
} from "@/lib/game";
import type { BuildingType } from "@/types";

/**
 * Cancel an ongoing building upgrade and refund 50% of the resources
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
        const { planetId, buildingType } = body;

        if (!planetId || !buildingType) {
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

        // Get the building that's being upgraded
        const buildings = await getPlanetBuildings(planetId);
        const building = buildings.find(b => b.type === buildingType && b.is_upgrading);

        if (!building) {
            return NextResponse.json(
                { error: "Kein laufendes Upgrade für dieses Gebäude gefunden" },
                { status: 400 }
            );
        }

        // Calculate 50% refund based on current level upgrade cost
        const buildingDef = BUILDING_DEFINITIONS[buildingType as BuildingType];
        if (!buildingDef) {
            return NextResponse.json(
                { error: "Ungültiger Gebäudetyp" },
                { status: 400 }
            );
        }

        const cost = calculateBuildingCost(buildingType as BuildingType, building.level);
        const refundMetal = Math.floor(cost.metal * 0.5);
        const refundCrystal = Math.floor(cost.crystal * 0.5);
        const refundDeuterium = Math.floor(cost.deuterium * 0.5);

        // Cancel the upgrade
        const { error: updateError } = await supabase
            .from("buildings")
            .update({
                is_upgrading: false,
                upgrade_finish_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", building.id);

        if (updateError) {
            console.error("Error canceling upgrade:", updateError);
            return NextResponse.json(
                { error: "Upgrade konnte nicht abgebrochen werden" },
                { status: 500 }
            );
        }

        // Refund 50% of resources
        const { data: currentResources } = await supabase
            .from("planet_resources")
            .select("metal, crystal, deuterium")
            .eq("planet_id", planetId)
            .single();

        if (currentResources) {
            await supabase
                .from("planet_resources")
                .update({
                    metal: currentResources.metal + refundMetal,
                    crystal: currentResources.crystal + refundCrystal,
                    deuterium: currentResources.deuterium + refundDeuterium,
                    last_updated: new Date().toISOString(),
                })
                .eq("planet_id", planetId);
        }

        return NextResponse.json({
            success: true,
            refund: {
                metal: refundMetal,
                crystal: refundCrystal,
                deuterium: refundDeuterium,
            },
            message: `Upgrade abgebrochen. ${refundMetal} Metall, ${refundCrystal} Kristall, ${refundDeuterium} Deuterium erstattet.`,
        });
    } catch (error) {
        console.error("Error canceling upgrade:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
