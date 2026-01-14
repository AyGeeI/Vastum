import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Settings, User, Bell, Palette, Shield } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-display text-gradient mb-2 flex items-center gap-3">
                    <Settings className="w-8 h-8" aria-hidden="true" />
                    Einstellungen
                </h1>
                <p className="text-foreground-muted">
                    Verwalte dein Konto und Spieleinstellungen.
                </p>
            </div>

            {/* Settings Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" aria-hidden="true" />
                            Profil
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground-muted">
                            Profiloptionen werden bald verfügbar sein.
                        </p>
                    </CardContent>
                </Card>

                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" aria-hidden="true" />
                            Benachrichtigungen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground-muted">
                            Benachrichtigungseinstellungen werden bald verfügbar sein.
                        </p>
                    </CardContent>
                </Card>

                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" aria-hidden="true" />
                            Darstellung
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground-muted">
                            Anzeigeoptionen werden bald verfügbar sein.
                        </p>
                    </CardContent>
                </Card>

                <Card variant="bordered">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" aria-hidden="true" />
                            Sicherheit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-foreground-muted">
                            Sicherheitseinstellungen werden bald verfügbar sein.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
