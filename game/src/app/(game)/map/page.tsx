"use client";

import { useState } from "react";
import { GalaxyMap } from "@/components/game/galaxy-map";
import { SystemView } from "@/components/game/system-view";

export default function MapPage() {
    const [selectedSector, setSelectedSector] = useState<number | null>(null);

    return (
        <div className="max-w-6xl mx-auto">
            {selectedSector ? (
                <SystemView
                    sector={selectedSector}
                    onBack={() => setSelectedSector(null)}
                />
            ) : (
                <GalaxyMap onSelectSector={setSelectedSector} />
            )}
        </div>
    );
}
