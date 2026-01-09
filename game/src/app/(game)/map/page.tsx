import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Map } from "lucide-react";

export default function MapPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display text-gradient mb-2">
                    Galaxiekarte
                </h1>
                <p className="text-foreground-muted">
                    Erkunde die Galaxie und entdecke neue Welten.
                </p>
            </div>

            <Card variant="bordered" className="text-center py-12">
                <CardContent>
                    <Map className="w-16 h-16 mx-auto mb-4 text-foreground-muted opacity-50" />
                    <h3 className="text-xl font-medium mb-2">Galaxiekarte</h3>
                    <p className="text-foreground-muted">
                        Die interaktive Sternenkarte wird in einer zukünftigen Version implementiert.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
