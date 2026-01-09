"use client";

import { useState } from "react";
import { ProceduralGalaxy } from "@/components/game/procedural-galaxy";
import { SystemView } from "@/components/game/system-view";
import type { Sector } from "@/lib/galaxy";

export default function MapPage() {
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

    const handleSelectSector = (sector: Sector) => {
        setSelectedSector(sector);
    };

    return (
        <div className="max-w-7xl mx-auto">
            {selectedSector ? (
                <SystemView
                    sector={parseInt(selectedSector.id.split("-")[1] || "1")}
                    onBack={() => setSelectedSector(null)}
                />
            ) : (
                <ProceduralGalaxy onSelectSector={handleSelectSector} />
            )}
        </div>
    );
}
