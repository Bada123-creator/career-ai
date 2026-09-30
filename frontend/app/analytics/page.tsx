"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Target,
  Trophy,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppNavbar from "@/components/navigation/AppNavbar";
import {
  Application,
  getApplications,
} from "@/lib/api/applications";
import {
  Analysis,
  getAnalyses,
} from "@/lib/api/analysis";

function percentage(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

export default function AnalyticsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);

        const [applicationsData, analysesData] =
          await Promise.all([
            getApplications(),
            getAnalyses(),
          ]);

        setApplications(applicationsData);
        setAnalyses(analysesData);
      } catch {
        setError(
          "Impossible de charger les statistiques pour le moment."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const stats = useMemo(() => {
    const submitted = applications.filter(
      (application) => application.status !== "draft"
    );

    const reachedInterview = applications.filter(
      (application) =>
        application.status === "interview" ||
        application.status === "accepted"
    ).length;

    const accepted = applications.filter(
      (application) => application.status === "accepted"
    ).length;

    const scores = analyses.map(
      (analysis) => analysis.matching.overall_score
    );

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) /
          scores.length
        : null;

    const bestScore =
      scores.length > 0 ? Math.max(...scores) : null;

    return {
      totalApplications: applications.length,
      submittedApplications: submitted.length,
      reachedInterview,
      accepted,
      interviewRate: percentage(
        reachedInterview,
        submitted.length
      ),
      averageScore,
      bestScore,
    };
  }, [applications, analyses]);

  const pipeline = useMemo(() => {
    const definitions = [
      { key: "draft", label: "Brouillon" },
      { key: "sent", label: "Envoyée" },
      { key: "interview", label: "Entretien" },
      { key: "accepted", label: "Acceptée" },
      { key: "rejected", label: "Refusée" },
    ] as const;

    return definitions.map((item) => {
      const count = applications.filter(
        (application) => application.status === item.key
      ).length;

      return {
        ...item,
        count,
        percentage: percentage(
          count,
          applications.length
        ),
      };
    });
  }, [applications]);

  const chartData = useMemo(() => {
    return [...analyses]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      )
      .map((analysis) => ({
        id: analysis.id,
        date: new Date(
          analysis.created_at
        ).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }),
        score: analysis.matching.overall_score,
        job: analysis.job.title,
        company: analysis.job.company,
      }));
  }, [analyses]);

  if (loading) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-7xl px-6 py-12 text-zinc-400">
          Chargement des statistiques...
        </main>
      </>
    );
  }

  return (
    <>
      <AppNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>

        <div className="mb-8">
          <p className="text-sm font-medium text-violet-400">
            Career Analytics
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Pilote ta recherche d&apos;emploi
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Suis tes candidatures, ton niveau de compatibilité
            et ta progression au fil de tes analyses.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            label="Candidatures"
            value={String(stats.totalApplications)}
            description={`${stats.submittedApplications} envoyée${
              stats.submittedApplications > 1 ? "s" : ""
            }`}
          />

          <MetricCard
            icon={<Target className="h-5 w-5" />}
            label="Score moyen"
            value={
              stats.averageScore !== null
                ? `${stats.averageScore.toFixed(1)}%`
                : "—"
            }
            description={`${analyses.length} analyse${
              analyses.length > 1 ? "s" : ""
            }`}
          />

          <MetricCard
            icon={<Activity className="h-5 w-5" />}
            label="Taux d'entretien"
            value={`${stats.interviewRate.toFixed(1)}%`}
            description={`${stats.reachedInterview} candidature${
              stats.reachedInterview > 1 ? "s" : ""
            } arrivée${
              stats.reachedInterview > 1 ? "s" : ""
            } à cette étape`}
          />

          <MetricCard
            icon={<Trophy className="h-5 w-5" />}
            label="Meilleur matching"
            value={
              stats.bestScore !== null
                ? `${stats.bestScore.toFixed(1)}%`
                : "—"
            }
            description={`${stats.accepted} candidature${
              stats.accepted > 1 ? "s" : ""
            } acceptée${
              stats.accepted > 1 ? "s" : ""
            }`}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex items-center gap-3">
              <ChartNoAxesCombined className="h-5 w-5 text-violet-400" />

              <div>
                <h2 className="font-semibold">
                  Évolution du matching
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Score de compatibilité de tes analyses dans
                  le temps.
                </p>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      fontSize={12}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#71717a"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Matching",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="currentColor"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Aucune analyse disponible." />
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-semibold">
              Pipeline des candidatures
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Répartition actuelle de tes candidatures.
            </p>

            <div className="mt-6 space-y-5">
              {pipeline.map((item) => (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-300">
                      {item.label}
                    </span>

                    <span className="font-medium">
                      {item.count}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/70 transition-all"
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-right text-xs text-zinc-500">
                    {item.percentage.toFixed(1)} %
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-violet-400">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>

      <p className="mt-4 text-3xl font-bold">{value}</p>

      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-zinc-500">
      {text}
    </div>
  );
}
