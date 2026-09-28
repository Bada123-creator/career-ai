"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";

import AppNavbar from "@/components/navigation/AppNavbar";
import { getJob, Job } from "@/lib/api/jobs";
import {
  Analysis,
  getAnalyses,
} from "@/lib/api/analysis";

function confidenceLabel(
  value: "low" | "medium" | "high"
) {
  if (value === "high") return "Élevée";
  if (value === "medium") return "Moyenne";
  return "Faible";
}

export default function JobDetailPage() {
  const params = useParams();

  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(jobId)) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getJob(jobId),
      getAnalyses(),
    ])
      .then(([jobData, analysisData]) => {
        if (cancelled) return;

        setJob(jobData);
        setAnalyses(analysisData);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Impossible de charger cette offre."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const latestAnalysis = useMemo(() => {
    return analyses
      .filter(
        (analysis) =>
          analysis.job.id === jobId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0] ?? null;
  }, [analyses, jobId]);

  const descriptionLimited =
    job !== null &&
    job.description.trim().length < 1200;

  if (!Number.isFinite(jobId)) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <Link
            href="/jobs"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux offres
          </Link>

          <div className="rounded-2xl border p-8">
            <h1 className="text-xl font-semibold">
              Offre indisponible
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Identifiant d&apos;offre invalide.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <Link
            href="/jobs"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux offres
          </Link>

          <div className="rounded-2xl border p-8">
            <h1 className="text-xl font-semibold">
              Offre indisponible
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNavbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/jobs"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux offres
        </Link>

        <section className="rounded-3xl border bg-card p-7 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </span>

                {job.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3">
              {job.source_url && (
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
                >
                  Voir la source
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              <Link
                href={`/analysis/new?jobId=${job.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background"
              >
                <Sparkles className="h-4 w-4" />
                Analyser avec mon CV
              </Link>
            </div>
          </div>
        </section>

        {descriptionLimited && (
          <section className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <h2 className="font-semibold">
                Description limitée
              </h2>

              <p className="mt-1 text-sm">
                La source ne fournit qu&apos;une partie de
                l&apos;offre. Certaines compétences ou exigences
                peuvent manquer et réduire la fiabilité de
                l&apos;analyse.
              </p>
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
          <section className="rounded-3xl border bg-card p-7">
            <div className="mb-5 flex items-center gap-3">
              <FileSearch className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                Description de l&apos;offre
              </h2>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {job.description}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border bg-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <BarChart3 className="h-5 w-5" />
                <h2 className="font-semibold">
                  Dernière analyse
                </h2>
              </div>

              {!latestAnalysis ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Cette offre n&apos;a pas encore été
                    analysée avec un CV.
                  </p>

                  <Link
                    href={`/analysis/new?jobId=${job.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    <Sparkles className="h-4 w-4" />
                    Lancer une analyse
                  </Link>
                </>
              ) : (
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">
                      {Math.round(
                        latestAnalysis.matching.overall_score
                      )}
                    </span>
                    <span className="pb-1 text-muted-foreground">
                      /100
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Couverture
                      </span>
                      <strong>
                        {Math.round(
                          latestAnalysis.matching.coverage_score
                        )}
                        %
                      </strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Fiabilité
                      </span>
                      <strong>
                        {confidenceLabel(
                          latestAnalysis.matching
                            .confidence_level
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        CV
                      </span>
                      <strong className="text-right">
                        {latestAnalysis.resume.title}
                      </strong>
                    </div>
                  </div>

                  {latestAnalysis.matching.coverage_score < 50 && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                      Score basé sur un nombre limité de
                      critères disponibles.
                    </div>
                  )}

                  <Link
                    href={`/analysis/${latestAnalysis.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    Voir l&apos;analyse complète
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl border bg-card p-6">
              <div className="flex items-center gap-3">
                {descriptionLimited ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}

                <h2 className="font-semibold">
                  Qualité des données
                </h2>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {descriptionLimited
                  ? `${job.description.length} caractères disponibles. La description semble incomplète.`
                  : `${job.description.length} caractères disponibles. La description contient suffisamment de contenu pour une analyse détaillée.`}
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
