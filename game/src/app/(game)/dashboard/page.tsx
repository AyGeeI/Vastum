import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
    TrendingUp,
    Package,
    Shield,
    Rocket,
    AlertTriangle,
    Clock
} from "lucide-react";

export default async function DashboardPage() {
    const session = await auth();
    const userName = session?.user?.name?.split(" ")[0] || "Kommandant";

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-display text-gradient mb-2">
                    Willkommen, {userName}
                </h1>
                <p className="text-foreground-muted">
                    Hier ist die aktuelle Übersicht deines Imperiums.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Planeten"
                    value="1"
                    subtitle="1 Kolonie aktiv"
                    icon={<Package className="w-5 h-5" />}
                    trend="+0%"
                />
                <StatCard
                    title="Produktion/h"
                    value="1.2K"
                    subtitle="Metall + Kristall"
                    icon={<TrendingUp className="w-5 h-5" />}
                    trend="+5%"
                    trendUp
                />
                <StatCard
                    title="Flottenstärke"
                    value="0"
                    subtitle="Keine aktiven Schiffe"
                    icon={<Rocket className="w-5 h-5" />}
                />
                <StatCard
                    title="Verteidigung"
                    value="0"
                    subtitle="Keine Verteidigungen"
                    icon={<Shield className="w-5 h-5" />}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Building Queue */}
                <Card variant="bordered" className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Aktive Bauprojekte
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-foreground-muted">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Keine aktiven Bauprojekte.</p>
                            <p className="text-sm mt-2">
                                Gehe zu <span className="text-primary">Planet</span>, um mit dem Aufbau zu beginnen.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts & Messages */}
                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Meldungen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <AlertItem
                                type="info"
                                title="Willkommen bei Vastum!"
                                message="Dein Abenteuer beginnt jetzt. Baue deine erste Mine."
                                time="Gerade eben"
                            />
                            <AlertItem
                                type="success"
                                title="Schutzphase aktiv"
                                message="Du bist für 7 Tage vor Angriffen geschützt."
                                time="Gerade eben"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tutorial Hint */}
            <Card variant="glass" className="border border-primary/30">
                <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🚀</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-primary">Erste Schritte</h3>
                        <p className="text-sm text-foreground-muted">
                            Beginne damit, deine <strong>Metallmine</strong> zu bauen, um Ressourcen zu produzieren.
                            Dann kannst du weitere Gebäude freischalten und dein Imperium erweitern.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendUp,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
}) {
    return (
        <Card variant="bordered">
            <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground-muted text-sm uppercase tracking-wider">
                        {title}
                    </span>
                    <div className="text-primary">{icon}</div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display text-gradient">{value}</span>
                    {trend && (
                        <span
                            className={`text-xs ${trendUp ? "text-positive" : "text-foreground-muted"
                                }`}
                        >
                            {trend}
                        </span>
                    )}
                </div>
                <p className="text-xs text-foreground-muted mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    );
}

function AlertItem({
    type,
    title,
    message,
    time,
}: {
    type: "info" | "success" | "warning" | "danger";
    title: string;
    message: string;
    time: string;
}) {
    const colors = {
        info: "border-primary/50 bg-primary/10",
        success: "border-green-500/50 bg-green-500/10",
        warning: "border-yellow-500/50 bg-yellow-500/10",
        danger: "border-danger/50 bg-danger/10",
    };

    return (
        <div className={`p-3 rounded-lg border ${colors[type]}`}>
            <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{title}</span>
                <span className="text-xs text-foreground-muted">{time}</span>
            </div>
            <p className="text-xs text-foreground-muted">{message}</p>
        </div>
    );
}
