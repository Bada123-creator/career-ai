"use client";

import Link from "next/link";
import AppNavbar from "@/components/navigation/AppNavbar";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Send,
  Trash2,
  TriangleAlert,
  Users,
  XCircle,
} from "lucide-react";

import {
  Application,
  ApplicationStatus,
  deleteApplication,
  getApplications,
  updateApplication,
} from "@/lib/api/applications";

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

function formatDate(date: string | null) {
  if (!date) {
    return "Non renseignée";
  }

  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {label}
        </p>

        <div className="text-slate-500">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-white">
        {count}
      </p>
    </div>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  useEffect(() => {
    async function loadApplications() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getApplications();

        setApplications(data);
      } catch (err) {
        console.error(
          "CAREERAI APPLICATIONS ERROR:",
          err
        );

        setError(
          "Impossible de charger les candidatures."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  const counts = useMemo(() => {
    return {
      draft: applications.filter(
        (item) => item.status === "draft"
      ).length,

      sent: applications.filter(
        (item) => item.status === "sent"
      ).length,

      interview: applications.filter(
        (item) =>
          item.status === "interview"
      ).length,

      accepted: applications.filter(
        (item) =>
          item.status === "accepted"
      ).length,

      rejected: applications.filter(
        (item) =>
          item.status === "rejected"
      ).length,
    };
  }, [applications]);

  const followUps = useMemo(() => {
    return applications
      .filter(
        (application) =>
          application.follow_up_at &&
          application.status !== "accepted" &&
          application.status !== "rejected"
      )
      .sort((a, b) =>
        (a.follow_up_at ?? "").localeCompare(
          b.follow_up_at ?? ""
        )
      );
  }, [applications]);

  function getFollowUpState(date: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const followUpDate = new Date(
      `${date}T12:00:00`
    );
    followUpDate.setHours(0, 0, 0, 0);

    const difference = Math.round(
      (followUpDate.getTime() - today.getTime()) /
        86_400_000
    );

    if (difference < 0) {
      return {
        label: "Relance en retard",
        urgent: true,
      };
    }

    if (difference === 0) {
      return {
        label: "À relancer aujourd'hui",
        urgent: true,
      };
    }

    if (difference === 1) {
      return {
        label: "À relancer demain",
        urgent: false,
      };
    }

    return {
      label: `Dans ${difference} jours`,
      urgent: false,
    };
  }

  async function handleStatusChange(
    application: Application,
    status: ApplicationStatus
  ) {
    try {
      setUpdatingId(application.id);
      setError("");

      const payload: {
        status: ApplicationStatus;
        applied_at?: string;
      } = {
        status,
      };

      if (
        status !== "draft" &&
        !application.applied_at
      ) {
        payload.applied_at =
          new Date()
            .toISOString()
            .slice(0, 10);
      }

      const updated =
        await updateApplication(
          application.id,
          payload
        );

      setApplications((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );
    } catch (err) {
      console.error(
        "CAREERAI APPLICATION UPDATE ERROR:",
        err
      );

      setError(
        "Impossible de modifier le statut."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(
    application: Application
  ) {
    const confirmed = window.confirm(
      `Supprimer la candidature "${application.job_title}" chez ${application.company} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(application.id);
      setError("");

      await deleteApplication(
        application.id
      );

      setApplications((current) =>
        current.filter(
          (item) =>
            item.id !== application.id
        )
      );
    } catch (err) {
      console.error(
        "CAREERAI APPLICATION DELETE ERROR:",
        err
      );

      setError(
        "Impossible de supprimer la candidature."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au dashboard
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Mes candidatures
            </h1>

            <p className="mt-2 text-slate-400">
              Suis l&apos;évolution de toutes tes
              candidatures depuis CareerAI.
            </p>
          </div>

          <Link
            href="/analysis/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Nouvelle analyse
          </Link>
        </header>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <TriangleAlert className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatusCard
            label="Brouillons"
            count={counts.draft}
            icon={
              <FileText className="h-5 w-5" />
            }
          />

          <StatusCard
            label="Envoyées"
            count={counts.sent}
            icon={
              <Send className="h-5 w-5" />
            }
          />

          <StatusCard
            label="Entretiens"
            count={counts.interview}
            icon={
              <Users className="h-5 w-5" />
            }
          />

          <StatusCard
            label="Acceptées"
            count={counts.accepted}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <StatusCard
            label="Refusées"
            count={counts.rejected}
            icon={
              <XCircle className="h-5 w-5" />
            }
          />
        </section>

        {followUps.length > 0 && (
          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                À relancer
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Les prochaines actions à effectuer sur tes candidatures.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {followUps.map((application) => {
                const followUpState = getFollowUpState(
                  application.follow_up_at!
                );

                return (
                  <article
                    key={application.id}
                    className={`rounded-2xl border p-5 ${
                      followUpState.urgent
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-slate-800 bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-400">
                          {application.company}
                        </p>

                        <h3 className="mt-1 font-semibold">
                          {application.job_title}
                        </h3>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                          followUpState.urgent
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        {followUpState.label}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                      <CalendarDays className="h-4 w-4" />

                      Relance prévue le{" "}
                      {formatDate(application.follow_up_at)}
                    </div>

                    {application.next_action && (
                      <div className="mt-4 rounded-xl bg-slate-950/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Prochaine action
                        </p>

                        <p className="mt-1 text-sm text-slate-200">
                          {application.next_action}
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/applications/${application.id}`}
                      className="mt-4 inline-flex items-center text-sm font-medium text-blue-400 transition hover:text-blue-300"
                    >
                      Voir la candidature
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Historique
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {applications.length} candidature
                {applications.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <BriefcaseBusiness className="h-5 w-5 text-slate-500" />
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900">
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement...
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-600" />

              <h3 className="mt-4 font-semibold">
                Aucune candidature
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Tes candidatures apparaîtront ici
                après leur ajout depuis CareerAI.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(
                (application) => (
                  <article
                    key={application.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">
                          {application.job_title}
                        </h3>

                        <p className="mt-1 text-slate-300">
                          {application.company}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                          {application.location && (
                            <span className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {application.location}
                            </span>
                          )}

                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(
                              application.applied_at
                            )}
                          </span>
                        </div>

                        {application.notes && (
                          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                            {application.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                        <select
                          value={
                            application.status
                          }
                          disabled={
                            updatingId ===
                            application.id
                          }
                          onChange={(event) =>
                            handleStatusChange(
                              application,
                              event.target
                                .value as ApplicationStatus
                            )
                          }
                          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>

                        {updatingId ===
                          application.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        )}

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            application.id
                          }
                          onClick={() =>
                            handleDelete(
                              application
                            )
                          }
                          className="rounded-xl border border-red-500/20 p-2.5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          aria-label="Supprimer la candidature"
                        >
                          {deletingId ===
                          application.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
