"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Button } from "@/components/ui";
import {
    Globe,
    ArrowLeft,
    Loader2,
    User,
    Rocket,
    Eye,
    ChevronLeft,
    ChevronRight,
    Target
} from "lucide-react";

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

interface SystemViewProps {
    sector: number;
    onBack: () => void;
}

export function SystemView({ sector, onBack }: SystemViewProps) {
    const router = useRouter();
    const [currentSystem, setCurrentSystem] = useState(1);
    const [planets, setPlanets] = useState<PlanetInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [colonizing, setColonizing] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const fetchSystem = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/api/galaxy/system?galaxy=1&sector=${sector}&system=${currentSystem}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setPlanets(data.planets);
                }
            } catch (err) {
                console.error("Error fetching system:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSystem();
    }, [sector, currentSystem]);

    const handleColonize = async (planetId: string) => {
        setColonizing(planetId);
        setMessage(null);

        try {
            const response = await fetch("/api/planet/colonize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planetId }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: data.message });
                // Refresh the system view
                const refreshResponse = await fetch(
                    `/api/galaxy/system?galaxy=1&sector=${sector}&system=${currentSystem}`
                );
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    setPlanets(refreshData.planets);
                }
            } else {
                setMessage({ type: "error", text: data.error });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Verbindungsfehler" });
        } finally {
            setColonizing(null);
        }
    };

    const getPlanetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            terra: "Terra",
            desert: "Wüste",
            ice: "Eis",
            volcano: "Vulkan",
            gas_giant: "Gasriese",
            asteroid: "Asteroid",
        };
        return labels[type] || type;
    };

    const getPlanetColor = (planet: PlanetInfo) => {
        if (planet.is_mine) return "border-primary bg-primary/10";
        if (planet.is_colonized) return "border-danger/50 bg-danger/5";
        return "border-foreground/20 bg-foreground/5 hover:border-accent hover:bg-accent/10";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück
                    </Button>
                    <div>
                        <h2 className="text-2xl font-display text-gradient flex items-center gap-3">
                            <Target className="w-7 h-7" />
                            Sektor {sector} - System {currentSystem}
                        </h2>
                        <p className="text-foreground-muted mt-1">
                            Koordinaten: 1:{sector}:{currentSystem}
                        </p>
                    </div>
                </div>

                {/* System Navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentSystem <= 1}
                        onClick={() => setCurrentSystem(s => Math.max(1, s - 1))}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-mono px-3">
                        {currentSystem} / 100
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentSystem >= 100}
                        onClick={() => setCurrentSystem(s => Math.min(100, s + 1))}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div
                    className={`p-4 rounded-lg border ${message.type === "success"
                            ? "bg-accent/10 border-accent/40 text-accent"
                            : "bg-danger/10 border-danger/40 text-danger"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* System View */}
            <Card variant="bordered">
                <CardContent className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : planets.length === 0 ? (
                        <div className="text-center py-12 text-foreground-muted">
                            Keine Planeten in diesem System gefunden
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Planet Positions 1-15 */}
                            {Array.from({ length: 15 }, (_, i) => i + 1).map((pos) => {
                                const planet = planets.find(p => p.position === pos);

                                if (!planet) {
                                    return (
                                        <div
                                            key={pos}
                                            className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-foreground/10"
                                        >
                                            <div className="w-8 text-center font-mono text-foreground-muted">
                                                {pos}
                                            </div>
                                            <div className="text-foreground-muted text-sm">
                                                Leere Position
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={planet.id}
                                        className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${getPlanetColor(planet)}`}
                                    >
                                        {/* Position */}
                                        <div className="w-8 text-center font-mono text-foreground-muted">
                                            {pos}
                                        </div>

                                        {/* Planet Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${planet.is_mine ? "bg-primary/20" : planet.is_colonized ? "bg-danger/20" : "bg-foreground/10"
                                            }`}>
                                            <Globe className={`w-5 h-5 ${planet.is_mine ? "text-primary" : planet.is_colonized ? "text-danger" : "text-foreground-muted"
                                                }`} />
                                        </div>

                                        {/* Planet Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{planet.name}</span>
                                                <span className="text-xs text-foreground-muted px-2 py-0.5 bg-foreground/10 rounded">
                                                    {getPlanetTypeLabel(planet.type)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-foreground-muted mt-1">
                                                Größe: {planet.size} Felder
                                            </div>
                                        </div>

                                        {/* Owner */}
                                        <div className="text-right">
                                            {planet.is_mine ? (
                                                <span className="text-sm text-primary flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    Dein Planet
                                                </span>
                                            ) : planet.is_colonized ? (
                                                <span className="text-sm text-danger flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {planet.owner_name || "Unbekannt"}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-foreground-muted">
                                                    Unkolonisiert
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {planet.is_mine ? (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => router.push(`/planet?id=${planet.id}`)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Ansehen
                                                </Button>
                                            ) : planet.is_colonized ? (
                                                <Button size="sm" variant="secondary" disabled>
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Spionieren
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => handleColonize(planet.id)}
                                                    loading={colonizing === planet.id}
                                                    disabled={colonizing !== null}
                                                >
                                                    <Rocket className="w-4 h-4 mr-1" />
                                                    Kolonisieren
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Colonization Info */}
            <Card variant="bordered" className="bg-background-elevated">
                <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                        <Rocket className="w-5 h-5 text-accent" />
                        <div>
                            <h4 className="font-medium text-foreground">Kolonisierungskosten</h4>
                            <p className="text-sm text-foreground-muted">
                                10.000 Metall, 5.000 Kristall, 2.500 Deuterium (werden von deinem Hauptplaneten abgezogen)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
