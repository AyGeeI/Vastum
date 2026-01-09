"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { LogOut, Bell, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { PlanetResources } from "@/types";

interface GameHeaderProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    resources?: PlanetResources | null;
    planets?: { id: string; name: string }[];
    currentPlanetId?: string | null;
}

export function GameHeader({ user, resources, planets = [], currentPlanetId }: GameHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Calculate energy balance
    const energyProduction = resources?.energy_production || 0;
    const energyConsumption = resources?.energy_consumption || 0;
    const energyBalance = energyProduction - energyConsumption;

    return (
        <header className="h-16 bg-background-elevated border-b border-border px-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden text-foreground-muted hover:text-primary"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <Menu className="w-6 h-6" />
                </button>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <h1 className="text-xl font-display tracking-widest text-gradient">
                        VASTUM
                    </h1>
                </Link>
            </div>

            {/* Resource Bar */}
            <div className="hidden lg:flex items-center gap-6 text-sm">
                {resources ? (
                    <>
                        <ResourceDisplay
                            label="Metall"
                            value={Math.floor(resources.metal)}
                            production={resources.metal_production}
                            color="text-gray-400"
                        />
                        <ResourceDisplay
                            label="Kristall"
                            value={Math.floor(resources.crystal)}
                            production={resources.crystal_production}
                            color="text-blue-400"
                        />
                        <ResourceDisplay
                            label="Deuterium"
                            value={Math.floor(resources.deuterium)}
                            production={resources.deuterium_production}
                            color="text-green-400"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-foreground-muted text-xs uppercase">Energie:</span>
                            <span className={`font-medium ${energyBalance >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                                {energyProduction}
                                <span className="text-foreground-muted">/{energyConsumption}</span>
                            </span>
                        </div>
                    </>
                ) : (
                    <span className="text-foreground-muted text-xs">Wähle einen Planeten</span>
                )}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
                {/* Planet Selector (if multiple planets) */}
                {planets.length > 1 && (
                    <div className="hidden md:flex items-center gap-2 text-sm">
                        <span className="text-foreground-muted">Planet:</span>
                        <span className="text-primary font-medium">
                            {planets.find(p => p.id === currentPlanetId)?.name || "Unbekannt"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-foreground-muted" />
                    </div>
                )}

                {/* Notifications */}
                <button className="relative text-foreground-muted hover:text-primary transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] flex items-center justify-center text-white">
                        3
                    </span>
                </button>

                {/* User Avatar & Menu */}
                <div className="flex items-center gap-3">
                    {user.image ? (
                        <Image
                            src={user.image}
                            alt={user.name || "User"}
                            width={32}
                            height={32}
                            className="rounded-full border border-border"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                            {user.name?.charAt(0) || "U"}
                        </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium">
                        {user.name}
                    </span>
                </div>

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-foreground-muted"
                >
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        </header>
    );
}

function ResourceDisplay({
    label,
    value,
    production = 0,
    color = "text-foreground",
}: {
    label: string;
    value: number;
    production?: number;
    color?: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-foreground-muted text-xs uppercase">{label}:</span>
            <span className={`font-medium ${color}`}>
                {value.toLocaleString("de-DE")}
            </span>
            {production > 0 && (
                <span className="text-xs text-foreground-muted">
                    (+{production}/h)
                </span>
            )}
        </div>
    );
}
