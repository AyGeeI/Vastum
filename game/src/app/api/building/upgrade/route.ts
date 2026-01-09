import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    createServerClient,
    findUserByGoogleId,
    deductResources,
    getPlanetBuildings
} from "@/lib/supabase";
import {
    BUILDING_DEFINITIONS,
    calculateBuildingCost,
    calculateBuildTime,
} from "@/lib/game";
import type { BuildingType } from "@/types";

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
        const { planetId, buildingType, currentLevel } = body;

        if (!planetId || !buildingType || currentLevel === undefined) {
            return NextResponse.json(
                { error: "Fehlende Parameter" },
                { status: 400 }
            );
        }

        // Verify building type exists
        const buildingDef = BUILDING_DEFINITIONS[buildingType as BuildingType];
        if (!buildingDef) {
            return NextResponse.json(
                { error: "Ungültiger Gebäudetyp" },
                { status: 400 }
            );
        }

        // Check max level
        if (currentLevel >= buildingDef.maxLevel) {
            return NextResponse.json(
                { error: "Maximales Level erreicht" },
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
                { error: "Planet nicht gefunden oder gehört dir nicht" },
                { status: 403 }
            );
        }

        // Check if any building is already upgrading
        const buildings = await getPlanetBuildings(planetId);
        const isAnyUpgrading = buildings.some(b => b.is_upgrading);

        if (isAnyUpgrading) {
            return NextResponse.json(
                { error: "Es wird bereits ein Gebäude ausgebaut" },
                { status: 400 }
            );
        }

        // Calculate costs
        const cost = calculateBuildingCost(buildingType as BuildingType, currentLevel);

        // Deduct resources
        const resourcesDeducted = await deductResources(
            planetId,
            cost.metal,
            cost.crystal,
            cost.deuterium
        );

        if (!resourcesDeducted) {
            return NextResponse.json(
                { error: "Nicht genügend Ressourcen" },
                { status: 400 }
            );
        }

        // Get command center level for build time
        const commandCenter = buildings.find(b => b.type === "command_center");
        const commandCenterLevel = commandCenter?.level || 0;

        // Calculate build time
        const buildTimeSeconds = calculateBuildTime(
            buildingType as BuildingType,
            currentLevel + 1,
            commandCenterLevel
        );

        // Set the finish time
        const upgradeFinishAt = new Date(Date.now() + buildTimeSeconds * 1000);

        // Find existing building
        let building = buildings.find(b => b.type === buildingType);

        if (!building) {
            // Create new building with upgrade in progress
            const { data: newBuilding, error } = await supabase
                .from("buildings")
                .insert({
                    planet_id: planetId,
                    type: buildingType,
                    level: 0,
                    is_upgrading: true,
                    upgrade_finish_at: upgradeFinishAt.toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error("Error creating building:", error);
                return NextResponse.json(
                    { error: "Gebäude konnte nicht erstellt werden" },
                    { status: 500 }
                );
            }

            building = newBuilding;
        } else {
            // Update existing building to start upgrade
            const { data: updatedBuilding, error } = await supabase
                .from("buildings")
                .update({
                    is_upgrading: true,
                    upgrade_finish_at: upgradeFinishAt.toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", building.id)
                .select()
                .single();

            if (error) {
                console.error("Error starting upgrade:", error);
                return NextResponse.json(
                    { error: "Upgrade konnte nicht gestartet werden" },
                    { status: 500 }
                );
            }

            building = updatedBuilding;
        }

        return NextResponse.json({
            success: true,
            building,
            finishAt: upgradeFinishAt.toISOString(),
            buildTimeSeconds,
        });
    } catch (error) {
        console.error("Error upgrading building:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
