import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient, findUserByGoogleId } from "@/lib/supabase";

interface SectorData {
    sector: number;
    totalPlanets: number;
    colonizedPlanets: number;
    myPlanets: number;
}

/**
 * GET /api/galaxy/sectors
 * Returns overview of all sectors in the galaxy
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
        const userId = user?.id;

        const supabase = await createServerClient();

        // Get galaxy from query params (default to 1)
        const searchParams = request.nextUrl.searchParams;
        const galaxy = parseInt(searchParams.get("galaxy") || "1");

        // Get all planets grouped by sector
        const { data: planets, error } = await supabase
            .from("planets")
            .select("sector, owner_id")
            .eq("galaxy", galaxy)
            .not("sector", "is", null);

        if (error) {
            console.error("Error fetching sectors:", error);
            return NextResponse.json(
                { error: "Fehler beim Laden der Sektoren" },
                { status: 500 }
            );
        }

        // Aggregate data per sector
        const sectorMap = new Map<number, SectorData>();

        // Initialize all 25 sectors
        for (let i = 1; i <= 25; i++) {
            sectorMap.set(i, {
                sector: i,
                totalPlanets: 0,
                colonizedPlanets: 0,
                myPlanets: 0,
            });
        }

        // Count planets per sector
        planets?.forEach((planet) => {
            const data = sectorMap.get(planet.sector);
            if (data) {
                data.totalPlanets++;
                if (planet.owner_id) {
                    data.colonizedPlanets++;
                    if (planet.owner_id === userId) {
                        data.myPlanets++;
                    }
                }
            }
        });

        const sectors = Array.from(sectorMap.values());

        return NextResponse.json({
            galaxy,
            sectors,
        });
    } catch (error) {
        console.error("Error in galaxy sectors:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
