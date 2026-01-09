"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Button } from "@/components/ui";
import { BUILDING_DEFINITIONS, calculateBuildingCost, calculateBuildTime } from "@/lib/game";
import { formatDuration, formatNumber } from "@/lib/utils";
import { Building, Hammer, Clock, ArrowUp } from "lucide-react";
import type { Building as BuildingType, PlanetResources, BuildingType as BuildingTypeEnum } from "@/types";

interface BuildingListProps {
    buildings: BuildingType[];
    planetId: string;
    resources: PlanetResources;
}

export function BuildingList({ buildings, planetId, resources }: BuildingListProps) {
    const router = useRouter();
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [countdowns, setCountdowns] = useState<Record<string, number>>({});

    // Get command center level for build time calculation
    const commandCenter = buildings.find(b => b.type === "command_center");
    const commandCenterLevel = commandCenter?.level || 0;

    // Check for completed upgrades
    const checkCompletedUpgrades = useCallback(async () => {
        try {
            const response = await fetch("/api/building/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planetId }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.hasCompleted) {
                    router.refresh();
                }
            }
        } catch (err) {
            console.error("Error checking upgrades:", err);
        }
    }, [planetId, router]);

    // Initialize countdowns and polling
    useEffect(() => {
        // Calculate initial countdowns
        const newCountdowns: Record<string, number> = {};
        buildings.forEach(b => {
            if (b.is_upgrading && b.upgrade_finish_at) {
                const remaining = Math.max(0, new Date(b.upgrade_finish_at).getTime() - Date.now());
                newCountdowns[b.type] = Math.ceil(remaining / 1000);
            }
        });
        setCountdowns(newCountdowns);

        // Check for completed upgrades on mount
        checkCompletedUpgrades();

        // Poll for completions every 5 seconds when there are active upgrades
        const hasActiveUpgrades = buildings.some(b => b.is_upgrading);
        let pollInterval: NodeJS.Timeout | null = null;

        if (hasActiveUpgrades) {
            pollInterval = setInterval(checkCompletedUpgrades, 5000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [buildings, checkCompletedUpgrades]);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdowns(prev => {
                const updated: Record<string, number> = {};
                let hasFinished = false;

                Object.entries(prev).forEach(([type, seconds]) => {
                    if (seconds > 0) {
                        updated[type] = seconds - 1;
                    } else {
                        hasFinished = true;
                    }
                });

                if (hasFinished) {
                    checkCompletedUpgrades();
                }

                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [checkCompletedUpgrades]);

    // Group buildings by category
    const buildingsByCategory = {
        production: [] as BuildingType[],
        storage: [] as BuildingType[],
        infrastructure: [] as BuildingType[],
        special: [] as BuildingType[],
    };

    // Add existing buildings
    buildings.forEach(building => {
        const def = BUILDING_DEFINITIONS[building.type as BuildingTypeEnum];
        if (def) {
            buildingsByCategory[def.category].push(building);
        }
    });

    // Add buildings that can be built but aren't yet
    Object.entries(BUILDING_DEFINITIONS).forEach(([type, def]) => {
        const exists = buildings.some(b => b.type === type);
        if (!exists) {
            // Check requirements
            const requirementsMet = def.requirements.every(req => {
                const reqBuilding = buildings.find(b => b.type === req.building);
                return reqBuilding && reqBuilding.level >= req.level;
            });

            if (requirementsMet) {
                buildingsByCategory[def.category].push({
                    id: `new-${type}`,
                    planet_id: planetId,
                    type: type as BuildingTypeEnum,
                    level: 0,
                    is_upgrading: false,
                    created_at: "",
                    updated_at: "",
                });
            }
        }
    });

    const handleUpgrade = async (buildingType: string, currentLevel: number) => {
        setUpgrading(buildingType);
        setError(null);

        try {
            const response = await fetch("/api/building/upgrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planetId,
                    buildingType,
                    currentLevel,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upgrade fehlgeschlagen");
            }

            // Set countdown for the new upgrade
            if (data.buildTimeSeconds) {
                setCountdowns(prev => ({
                    ...prev,
                    [buildingType]: data.buildTimeSeconds,
                }));
            }

            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
        } finally {
            setUpgrading(null);
        }
    };

    const canAfford = (type: BuildingTypeEnum, level: number) => {
        const cost = calculateBuildingCost(type, level);
        return (
            resources.metal >= cost.metal &&
            resources.crystal >= cost.crystal &&
            resources.deuterium >= cost.deuterium
        );
    };

    const isAnyUpgrading = buildings.some(b => b.is_upgrading);

    const formatCountdown = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const renderBuildingCard = (building: BuildingType) => {
        const def = BUILDING_DEFINITIONS[building.type as BuildingTypeEnum];
        if (!def) return null;

        const nextLevel = building.level + 1;
        const cost = calculateBuildingCost(building.type as BuildingTypeEnum, building.level);
        const buildTime = calculateBuildTime(building.type as BuildingTypeEnum, nextLevel, commandCenterLevel);
        const affordable = canAfford(building.type as BuildingTypeEnum, building.level);
        const countdown = countdowns[building.type];

        return (
            <Card key={building.id} variant="bordered" className="relative overflow-hidden">
                {building.is_upgrading && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" />
                            <p className="text-sm text-primary font-medium">Wird gebaut...</p>
                            {countdown !== undefined && countdown > 0 && (
                                <p className="text-lg font-mono text-primary mt-1">
                                    {formatCountdown(countdown)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h4 className="font-medium flex items-center gap-2">
                                <Building className="w-4 h-4 text-primary" />
                                {def.name}
                            </h4>
                            <p className="text-xs text-foreground-muted mt-1">
                                Level {building.level} {building.level < def.maxLevel && `/ ${def.maxLevel}`}
                            </p>
                        </div>
                        {building.level > 0 && (
                            <div className="text-2xl font-display text-gradient">
                                {building.level}
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-foreground-muted mb-4">
                        {def.description}
                    </p>

                    {building.level < def.maxLevel && (
                        <>
                            {/* Upgrade Cost */}
                            <div className="bg-background/50 rounded-lg p-3 mb-3 space-y-2">
                                <div className="text-xs uppercase tracking-wider text-foreground-muted mb-2">
                                    Kosten für Level {nextLevel}
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className={cost.metal > resources.metal ? "text-red-400" : "text-gray-400"}>
                                        <span className="block text-foreground-muted">Metall</span>
                                        {formatNumber(cost.metal)}
                                    </div>
                                    <div className={cost.crystal > resources.crystal ? "text-red-400" : "text-blue-400"}>
                                        <span className="block text-foreground-muted">Kristall</span>
                                        {formatNumber(cost.crystal)}
                                    </div>
                                    <div className={cost.deuterium > resources.deuterium ? "text-red-400" : "text-green-400"}>
                                        <span className="block text-foreground-muted">Deuterium</span>
                                        {formatNumber(cost.deuterium)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-foreground-muted pt-2 border-t border-border">
                                    <Clock className="w-3 h-3" />
                                    <span>Bauzeit: {formatDuration(buildTime)}</span>
                                </div>
                            </div>

                            {/* Upgrade Button */}
                            <Button
                                size="sm"
                                className="w-full"
                                variant={affordable ? "primary" : "secondary"}
                                disabled={!affordable || isAnyUpgrading || upgrading !== null}
                                loading={upgrading === building.type}
                                onClick={() => handleUpgrade(building.type, building.level)}
                            >
                                <ArrowUp className="w-4 h-4 mr-2" />
                                {building.level === 0 ? "Bauen" : "Ausbauen"}
                            </Button>
                        </>
                    )}

                    {building.level >= def.maxLevel && (
                        <div className="text-center py-2 text-sm text-accent">
                            ✨ Maximales Level erreicht
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const categoryLabels: Record<string, string> = {
        production: "Ressourcen-Produktion",
        storage: "Lagerung",
        infrastructure: "Infrastruktur",
        special: "Spezialgebäude",
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-danger/20 border border-danger/50 rounded-lg text-sm text-danger">
                    {error}
                </div>
            )}

            {Object.entries(buildingsByCategory).map(([category, categoryBuildings]) => {
                if (categoryBuildings.length === 0) return null;

                return (
                    <div key={category}>
                        <h3 className="text-lg font-display text-gradient mb-4 flex items-center gap-2">
                            <Hammer className="w-5 h-5" />
                            {categoryLabels[category]}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {categoryBuildings.map(renderBuildingCard)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
