import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPlanets, getAvailableStarterPlanets, findUserByGoogleId, getPlanetWithResources, getPlanetBuildings } from "@/lib/supabase";
import { PlanetSelector, PlanetView } from "@/components/game";

interface PlanetPageProps {
    searchParams: Promise<{ id?: string }>;
}

export default async function PlanetPage({ searchParams }: PlanetPageProps) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const params = await searchParams;
    const requestedPlanetId = params.id;

    // Find user in database
    const user = await findUserByGoogleId(session.user.id);

    if (!user) {
        // User not in DB yet - show planet selection
        const starterPlanets = await getAvailableStarterPlanets();
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-display text-gradient mb-2">
                        Wähle deinen Startplaneten
                    </h1>
                    <p className="text-foreground-muted">
                        Wähle einen Planeten, um dein galaktisches Imperium zu gründen.
                    </p>
                </div>
                <PlanetSelector
                    planets={starterPlanets}
                    userId={session.user.id}
                    userName={session.user.name || "Commander"}
                    userEmail={session.user.email || ""}
                    userAvatar={session.user.image || undefined}
                />
            </div>
        );
    }

    // Get user's planets
    const planets = await getUserPlanets(user.id);

    if (planets.length === 0) {
        // User exists but has no planets - show selection
        const starterPlanets = await getAvailableStarterPlanets();
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-display text-gradient mb-2">
                        Wähle deinen Startplaneten
                    </h1>
                    <p className="text-foreground-muted">
                        Wähle einen Planeten, um dein galaktisches Imperium zu gründen.
                    </p>
                </div>
                <PlanetSelector
                    planets={starterPlanets}
                    userId={user.id}
                />
            </div>
        );
    }

    // Determine which planet to show
    let currentPlanet = planets[0];

    if (requestedPlanetId) {
        const foundPlanet = planets.find(p => p.id === requestedPlanetId);
        if (foundPlanet) {
            currentPlanet = foundPlanet;
        }
    }

    // Get planet resources and buildings
    const planetData = await getPlanetWithResources(currentPlanet.id);
    const buildings = await getPlanetBuildings(currentPlanet.id);

    if (!planetData) {
        return (
            <div className="text-center py-12">
                <p className="text-foreground-muted">Planetendaten konnten nicht geladen werden.</p>
            </div>
        );
    }

    return (
        <PlanetView
            planet={currentPlanet}
            resources={planetData.resources}
            buildings={buildings}
            allPlanets={planets}
        />
    );
}
