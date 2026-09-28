"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Loader2,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";

import AppNavbar from "@/components/navigation/AppNavbar";
import { getProfile, UserProfile } from "@/lib/api/profile";
import {
  DashboardData,
  DashboardRecentApplication,
  getDashboard,
} from "@/lib/api/dashboard";
import {
  Application,
  getApplications,
} from "@/lib/api/applications";

const statusLabels: Record<
  DashboardRecentApplication["status"],
  string
> = {
  draft: "Brouillon",
  sent: "Envoyée",
  interview: "Entretien",
  accepted: "Acceptée",
  rejected: "Refusée",
};

export default function DashboardPage() {
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");

        const [
          profileData,
          dashboardData,
          applicationsData,
        ] = await Promise.all([
          getProfile(),
          getDashboard(),
          getApplications(),
        ]);

        setProfile(profileData);
        setDashboard(dashboardData);
        setApplications(applicationsData);
      } catch (err) {
        console.error(
          "CAREERAI DASHBOARD ERROR:",
          err
        );

        setError(
          "Impossible de charger le dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />

          <p className="mt-4 text-slate-400">
            Chargement de CareerAI...
          </p>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <AppNavbar />

        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error ||
              "Impossible de charger les données du dashboard."}
          </div>
        </div>
      </main>
    );
  }

  const { stats } = dashboard;

  const followUps = applications
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

  const overdueFollowUps = followUps.filter(
    (application) =>
      getFollowUpDifference(
        application.follow_up_at!
      ) < 0
  );

  const todayFollowUps = followUps.filter(
    (application) =>
      getFollowUpDifference(
        application.follow_up_at!
      ) === 0
  );

  const priorityFollowUps = followUps
    .filter((application) => {
      const difference = getFollowUpDifference(
        application.follow_up_at!
      );

      return difference <= 0;
    })
    .slice(0, 3);

  const hasPriorityActions =
    priorityFollowUps.length > 0 ||
    dashboard.actions.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Sparkles className="h-4 w-4" />
              Dashboard
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight">
              Bonjour{" "}
              {profile?.username ?? ""}
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Pilote ta recherche d&apos;emploi,
              tes candidatures et ta préparation
              aux entretiens avec CareerAI.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/applications"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <BriefcaseBusiness className="h-5 w-5" />
              Mes candidatures
            </Link>

            <Link
              href="/analysis/new"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
            >
              <Plus className="h-5 w-5" />
              Nouvelle analyse
            </Link>
          </div>
        </section>

        {error && (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            {error}
          </div>
        )}

        <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat
            title="Candidatures actives"
            value={stats.active_applications}
            description={`${stats.applications} candidature${
              stats.applications > 1 ? "s" : ""
            } au total`}
            icon={
              <BriefcaseBusiness className="h-5 w-5 text-blue-400" />
            }
          />

          <DashboardStat
            title="Score moyen"
            value={
              stats.average_match_score !== null
                ? `${stats.average_match_score.toFixed(1)}%`
                : "—"
            }
            description="Compatibilité CV / offre"
            icon={
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            }
          />

          <DashboardStat
            title="Entretiens"
            value={stats.interviews}
            description="Candidatures au stade entretien"
            icon={
              <UserRoundCheck className="h-5 w-5 text-violet-400" />
            }
          />

          <DashboardStat
            title="Analyses"
            value={stats.analyses}
            description={`${stats.resumes} CV · ${stats.jobs} offres`}
            icon={
              <Target className="h-5 w-5 text-amber-400" />
            }
          />
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <CalendarClock className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Relances à effectuer
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Garde le contrôle sur tes prochaines actions.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/applications"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              Toutes les candidatures
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {followUps.length > 0 ? (
            <>
              <div className="mt-6 flex flex-wrap gap-3">
                {overdueFollowUps.length > 0 && (
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                    {overdueFollowUps.length} en retard
                  </span>
                )}

                {todayFollowUps.length > 0 && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                    {todayFollowUps.length} aujourd&apos;hui
                  </span>
                )}

                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {followUps.length} relance{followUps.length > 1 ? "s" : ""} planifiée{followUps.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {followUps.slice(0, 4).map((application) => {
                  const state = getFollowUpState(
                    application.follow_up_at!
                  );

                  return (
                    <Link
                      key={application.id}
                      href={`/applications/${application.id}`}
                      className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-blue-500/30 hover:bg-slate-950"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {application.job_title}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {application.company}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                            state.urgent
                              ? "border-red-500/30 bg-red-500/10 text-red-300"
                              : "border-blue-500/30 bg-blue-500/10 text-blue-300"
                          }`}
                        >
                          {state.label}
                        </span>
                      </div>

                      <div className="mt-4 border-t border-slate-800 pt-4">
                        <p className="text-sm text-slate-400">
                          {formatFollowUpDate(
                            application.follow_up_at!
                          )}
                        </p>

                        {application.next_action && (
                          <p className="mt-2 text-sm font-medium text-slate-200">
                            {application.next_action}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2 text-xs font-medium text-blue-400">
                        Ouvrir la candidature
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {followUps.length > 4 && (
                <p className="mt-5 text-sm text-slate-500">
                  + {followUps.length - 4} autre{followUps.length - 4 > 1 ? "s" : ""} relance{followUps.length - 4 > 1 ? "s" : ""} dans Mes candidatures.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon={<CalendarClock className="h-6 w-6" />}
              title="Aucune relance prévue"
              description="Ajoute une date de relance depuis une candidature pour la retrouver ici."
            />
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Pipeline des candidatures
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suis l&apos;avancement de tes candidatures
                à chaque étape.
              </p>
            </div>

            <Link
              href="/applications"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              Gérer mes candidatures
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-5">
            <PipelineStage
              label="Brouillon"
              value={dashboard.application_pipeline.draft}
              total={stats.applications}
            />

            <PipelineStage
              label="Envoyée"
              value={dashboard.application_pipeline.sent}
              total={stats.applications}
            />

            <PipelineStage
              label="Entretien"
              value={dashboard.application_pipeline.interview}
              total={stats.applications}
            />

            <PipelineStage
              label="Acceptée"
              value={dashboard.application_pipeline.accepted}
              total={stats.applications}
            />

            <PipelineStage
              label="Refusée"
              value={dashboard.application_pipeline.rejected}
              total={stats.applications}
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-800 pt-5">
            <p className="text-sm text-slate-500">
              {stats.applications === 0
                ? "Aucune candidature suivie pour le moment."
                : `${stats.applications} candidature${
                    stats.applications > 1 ? "s" : ""
                  } suivie${
                    stats.applications > 1 ? "s" : ""
                  }`}
            </p>

            <p className="text-sm font-medium text-slate-300">
              {stats.active_applications} active
              {stats.active_applications > 1 ? "s" : ""}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Dernières analyses
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tes dernières compatibilités CV / offre
                </p>
              </div>

              <Target className="h-5 w-5 text-slate-500" />
            </div>

            {dashboard.recent_analyses.length > 0 ? (
              <div className="mt-6 divide-y divide-slate-800">
                {dashboard.recent_analyses.map(
                  (analysis) => (
                    <Link
                      key={analysis.id}
                      href={`/analysis/${analysis.id}`}
                      className="group flex flex-col gap-4 rounded-2xl px-3 py-5 transition hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {analysis.job.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {analysis.job.company}
                          {" • "}
                          {analysis.resume.title}
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          {formatDate(
                            analysis.created_at
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-400">
                            {analysis.overall_score.toFixed(
                              1
                            )}
                            %
                          </p>

                          <p className="text-xs text-slate-500">
                            compatibilité
                          </p>
                        </div>

                        <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon={
                  <Target className="h-6 w-6" />
                }
                title="Aucune analyse"
                description="Lance ta première analyse pour commencer ton historique."
              />
            )}
          </div>

          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-slate-900 p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  À faire
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tes prochaines actions
                </p>
              </div>

              <CircleDot className="h-5 w-5 text-blue-400" />
            </div>

            {hasPriorityActions ? (
              <div className="mt-6 space-y-3">
                {priorityFollowUps.map((application) => {
                  const state = getFollowUpState(
                    application.follow_up_at!
                  );

                  return (
                    <Link
                      key={`follow-up-${application.id}`}
                      href={`/applications/${application.id}`}
                      className="group block rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition hover:border-red-500/40 hover:bg-red-500/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                          <CalendarClock className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                              {application.job_title}
                            </p>

                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
                              {state.label}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {application.company}
                          </p>

                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            {application.next_action ||
                              "Effectuer la relance prévue."}
                          </p>
                        </div>

                        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-red-400" />
                      </div>
                    </Link>
                  );
                })}

                {dashboard.actions.map(
                  (action, index) => (
                    <Link
                      key={`${action.type}-${index}`}
                      href={action.href}
                      className="group block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-blue-500/30 hover:bg-slate-950"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            {action.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {action.description}
                          </p>
                        </div>

                        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-400" />
                      </div>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon={
                  <CheckCircle2 className="h-6 w-6" />
                }
                title="Tout est à jour"
                description="Aucune action prioritaire pour le moment."
              />
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Candidatures récentes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Suivi de tes dernières opportunités
                </p>
              </div>

              <BriefcaseBusiness className="h-5 w-5 text-slate-500" />
            </div>

            {dashboard.recent_applications.length >
            0 ? (
              <div className="mt-6 divide-y divide-slate-800">
                {dashboard.recent_applications.map(
                  (application) => (
                    <Link
                      key={application.id}
                      href={`/applications/${application.id}`}
                      className="group flex items-center justify-between gap-4 py-4 first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {application.job.title}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {application.job.company}
                        </p>

                        <p className="mt-2 text-xs text-slate-600">
                          {application.applied_at
                            ? `Candidature du ${formatDate(
                                application.applied_at
                              )}`
                            : `Ajoutée le ${formatDate(
                                application.created_at
                              )}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <ApplicationStatus
                          status={application.status}
                        />

                        <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon={
                  <BriefcaseBusiness className="h-6 w-6" />
                }
                title="Aucune candidature"
                description="Tes candidatures suivies apparaîtront ici."
              />
            )}

            <Link
              href="/applications"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              Voir toutes mes candidatures
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Préparation aux entretiens
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Progression de tes simulations
                </p>
              </div>

              <UserRoundCheck className="h-5 w-5 text-slate-500" />
            </div>

            {dashboard.interview_progress.length >
            0 ? (
              <div className="mt-6 space-y-4">
                {dashboard.interview_progress.map(
                  (interview) => (
                    <Link
                      key={
                        interview.preparation_id
                      }
                      href={`/interview/${interview.preparation_id}`}
                      className="group block rounded-2xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {interview.job.title}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {interview.job.company}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-semibold text-blue-400">
                          {interview.completion_percentage.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${Math.min(
                              interview.completion_percentage,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500">
                        <span>
                          {
                            interview.answered_questions
                          }
                          /
                          {
                            interview.total_questions
                          }{" "}
                          questions analysées
                        </span>

                        <span>
                          {interview.has_final_report
                            ? "Bilan disponible"
                            : interview.completed
                              ? "Bilan à générer"
                              : "En cours"}
                        </span>
                      </div>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon={
                  <UserRoundCheck className="h-6 w-6" />
                }
                title="Aucune préparation"
                description="Prépare un entretien depuis une analyse CareerAI."
              />
            )}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/10 via-slate-900 to-slate-900 p-8">
          <div className="max-w-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
              <BrainCircuit className="h-6 w-6 text-blue-400" />
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Analyse une nouvelle opportunité
            </h2>

            <p className="mt-3 leading-7 text-slate-400">
              Compare ton CV à une offre, identifie
              les compétences importantes et prépare
              ensuite ta candidature et ton entretien
              avec CareerAI.
            </p>

            <Link
              href="/analysis/new"
              className="mt-6 inline-flex items-center gap-2 font-medium text-blue-400 transition hover:text-blue-300"
            >
              Commencer une analyse
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PipelineStage({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <Link
      href="/applications"
      className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-blue-500/30 hover:bg-slate-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>
        </div>

        <ArrowRight className="mt-1 h-4 w-4 text-slate-700 transition group-hover:translate-x-1 group-hover:text-blue-400" />
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-600">
        {percentage}% du total
      </p>
    </Link>
  );
}

function DashboardStat({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950">
          {icon}
        </div>

        <span className="text-3xl font-bold">
          {value}
        </span>
      </div>

      <h3 className="mt-5 font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ApplicationStatus({
  status,
}: {
  status: DashboardRecentApplication["status"];
}) {
  return (
    <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
      {statusLabels[status]}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-700 px-5 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
        {icon}
      </div>

      <p className="mt-4 font-medium">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function getFollowUpDifference(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUpDate = new Date(`${value}T12:00:00`);
  followUpDate.setHours(0, 0, 0, 0);

  return Math.round(
    (followUpDate.getTime() - today.getTime()) /
      86_400_000
  );
}

function getFollowUpState(value: string) {
  const difference = getFollowUpDifference(value);

  if (difference < 0) {
    return {
      label: "En retard",
      urgent: true,
    };
  }

  if (difference === 0) {
    return {
      label: "Aujourd'hui",
      urgent: true,
    };
  }

  if (difference === 1) {
    return {
      label: "Demain",
      urgent: false,
    };
  }

  return {
    label: `Dans ${difference} jours`,
    urgent: false,
  };
}

function formatFollowUpDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}
