"use client";

import Link from "next/link";
import AppNavbar from "@/components/navigation/AppNavbar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import {
  Application,
  ApplicationStatus,
  AIFollowUp,
  deleteApplication,
  generateApplicationFollowUp,
  getApplication,
  updateApplication,
} from "@/lib/api/applications";

import {
  GeneratedResume,
  getGeneratedResumeHistory,
} from "@/lib/api/analysis";

const STATUS_OPTIONS: {
  value: ApplicationStatus;
  label: string;
}[] = [
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyée" },
  { value: "interview", label: "Entretien" },
  { value: "accepted", label: "Acceptée" },
  { value: "rejected", label: "Refusée" },
];

function formatCreatedAt(date: string) {
  return new Date(date).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [application, setApplication] =
    useState<Application | null>(null);

  const [status, setStatus] =
    useState<ApplicationStatus>("draft");

  const [notes, setNotes] =
    useState("");

  const [appliedAt, setAppliedAt] =
    useState("");

  const [followUpAt, setFollowUpAt] =
    useState("");

  const [nextAction, setNextAction] =
    useState("");

  const [resumeVersions, setResumeVersions] =
    useState<GeneratedResume[]>([]);

  const [selectedResumeId, setSelectedResumeId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [aiFollowUp, setAiFollowUp] =
    useState<AIFollowUp | null>(null);

  const [generatingFollowUp, setGeneratingFollowUp] =
    useState(false);

  const [followUpCopied, setFollowUpCopied] =
    useState(false);

  useEffect(() => {
    async function loadApplication() {
      try {
        setLoading(true);
        setError("");

        const rawId = params.id;

        const id = Number(
          Array.isArray(rawId)
            ? rawId[0]
            : rawId
        );

        if (!Number.isInteger(id) || id <= 0) {
          setError(
            "Identifiant de candidature invalide."
          );
          return;
        }

        const data = await getApplication(id);

        setApplication(data);
        setStatus(data.status);
        setNotes(data.notes || "");
        setAppliedAt(data.applied_at || "");
        setFollowUpAt(data.follow_up_at || "");
        setNextAction(data.next_action || "");
        setSelectedResumeId(
          data.generated_resume ?? null
        );

        if (data.analysis) {
          const history =
            await getGeneratedResumeHistory(
              data.analysis
            );

          setResumeVersions(history);
        } else {
          setResumeVersions([]);
        }
      } catch (err) {
        console.error(
          "CAREERAI APPLICATION DETAIL ERROR:",
          err
        );

        setError(
          "Impossible de charger cette candidature."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [params.id]);

  async function handleSave() {
    if (!application) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated =
        await updateApplication(
          application.id,
          {
            status,
            notes,
            applied_at:
              appliedAt || null,
            follow_up_at:
              followUpAt || null,
            next_action:
              nextAction.trim(),
            generated_resume:
              selectedResumeId,
          }
        );

      setApplication(updated);
      setStatus(updated.status);
      setNotes(updated.notes || "");
      setAppliedAt(
        updated.applied_at || ""
      );
      setFollowUpAt(
        updated.follow_up_at || ""
      );
      setNextAction(
        updated.next_action || ""
      );
      setSelectedResumeId(
        updated.generated_resume ?? null
      );

      setSuccess(
        "Candidature mise à jour."
      );
    } catch (err) {
      console.error(
        "CAREERAI APPLICATION SAVE ERROR:",
        err
      );

      setError(
        "Impossible d'enregistrer les modifications."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateFollowUp() {
    if (!application) {
      return;
    }

    try {
      setGeneratingFollowUp(true);
      setError("");
      setFollowUpCopied(false);

      const result =
        await generateApplicationFollowUp(
          application.id
        );

      setAiFollowUp(result);
    } catch (err) {
      console.error(
        "CAREERAI FOLLOW UP ERROR:",
        err
      );

      setError(
        "Impossible de générer la relance avec l'IA."
      );
    } finally {
      setGeneratingFollowUp(false);
    }
  }

  async function handleCopyFollowUp() {
    if (!aiFollowUp) {
      return;
    }

    const content =
      `Objet : ${aiFollowUp.subject}\n\n` +
      aiFollowUp.message;

    try {
      await navigator.clipboard.writeText(content);
      setFollowUpCopied(true);

      window.setTimeout(() => {
        setFollowUpCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "CAREERAI COPY FOLLOW UP ERROR:",
        err
      );

      setError(
        "Impossible de copier la relance."
      );
    }
  }

  async function handleDelete() {
    if (!application) {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer la candidature "${application.job_title}" chez ${application.company} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteApplication(
        application.id
      );

      router.push("/applications");
    } catch (err) {
      console.error(
        "CAREERAI APPLICATION DELETE ERROR:",
        err
      );

      setError(
        "Impossible de supprimer cette candidature."
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement de la candidature...
        </div>
      </main>
    );
  }

  if (error && !application) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md text-center">
          <TriangleAlert className="mx-auto h-10 w-10 text-amber-400" />

          <h1 className="mt-4 text-xl font-semibold">
            Candidature indisponible
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {error}
          </p>

          <Link
            href="/applications"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            Retour aux candidatures
          </Link>
        </div>
      </main>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux candidatures
        </Link>

        <header className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>

              <h1 className="text-3xl font-bold">
                {application.job_title}
              </h1>

              <p className="mt-2 text-lg text-slate-300">
                {application.company}
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-400">
                {application.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {application.location}
                  </span>
                )}

                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Ajoutée le{" "}
                  {formatCreatedAt(
                    application.created_at
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm">
              {application.status_display}
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {application.analysis && resumeVersions.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  CV utilisé
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Choisis la version du CV associée à cette candidature.
                </p>
              </div>

              {application.generated_resume_version && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                  Enregistré : Version{" "}
                  {application.generated_resume_version}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {resumeVersions.map((version) => {
                const selected =
                  selectedResumeId === version.id;

                return (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() =>
                      setSelectedResumeId(version.id)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      selected
                        ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    Version {version.version}
                    {version.id ===
                    resumeVersions[0]?.id
                      ? " · dernière"
                      : ""}
                  </button>
                );
              })}
            </div>

            {selectedResumeId !==
              application.generated_resume && (
              <p className="mt-4 text-sm text-amber-300">
                La version sélectionnée sera associée
                à la candidature après enregistrement.
              </p>
            )}
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-7">
          <h2 className="text-xl font-semibold">
            Suivi de la candidature
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Mets à jour son statut, la date
            d&apos;envoi, sa prochaine relance et tes notes.
          </p>

          <div className="mt-7 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Statut
              </label>

              <select
                value={status}
                onChange={(event) => {
                  const newStatus =
                    event.target
                      .value as ApplicationStatus;

                  setStatus(newStatus);

                  if (
                    newStatus !== "draft" &&
                    !appliedAt
                  ) {
                    setAppliedAt(
                      new Date()
                        .toISOString()
                        .slice(0, 10)
                    );
                  }
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Date d&apos;envoi
              </label>

              <input
                type="date"
                value={appliedAt}
                onChange={(event) =>
                  setAppliedAt(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
            <div>
              <h3 className="font-semibold text-white">
                Suivi &amp; relance
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Programme la prochaine action à effectuer
                pour cette candidature.
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Date de relance
                </label>

                <input
                  type="date"
                  value={followUpAt}
                  onChange={(event) =>
                    setFollowUpAt(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Prochaine action
                </label>

                <input
                  type="text"
                  value={nextAction}
                  onChange={(event) =>
                    setNextAction(event.target.value)
                  }
                  maxLength={255}
                  placeholder="Ex. Relancer le recruteur par email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
            </div>

            {(followUpAt || nextAction) && (
              <button
                type="button"
                onClick={() => {
                  setFollowUpAt("");
                  setNextAction("");
                }}
                className="mt-4 text-sm font-medium text-slate-400 transition hover:text-white"
              >
                Effacer la relance
              </button>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />

                  <h3 className="font-semibold text-white">
                    Relance assistée par IA
                  </h3>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  CareerAI prépare un email de relance
                  adapté à cette candidature.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateFollowUp}
                disabled={generatingFollowUp}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingFollowUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : aiFollowUp ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}

                {generatingFollowUp
                  ? "Génération..."
                  : aiFollowUp
                    ? "Régénérer"
                    : "Générer avec l'IA"}
              </button>
            </div>

            {aiFollowUp && (
              <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Objet
                  </p>

                  <p className="mt-2 text-sm font-medium text-white">
                    {aiFollowUp.subject}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-800 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Message
                  </p>

                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {aiFollowUp.message}
                  </div>
                </div>

                <div className="mt-5 flex justify-end border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handleCopyFollowUp}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
                  >
                    {followUpCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}

                    {followUpCopied
                      ? "Copié"
                      : "Copier la relance"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={7}
              placeholder="Exemple : candidature envoyée, recruteur contacté, entretien prévu..."
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              Supprimer
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
