import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BuildingList } from "./building-list";
import { ResourceBar } from "./resource-bar";
import { Globe, Thermometer, Maximize, MapPin } from "lucide-react";
import type { Planet, PlanetResources, Building } from "@/types";

interface PlanetViewProps {
    planet: Planet;
    resources: PlanetResources;
    buildings: Building[];
    allPlanets: Planet[];
}

export function PlanetView({ planet, resources, buildings, allPlanets }: PlanetViewProps) {
    const getPlanetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            terra: "Terra (Erdähnlich)",
            desert: "Wüstenplanet",
            ice: "Eiswelt",
            volcano: "Vulkanplanet",
            gas_giant: "Gasriese",
            asteroid: "Asteroid",
        };
        return labels[type] || type;
    };

    const isFirstPlanet = allPlanets.length > 0 && allPlanets[0].id === planet.id;

    return (
        <div className="space-y-6">
            {/* Planet Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-display text-gradient mb-2 flex items-center gap-3">
                        <Globe className="w-8 h-8" />
                        {planet.name}
                    </h1>
                    <p className="text-foreground-muted">
                        {getPlanetTypeLabel(planet.type)} • {isFirstPlanet ? "Deine Heimatkolonie" : "Kolonie"}
                    </p>
                </div>
            </div>

            {/* Resource Overview */}
            <ResourceBar resources={resources} />

            {/* Planet Stats & Buildings Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Planet Info */}
                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle>Planeten-Daten</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-foreground-muted flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Position
                            </span>
                            <span className="font-medium">
                                [{planet.position_x}, {planet.position_y}]
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-foreground-muted flex items-center gap-2">
                                <Maximize className="w-4 h-4" />
                                Größe
                            </span>
                            <span className="font-medium">{planet.size} Felder</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-foreground-muted flex items-center gap-2">
                                <Thermometer className="w-4 h-4" />
                                Temperatur
                            </span>
                            <span className="font-medium">{planet.temperature}°C</span>
                        </div>

                        <hr className="border-border" />

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-primary">Ressourcen-Boni</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-foreground-muted">Metall</span>
                                    <span className={planet.metal_bonus > 1 ? "text-green-400" : planet.metal_bonus < 1 ? "text-red-400" : ""}>
                                        {(planet.metal_bonus * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground-muted">Kristall</span>
                                    <span className={planet.crystal_bonus > 1 ? "text-green-400" : planet.crystal_bonus < 1 ? "text-red-400" : ""}>
                                        {(planet.crystal_bonus * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground-muted">Deuterium</span>
                                    <span className={planet.deuterium_bonus > 1 ? "text-green-400" : planet.deuterium_bonus < 1 ? "text-red-400" : ""}>
                                        {(planet.deuterium_bonus * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground-muted">Energie</span>
                                    <span className={planet.energy_bonus > 1 ? "text-green-400" : planet.energy_bonus < 1 ? "text-red-400" : ""}>
                                        {(planet.energy_bonus * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Buildings */}
                <div className="lg:col-span-2">
                    <BuildingList
                        buildings={buildings}
                        planetId={planet.id}
                        resources={resources}
                    />
                </div>
            </div>
        </div>
    );
}
