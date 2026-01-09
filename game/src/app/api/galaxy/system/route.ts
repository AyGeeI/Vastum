import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient, findUserByGoogleId } from "@/lib/supabase";

interface PlanetInfo {
    id: string;
    name: string;
    type: string;
    size: number;
    position: number;
    owner_id: string | null;
    owner_name: string | null;
    is_mine: boolean;
    is_colonized: boolean;
}

/**
 * GET /api/galaxy/system?galaxy=1&sector=4&system=7
 * Returns all planets in a specific system
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

        const searchParams = request.nextUrl.searchParams;
        const galaxy = parseInt(searchParams.get("galaxy") || "1");
        const sector = parseInt(searchParams.get("sector") || "1");
        const system = parseInt(searchParams.get("system") || "1");

        if (!sector || !system) {
            return NextResponse.json(
                { error: "Sektor und System müssen angegeben werden" },
                { status: 400 }
            );
        }

        const supabase = await createServerClient();

        // Get all planets in the system with owner info
        const { data: planets, error } = await supabase
            .from("planets")
            .select(`
                id,
                name,
                type,
                size,
                planet_pos,
                owner_id,
                users!planets_owner_id_fkey (
                    name
                )
            `)
            .eq("galaxy", galaxy)
            .eq("sector", sector)
            .eq("system_pos", system)
            .order("planet_pos", { ascending: true });

        if (error) {
            console.error("Error fetching system:", error);
            return NextResponse.json(
                { error: "Fehler beim Laden des Systems" },
                { status: 500 }
            );
        }

        // Format the response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedPlanets: PlanetInfo[] = (planets || []).map((planet: any) => {
            // Handle users being an array or object
            const ownerName = Array.isArray(planet.users)
                ? planet.users[0]?.name
                : planet.users?.name;

            return {
                id: planet.id,
                name: planet.name,
                type: planet.type,
                size: planet.size,
                position: planet.planet_pos,
                owner_id: planet.owner_id,
                owner_name: ownerName || null,
                is_mine: planet.owner_id === userId,
                is_colonized: !!planet.owner_id,
            };
        });

        return NextResponse.json({
            galaxy,
            sector,
            system,
            coordinates: `${galaxy}:${sector}:${system}`,
            planets: formattedPlanets,
        });
    } catch (error) {
        console.error("Error in galaxy system:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
