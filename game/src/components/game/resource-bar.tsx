"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui";
import type { PlanetResources } from "@/types";
import { formatNumber } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ResourceBarProps {
    resources: PlanetResources;
    planetId: string;
}

export function ResourceBar({ resources: initialResources, planetId }: ResourceBarProps) {
    const [resources, setResources] = useState<PlanetResources>(initialResources);

    const energyBalance = resources.energy_production - resources.energy_consumption;
    const isEnergyPositive = energyBalance >= 0;

    // Calculate efficiency when energy is insufficient
    const efficiency = resources.energy_production > 0 && resources.energy_consumption > 0
        ? Math.min(100, Math.floor((resources.energy_production / resources.energy_consumption) * 100))
        : 100;

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

        fetchResources();
        const interval = setInterval(fetchResources, 2000);
        return () => clearInterval(interval);
    }, [planetId]);

    useEffect(() => {
        setResources(initialResources);
    }, [initialResources]);

    return (
        <Card variant="bordered">
            <CardContent className="py-4">
                {/* Efficiency Warning */}
                {!isEnergyPositive && (
                    <div
                        className="flex items-center gap-3 p-3 mb-4 bg-danger/10 border border-danger/30 rounded-lg"
                        role="alert"
                        aria-live="assertive"
                    >
                        <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-danger">Energiemangel</p>
                            <p className="text-sm text-foreground/70">
                                Produktionseffizienz: {efficiency}% - Baue mehr Solarkraftwerke oder einen Fusionsreaktor
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Metal */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground/70">
                                Metall
                            </span>
                            <span className={`text-xs ${isEnergyPositive ? "text-foreground/70" : "text-danger"}`}>
                                +{formatNumber(Math.floor(resources.metal_production * (efficiency / 100)))}/h
                                {!isEnergyPositive && <span className="text-danger/70 ml-1">({efficiency}%)</span>}
                            </span>
                        </div>
                        <div className="text-xl font-display text-resource-metal">
                            {formatNumber(Math.floor(resources.metal))}
                        </div>
                        <div
                            className="h-1.5 bg-background rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={resources.metal_capacity}
                            aria-valuenow={Math.floor(resources.metal)}
                            aria-label={`Metallspeicher: ${formatNumber(Math.floor(resources.metal))} von ${formatNumber(resources.metal_capacity)}`}
                        >
                            <div
                                className="h-full bg-resource-metal transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (resources.metal / resources.metal_capacity) * 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground/70 text-right">
                            / {formatNumber(resources.metal_capacity)}
                        </div>
                    </div>

                    {/* Crystal */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground/70">
                                Kristall
                            </span>
                            <span className={`text-xs ${isEnergyPositive ? "text-foreground/70" : "text-danger"}`}>
                                +{formatNumber(Math.floor(resources.crystal_production * (efficiency / 100)))}/h
                                {!isEnergyPositive && <span className="text-danger/70 ml-1">({efficiency}%)</span>}
                            </span>
                        </div>
                        <div className="text-xl font-display text-resource-crystal">
                            {formatNumber(Math.floor(resources.crystal))}
                        </div>
                        <div
                            className="h-1.5 bg-background rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={resources.crystal_capacity}
                            aria-valuenow={Math.floor(resources.crystal)}
                            aria-label={`Kristallspeicher: ${formatNumber(Math.floor(resources.crystal))} von ${formatNumber(resources.crystal_capacity)}`}
                        >
                            <div
                                className="h-full bg-resource-crystal transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (resources.crystal / resources.crystal_capacity) * 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground/70 text-right">
                            / {formatNumber(resources.crystal_capacity)}
                        </div>
                    </div>

                    {/* Deuterium */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground/70">
                                Deuterium
                            </span>
                            <span className={`text-xs ${isEnergyPositive ? "text-foreground/70" : "text-danger"}`}>
                                +{formatNumber(Math.floor(resources.deuterium_production * (efficiency / 100)))}/h
                                {!isEnergyPositive && <span className="text-danger/70 ml-1">({efficiency}%)</span>}
                            </span>
                        </div>
                        <div className="text-xl font-display text-resource-deuterium">
                            {formatNumber(Math.floor(resources.deuterium))}
                        </div>
                        <div
                            className="h-1.5 bg-background rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={resources.deuterium_capacity}
                            aria-valuenow={Math.floor(resources.deuterium)}
                            aria-label={`Deuteriumspeicher: ${formatNumber(Math.floor(resources.deuterium))} von ${formatNumber(resources.deuterium_capacity)}`}
                        >
                            <div
                                className="h-full bg-resource-deuterium transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (resources.deuterium / resources.deuterium_capacity) * 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground/70 text-right">
                            / {formatNumber(resources.deuterium_capacity)}
                        </div>
                    </div>

                    {/* Energy */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground/70">
                                Energie
                            </span>
                            <span className={`text-xs font-medium ${isEnergyPositive ? "text-green-400" : "text-danger"}`}>
                                {isEnergyPositive ? "+" : ""}{energyBalance}
                            </span>
                        </div>
                        <div className={`text-xl font-display ${isEnergyPositive ? "text-resource-energy" : "text-danger"}`}>
                            {formatNumber(resources.energy_production)}
                        </div>
                        <div
                            className="h-1.5 bg-background rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={resources.energy_production}
                            aria-valuenow={resources.energy_consumption}
                            aria-label={`Energieverbrauch: ${formatNumber(resources.energy_consumption)} von ${formatNumber(resources.energy_production)} produziert`}
                        >
                            <div
                                className={`h-full transition-all duration-300 ${isEnergyPositive ? "bg-resource-energy" : "bg-danger"}`}
                                style={{
                                    width: resources.energy_production > 0
                                        ? `${Math.min(100, (resources.energy_consumption / resources.energy_production) * 100)}%`
                                        : "0%",
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground/70 text-right">
                            Verbrauch: {formatNumber(resources.energy_consumption)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
