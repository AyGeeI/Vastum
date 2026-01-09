import { Card, CardContent } from "@/components/ui";
import { Rocket } from "lucide-react";

export default function FleetPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display text-gradient mb-2">
                    Flottenmanagement
                </h1>
                <p className="text-foreground-muted">
                    Baue und kommandiere deine Raumflotte.
                </p>
            </div>

            <Card variant="bordered" className="text-center py-12">
                <CardContent>
                    <Rocket className="w-16 h-16 mx-auto mb-4 text-foreground-muted opacity-50" />
                    <h3 className="text-xl font-medium mb-2">Keine Flotte</h3>
                    <p className="text-foreground-muted">
                        Du hast noch keine Schiffe. Baue eine Raumschiffwerft, um Schiffe zu produzieren.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
