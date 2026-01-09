import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GameHeader, Sidebar } from "@/components/game";
import { findUserByGoogleId, getUserPlanets, getPlanetWithResources } from "@/lib/supabase";

export default async function GameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Get user's current planet resources for the header
    let resources = null;
    let planets: { id: string; name: string }[] = [];
    let currentPlanetId: string | null = null;

    if (session.user.id) {
        const user = await findUserByGoogleId(session.user.id);
        if (user) {
            const userPlanets = await getUserPlanets(user.id);
            planets = userPlanets.map(p => ({ id: p.id, name: p.name }));

            if (userPlanets.length > 0) {
                currentPlanetId = userPlanets[0].id;
                const planetData = await getPlanetWithResources(userPlanets[0].id);
                if (planetData) {
                    resources = planetData.resources;
                }
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <GameHeader
                user={session.user}
                resources={resources}
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
