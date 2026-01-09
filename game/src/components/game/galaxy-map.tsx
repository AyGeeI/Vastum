"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button } from "@/components/ui";
import { Map, Globe, Users, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

interface SectorData {
    sector: number;
    totalPlanets: number;
    colonizedPlanets: number;
    myPlanets: number;
}

interface GalaxyMapProps {
    onSelectSector: (sector: number) => void;
}

export function GalaxyMap({ onSelectSector }: GalaxyMapProps) {
    const [sectors, setSectors] = useState<SectorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredSector, setHoveredSector] = useState<number | null>(null);

    useEffect(() => {
        const fetchSectors = async () => {
            try {
                const response = await fetch("/api/galaxy/sectors?galaxy=1");
                if (response.ok) {
                    const data = await response.json();
                    setSectors(data.sectors);
                } else {
                    setError("Fehler beim Laden der Galaxie");
                }
            } catch (err) {
                setError("Verbindungsfehler");
            } finally {
                setLoading(false);
            }
        };

        fetchSectors();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-danger">{error}</p>
            </div>
        );
    }

    // Create 5x5 grid
    const grid: SectorData[][] = [];
    for (let row = 0; row < 5; row++) {
        const rowSectors: SectorData[] = [];
        for (let col = 0; col < 5; col++) {
            const sectorNum = row * 5 + col + 1;
            const sector = sectors.find(s => s.sector === sectorNum) || {
                sector: sectorNum,
                totalPlanets: 0,
                colonizedPlanets: 0,
                myPlanets: 0,
            };
            rowSectors.push(sector);
        }
        grid.push(rowSectors);
    }

    const getSectorColor = (sector: SectorData) => {
        if (sector.myPlanets > 0) return "border-primary bg-primary/20";
        if (sector.colonizedPlanets > 0) return "border-danger/50 bg-danger/10";
        if (sector.totalPlanets > 0) return "border-foreground/30 bg-foreground/5";
        return "border-foreground/20 bg-transparent";
    };

    const getActivityLevel = (sector: SectorData) => {
        const ratio = sector.colonizedPlanets / Math.max(1, sector.totalPlanets);
        if (ratio > 0.7) return "Hohe Aktivität";
        if (ratio > 0.3) return "Mittlere Aktivität";
        if (ratio > 0) return "Geringe Aktivität";
        return "Unbewohnt";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display text-gradient flex items-center gap-3">
                        <Map className="w-7 h-7" />
                        Galaxie 1 - Sektorenübersicht
                    </h2>
                    <p className="text-foreground/60 mt-1">
                        Wähle einen Sektor um die Systeme zu erkunden
                    </p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-primary bg-primary/20" />
                    <span className="text-foreground/70">Eigene Planeten</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-danger/50 bg-danger/10" />
                    <span className="text-foreground/70">Andere Spieler</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-foreground/30 bg-foreground/5" />
                    <span className="text-foreground/70">Unkolonisiert</span>
                </div>
            </div>

            {/* Galaxy Grid */}
            <Card variant="bordered" className="overflow-hidden">
                <CardContent className="p-6">
                    <div className="grid grid-cols-5 gap-3">
                        {grid.map((row, rowIndex) =>
                            row.map((sector, colIndex) => (
                                <button
                                    key={sector.sector}
                                    className={`
                                        relative aspect-square rounded-lg border-2 p-3
                                        transition-all duration-200 cursor-pointer
                                        hover:scale-105 hover:shadow-lg hover:z-10
                                        ${getSectorColor(sector)}
                                        ${hoveredSector === sector.sector ? "ring-2 ring-primary" : ""}
                                    `}
                                    onClick={() => onSelectSector(sector.sector)}
                                    onMouseEnter={() => setHoveredSector(sector.sector)}
                                    onMouseLeave={() => setHoveredSector(null)}
                                >
                                    <div className="absolute top-2 left-2 text-xs font-mono text-foreground/50">
                                        S{sector.sector.toString().padStart(2, "0")}
                                    </div>

                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="flex items-center gap-1">
                                            <Globe className="w-4 h-4 text-foreground/50" />
                                            <span className="text-lg font-display">{sector.totalPlanets}</span>
                                        </div>
                                        {sector.myPlanets > 0 && (
                                            <div className="text-xs text-primary mt-1">
                                                {sector.myPlanets} eigene
                                            </div>
                                        )}
                                    </div>

                                    {sector.colonizedPlanets > 0 && (
                                        <div className="absolute bottom-2 right-2">
                                            <Users className="w-3 h-3 text-foreground/40" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Hovered Sector Info */}
            {hoveredSector && (
                <Card variant="bordered" className="bg-background-elevated">
                    <CardContent className="py-4">
                        {(() => {
                            const sector = sectors.find(s => s.sector === hoveredSector);
                            if (!sector) return null;
                            return (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-display text-primary">
                                            Sektor {sector.sector}
                                        </h3>
                                        <p className="text-sm text-foreground/60">
                                            {getActivityLevel(sector)}
                                        </p>
                                    </div>
                                    <div className="flex gap-6 text-sm">
                                        <div>
                                            <span className="text-foreground/60">Planeten:</span>
                                            <span className="ml-2 font-medium">{sector.totalPlanets}</span>
                                        </div>
                                        <div>
                                            <span className="text-foreground/60">Kolonisiert:</span>
                                            <span className="ml-2 font-medium">{sector.colonizedPlanets}</span>
                                        </div>
                                        <div>
                                            <span className="text-foreground/60">Eigene:</span>
                                            <span className="ml-2 font-medium text-primary">{sector.myPlanets}</span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="primary" onClick={() => onSelectSector(sector.sector)}>
                                        Erkunden
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
