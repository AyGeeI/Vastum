import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GameHeader, Sidebar } from "@/components/game";
import { findUserByGoogleId, getUserPlanets, getPlanetWithResources } from "@/lib/supabase";
import type { PlanetResources } from "@/types";

export default async function GameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Get user's TOTAL resources across all planets for the header
    let totalResources: PlanetResources | null = null;
    let planets: { id: string; name: string }[] = [];
    let currentPlanetId: string | null = null;

    if (session.user.id) {
        const user = await findUserByGoogleId(session.user.id);
        if (user) {
            const userPlanets = await getUserPlanets(user.id);
            planets = userPlanets.map(p => ({ id: p.id, name: p.name }));

            if (userPlanets.length > 0) {
                currentPlanetId = userPlanets[0].id;

                // Aggregate resources from ALL planets
                let totalMetal = 0;
                let totalCrystal = 0;
                let totalDeuterium = 0;
                let totalRareEarth = 0;
                let totalMetalProduction = 0;
                let totalCrystalProduction = 0;
                let totalDeuteriumProduction = 0;
                let totalEnergyProduction = 0;
                let totalEnergyConsumption = 0;

                for (const planet of userPlanets) {
                    const planetData = await getPlanetWithResources(planet.id);
                    if (planetData) {
                        totalMetal += planetData.resources.metal;
                        totalCrystal += planetData.resources.crystal;
                        totalDeuterium += planetData.resources.deuterium;
                        totalRareEarth += planetData.resources.rare_earth || 0;
                        totalMetalProduction += planetData.resources.metal_production;
                        totalCrystalProduction += planetData.resources.crystal_production;
                        totalDeuteriumProduction += planetData.resources.deuterium_production;
                        totalEnergyProduction += planetData.resources.energy_production;
                        totalEnergyConsumption += planetData.resources.energy_consumption;
                    }
                }

                totalResources = {
                    id: "total",
                    planet_id: "total",
                    metal: totalMetal,
                    crystal: totalCrystal,
                    deuterium: totalDeuterium,
                    rare_earth: totalRareEarth,
                    metal_production: totalMetalProduction,
                    crystal_production: totalCrystalProduction,
                    deuterium_production: totalDeuteriumProduction,
                    energy_production: totalEnergyProduction,
                    energy_consumption: totalEnergyConsumption,
                    metal_capacity: 999999999,
                    crystal_capacity: 999999999,
                    deuterium_capacity: 999999999,
                    last_updated: new Date().toISOString(),
                };
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <GameHeader
                user={session.user}
                resources={totalResources}
                planets={planets}
                currentPlanetId={currentPlanetId}
            />
            <div className="flex-1 flex">
                <Sidebar planets={planets} currentPlanetId={currentPlanetId} />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
