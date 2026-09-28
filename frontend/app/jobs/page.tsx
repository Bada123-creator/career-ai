"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import AppNavbar from "@/components/navigation/AppNavbar";
import {
  createJob,
  deleteJob,
  getJobs,
  importJobPreview,
  searchJobs,
  ExternalJob,
  Job,
  JobImportPreview,
} from "@/lib/api/jobs";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [savingImport, setSavingImport] =
    useState(false);
  const [importError, setImportError] =
    useState<string | null>(null);
  const [importPreview, setImportPreview] =
    useState<JobImportPreview | null>(null);

  const [jobSearchQuery, setJobSearchQuery] =
    useState("");
  const [jobSearchLocation, setJobSearchLocation] =
    useState("");
  const [jobSearchResults, setJobSearchResults] =
    useState<ExternalJob[]>([]);
  const [jobSearchTotal, setJobSearchTotal] =
    useState<number | null>(null);
  const [jobSearching, setJobSearching] =
    useState(false);
  const [jobSearchError, setJobSearchError] =
    useState<string | null>(null);
  const [savingExternalId, setSavingExternalId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getJobs()
      .then((data) => {
        if (!cancelled) {
          setJobs(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Impossible de charger vos offres."
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
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return jobs;
    }

    return jobs.filter((job) =>
      [
        job.title,
        job.company,
        job.location,
        job.description,
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [jobs, search]);

  async function handleJobSearch() {
    const query = jobSearchQuery.trim();

    if (!query) {
      setJobSearchError(
        "Indiquez le poste que vous recherchez."
      );
      return;
    }

    try {
      setJobSearching(true);
      setJobSearchError(null);

      const data = await searchJobs(
        query,
        jobSearchLocation.trim()
      );

      setJobSearchResults(data.results);
      setJobSearchTotal(data.count);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          setJobSearchError(detail);
          return;
        }
      }

      setJobSearchError(
        "Impossible de rechercher des offres."
      );
    } finally {
      setJobSearching(false);
    }
  }

  async function handleSaveExternalJob(
    externalJob: ExternalJob
  ) {
    try {
      setSavingExternalId(externalJob.external_id);
      setJobSearchError(null);

      const job = await createJob({
        title: externalJob.title,
        company:
          externalJob.company ||
          "Entreprise non renseignée",
        location: externalJob.location,
        description: externalJob.description,
        source_url: externalJob.source_url,
      });

      setJobs((current) => [
        job,
        ...current,
      ]);

      setJobSearchResults((current) =>
        current.filter(
          (item) =>
            item.external_id !==
            externalJob.external_id
        )
      );
    } catch {
      setJobSearchError(
        "Impossible d'enregistrer cette offre."
      );
    } finally {
      setSavingExternalId(null);
    }
  }

  async function handleImportPreview() {
    const url = importUrl.trim();

    if (!url) {
      setImportError(
        "Collez l'URL d'une offre d'emploi."
      );
      return;
    }

    try {
      setImporting(true);
      setImportError(null);
      setImportPreview(null);

      const preview = await importJobPreview(url);

      if (!preview.is_job_offer) {
        setImportError(
          "Cette page ne semble pas être une offre d'emploi individuelle."
        );
        return;
      }

      setImportPreview(preview);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          setImportError(detail);
          return;
        }
      }

      setImportError(
        "Impossible d'importer cette offre."
      );
    } finally {
      setImporting(false);
    }
  }

  function updateImportPreview(
    field:
      | "title"
      | "company"
      | "location"
      | "description",
    value: string
  ) {
    setImportPreview((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleSaveImport() {
    if (!importPreview) {
      return;
    }

    if (
      !importPreview.title.trim() ||
      !importPreview.company.trim() ||
      !importPreview.description.trim()
    ) {
      setImportError(
        "Le poste, l'entreprise et la description sont obligatoires."
      );
      return;
    }

    try {
      setSavingImport(true);
      setImportError(null);

      const job = await createJob({
        title: importPreview.title.trim(),
        company: importPreview.company.trim(),
        location: importPreview.location.trim(),
        description: importPreview.description.trim(),
        source_url: importPreview.source_url,
      });

      setJobs((current) => [
        job,
        ...current,
      ]);

      setImportUrl("");
      setImportPreview(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          setImportError(detail);
          return;
        }
      }

      setImportError(
        "Impossible d'enregistrer cette offre."
      );
    } finally {
      setSavingImport(false);
    }
  }

  async function handleDelete(job: Job) {
    const confirmed = window.confirm(
      `Supprimer l'offre « ${job.title} » chez ${job.company} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(job.id);
      setError(null);

      await deleteJob(job.id);

      setJobs((current) =>
        current.filter(
          (item) => item.id !== job.id
        )
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
          setError(detail);
          return;
        }
      }

      setError(
        "Impossible de supprimer cette offre."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-400">
              CareerAI · Job Manager
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mes offres
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Retrouvez les offres enregistrées dans
              CareerAI et réutilisez-les pour vos analyses.
            </p>
          </div>

          <Link
            href="/analysis/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-500"
          >
            <Sparkles className="h-5 w-5" />
            Nouvelle analyse
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <p className="text-sm font-medium text-blue-400">
              CareerAI · Job Search
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Rechercher des offres
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Recherchez des offres réelles puis enregistrez
              celles qui vous intéressent dans CareerAI.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={jobSearchQuery}
              onChange={(event) =>
                setJobSearchQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !jobSearching
                ) {
                  void handleJobSearch();
                }
              }}
              placeholder="Ex. Data Analyst"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            />

            <input
              value={jobSearchLocation}
              onChange={(event) =>
                setJobSearchLocation(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !jobSearching
                ) {
                  void handleJobSearch();
                }
              }}
              placeholder="Ex. Paris"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() => void handleJobSearch()}
              disabled={
                jobSearching ||
                !jobSearchQuery.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {jobSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}

              {jobSearching
                ? "Recherche..."
                : "Rechercher"}
            </button>
          </div>

          {jobSearchError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {jobSearchError}
            </div>
          )}

          {jobSearchTotal !== null && (
            <p className="mt-5 text-sm text-slate-400">
              {jobSearchTotal.toLocaleString("fr-FR")} offre
              {jobSearchTotal !== 1 ? "s" : ""} trouvée
              {jobSearchTotal !== 1 ? "s" : ""}
            </p>
          )}

          {jobSearchResults.length > 0 && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {jobSearchResults.map(
                (externalJob) => (
                  <article
                    key={externalJob.external_id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                  >
                    <h3 className="font-semibold text-white">
                      {externalJob.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {externalJob.company ||
                          "Entreprise non renseignée"}
                      </span>

                      {externalJob.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {externalJob.location}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-400">
                      {externalJob.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <a
                        href={externalJob.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Voir l&apos;offre
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          void handleSaveExternalJob(
                            externalJob
                          )
                        }
                        disabled={
                          savingExternalId ===
                          externalJob.external_id
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-medium transition hover:bg-violet-500 disabled:opacity-50"
                      >
                        {savingExternalId ===
                        externalJob.external_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}

                        Enregistrer
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Importer une offre depuis une URL
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Collez le lien d&apos;une annonce. CareerAI
              extraira les informations avant de vous laisser
              les vérifier et les modifier.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={importUrl}
              onChange={(event) =>
                setImportUrl(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !importing) {
                  void handleImportPreview();
                }
              }}
              placeholder="https://entreprise.com/offre..."
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() =>
                void handleImportPreview()
              }
              disabled={importing || !importUrl.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extraction...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extraire avec CareerAI
                </>
              )}
            </button>
          </div>

          {importError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {importError}
            </div>
          )}

          {importPreview && (
            <div className="mt-6 border-t border-slate-800 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    Offre détectée
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Vérifiez les informations avant
                    l&apos;enregistrement.
                  </p>
                </div>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Confiance :{" "}
                  {importPreview.confidence === "high"
                    ? "élevée"
                    : importPreview.confidence === "medium"
                      ? "moyenne"
                      : "faible"}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-300">
                    Poste
                  </span>

                  <input
                    value={importPreview.title}
                    onChange={(event) =>
                      updateImportPreview(
                        "title",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300">
                    Entreprise
                  </span>

                  <input
                    value={importPreview.company}
                    onChange={(event) =>
                      updateImportPreview(
                        "company",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm text-slate-300">
                    Localisation
                  </span>

                  <input
                    value={importPreview.location}
                    onChange={(event) =>
                      updateImportPreview(
                        "location",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm text-slate-300">
                    Description
                  </span>

                  <textarea
                    rows={10}
                    value={importPreview.description}
                    onChange={(event) =>
                      updateImportPreview(
                        "description",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void handleSaveImport()
                  }
                  disabled={savingImport}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {savingImport && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {savingImport
                    ? "Enregistrement..."
                    : "Enregistrer l'offre"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportPreview(null);
                    setImportError(null);
                  }}
                  disabled={savingImport}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Annuler
                </button>

                <a
                  href={importPreview.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir la source
                </a>
              </div>
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Poste, entreprise, localisation..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
            />
          </div>

          <p className="text-sm text-slate-400">
            {filteredJobs.length} offre
            {filteredJobs.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-600" />

            <h2 className="mt-4 font-semibold">
              Aucune offre trouvée
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Lancez une analyse pour enregistrer
              votre première offre.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                      <BriefcaseBusiness className="h-5 w-5 text-violet-400" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold">
                        {job.title}
                      </h2>

                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                        <Building2 className="h-4 w-4" />
                        <span>{job.company}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(job)
                    }
                    disabled={deletingId === job.id}
                    title="Supprimer cette offre"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  >
                    {deletingId === job.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                  {job.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                  )}

                  <span>
                    Ajoutée le {formatDate(job.created_at)}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-slate-950/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-300">
                    {job.description}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    {job.description.length.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    caractères
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/analysis/new?job=${job.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium transition hover:bg-blue-500"
                  >
                    <Sparkles className="h-4 w-4" />
                    Analyser cette offre
                  </Link>

                  {job.source_url && (
                    <a
                      href={job.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir l&apos;annonce
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
