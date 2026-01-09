"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Card, Button } from "@/components/ui";
import { ZoomIn, ZoomOut, Home, Info, X } from "lucide-react";
import {
    generateSectors,
    generateStars,
    SpatialHash,
    Camera,
    renderNebula,
    renderStars,
    renderSectors,
    renderOverlay,
    type Sector,
    type Star,
} from "@/lib/galaxy";

interface ProceduralGalaxyProps {
    onSelectSector?: (sector: Sector) => void;
}

export function ProceduralGalaxy({ onSelectSector }: ProceduralGalaxyProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    // Galaxy data (generated once)
    const sectorsRef = useRef<Sector[]>([]);
    const starsRef = useRef<Star[]>([]);
    const spatialHashRef = useRef<SpatialHash | null>(null);
    const cameraRef = useRef<Camera>(new Camera(0, 0, 0.5));

    // State
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [hoveredSector, setHoveredSector] = useState<Sector | null>(null);
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Drag tracking
    const dragStart = useRef({ x: 0, y: 0 });
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Initialize galaxy data
    useEffect(() => {
        if (!isInitialized) {
            console.log("Generating galaxy...");
            sectorsRef.current = generateSectors({ numSectors: 800 });
            starsRef.current = generateStars({ numStars: 4000 });
            spatialHashRef.current = new SpatialHash(100);
            spatialHashRef.current.insertAll(sectorsRef.current);
            setIsInitialized(true);
            console.log("Galaxy generated:", sectorsRef.current.length, "sectors");
        }
    }, [isInitialized]);

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

    // Update camera viewport
    useEffect(() => {
        cameraRef.current.setViewport(dimensions.width, dimensions.height);
    }, [dimensions]);

    // Render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isInitialized) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const render = () => {
            const camera = cameraRef.current;
            camera.update();

            // Clear
            ctx.fillStyle = "#050510";
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);

            // Render layers
            renderNebula(ctx, dimensions.width, dimensions.height, camera);
            renderStars(ctx, starsRef.current, camera);
            renderSectors(ctx, sectorsRef.current, camera, hoveredSector);
            renderOverlay(ctx, hoveredSector, camera, dimensions.width, dimensions.height);

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [dimensions, hoveredSector, isInitialized]);

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (isDragging) {
            // Pan
            const dx = lastMousePos.current.x - e.clientX;
            const dy = lastMousePos.current.y - e.clientY;
            cameraRef.current.pan(dx, dy);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            setHoveredSector(null);
        } else {
            // Hit detection
            const camera = cameraRef.current;
            const worldX = camera.screenToWorldX(mouseX);
            const worldY = camera.screenToWorldY(mouseY);

            const nearest = spatialHashRef.current?.findNearest(worldX, worldY, 30 / camera.state.zoom);
            setHoveredSector(nearest || null);
        }
    }, [isDragging]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        const wasDragging = isDragging;
        const dragDistance = Math.sqrt(
            Math.pow(e.clientX - dragStart.current.x, 2) +
            Math.pow(e.clientY - dragStart.current.y, 2)
        );

        setIsDragging(false);

        // If it was a click (not a drag)
        if (dragDistance < 5 && hoveredSector) {
            setSelectedSector(hoveredSector);
            if (onSelectSector) {
                onSelectSector(hoveredSector);
            }
        }
    }, [isDragging, hoveredSector, onSelectSector]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? -0.1 : 0.1;

        cameraRef.current.zoomAt(delta, mouseX, mouseY);
    }, []);

    const handleZoomIn = () => {
        cameraRef.current.setZoom(cameraRef.current.state.targetZoom * 1.5);
    };

    const handleZoomOut = () => {
        cameraRef.current.setZoom(cameraRef.current.state.targetZoom / 1.5);
    };

    const handleResetView = () => {
        cameraRef.current.moveTo(0, 0);
        cameraRef.current.setZoom(0.5);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display text-gradient">Galaxie Andromeda</h2>
                    <p className="text-foreground/60 text-sm mt-1">
                        {sectorsRef.current.length} Sektoren - Klicke und ziehe zum Navigieren
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleZoomOut}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleResetView}>
                        <Home className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleZoomIn}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(102,252,241,0.6)]" />
                    <span className="text-foreground/70">Eigene Planeten</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_rgba(255,107,107,0.5)]" />
                    <span className="text-foreground/70">Andere Spieler</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-foreground/50" />
                    <span className="text-foreground/70">Unbesiedelt</span>
                </div>
            </div>

            {/* Galaxy Canvas */}
            <Card variant="bordered" className="overflow-hidden">
                <div
                    ref={containerRef}
                    className="relative"
                    style={{ height: "600px" }}
                >
                    <canvas
                        ref={canvasRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        className="cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={() => {
                            setIsDragging(false);
                            setHoveredSector(null);
                        }}
                        onWheel={handleWheel}
                    />

                    {/* Instructions Overlay */}
                    <div className="absolute bottom-4 left-4 text-xs text-foreground/40 pointer-events-none">
                        Mausrad: Zoomen | Klicken + Ziehen: Navigieren
                    </div>
                </div>
            </Card>

            {/* Selected Sector Info */}
            {selectedSector && (
                <Card variant="bordered" className="bg-background-elevated">
                    <div className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-display text-primary text-lg">
                                    Sektor {selectedSector.id}
                                </h3>
                                <p className="text-sm text-foreground/60 capitalize">
                                    {selectedSector.type === "core" ? "Galaxiekern" :
                                        selectedSector.type === "arm" ? "Spiralarm" : "Äußerer Rand"}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSector(null)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-display text-foreground">
                                    {selectedSector.totalPlanets}
                                </div>
                                <div className="text-xs text-foreground/50">Planeten</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-display text-danger">
                                    {selectedSector.colonizedPlanets}
                                </div>
                                <div className="text-xs text-foreground/50">Kolonisiert</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-display text-primary">
                                    {selectedSector.myPlanets}
                                </div>
                                <div className="text-xs text-foreground/50">Eigene</div>
                            </div>
                        </div>
                        <Button className="w-full mt-4" variant="primary">
                            Sektor erkunden
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
