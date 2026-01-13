import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient, findUserByGoogleId } from "@/lib/supabase";

interface SectorOwnership {
    sector: number;
    totalPlanets: number;
    colonizedPlanets: number;
    myPlanets: number;
}

/**
 * GET /api/galaxy/ownership
 * Returns ownership data for all sectors (1-25) to color the galaxy map
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

        // Get all planets with their sector and owner
        const { data: planets, error } = await supabase
            .from("planets")
            .select("sector, owner_id")
            .not("sector", "is", null);

        if (error) {
            console.error("Error fetching planets:", error);
            return NextResponse.json(
                { error: "Fehler beim Laden der Planeten" },
                { status: 500 }
            );
        }

        // Aggregate by sector
        const sectorMap = new Map<number, SectorOwnership>();

        // Initialize sectors 1-25
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
            if (!planet.sector) return;
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

        return NextResponse.json({ sectors });
    } catch (error) {
        console.error("Error in galaxy ownership:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
