"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, Button } from "@/components/ui";
import { GalaxyCanvas } from "./galaxy-canvas";
import { Map, Globe, Users, ZoomIn, ZoomOut, ChevronLeft } from "lucide-react";

interface SectorData {
    sector: number;
    totalPlanets: number;
    colonizedPlanets: number;
    myPlanets: number;
}

interface GalaxyMapProps {
    onSelectSector: (sector: number) => void;
}

// Elliptical positions for 25 sectors (5x5 grid in ellipse shape)
const getSectorPosition = (sector: number, containerWidth: number, containerHeight: number) => {
    const row = Math.floor((sector - 1) / 5);
    const col = (sector - 1) % 5;

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const radiusX = containerWidth * 0.38;
    const radiusY = containerHeight * 0.32;

    // Map grid position to elliptical position
    const gridX = (col - 2) / 2.5; // -1 to 1
    const gridY = (row - 2) / 2.5; // -1 to 1

    // Apply elliptical squish based on distance from center
    const distFromCenter = Math.sqrt(gridX * gridX + gridY * gridY);
    const ellipseFactor = distFromCenter < 0.1 ? 1 : Math.min(1, 0.9 / distFromCenter);

    const x = centerX + gridX * radiusX * ellipseFactor;
    const y = centerY + gridY * radiusY * ellipseFactor;

    return { x, y };
};

