"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { LogOut, Bell, Menu, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { formatNumber } from "@/lib/utils";

interface TotalResources {
    metal: number;
    crystal: number;
    deuterium: number;
    metal_production: number;
    crystal_production: number;
    deuterium_production: number;
    energy_production: number;
    energy_consumption: number;
}

interface GameHeaderProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    resources?: TotalResources | null;
    planets?: { id: string; name: string }[];
    currentPlanetId?: string | null;
}

export function GameHeader({ user, resources: initialResources, planets = [], currentPlanetId }: GameHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [resources, setResources] = useState<TotalResources | null>(initialResources || null);

    // Fetch total resources every 2 seconds
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await fetch("/api/user/total-resources");
                if (response.ok) {
                    const data = await response.json();
                    if (data.resources) {
                        setResources(data.resources);
                    }
                }
            } catch (err) {
                console.error("Error fetching total resources:", err);
            }
        };

        fetchResources();
        const interval = setInterval(fetchResources, 2000);
        return () => clearInterval(interval);
    }, []);

    // Update from props when they change
    useEffect(() => {
        if (initialResources) {
            setResources(initialResources);
        }
    }, [initialResources]);

    const energyProduction = resources?.energy_production || 0;
    const energyConsumption = resources?.energy_consumption || 0;
    const energyBalance = energyProduction - energyConsumption;

    return (
        <header className="h-16 bg-background-elevated border-b border-border px-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden text-foreground/60 hover:text-primary"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Menü öffnen"
                    aria-expanded={mobileMenuOpen}
                >
                    <Menu className="w-6 h-6" aria-hidden="true" />
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
                            production={Math.floor(resources.metal_production)}
                        />
                        <ResourceDisplay
                            label="Kristall"
                            value={Math.floor(resources.crystal)}
                            production={Math.floor(resources.crystal_production)}
                            color="text-primary"
                        />
                        <ResourceDisplay
                            label="Deuterium"
                            value={Math.floor(resources.deuterium)}
                            production={Math.floor(resources.deuterium_production)}
                            color="text-accent"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-foreground/60 text-xs uppercase">Energie:</span>
                            <span className={`font-medium ${energyBalance >= 0 ? "text-positive" : "text-danger"}`}>
                                {energyProduction}
                                <span className="text-foreground/50">/{energyConsumption}</span>
                            </span>
                        </div>
                    </>
                ) : (
                    <span className="text-foreground/60 text-xs">Wähle einen Planeten</span>
                )}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
                {/* Planet Selector (if multiple planets) */}
                {planets.length > 1 && (
                    <div className="hidden md:flex items-center gap-2 text-sm">
                        <span className="text-foreground/60">Planet:</span>
                        <span className="text-primary font-medium">
                            {planets.find(p => p.id === currentPlanetId)?.name || "Unbekannt"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-foreground/50" />
                    </div>
                )}

                {/* Notifications */}
                <button
                    className="relative text-foreground/60 hover:text-primary transition-colors"
                    aria-label="3 neue Benachrichtigungen"
                >
                    <Bell className="w-5 h-5" aria-hidden="true" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] flex items-center justify-center text-white" aria-hidden="true">
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
                    <span className="hidden sm:block text-sm font-medium text-foreground">
                        {user.name}
                    </span>
                </div>

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-foreground/60"
                    aria-label="Abmelden"
                >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
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
            <span className="text-foreground/60 text-xs uppercase">{label}:</span>
            <span className={`font-medium ${color}`}>
                {formatNumber(value)}
            </span>
            {production > 0 && (
                <span className="text-xs text-positive">
                    (+{formatNumber(production)}/h)
                </span>
            )}
        </div>
    );
}
