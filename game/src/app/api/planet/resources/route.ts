import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient, findUserByGoogleId } from "@/lib/supabase";

/**
 * GET /api/planet/resources?planetId=xxx
 * Returns current resources for a planet (used for polling)
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

        const searchParams = request.nextUrl.searchParams;
        const planetId = searchParams.get("planetId");

        if (!planetId) {
            return NextResponse.json(
                { error: "Planet ID fehlt" },
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

        // Get resources
        const { data: resources, error } = await supabase
            .from("planet_resources")
            .select("*")
            .eq("planet_id", planetId)
            .single();

        if (error || !resources) {
            return NextResponse.json(
                { error: "Ressourcen nicht gefunden" },
                { status: 404 }
            );
        }

        // Calculate resources gained since last update (simple linear production)
        const lastUpdated = new Date(resources.last_updated).getTime();
        const now = Date.now();
        const hoursPassed = (now - lastUpdated) / (1000 * 60 * 60);

        // Calculate production efficiency based on energy
        const energyRatio = resources.energy_production > 0
            ? Math.min(1, resources.energy_production / Math.max(1, resources.energy_consumption))
            : 1;

        // Calculate new resource amounts
        const newMetal = Math.min(
            resources.metal_capacity,
            resources.metal + (resources.metal_production * hoursPassed * energyRatio)
        );
        const newCrystal = Math.min(
            resources.crystal_capacity,
            resources.crystal + (resources.crystal_production * hoursPassed * energyRatio)
        );
        const newDeuterium = Math.min(
            resources.deuterium_capacity,
            resources.deuterium + (resources.deuterium_production * hoursPassed * energyRatio)
        );

        // Update resources in DB if significant time has passed (> 1 minute)
        if (hoursPassed > 1 / 60) {
            await supabase
                .from("planet_resources")
                .update({
                    metal: newMetal,
                    crystal: newCrystal,
                    deuterium: newDeuterium,
                    last_updated: new Date().toISOString(),
                })
                .eq("planet_id", planetId);
        }

        return NextResponse.json({
            resources: {
                ...resources,
                metal: newMetal,
                crystal: newCrystal,
                deuterium: newDeuterium,
            },
        });
    } catch (error) {
        console.error("Error fetching resources:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
