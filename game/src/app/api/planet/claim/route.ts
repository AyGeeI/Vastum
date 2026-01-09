import { NextRequest, NextResponse } from "next/server";
import { createServerClient, getOrCreateUser, claimStarterPlanet } from "@/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planetId, userId, userName, userEmail, userAvatar } = body;

        if (!planetId || !userId) {
            return NextResponse.json(
                { error: "Planet ID und User ID erforderlich" },
                { status: 400 }
            );
        }

        // Get or create user in database
        const user = await getOrCreateUser(userId, userName || "Commander", userEmail || "", userAvatar);

        if (!user) {
            return NextResponse.json(
                { error: "Benutzer konnte nicht erstellt werden" },
                { status: 500 }
            );
        }

        // Claim the planet
        const planet = await claimStarterPlanet(planetId, user.id);

        if (!planet) {
            return NextResponse.json(
                { error: "Planet konnte nicht beansprucht werden. Vielleicht wurde er bereits vergeben." },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, planet });
    } catch (error) {
        console.error("Error claiming planet:", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}
