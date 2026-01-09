import { Card, CardContent } from "@/components/ui";
import { ShoppingCart } from "lucide-react";

export default function MarketPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display text-gradient mb-2">
                    Galaktischer Markt
                </h1>
                <p className="text-foreground-muted">
                    Handel mit anderen Spielern und tausche Ressourcen.
                </p>
            </div>

            <Card variant="bordered" className="text-center py-12">
                <CardContent>
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-foreground-muted opacity-50" />
                    <h3 className="text-xl font-medium mb-2">Markt nicht verfügbar</h3>
                    <p className="text-foreground-muted">
                        Du benötigst einen Handelsposten, um auf den galaktischen Markt zuzugreifen.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
