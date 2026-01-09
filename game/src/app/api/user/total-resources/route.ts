import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient, findUserByGoogleId, getUserPlanets } from "@/lib/supabase";

/**
 * GET /api/user/total-resources
 * Returns total resources across all planets for the header
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

        const supabase = await createServerClient();
        const planets = await getUserPlanets(user.id);

        if (planets.length === 0) {
            return NextResponse.json({ resources: null });
        }

        let totalMetal = 0;
        let totalCrystal = 0;
        let totalDeuterium = 0;
        let totalMetalProduction = 0;
        let totalCrystalProduction = 0;
        let totalDeuteriumProduction = 0;
        let totalEnergyProduction = 0;
        let totalEnergyConsumption = 0;

        for (const planet of planets) {
            const { data: resources } = await supabase
                .from("planet_resources")
                .select("*")
                .eq("planet_id", planet.id)
                .single();

            if (resources) {
                // Calculate resources gained since last update
                const lastUpdated = new Date(resources.last_updated).getTime();
                const now = Date.now();
                const hoursPassed = (now - lastUpdated) / (1000 * 60 * 60);

                const energyRatio = resources.energy_production > 0
                    ? Math.min(1, resources.energy_production / Math.max(1, resources.energy_consumption))
                    : 1;

                const currentMetal = Math.min(
                    resources.metal_capacity,
                    resources.metal + (resources.metal_production * hoursPassed * energyRatio)
                );
                const currentCrystal = Math.min(
                    resources.crystal_capacity,
                    resources.crystal + (resources.crystal_production * hoursPassed * energyRatio)
                );
                const currentDeuterium = Math.min(
                    resources.deuterium_capacity,
                    resources.deuterium + (resources.deuterium_production * hoursPassed * energyRatio)
                );

                totalMetal += currentMetal;
                totalCrystal += currentCrystal;
                totalDeuterium += currentDeuterium;
                totalMetalProduction += resources.metal_production * energyRatio;
                totalCrystalProduction += resources.crystal_production * energyRatio;
                totalDeuteriumProduction += resources.deuterium_production * energyRatio;
                totalEnergyProduction += resources.energy_production;
                totalEnergyConsumption += resources.energy_consumption;
            }
        }

        return NextResponse.json({
            resources: {
                metal: totalMetal,
                crystal: totalCrystal,
                deuterium: totalDeuterium,
                metal_production: totalMetalProduction,
                crystal_production: totalCrystalProduction,
                deuterium_production: totalDeuteriumProduction,
                energy_production: totalEnergyProduction,
                energy_consumption: totalEnergyConsumption,
            },
        });
    } catch (error) {
        console.error("Error fetching total resources:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
