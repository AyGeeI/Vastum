"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Globe,
    Map,
    Rocket,
    Users,
    ShoppingCart,
    Settings,
    ChevronDown,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
}

interface SidebarProps {
    planets?: { id: string; name: string }[];
    currentPlanetId?: string | null;
}

const navItems: NavItem[] = [
    { label: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
    { label: "Planet", href: "/planet", icon: Globe },
    { label: "Galaxie", href: "/map", icon: Map },
    { label: "Flotte", href: "/fleet", icon: Rocket },
    { label: "Allianz", href: "/alliance", icon: Users },
    { label: "Markt", href: "/market", icon: ShoppingCart },
];

export function Sidebar({ planets = [], currentPlanetId }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [planetMenuOpen, setPlanetMenuOpen] = useState(false);

    const handlePlanetChange = (planetId: string) => {
        router.push(`/planet?id=${planetId}`);
        setPlanetMenuOpen(false);
    };

    const currentPlanet = planets.find(p => p.id === currentPlanetId);

    return (
        <aside className="w-64 bg-background-elevated border-r border-border hidden md:block">
            {/* Planet Selector */}
            {planets.length > 0 && (
                <div className="p-4 border-b border-border">
                    <div className="text-xs uppercase tracking-wider text-foreground-muted mb-2">
                        Aktueller Planet
                    </div>
                    <button
                        onClick={() => setPlanetMenuOpen(!planetMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                        aria-expanded={planetMenuOpen}
                        aria-haspopup="listbox"
                        aria-label={`Planet auswählen, aktuell: ${currentPlanet?.name || "Kein Planet"}`}
                    >
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" aria-hidden="true" />
                            <span className="font-medium text-sm">
                                {currentPlanet?.name || "Kein Planet"}
                            </span>
                        </div>
                        {planets.length > 1 && (
                            <ChevronDown className={cn(
                                "w-4 h-4 text-foreground-muted transition-transform",
                                planetMenuOpen && "rotate-180"
                            )} aria-hidden="true" />
                        )}
                    </button>

                    {/* Planet Dropdown */}
                    {planetMenuOpen && planets.length > 1 && (
                        <div className="mt-2 bg-background border border-border rounded-lg overflow-hidden" role="listbox">
                            {planets.map(planet => (
                                <button
                                    key={planet.id}
                                    onClick={() => handlePlanetChange(planet.id)}
                                    className={cn(
                                        "w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors flex items-center gap-2",
                                        planet.id === currentPlanetId && "bg-primary/20 text-primary"
                                    )}
                                    role="option"
                                    aria-selected={planet.id === currentPlanetId}
                                >
                                    <Globe className="w-4 h-4" aria-hidden="true" />
                                    {planet.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    // Add planet ID to planet link if we have one
                    const href = item.href === "/planet" && currentPlanetId
                        ? `/planet?id=${currentPlanetId}`
                        : item.href;

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                "hover:bg-primary/10 hover:text-primary",
                                isActive
                                    ? "bg-primary/20 text-primary border-l-2 border-primary"
                                    : "text-foreground-muted"
                            )}
                        >
                            <Icon className="w-5 h-5" aria-hidden="true" />
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                                <span className="ml-auto bg-danger text-white text-xs px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}

                <div className="pt-6 mt-6 border-t border-border">
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            "hover:bg-primary/10 hover:text-primary text-foreground-muted"
                        )}
                    >
                        <Settings className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">Einstellungen</span>
                    </Link>
                </div>
            </nav>
        </aside>
    );
}
