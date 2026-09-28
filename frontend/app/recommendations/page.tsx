"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  MapPin,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

import AppNavbar from "@/components/navigation/AppNavbar";
import {
  getJobRecommendations,
  JobRecommendationsResponse,
  RecommendedJob,
} from "@/lib/api/recommendations";
import {
  getResumes,
  Resume,
} from "@/lib/api/resumes";


function getLevelLabel(level: RecommendedJob["match_level"]) {
  switch (level) {
    case "strong":
      return "Très forte correspondance";
    case "good":
      return "Bonne correspondance";
    case "partial":
      return "Correspondance partielle";
    case "weak":
      return "Faible correspondance";
  }
}


function getScoreClasses(score: number) {
  if (score >= 80) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (score >= 65) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (score >= 50) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}


export default function RecommendationsPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] =
    useState<number | null>(null);

  const [result, setResult] =
    useState<JobRecommendationsResponse | null>(null);

  const [loadingResumes, setLoadingResumes] =
    useState(true);

  const [loadingRecommendations, setLoadingRecommendations] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [expandedJobId, setExpandedJobId] =
    useState<number | null>(null);

  const [minimumScore, setMinimumScore] =
    useState(0);

  const [sortBy, setSortBy] =
    useState<"score-desc" | "score-asc" | "company">(
      "score-desc"
    );


  useEffect(() => {
    let cancelled = false;

    getResumes()
      .then((data) => {
        if (cancelled) {
          return;
        }

        const usableResumes = data.filter(
          (resume) =>
            resume.extracted_text.trim().length > 0
        );

        setResumes(usableResumes);

        if (usableResumes.length > 0) {
          setSelectedResumeId(
            usableResumes[0].id
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Impossible de charger vos CV."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingResumes(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);


  async function handleRecommendations(
    refresh = false
  ) {
    if (!selectedResumeId) {
      return;
    }

    if (refresh) {
      const confirmed = window.confirm(
        "Actualiser les recommandations ? " +
          "CareerAI relancera l’analyse IA de toutes vos offres."
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setLoadingRecommendations(true);
      setError(null);
      setExpandedJobId(null);

      if (!refresh) {
        setResult(null);
      }

      const data = await getJobRecommendations(
        selectedResumeId,
        refresh
      );

      setResult(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail =
          err.response?.data?.detail;

        if (typeof detail === "string") {
          setError(detail);
          return;
        }
      }

      setError(
        refresh
          ? "Impossible d'actualiser les recommandations."
          : "Impossible de générer les recommandations."
      );
    } finally {
      setLoadingRecommendations(false);
    }
  }


  const visibleRecommendations = result
    ? [...result.recommendations]
        .filter((item) => item.score >= minimumScore)
        .sort((a, b) => {
          if (sortBy === "score-asc") {
            return a.score - b.score;
          }

          if (sortBy === "company") {
            return a.job.company.localeCompare(
              b.job.company,
              "fr"
            );
          }

          return b.score - a.score;
        })
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-medium text-violet-400">
            CareerAI · Job Recommendation Engine
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Recommandations d&apos;offres
          </h1>

          <p className="mt-3 text-slate-400">
            Sélectionnez un CV et laissez CareerAI
            comparer votre profil aux offres que vous
            avez enregistrées.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label
                htmlFor="resume"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                CV à utiliser
              </label>

              <div className="relative">
                <select
                  id="resume"
                  value={selectedResumeId ?? ""}
                  onChange={(event) => {
                    setSelectedResumeId(
                      Number(event.target.value)
                    );
                    setResult(null);
                  }}
                  disabled={
                    loadingResumes ||
                    loadingRecommendations
                  }
                  className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-10 text-sm outline-none transition focus:border-blue-500 disabled:opacity-50"
                >
                  {resumes.map((resume) => (
                    <option
                      key={resume.id}
                      value={resume.id}
                    >
                      {resume.title}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleRecommendations(false)
              }
              disabled={
                !selectedResumeId ||
                loadingRecommendations
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingRecommendations ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}

              {loadingRecommendations
                ? "Analyse des offres..."
                : "Trouver mes meilleures offres"}
            </button>
          </div>

          {loadingRecommendations && (
            <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-start gap-3">
                <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

                <div>
                  <p className="text-sm font-medium text-blue-200">
                    CareerAI analyse vos offres
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Cette opération peut prendre quelques
                    instants car chaque offre est comparée
                    à votre CV.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loadingResumes && resumes.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-600" />

            <h2 className="mt-4 font-semibold">
              Aucun CV exploitable
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Ajoutez d&apos;abord un CV contenant du
              texte analysable.
            </p>

            <Link
              href="/resumes"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Aller à mes CV
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {result && (
          <section className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-violet-400">
                  Résultats pour {result.resume.title}
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Vos meilleures opportunités
                </h2>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm text-slate-400">
                  {result.count} offre
                  {result.count !== 1 ? "s" : ""} analysée
                  {result.count !== 1 ? "s" : ""}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void handleRecommendations(true)
                  }
                  disabled={loadingRecommendations}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingRecommendations ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}

                  Actualiser les recommandations
                </button>
              </div>
            </div>

            {(result.cached_count > 0 ||
              result.generated_count > 0) && (
              <div className="mt-5 flex flex-wrap gap-3">
                {result.cached_count > 0 && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                    {result.cached_count} depuis le cache
                  </span>
                )}

                {result.generated_count > 0 && (
                  <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                    {result.generated_count} générée
                    {result.generated_count !== 1 ? "s" : ""} par l&apos;IA
                  </span>
                )}
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Filtrer les recommandations
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {visibleRecommendations.length} offre{visibleRecommendations.length !== 1 ? "s" : ""} affichée{visibleRecommendations.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[0, 50, 65, 80].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setMinimumScore(score)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        minimumScore === score
                          ? "border-blue-500 bg-blue-500/10 text-blue-300"
                          : "border-slate-700 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {score === 0 ? "Toutes" : `≥ ${score}`}
                    </button>
                  ))}

                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target.value as
                          | "score-desc"
                          | "score-asc"
                          | "company"
                      )
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                  >
                    <option value="score-desc">
                      Meilleur score
                    </option>
                    <option value="score-asc">
                      Score croissant
                    </option>
                    <option value="company">
                      Entreprise A–Z
                    </option>
                  </select>
                </div>
              </div>
            )}

            {result.recommendations.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 py-14 text-center text-slate-400">
                Aucune offre à analyser.
              </div>
            ) : visibleRecommendations.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 py-14 text-center">
                <Target className="mx-auto h-8 w-8 text-slate-600" />

                <p className="mt-3 font-medium text-slate-300">
                  Aucune offre avec ce niveau de compatibilité
                </p>

                <button
                  type="button"
                  onClick={() => setMinimumScore(0)}
                  className="mt-4 text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  Afficher toutes les offres
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {visibleRecommendations.map(
                  (item, index) => {
                    const expanded =
                      expandedJobId === item.job.id;

                    return (
                      <article
                        key={item.job.id}
                        className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                      >
                        <div className="p-6">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                                <span className="font-bold">
                                  {index + 1}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-xl font-semibold">
                                  {item.job.title}
                                </h3>

                                <p className="mt-1 text-slate-300">
                                  {item.job.company}
                                </p>

                                {item.job.location && (
                                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin className="h-4 w-4" />
                                    {item.job.location}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div
                              className={`shrink-0 rounded-xl border px-5 py-3 text-center ${getScoreClasses(
                                item.score
                              )}`}
                            >
                              <div className="text-2xl font-bold">
                                {Math.round(item.score)}
                              </div>

                              <div className="text-xs">
                                / 100
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300">
                              <Target className="h-3.5 w-3.5" />
                              {getLevelLabel(
                                item.match_level
                              )}
                            </span>

                            <span className="text-xs text-slate-500">
                              {
                                item.matching_skills
                                  .length
                              }{" "}
                              compétences correspondantes
                            </span>

                            <span className="text-xs text-slate-500">
                              {
                                item.missing_skills
                                  .length
                              }{" "}
                              à développer
                            </span>
                          </div>

                          <p className="mt-5 leading-7 text-slate-300">
                            {item.summary}
                          </p>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedJobId(
                                  expanded
                                    ? null
                                    : item.job.id
                                )
                              }
                              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                            >
                              {expanded
                                ? "Masquer les détails"
                                : "Voir les détails"}
                            </button>

                            <Link
                              href={`/analysis/new?resume=${result.resume.id}&job=${item.job.id}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium transition hover:bg-blue-500"
                            >
                              <Sparkles className="h-4 w-4" />
                              Analyser cette offre
                            </Link>

                            {item.job.source_url && (
                              <a
                                href={item.job.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Offre originale
                              </a>
                            )}
                          </div>
                        </div>

                        {expanded && (
                          <div className="border-t border-slate-800 bg-slate-950/50 p-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Points correspondants
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {item.matching_skills.length >
                                  0 ? (
                                    item.matching_skills.map(
                                      (skill) => (
                                        <span
                                          key={skill}
                                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
                                        >
                                          {skill}
                                        </span>
                                      )
                                    )
                                  ) : (
                                    <span className="text-sm text-slate-500">
                                      Aucun élément identifié.
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                                  <TriangleAlert className="h-4 w-4" />
                                  Compétences à développer
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {item.missing_skills.length >
                                  0 ? (
                                    item.missing_skills.map(
                                      (skill) => (
                                        <span
                                          key={skill}
                                          className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200"
                                        >
                                          {skill}
                                        </span>
                                      )
                                    )
                                  ) : (
                                    <span className="text-sm text-slate-500">
                                      Aucun manque majeur identifié.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                                <h4 className="font-semibold">
                                  Pourquoi cette offre ?
                                </h4>

                                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                                  {item.reasons.map(
                                    (reason, reasonIndex) => (
                                      <li
                                        key={`${item.job.id}-${reasonIndex}`}
                                        className="flex gap-2"
                                      >
                                        <span className="text-blue-400">
                                          •
                                        </span>
                                        <span>
                                          {reason}
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>

                              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
                                <div className="flex items-center gap-2 font-semibold text-violet-200">
                                  <BrainCircuit className="h-4 w-4" />
                                  Conseil CareerAI
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                  {item.recommendation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
