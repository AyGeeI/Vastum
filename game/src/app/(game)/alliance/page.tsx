import { Card, CardContent } from "@/components/ui";
import { Users } from "lucide-react";

export default function AlliancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display text-gradient mb-2">
                    Allianz
                </h1>
                <p className="text-foreground-muted">
                    Verbünde dich mit anderen Kommandanten.
                </p>
            </div>

            <Card variant="bordered" className="text-center py-12">
                <CardContent>
                    <Users className="w-16 h-16 mx-auto mb-4 text-foreground-muted opacity-50" />
                    <h3 className="text-xl font-medium mb-2">Keine Allianz</h3>
                    <p className="text-foreground-muted">
                        Du bist derzeit keiner Allianz beigetreten.
                        Erstelle eine neue Allianz oder tritt einer bestehenden bei.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