export function GalaxyMap({ onSelectSector }: GalaxyMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [sectors, setSectors] = useState<SectorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredSector, setHoveredSector] = useState<number | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [zoomLevel, setZoomLevel] = useState(1);

    // Update dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: Math.max(500, rect.height) });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

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

    const getSectorSize = (sector: SectorData) => {
        const baseSize = 60;
        const activityBonus = Math.min(20, sector.colonizedPlanets * 2);
        return baseSize + activityBonus;
    };

    const getSectorGlow = (sector: SectorData) => {
        if (sector.myPlanets > 0) return "0 0 30px rgba(102, 252, 241, 0.6)";
        if (sector.colonizedPlanets > 0) return "0 0 20px rgba(255, 107, 107, 0.4)";
        return "0 0 15px rgba(200, 200, 220, 0.2)";
    };

    const getSectorBg = (sector: SectorData) => {
        if (sector.myPlanets > 0) {
            return "radial-gradient(circle, rgba(102, 252, 241, 0.3) 0%, rgba(69, 162, 158, 0.15) 50%, transparent 70%)";
        }
        if (sector.colonizedPlanets > 0) {
            return "radial-gradient(circle, rgba(255, 107, 107, 0.2) 0%, rgba(195, 7, 63, 0.1) 50%, transparent 70%)";
        }
        return "radial-gradient(circle, rgba(200, 200, 220, 0.15) 0%, rgba(100, 100, 120, 0.05) 50%, transparent 70%)";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display text-gradient flex items-center gap-3">
                        <Map className="w-7 h-7" />
                        Galaxie Andromeda
                    </h2>
                    <p className="text-foreground/60 mt-1">
                        Wähle einen Sektor um die Systeme zu erkunden
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                        disabled={zoomLevel <= 0.5}
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-foreground/60 w-16 text-center">
                        {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setZoomLevel(z => Math.min(2, z + 0.25))}
                        disabled={zoomLevel >= 2}
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/50 shadow-[0_0_10px_rgba(102,252,241,0.5)]" />
                    <span className="text-foreground/70">Eigene Planeten</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-danger/50 shadow-[0_0_10px_rgba(255,107,107,0.4)]" />
                    <span className="text-foreground/70">Andere Spieler</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-foreground/20" />
                    <span className="text-foreground/70">Wenig Aktivität</span>
                </div>
            </div>

            {/* Galaxy Container */}
            <Card variant="bordered" className="overflow-hidden bg-[#050510]">
                <div
                    ref={containerRef}
                    className="relative w-full"
                    style={{
                        height: "600px",
                        overflow: "hidden",
                    }}
                >
                    {/* Canvas Background */}
                    <GalaxyCanvas
                        width={dimensions.width}
                        height={600}
                        starCount={1000}
                    />

                    {/* Nebula Overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `
                                radial-gradient(ellipse 70% 50% at 50% 50%, rgba(69, 162, 158, 0.1) 0%, transparent 70%),
                                radial-gradient(ellipse 50% 35% at 45% 45%, rgba(155, 89, 182, 0.08) 0%, transparent 60%),
                                radial-gradient(ellipse 40% 30% at 55% 55%, rgba(102, 252, 241, 0.05) 0%, transparent 50%)
                            `,
                        }}
                    />

                    {/* Zoomable Container */}
                    <div
                        className="absolute inset-0 transition-transform duration-300"
                        style={{
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: "center center",
                        }}
                    >
                        {/* Sectors */}
                        {sectors.map((sector) => {
                            const pos = getSectorPosition(sector.sector, dimensions.width, 600);
                            const size = getSectorSize(sector);
                            const isHovered = hoveredSector === sector.sector;

                            return (
                                <button
                                    key={sector.sector}
                                    className={`
                                        absolute rounded-full cursor-pointer
                                        transition-all duration-300 ease-out
                                        flex items-center justify-center
                                        border border-foreground/10
                                        hover:border-primary/50
                                        ${isHovered ? "z-20" : "z-10"}
                                    `}
                                    style={{
                                        left: pos.x - size / 2,
                                        top: pos.y - size / 2,
                                        width: size,
                                        height: size,
                                        background: getSectorBg(sector),
                                        boxShadow: isHovered
                                            ? `${getSectorGlow(sector)}, 0 0 40px rgba(102, 252, 241, 0.3)`
                                            : getSectorGlow(sector),
                                        transform: isHovered ? "scale(1.2)" : "scale(1)",
                                    }}
                                    onClick={() => onSelectSector(sector.sector)}
                                    onMouseEnter={() => setHoveredSector(sector.sector)}
                                    onMouseLeave={() => setHoveredSector(null)}
                                >
                                    <div className="text-center">
                                        <div className="text-xs font-mono text-foreground/50">
                                            S{sector.sector.toString().padStart(2, "0")}
                                        </div>
                                        {sector.totalPlanets > 0 && (
                                            <div className="flex items-center justify-center gap-1 mt-1">
                                                <Globe className="w-3 h-3 text-foreground/40" />
                                                <span className="text-sm font-medium text-foreground/80">
                                                    {sector.totalPlanets}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}

                        {/* Hyperspace Routes (connecting sectors with activity) */}
                        <svg
                            className="absolute inset-0 pointer-events-none"
                            width={dimensions.width}
                            height={600}
                        >
                            <defs>
                                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(102, 252, 241, 0)" />
                                    <stop offset="50%" stopColor="rgba(102, 252, 241, 0.3)" />
                                    <stop offset="100%" stopColor="rgba(102, 252, 241, 0)" />
                                </linearGradient>
                            </defs>
                            {/* Draw routes between my sectors */}
                            {sectors
                                .filter(s => s.myPlanets > 0)
                                .map((sector, i, arr) => {
                                    if (i === arr.length - 1) return null;
                                    const nextSector = arr[i + 1];
                                    const pos1 = getSectorPosition(sector.sector, dimensions.width, 600);
                                    const pos2 = getSectorPosition(nextSector.sector, dimensions.width, 600);

                                    return (
                                        <line
                                            key={`route-${sector.sector}-${nextSector.sector}`}
                                            x1={pos1.x}
                                            y1={pos1.y}
                                            x2={pos2.x}
                                            y2={pos2.y}
                                            stroke="url(#routeGradient)"
                                            strokeWidth="2"
                                            strokeDasharray="5,5"
                                            className="animate-pulse"
                                        />
                                    );
                                })}
                        </svg>
                    </div>

                    {/* Center Label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center opacity-10">
                            <div className="text-6xl font-display text-primary">ANDROMEDA</div>
                            <div className="text-sm tracking-[0.5em] text-foreground/50">GALAXIE</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Hovered Sector Info */}
            {hoveredSector && (
                <Card variant="bordered" className="bg-background-elevated animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <CardContent className="py-4">
                        {(() => {
                            const sector = sectors.find(s => s.sector === hoveredSector);
                            if (!sector) return null;

                            const getActivityLevel = () => {
                                const ratio = sector.colonizedPlanets / Math.max(1, sector.totalPlanets);
                                if (ratio > 0.7) return { text: "Hohe Aktivität", color: "text-danger" };
                                if (ratio > 0.3) return { text: "Mittlere Aktivität", color: "text-accent" };
                                if (ratio > 0) return { text: "Geringe Aktivität", color: "text-foreground/60" };
                                return { text: "Unbewohnt", color: "text-foreground/40" };
                            };

                            const activity = getActivityLevel();

                            return (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-display text-primary text-lg">
                                            Sektor {sector.sector}
                                        </h3>
                                        <p className={`text-sm ${activity.color}`}>
                                            {activity.text}
                                        </p>
                                    </div>
                                    <div className="flex gap-8 text-sm">
                                        <div className="text-center">
                                            <div className="text-2xl font-display text-foreground">
                                                {sector.totalPlanets}
                                            </div>
                                            <div className="text-xs text-foreground/50">Planeten</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-display text-danger">
                                                {sector.colonizedPlanets}
                                            </div>
                                            <div className="text-xs text-foreground/50">Kolonisiert</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-display text-primary">
                                                {sector.myPlanets}
                                            </div>
                                            <div className="text-xs text-foreground/50">Eigene</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => onSelectSector(sector.sector)}
                                    >
                                        Sektor erkunden
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
