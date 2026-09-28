import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <BrainCircuit className="h-6 w-6" />
          </div>

          <span className="text-xl font-bold">
            Career<span className="text-blue-500">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            Se connecter
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
          >
            Créer un compte
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />
            Votre candidature, analysée par l&apos;IA
          </div>

          <h1 className="mt-8 max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Comprenez vos chances avant
            <span className="text-blue-500"> de postuler.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            CareerAI compare votre CV à une offre d&apos;emploi, détecte
            vos points forts, identifie les compétences à mieux mettre en
            avant et génère des recommandations personnalisées.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/analysis/new"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-semibold transition hover:bg-blue-500"
            >
              Analyser mon CV
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href="#features"
              className="rounded-xl border border-slate-700 px-7 py-4 font-semibold text-slate-300 transition hover:bg-slate-900"
            >
              Découvrir CareerAI
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Analyse CV
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Matching d&apos;offre
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Recommandations IA
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="relative rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <div>
                <p className="text-sm text-slate-500">
                  Compatibilité
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Data Analyst
                </h2>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-blue-500 text-xl font-bold">
                79%
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-slate-300">
                Compétences correspondantes
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Python", "SQL", "Django", "Git", "API REST"].map(
                  (skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300"
                    >
                      ✓ {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex gap-3">
                <FileSearch className="mt-1 h-5 w-5 shrink-0 text-blue-400" />

                <div>
                  <p className="font-medium">
                    Analyse CareerAI
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Votre profil présente une bonne adéquation avec
                    les missions de collecte, d&apos;analyse et de
                    qualité des données.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-slate-900 bg-slate-950 px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-medium text-blue-400">
              Une analyse complète
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Plus qu&apos;un simple score de compatibilité
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Analyse du CV",
                text: "CareerAI extrait les informations importantes de votre CV et identifie vos compétences.",
              },
              {
                title: "Matching intelligent",
                text: "Votre profil est comparé aux compétences et aux exigences présentes dans l'offre.",
              },
              {
                title: "Recommandations IA",
                text: "Recevez des conseils personnalisés pour améliorer votre candidature avant de postuler.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <h3 className="text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
