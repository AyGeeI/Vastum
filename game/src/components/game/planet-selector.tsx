"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Globe, MapPin, Thermometer, Maximize } from "lucide-react";
import type { Planet } from "@/types";

interface PlanetSelectorProps {
    planets: Planet[];
    userId: string;
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
}

export function PlanetSelector({
    planets,
    userId,
    userName,
    userEmail,
    userAvatar
}: PlanetSelectorProps) {
    const router = useRouter();
    const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClaimPlanet = async () => {
        if (!selectedPlanet) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/planet/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planetId: selectedPlanet.id,
                    userId,
                    userName,
                    userEmail,
                    userAvatar
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Fehler beim Beanspruchen des Planeten");
            }

            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
        } finally {
            setIsLoading(false);
        }
    };

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

    if (planets.length === 0) {
        return (
            <Card variant="bordered" className="text-center py-12">
                <CardContent>
                    <Globe className="w-16 h-16 mx-auto mb-4 text-foreground-muted opacity-50" />
                    <h3 className="text-xl font-medium mb-2">Keine Planeten verfügbar</h3>
                    <p className="text-foreground-muted">
                        Derzeit sind keine Startplaneten verfügbar. Bitte versuche es später erneut.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Planet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {planets.map((planet) => (
                    <Card
                        key={planet.id}
                        variant="bordered"
                        className={`cursor-pointer transition-all duration-200 hover:border-primary ${selectedPlanet?.id === planet.id
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : ""
                            }`}
                        onClick={() => setSelectedPlanet(planet)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" />
                                {planet.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-foreground-muted">
                                <span className="text-xs uppercase tracking-wider">Typ:</span>
                                <span className="text-foreground">{getPlanetTypeLabel(planet.type)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground-muted">
                                <MapPin className="w-4 h-4" />
                                <span>Position: {planet.position_x}, {planet.position_y}</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground-muted">
                                <Maximize className="w-4 h-4" />
                                <span>Größe: {planet.size} Felder</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground-muted">
                                <Thermometer className="w-4 h-4" />
                                <span>Temperatur: {planet.temperature}°C</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Selection Summary & Claim Button */}
            {selectedPlanet && (
                <Card variant="glass" className="border border-primary/30">
                    <CardContent className="flex items-center justify-between py-4">
                        <div>
                            <h3 className="font-medium text-primary">
                                Ausgewählt: {selectedPlanet.name}
                            </h3>
                            <p className="text-sm text-foreground-muted">
                                {getPlanetTypeLabel(selectedPlanet.type)} • Position ({selectedPlanet.position_x}, {selectedPlanet.position_y})
                            </p>
                        </div>
                        <Button
                            onClick={handleClaimPlanet}
                            loading={isLoading}
                            size="lg"
                        >
                            Planeten Beanspruchen
                        </Button>
                    </CardContent>
                    {error && (
                        <div className="px-4 pb-4">
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
