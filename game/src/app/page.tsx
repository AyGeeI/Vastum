import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();

  // Redirect logged in users to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        {/* Logo / Title */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-display tracking-widest text-gradient mb-4">
            VASTUM
          </h1>
          <p className="text-xl md:text-2xl text-foreground-muted font-light tracking-wide">
            Build deeply. Fight strategically. Connect globally.
          </p>
        </div>

        {/* Tagline */}
        <p className="max-w-2xl text-foreground-muted mb-12 leading-relaxed">
          Tauche ein in die unerforschten Tiefen des Weltraums. Errichte dein Imperium,
          schmiede Allianzen und führe deine Flotten zum Sieg in diesem modernen
          Sci-Fi Browserspiel.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login">
            <Button size="lg" className="min-w-[200px]">
              Spiel Starten
            </Button>
          </Link>
          <Button variant="secondary" size="lg" className="min-w-[200px]">
            Mehr Erfahren
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="features-heading" className="text-3xl font-display text-center mb-12 text-gradient">
            Kernfeatures
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card variant="bordered" className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-display text-primary mb-2">
                  Kolonie-Aufbau
                </h3>
                <p className="text-sm text-foreground-muted">
                  Errichte und erweitere deine planetaren Kolonien.
                  Verwalte Ressourcen und optimiere deine Produktion.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card variant="bordered" className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-display text-primary mb-2">
                  Allianzen
                </h3>
                <p className="text-sm text-foreground-muted">
                  Verbünde dich mit anderen Kommandanten.
                  Teile Ressourcen und koordiniere gemeinsame Angriffe.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card variant="bordered" className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-display text-danger mb-2">
                  Strategische Kämpfe
                </h3>
                <p className="text-sm text-foreground-muted">
                  Baue mächtige Flotten und führe sie in den Kampf.
                  Timing und Taktik entscheiden über Sieg oder Niederlage.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground-muted">
            © 2026 VASTUM. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6 text-sm text-foreground-muted">
            <Link href="#" className="hover:text-primary transition-colors">
              Datenschutz
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Impressum
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Discord
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
