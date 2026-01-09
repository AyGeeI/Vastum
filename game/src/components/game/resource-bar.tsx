import { Card, CardContent } from "@/components/ui";
import type { PlanetResources } from "@/types";
import { formatNumber } from "@/lib/utils";

interface ResourceBarProps {
    resources: PlanetResources;
}

export function ResourceBar({ resources }: ResourceBarProps) {
    const energyBalance = resources.energy_production - resources.energy_consumption;
    const isEnergyPositive = energyBalance >= 0;

    return (
        <Card variant="bordered">
            <CardContent className="py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Metal */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground-muted">
                                Metall
                            </span>
                            <span className="text-xs text-green-400">
                                +{formatNumber(resources.metal_production)}/h
                            </span>
                        </div>
                        <div className="text-xl font-display text-gray-400">
                            {formatNumber(Math.floor(resources.metal))}
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gray-400 transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (resources.metal / resources.metal_capacity) * 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground-muted text-right">
                            / {formatNumber(resources.metal_capacity)}
                        </div>
                    </div>

                    {/* Crystal */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground-muted">
                                Kristall
                            </span>
                            <span className="text-xs text-green-400">
                                +{formatNumber(resources.crystal_production)}/h
                            </span>
                        </div>
                        <div className="text-xl font-display text-blue-400">
                            {formatNumber(Math.floor(resources.crystal))}
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-400 transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (resources.crystal / resources.crystal_capacity) * 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground-muted text-right">
                            / {formatNumber(resources.crystal_capacity)}
                        </div>
                    </div>

                    {/* Deuterium */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground-muted">
                                Deuterium
                            </span>
                            <span className="text-xs text-green-400">
                                +{formatNumber(resources.deuterium_production)}/h
                            </span>
                        </div>
                        <div className="text-xl font-display text-green-400">
                            {formatNumber(Math.floor(resources.deuterium))}
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-400 transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (resources.deuterium / resources.deuterium_capacity) * 100)}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground-muted text-right">
                            / {formatNumber(resources.deuterium_capacity)}
                        </div>
                    </div>

                    {/* Energy */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-foreground-muted">
                                Energie
                            </span>
                            <span className={`text-xs ${isEnergyPositive ? "text-green-400" : "text-red-400"}`}>
                                {isEnergyPositive ? "+" : ""}{energyBalance}
                            </span>
                        </div>
                        <div className={`text-xl font-display ${isEnergyPositive ? "text-yellow-400" : "text-red-400"}`}>
                            {formatNumber(resources.energy_production)}
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${isEnergyPositive ? "bg-yellow-400" : "bg-red-400"}`}
                                style={{
                                    width: resources.energy_production > 0
                                        ? `${Math.min(100, (resources.energy_consumption / resources.energy_production) * 100)}%`
                                        : "0%",
                                }}
                            />
                        </div>
                        <div className="text-xs text-foreground-muted text-right">
                            Verbrauch: {formatNumber(resources.energy_consumption)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
