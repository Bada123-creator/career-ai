"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";

import AppNavbar from "@/components/navigation/AppNavbar";
import {
  Analysis,
  InterviewAnswer,
  InterviewFinalReport,
  InterviewPreparation,
  InterviewQuestion,
  InterviewReport,
  evaluateInterviewAnswer,
  generateInterviewFinalReport,
  generateInterviewPreparation,
  getAnalysis,
  getInterviewAnswers,
  getInterviewFinalReport,
  getInterviewPreparation,
  getInterviewReport,
} from "@/lib/api/analysis";


const TYPE_LABELS: Record<
  InterviewQuestion["type"],
  string
> = {
  hr: "RH",
  technical: "Technique",
  cv: "Votre CV",
  situational: "Mise en situation",
};


export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const preparationId = Number(params.id);

  const [preparation, setPreparation] =
    useState<InterviewPreparation | null>(null);

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [showAnswer, setShowAnswer] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [regenerating, setRegenerating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [interviewAnswers, setInterviewAnswers] =
    useState<InterviewAnswer[]>([]);

  const [answerText, setAnswerText] =
    useState("");

  const [evaluating, setEvaluating] =
    useState(false);

  const [evaluationError, setEvaluationError] =
    useState<string | null>(null);

  const [report, setReport] =
    useState<InterviewReport | null>(null);

  const [finalReport, setFinalReport] =
    useState<InterviewFinalReport | null>(null);

  const [generatingFinalReport, setGeneratingFinalReport] =
    useState(false);

  const [finalReportError, setFinalReportError] =
    useState<string | null>(null);


  useEffect(() => {
    async function loadPreparation() {
      if (
        !Number.isInteger(preparationId) ||
        preparationId <= 0
      ) {
        setError(
          "Identifiant de préparation invalide."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          preparationData,
          savedAnswers,
          reportData,
        ] = await Promise.all([
          getInterviewPreparation(
            preparationId
          ),
          getInterviewAnswers(
            preparationId
          ),
          getInterviewReport(
            preparationId
          ),
        ]);

        setPreparation(preparationData);
        setInterviewAnswers(savedAnswers);
        setReport(reportData);

        try {
          const existingFinalReport =
            await getInterviewFinalReport(
              preparationId
            );

          setFinalReport(existingFinalReport);
        } catch {
          setFinalReport(null);
        }

        const firstSavedAnswer =
          savedAnswers.find(
            (item) =>
              item.question_index === 0
          );

        setAnswerText(
          firstSavedAnswer?.answer ?? ""
        );

        const analysisData =
          await getAnalysis(
            preparationData.analysis_id
          );

        setAnalysis(analysisData);
      } catch {
        setError(
          "Impossible de charger cette préparation."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreparation();
  }, [preparationId]);


  const question =
    preparation?.questions[currentIndex];

  const currentSavedAnswer =
    interviewAnswers.find(
      (item) =>
        item.question_index === currentIndex
    );


  const progress = useMemo(() => {
    return report?.completion_percentage ?? 0;
  }, [report]);


  function loadAnswerForQuestion(
    index: number
  ) {
    const saved = interviewAnswers.find(
      (item) =>
        item.question_index === index
    );

    setAnswerText(saved?.answer ?? "");
    setEvaluationError(null);
  }


  function goToPrevious() {
    if (currentIndex === 0) {
      return;
    }

    const newIndex = currentIndex - 1;

    setCurrentIndex(newIndex);
    setShowAnswer(false);
    loadAnswerForQuestion(newIndex);
  }


  function goToNext() {
    if (
      !preparation ||
      currentIndex >=
        preparation.questions.length - 1
    ) {
      return;
    }

    const newIndex = currentIndex + 1;

    setCurrentIndex(newIndex);
    setShowAnswer(false);
    loadAnswerForQuestion(newIndex);
  }


  function selectQuestion(index: number) {
    setCurrentIndex(index);
    setShowAnswer(false);
    loadAnswerForQuestion(index);
  }


  async function handleEvaluateAnswer() {
    if (
      evaluating ||
      !answerText.trim()
    ) {
      return;
    }

    try {
      setEvaluating(true);
      setEvaluationError(null);

      const evaluated =
        await evaluateInterviewAnswer(
          preparationId,
          currentIndex,
          answerText.trim()
        );

      setInterviewAnswers(
        (current) => {
          const withoutCurrent =
            current.filter(
              (item) =>
                item.question_index !==
                currentIndex
            );

          return [
            ...withoutCurrent,
            evaluated,
          ].sort(
            (a, b) =>
              a.question_index -
              b.question_index
          );
        }
      );

      setAnswerText(evaluated.answer);

      const updatedReport =
        await getInterviewReport(
          preparationId
        );

      setReport(updatedReport);
    } catch {
      setEvaluationError(
        "Impossible d'analyser votre réponse pour le moment."
      );
    } finally {
      setEvaluating(false);
    }
  }


  async function handleGenerateFinalReport() {
    if (
      generatingFinalReport ||
      !report?.completed
    ) {
      return;
    }

    try {
      setGeneratingFinalReport(true);
      setFinalReportError(null);

      const generated =
        await generateInterviewFinalReport(
          preparationId
        );

      setFinalReport(generated);
    } catch {
      setFinalReportError(
        "Impossible de générer votre bilan final pour le moment."
      );
    } finally {
      setGeneratingFinalReport(false);
    }
  }


  async function handleRegenerate() {
    if (!analysis || regenerating) {
      return;
    }

    const confirmed = window.confirm(
      "Générer une nouvelle préparation ? " +
        "La préparation actuelle restera sauvegardée."
    );

    if (!confirmed) {
      return;
    }

    try {
      setRegenerating(true);
      setError(null);

      const newPreparation =
        await generateInterviewPreparation(
          analysis.id
        );

      router.push(
        `/interview/${newPreparation.id}`
      );
    } catch {
      setError(
        "Impossible de générer une nouvelle préparation."
      );
    } finally {
      setRegenerating(false);
    }
  }


  if (loading) {
    return (
      <>
        <AppNavbar />

        <main className="min-h-screen bg-slate-950 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-32">
            <div className="flex items-center gap-3 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement de votre préparation...
            </div>
          </div>
        </main>
      </>
    );
  }


  if (
    error ||
    !preparation ||
    !analysis ||
    !question
  ) {
    return (
      <>
        <AppNavbar />

        <main className="min-h-screen bg-slate-950 text-white">
          <div className="mx-auto max-w-4xl px-6 py-20">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
              <p className="text-red-200">
                {error ||
                  "Préparation introuvable."}
              </p>

              <Link
                href="/dashboard"
                className="mt-5 inline-flex items-center gap-2 text-sm text-white hover:text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au dashboard
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }


  return (
    <>
      <AppNavbar />

      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">

          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href={`/analysis/${analysis.id}`}
                className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à l&apos;analyse
              </Link>

              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-300">
                <Sparkles className="h-4 w-4" />
                Préparation IA
              </div>

              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Préparation à l&apos;entretien
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-400">
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {analysis.job.title}
                </span>

                <span>
                  {analysis.job.company}
                </span>

                {analysis.job.location && (
                  <span>
                    {analysis.job.location}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              {regenerating
                ? "Génération..."
                : "Nouvelle préparation"}
            </button>
          </div>


          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Progression
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {report
                    ? `${report.answered_questions} réponse${
                        report.answered_questions > 1
                          ? "s"
                          : ""
                      } analysée${
                        report.answered_questions > 1
                          ? "s"
                          : ""
                      } sur ${report.total_questions}`
                    : "Chargement..."}
                </p>
              </div>

              <span className="text-sm font-semibold text-indigo-300">
                {Math.round(progress)} %
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>


          {report && (
            <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-indigo-300">
                    <Sparkles className="h-5 w-5" />

                    <h2 className="font-semibold">
                      Bilan de mon entretien
                    </h2>
                  </div>

                  <p className="text-sm text-slate-400">
                    Votre progression est calculée à partir
                    des réponses réellement analysées.
                  </p>
                </div>

                {report.completed ? (
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Entretien terminé
                  </span>
                ) : (
                  <span className="inline-flex w-fit rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-400">
                    En cours
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Réponses analysées
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {report.answered_questions}
                    <span className="text-base font-medium text-slate-500">
                      {" "}
                      / {report.total_questions}
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Progression
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {report.completion_percentage}
                    <span className="text-base font-medium text-slate-500">
                      {" "}
                      %
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                    Score moyen
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {report.average_score ?? "—"}
                    {report.average_score !== null && (
                      <span className="text-base font-medium text-slate-500">
                        {" "}
                        / 100
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Questions restantes
                  </p>

                  <p className="mt-3 text-2xl font-bold">
                    {Math.max(
                      report.total_questions -
                        report.answered_questions,
                      0
                    )}
                  </p>
                </div>
              </div>

              {report.answered_questions > 1 &&
                report.best_answer &&
                report.weakest_answer && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        selectQuestion(
                          report.best_answer!.question_index
                        )
                      }
                      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-left transition hover:border-emerald-500/40"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                        Meilleure réponse
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-300">
                          Question{" "}
                          {report.best_answer.question_index + 1}
                        </span>

                        <span className="font-bold text-emerald-300">
                          {report.best_answer.score}/100
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        selectQuestion(
                          report.weakest_answer!.question_index
                        )
                      }
                      className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-left transition hover:border-amber-500/40"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                        À retravailler
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-300">
                          Question{" "}
                          {report.weakest_answer.question_index + 1}
                        </span>

                        <span className="font-bold text-amber-200">
                          {report.weakest_answer.score}/100
                        </span>
                      </div>
                    </button>
                  </div>
                )}

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                {report.completed ? (
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                    <div>
                      <p className="font-medium text-white">
                        Vos 12 réponses ont été analysées
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Votre bilan final IA peut maintenant
                        être généré à partir de l&apos;ensemble
                        de votre simulation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Target className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                    <div>
                      <p className="font-medium text-slate-300">
                        Bilan final IA
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Analysez les{" "}
                        {Math.max(
                          report.total_questions -
                            report.answered_questions,
                          0
                        )}{" "}
                        réponse
                        {report.total_questions -
                          report.answered_questions >
                        1
                          ? "s"
                          : ""}{" "}
                        restante
                        {report.total_questions -
                          report.answered_questions >
                        1
                          ? "s"
                          : ""}{" "}
                        pour débloquer le bilan final.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          <div className="mb-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-indigo-300">
                  <Sparkles className="h-5 w-5" />

                  <h2 className="font-semibold">
                    Bilan final IA
                  </h2>
                </div>

                <p className="max-w-2xl text-sm leading-6 text-slate-400">
                  Une synthèse globale construite à partir de
                  l&apos;ensemble de vos réponses analysées,
                  du poste ciblé et de votre parcours.
                </p>
              </div>

              {finalReport && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Bilan généré
                </span>
              )}
            </div>

            {!finalReport && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                {report?.completed ? (
                  <>
                    <p className="font-medium text-white">
                      Votre entretien est terminé.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Vos {report.total_questions} réponses ont
                      été analysées. Vous pouvez maintenant
                      générer votre synthèse finale.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-slate-300">
                      Bilan verrouillé
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Analysez les{" "}
                      {Math.max(
                        (report?.total_questions ?? 0) -
                          (report?.answered_questions ?? 0),
                        0
                      )}{" "}
                      réponse
                      {Math.max(
                        (report?.total_questions ?? 0) -
                          (report?.answered_questions ?? 0),
                        0
                      ) > 1
                        ? "s"
                        : ""}{" "}
                      restante
                      {Math.max(
                        (report?.total_questions ?? 0) -
                          (report?.answered_questions ?? 0),
                        0
                      ) > 1
                        ? "s"
                        : ""}{" "}
                      pour débloquer cette fonctionnalité.
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleGenerateFinalReport}
                  disabled={
                    !report?.completed ||
                    generatingFinalReport
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {generatingFinalReport ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}

                  {generatingFinalReport
                    ? "Génération du bilan..."
                    : "Générer mon bilan final IA"}
                </button>
              </div>
            )}

            {finalReportError && (
              <div className="mt-5 flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{finalReportError}</span>
              </div>
            )}

            {finalReport && (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-indigo-500/20 bg-slate-950/60 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Score moyen de la simulation
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-bold text-white">
                      {finalReport.average_score}
                    </span>

                    <span className="pb-1 text-slate-500">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
                  <h3 className="font-semibold text-white">
                    Synthèse
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
                    {finalReport.report.summary}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                    <h3 className="flex items-center gap-2 font-semibold text-emerald-200">
                      <CheckCircle2 className="h-5 w-5" />
                      Points forts récurrents
                    </h3>

                    <div className="mt-4 space-y-3">
                      {finalReport.report.recurring_strengths.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 text-sm leading-6 text-slate-300"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            <span>{item}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                    <h3 className="flex items-center gap-2 font-semibold text-amber-100">
                      <Target className="h-5 w-5" />
                      Priorités d&apos;amélioration
                    </h3>

                    <div className="mt-4 space-y-3">
                      {finalReport.report.priority_improvements.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 text-sm leading-6 text-slate-300"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                            <span>{item}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
                  <h3 className="font-semibold text-white">
                    Compétences à valoriser
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {finalReport.report.skills_to_highlight.map(
                      (skill, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-200"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
                  <h3 className="flex items-center gap-2 font-semibold text-white">
                    <Lightbulb className="h-5 w-5 text-amber-300" />
                    Recommandations finales
                  </h3>

                  <div className="mt-4 space-y-3">
                    {finalReport.report.final_recommendations.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex gap-3 text-sm leading-6 text-slate-300"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">
                            {index + 1}
                          </span>

                          <span>{item}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>


          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">

            <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-4 flex items-center gap-2 px-2">
                <Target className="h-4 w-4 text-indigo-300" />

                <h2 className="text-sm font-semibold">
                  Questions
                </h2>
              </div>

              <div className="space-y-2">
                {preparation.questions.map(
                  (item, index) => {
                    const active =
                      index === currentIndex;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          selectQuestion(index)
                        }
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-indigo-500/50 bg-indigo-500/10"
                            : "border-transparent hover:border-slate-700 hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              active
                                ? "text-indigo-300"
                                : "text-slate-500"
                            }`}
                          >
                            Question {index + 1}
                          </span>

                          {interviewAnswers.some(
                            (answer) =>
                              answer.question_index ===
                              index
                          ) && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {TYPE_LABELS[item.type]}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </aside>


            <section className="space-y-6">

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                    {TYPE_LABELS[question.type]}
                  </span>

                  <span className="text-sm text-slate-500">
                    {currentIndex + 1} /{" "}
                    {preparation.questions.length}
                  </span>
                </div>

                <div className="flex gap-4">
                  <MessageSquareText className="mt-1 h-6 w-6 shrink-0 text-indigo-300" />

                  <h2 className="text-xl font-semibold leading-relaxed md:text-2xl">
                    {question.question}
                  </h2>
                </div>


                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAnswer(
                        (current) => !current
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                  >
                    {showAnswer ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Masquer la réponse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Afficher une réponse
                      </>
                    )}
                  </button>
                </div>


                {showAnswer && (
                  <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Proposition de réponse
                    </p>

                    <p className="whitespace-pre-line leading-7 text-slate-200">
                      {question.suggested_answer}
                    </p>
                  </div>
                )}
              </div>


              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 md:p-8">
                <div className="mb-5 flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5 text-indigo-300" />

                  <h3 className="font-semibold">
                    Simulation d&apos;entretien
                  </h3>
                </div>

                <p className="mb-4 text-sm leading-6 text-slate-400">
                  Répondez comme si vous étiez réellement
                  face au recruteur. L&apos;IA analysera ensuite
                  uniquement le contenu de votre réponse.
                </p>

                <textarea
                  value={answerText}
                  onChange={(event) =>
                    setAnswerText(
                      event.target.value
                    )
                  }
                  rows={7}
                  placeholder="Écrivez votre réponse ici..."
                  className="w-full resize-y rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                />

                {evaluationError && (
                  <div className="mt-4 flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{evaluationError}</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleEvaluateAnswer}
                    disabled={
                      evaluating ||
                      !answerText.trim()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {evaluating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}

                    {evaluating
                      ? "Analyse en cours..."
                      : currentSavedAnswer
                        ? "Ré-analyser ma réponse"
                        : "Analyser ma réponse"}
                  </button>

                  {currentSavedAnswer && (
                    <span className="inline-flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Réponse sauvegardée
                    </span>
                  )}
                </div>

                {currentSavedAnswer && (
                  <div className="mt-8 space-y-6">
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Évaluation de votre réponse
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          Qualité de cette réponse pour cette question
                        </p>
                      </div>

                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-indigo-500/40 bg-indigo-500/10">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {currentSavedAnswer.feedback.score}
                          </div>
                          <div className="text-xs text-slate-400">
                            / 100
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                        <h4 className="mb-4 flex items-center gap-2 font-semibold text-emerald-200">
                          <CheckCircle2 className="h-5 w-5" />
                          Points forts
                        </h4>

                        <div className="space-y-3">
                          {currentSavedAnswer.feedback.strengths.map(
                            (item, index) => (
                              <div
                                key={index}
                                className="flex gap-3 text-sm leading-6 text-slate-300"
                              >
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                <span>{item}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                        <h4 className="mb-4 flex items-center gap-2 font-semibold text-amber-100">
                          <Target className="h-5 w-5" />
                          À améliorer
                        </h4>

                        <div className="space-y-3">
                          {currentSavedAnswer.feedback.improvements.map(
                            (item, index) => (
                              <div
                                key={index}
                                className="flex gap-3 text-sm leading-6 text-slate-300"
                              >
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                                <span>{item}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                        Réponse améliorée
                      </p>

                      <p className="whitespace-pre-line text-sm leading-7 text-slate-200">
                        {currentSavedAnswer.feedback.improved_answer}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
                      <h4 className="mb-4 flex items-center gap-2 font-semibold">
                        <Lightbulb className="h-5 w-5 text-amber-300" />
                        Conseils pour l&apos;oral
                      </h4>

                      <div className="space-y-3">
                        {currentSavedAnswer.feedback.delivery_tips.map(
                          (item, index) => (
                            <div
                              key={index}
                              className="flex gap-3 text-sm leading-6 text-slate-300"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">
                                {index + 1}
                              </span>

                              <span>{item}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>


              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-300" />

                  <h3 className="font-semibold text-amber-100">
                    Conseils pour cette question
                  </h3>
                </div>

                <div className="space-y-3">
                  {question.tips.map(
                    (tip, index) => (
                      <div
                        key={index}
                        className="flex gap-3 text-sm leading-6 text-slate-300"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                        <span>{tip}</span>
                      </div>
                    )
                  )}
                </div>
              </div>


              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Précédente
                </button>

                <button
                  type="button"
                  onClick={goToNext}
                  disabled={
                    currentIndex ===
                    preparation.questions.length - 1
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Suivante
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>


              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-300" />

                  <h3 className="font-semibold">
                    Conseils généraux pour l&apos;entretien
                  </h3>
                </div>

                <div className="space-y-3">
                  {preparation.general_advice.map(
                    (advice, index) => (
                      <div
                        key={index}
                        className="flex gap-3 text-sm leading-6 text-slate-300"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-400">
                          {index + 1}
                        </span>

                        <span>{advice}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

            </section>
          </div>
        </div>
      </main>
    </>
  );
}
