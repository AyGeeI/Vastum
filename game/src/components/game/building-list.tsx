"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Button } from "@/components/ui";
import {
    BUILDING_DEFINITIONS,
    calculateBuildingCost,
    calculateBuildTime,
    calculateProduction,
    calculateSolarEnergy,
    calculateEnergyConsumption,
    calculateStorageCapacity
} from "@/lib/game";
import { formatDuration, formatNumber } from "@/lib/utils";
import { Building, Hammer, Clock, ArrowUp, X, Lock, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import type { Building as BuildingType, PlanetResources, BuildingType as BuildingTypeEnum } from "@/types";

interface BuildingListProps {
    buildings: BuildingType[];
    planetId: string;
    resources: PlanetResources;
}

// Extended building type to track locked status
interface ExtendedBuilding extends BuildingType {
    isLocked?: boolean;
    missingRequirements?: { building: string; level: number; currentLevel: number }[];
}

export function BuildingList({ buildings, planetId, resources: initialResources }: BuildingListProps) {
    const router = useRouter();
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [canceling, setCanceling] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [countdowns, setCountdowns] = useState<Record<string, number>>({});
    const [resources, setResources] = useState<PlanetResources>(initialResources);

    // Get command center level for build time calculation
    const commandCenter = buildings.find(b => b.type === "command_center");
    const commandCenterLevel = commandCenter?.level || 0;

    // Calculate current energy balance
    const energyBalance = resources.energy_production - resources.energy_consumption;
    const hasEnergy = energyBalance >= 0;

    // Fetch fresh resources every 2 seconds
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await fetch(`/api/planet/resources?planetId=${planetId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.resources) {
                        setResources(data.resources);
                    }
                }
            } catch (err) {
                console.error("Error fetching resources:", err);
            }
        };

        const interval = setInterval(fetchResources, 2000);
        return () => clearInterval(interval);
    }, [planetId]);

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
        const newCountdowns: Record<string, number> = {};
        buildings.forEach(b => {
            if (b.is_upgrading && b.upgrade_finish_at) {
                const remaining = Math.max(0, new Date(b.upgrade_finish_at).getTime() - Date.now());
                newCountdowns[b.type] = Math.ceil(remaining / 1000);
            }
        });
        setCountdowns(newCountdowns);
        checkCompletedUpgrades();

        const hasActiveUpgrades = buildings.some(b => b.is_upgrading);
        let pollInterval: NodeJS.Timeout | null = null;
        if (hasActiveUpgrades) {
            pollInterval = setInterval(checkCompletedUpgrades, 5000);
        }
        return () => { if (pollInterval) clearInterval(pollInterval); };
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
                if (hasFinished) checkCompletedUpgrades();
                return updated;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [checkCompletedUpgrades]);

    // Group buildings by category - INCLUDING LOCKED ONES
    const buildingsByCategory = {
        production: [] as ExtendedBuilding[],
        storage: [] as ExtendedBuilding[],
        infrastructure: [] as ExtendedBuilding[],
        special: [] as ExtendedBuilding[],
    };

    // Add existing buildings
    buildings.forEach(building => {
        const def = BUILDING_DEFINITIONS[building.type as BuildingTypeEnum];
        if (def) {
            buildingsByCategory[def.category].push({ ...building, isLocked: false });
        }
    });

    // Add ALL buildings that don't exist - show locked ones too
    Object.entries(BUILDING_DEFINITIONS).forEach(([type, def]) => {
        const exists = buildings.some(b => b.type === type);
        if (!exists) {
            const missingRequirements: { building: string; level: number; currentLevel: number }[] = [];

            def.requirements.forEach(req => {
                const reqBuilding = buildings.find(b => b.type === req.building);
                const currentLevel = reqBuilding?.level || 0;
                if (currentLevel < req.level) {
                    const reqDef = BUILDING_DEFINITIONS[req.building];
                    missingRequirements.push({
                        building: reqDef?.name || req.building,
                        level: req.level,
                        currentLevel,
                    });
                }
            });

            buildingsByCategory[def.category].push({
                id: `new-${type}`,
                planet_id: planetId,
                type: type as BuildingTypeEnum,
                level: 0,
                is_upgrading: false,
                created_at: "",
                updated_at: "",
                isLocked: missingRequirements.length > 0,
                missingRequirements,
            });
        }
    });

    const handleUpgrade = async (buildingType: string, currentLevel: number) => {
        setUpgrading(buildingType);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/building/upgrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planetId, buildingType, currentLevel }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Upgrade fehlgeschlagen");

            if (data.buildTimeSeconds) {
                setCountdowns(prev => ({ ...prev, [buildingType]: data.buildTimeSeconds }));
            }
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
        } finally {
            setUpgrading(null);
        }
    };

    const handleCancel = async (buildingType: string) => {
        setCanceling(buildingType);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/building/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planetId, buildingType }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Abbrechen fehlgeschlagen");

            setSuccess(data.message);
            setCountdowns(prev => {
                const updated = { ...prev };
                delete updated[buildingType];
                return updated;
            });
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
        } finally {
            setCanceling(null);
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

    // Check if upgrade would cause energy deficit
    const wouldCauseEnergyDeficit = (type: BuildingTypeEnum, currentLevel: number) => {
        if (!["metal_mine", "crystal_mine", "deuterium_synthesizer"].includes(type)) {
            return false;
        }
        const newLevel = currentLevel + 1;
        const newConsumption = calculateEnergyConsumption(type as "metal_mine" | "crystal_mine" | "deuterium_synthesizer", newLevel);
        const currentConsumption = currentLevel > 0
            ? calculateEnergyConsumption(type as "metal_mine" | "crystal_mine" | "deuterium_synthesizer", currentLevel)
            : 0;
        const additionalConsumption = newConsumption - currentConsumption;
        return (energyBalance - additionalConsumption) < 0;
    };

    const isAnyUpgrading = buildings.some(b => b.is_upgrading);

    const formatCountdown = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    // Get upgrade benefit description
    const getUpgradeBenefit = (type: BuildingTypeEnum, currentLevel: number): string => {
        const nextLevel = currentLevel + 1;

        switch (type) {
            case "metal_mine": {
                const currentProd = currentLevel > 0 ? calculateProduction("metal_mine", currentLevel) : 30;
                const nextProd = calculateProduction("metal_mine", nextLevel);
                const currentEnergy = currentLevel > 0 ? calculateEnergyConsumption("metal_mine", currentLevel) : 0;
                const nextEnergy = calculateEnergyConsumption("metal_mine", nextLevel);
                return `+${nextProd - currentProd} Metall/h | +${nextEnergy - currentEnergy} ⚡ Verbrauch`;
            }
            case "crystal_mine": {
                const currentProd = currentLevel > 0 ? calculateProduction("crystal_mine", currentLevel) : 15;
                const nextProd = calculateProduction("crystal_mine", nextLevel);
                const currentEnergy = currentLevel > 0 ? calculateEnergyConsumption("crystal_mine", currentLevel) : 0;
                const nextEnergy = calculateEnergyConsumption("crystal_mine", nextLevel);
                return `+${nextProd - currentProd} Kristall/h | +${nextEnergy - currentEnergy} ⚡ Verbrauch`;
            }
            case "deuterium_synthesizer": {
                const currentProd = currentLevel > 0 ? calculateProduction("deuterium_synthesizer", currentLevel) : 0;
                const nextProd = calculateProduction("deuterium_synthesizer", nextLevel);
                const currentEnergy = currentLevel > 0 ? calculateEnergyConsumption("deuterium_synthesizer", currentLevel) : 0;
                const nextEnergy = calculateEnergyConsumption("deuterium_synthesizer", nextLevel);
                return `+${nextProd - currentProd} Deuterium/h | +${nextEnergy - currentEnergy} ⚡ Verbrauch`;
            }
            case "solar_plant": {
                const currentEnergy = currentLevel > 0 ? calculateSolarEnergy(currentLevel) : 0;
                const nextEnergy = calculateSolarEnergy(nextLevel);
                return `+${nextEnergy - currentEnergy} ⚡ Produktion`;
            }
            case "metal_storage":
            case "crystal_storage":
            case "deuterium_tank": {
                const currentCap = currentLevel > 0 ? calculateStorageCapacity(currentLevel) : 10000;
                const nextCap = calculateStorageCapacity(nextLevel);
                return `+${formatNumber(nextCap - currentCap)} Kapazität`;
            }
            case "command_center":
                return `-10% Bauzeit für alle Gebäude`;
            case "shipyard":
                return `-10% Bauzeit für Schiffe`;
            case "research_lab":
                return `-5% Forschungszeit`;
            default:
                return "Verbesserte Effizienz";
        }
    };

    const renderBuildingCard = (building: ExtendedBuilding) => {
        const def = BUILDING_DEFINITIONS[building.type as BuildingTypeEnum];
        if (!def) return null;

        const nextLevel = building.level + 1;
        const cost = calculateBuildingCost(building.type as BuildingTypeEnum, building.level);
        const buildTime = calculateBuildTime(building.type as BuildingTypeEnum, nextLevel, commandCenterLevel);
        const affordable = canAfford(building.type as BuildingTypeEnum, building.level);
        const countdown = countdowns[building.type];
        const energyWarning = wouldCauseEnergyDeficit(building.type as BuildingTypeEnum, building.level);

        // LOCKED BUILDING
        if (building.isLocked) {
            return (
                <Card key={building.id} variant="bordered" className="relative overflow-hidden opacity-60">
                    <div className="absolute top-2 right-2">
                        <Lock className="w-5 h-5 text-foreground-muted" />
                    </div>
                    <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-medium flex items-center gap-2 text-foreground-muted">
                                    <Building className="w-4 h-4" />
                                    {def.name}
                                </h4>
                            </div>
                        </div>
                        <p className="text-xs text-foreground-muted mb-4">{def.description}</p>

                        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
                            <p className="text-xs text-danger font-medium mb-2">⚠️ Voraussetzungen fehlen:</p>
                            <ul className="text-xs text-foreground-muted space-y-1">
                                {building.missingRequirements?.map((req, i) => (
                                    <li key={i}>• {req.building} Level {req.level} (aktuell: {req.currentLevel})</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card key={building.id} variant="bordered" className="relative overflow-hidden">
                {/* UPGRADE IN PROGRESS OVERLAY - Redesigned */}
                {building.is_upgrading && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
                        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                        <h4 className="text-lg font-display text-primary mb-1">{def.name}</h4>
                        <p className="text-sm text-foreground-muted mb-2">wird auf Level {building.level + 1} ausgebaut</p>
                        {countdown !== undefined && countdown > 0 && (
                            <p className="text-2xl font-mono text-primary mb-4">
                                {formatCountdown(countdown)}
                            </p>
                        )}
                        <Button
                            size="sm"
                            variant="secondary"
                            className="border-danger text-danger hover:bg-danger/20"
                            onClick={() => handleCancel(building.type)}
                            loading={canceling === building.type}
                            disabled={canceling !== null}
                        >
                            <X className="w-4 h-4 mr-1" />
                            Abbrechen (50% Erstattung)
                        </Button>
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
                            <div className="text-2xl font-display text-gradient">{building.level}</div>
                        )}
                    </div>

                    <p className="text-xs text-foreground-muted mb-3">{def.description}</p>

                    {building.level < def.maxLevel && (
                        <>
                            {/* Upgrade Benefit */}
                            <div className="flex items-center gap-2 mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-xs text-green-400">
                                    {getUpgradeBenefit(building.type as BuildingTypeEnum, building.level)}
                                </span>
                            </div>

                            {/* Energy Warning */}
                            {energyWarning && (
                                <div className="flex items-center gap-2 mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                    <span className="text-xs text-yellow-400">
                                        Warnung: Dieses Upgrade erhöht den Energieverbrauch!
                                    </span>
                                </div>
                            )}

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
            {/* Energy Status */}
            <div className={`p-3 rounded-lg flex items-center gap-3 ${hasEnergy ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <Zap className={`w-5 h-5 ${hasEnergy ? 'text-green-400' : 'text-red-400'}`} />
                <div>
                    <span className={`text-sm font-medium ${hasEnergy ? 'text-green-400' : 'text-red-400'}`}>
                        Energie: {resources.energy_production} / {resources.energy_consumption}
                    </span>
                    <span className="text-xs text-foreground-muted ml-2">
                        ({energyBalance >= 0 ? '+' : ''}{energyBalance})
                    </span>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-danger/20 border border-danger/50 rounded-lg text-sm text-danger">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-sm text-green-400">
                    ✅ {success}
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
