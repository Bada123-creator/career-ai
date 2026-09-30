"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Clipboard,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  MapPin,
  MessageSquareText,
  PenLine,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

import type {
  Analysis,
  CoverLetter,
  CVOptimization,
  InterviewPreparation,
} from "@/lib/api/analysis";

import {
  generateCoverLetter,
  generateCVOptimization,
  generateInterviewPreparation,
  getAnalysis,
  getCoverLetters,
  getCVOptimization,
  getInterviewPreparations,
  updateCoverLetter,
} from "@/lib/api/analysis";

import AppNavbar from "@/components/navigation/AppNavbar";

import {
  createApplication,
  getApplications,
} from "@/lib/api/applications";


function ApplicationAssistantStep({
  number,
  title,
  completed,
}: {
  number: number;
  title: string;
  completed: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-4 py-3 ${
        completed
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          completed
            ? "bg-emerald-500 text-white"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        {completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          number
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {title}
        </p>

        <p
          className={`text-xs ${
            completed
              ? "text-emerald-300"
              : "text-zinc-500"
          }`}
        >
          {completed ? "Terminé" : "À faire"}
        </p>
      </div>
    </div>
  );
}


function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value === null
          ? "—"
          : `${value.toFixed(1)}%`}
      </p>
    </div>
  );
}


function ScoreBreakdown({
  skillScore,
  experienceScore,
  educationScore,
  overallScore,
}: {
  skillScore: number | null;
  experienceScore: number | null;
  educationScore: number | null;
  overallScore: number;
}) {
  const dimensions = [
    {
      label: "Compétences",
      score: skillScore,
      weight: 60,
      description:
        "Correspondance entre les compétences du CV et celles demandées par l'offre.",
    },
    {
      label: "Expérience",
      score: experienceScore,
      weight: 25,
      description:
        "Correspondance entre l'expérience décrite dans le CV et les besoins du poste.",
    },
    {
      label: "Formation",
      score: educationScore,
      weight: 15,
      description:
        "Adéquation entre le niveau de formation détecté et celui demandé.",
    },
  ];

  return (
    <section className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
      <div className="flex items-center gap-3">
        <Target className="h-5 w-5 text-blue-400" />

        <div>
          <h2 className="text-lg font-semibold text-white">
            Comprendre mon score
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Le score global est construit à partir de trois
            dimensions pondérées.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {dimensions.map((dimension) => {
          const contribution =
            dimension.score === null
              ? null
              : (dimension.score * dimension.weight) / 100;

          return (
            <div
              key={dimension.label}
              className="rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">
                      {dimension.label}
                    </p>

                    <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-400">
                      Poids {dimension.weight} %
                    </span>
                  </div>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-500">
                    {dimension.description}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  {dimension.score === null ? (
                    <>
                      <p className="font-semibold text-zinc-400">
                        Non évaluée
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        0 / {dimension.weight} point
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-white">
                        {dimension.score.toFixed(1)} %
                      </p>

                      <p className="mt-1 text-xs text-blue-300">
                        {contribution?.toFixed(1)} /{" "}
                        {dimension.weight} points
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${
                      dimension.score === null
                        ? 0
                        : Math.min(
                            100,
                            Math.max(0, dimension.score)
                          )
                    }%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Total des contributions
        </p>

        <p className="text-xl font-semibold text-white">
          {overallScore.toFixed(1)} / 100
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Une dimension non évaluable ne reçoit aucun point. Son
        poids n&apos;est pas redistribué aux autres dimensions.
      </p>
    </section>
  );
}


function ListSection({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center gap-3">
        {icon}

        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex gap-3 text-sm leading-6 text-zinc-300"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


export default function AnalysisDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const analysisId = Number(params.id);

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [applicationId, setApplicationId] =
    useState<number | null>(null);

  const [
    creatingApplication,
    setCreatingApplication,
  ] = useState(false);

  const [
    applicationError,
    setApplicationError,
  ] = useState("");

  const [coverLetter, setCoverLetter] =
    useState<CoverLetter | null>(null);

  const [
    coverLetterContent,
    setCoverLetterContent,
  ] = useState("");

  const [
    generatingCoverLetter,
    setGeneratingCoverLetter,
  ] = useState(false);

  const [
    savingCoverLetter,
    setSavingCoverLetter,
  ] = useState(false);

  const [
    coverLetterError,
    setCoverLetterError,
  ] = useState("");

  const [
    coverLetterMessage,
    setCoverLetterMessage,
  ] = useState("");


  const [cvOptimization, setCVOptimization] =
    useState<CVOptimization | null>(null);

  const [
    generatingCVOptimization,
    setGeneratingCVOptimization,
  ] = useState(false);

  const [
    cvOptimizationError,
    setCVOptimizationError,
  ] = useState("");


  const [
    interviewPreparation,
    setInterviewPreparation,
  ] = useState<InterviewPreparation | null>(null);

  const [
    generatingInterview,
    setGeneratingInterview,
  ] = useState(false);

  const [
    interviewError,
    setInterviewError,
  ] = useState("");


  useEffect(() => {
    async function loadAnalysis() {
      if (
        !Number.isInteger(analysisId) ||
        analysisId <= 0
      ) {
        setError(
          "Identifiant d'analyse invalide."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          data,
          applications,
          coverLetters,
          interviewPreparations,
        ] = await Promise.all([
          getAnalysis(analysisId),
          getApplications(),
          getCoverLetters(analysisId),
          getInterviewPreparations(analysisId),
        ]);

        setAnalysis(data);

        const existingApplication =
          applications.find(
            (application) =>
              application.job === data.job.id
          );

        setApplicationId(
          existingApplication?.id ?? null
        );

        const latestCoverLetter =
          coverLetters[0] ?? null;

        setCoverLetter(latestCoverLetter);

        setCoverLetterContent(
          latestCoverLetter?.content ?? ""
        );

        const latestInterviewPreparation =
          interviewPreparations[0] ?? null;

        setInterviewPreparation(
          latestInterviewPreparation
        );

        try {
          const existingCVOptimization =
            await getCVOptimization(analysisId);

          setCVOptimization(
            existingCVOptimization
          );
        } catch {
          setCVOptimization(null);
        }
      } catch (err) {
        console.error(
          "CAREERAI ANALYSIS DETAIL ERROR:",
          err
        );

        setError(
          "Impossible de charger cette analyse."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAnalysis();
  }, [analysisId]);


  async function handleAddApplication() {
    if (!analysis || applicationId !== null) {
      return;
    }

    try {
      setCreatingApplication(true);
      setApplicationError("");

      const createdApplication =
        await createApplication({
          job: analysis.job.id,
          status: "draft",
          notes:
            "Candidature ajoutée depuis une analyse CareerAI.",
        });

      setApplicationId(
        createdApplication.id
      );
    } catch (err) {
      console.error(
        "CAREERAI CREATE APPLICATION ERROR:",
        err
      );

      setApplicationError(
        "Impossible d'ajouter cette candidature."
      );
    } finally {
      setCreatingApplication(false);
    }
  }


  async function handleGenerateCVOptimization() {
    if (!analysis || generatingCVOptimization) {
      return;
    }

    try {
      setGeneratingCVOptimization(true);
      setCVOptimizationError("");

      const generated =
        await generateCVOptimization(analysis.id);

      setCVOptimization(generated);
    } catch (err) {
      console.error(
        "CAREERAI CV OPTIMIZATION ERROR:",
        err
      );

      setCVOptimizationError(
        "Impossible d'optimiser le CV."
      );
    } finally {
      setGeneratingCVOptimization(false);
    }
  }


  async function handleGenerateCoverLetter() {
    if (!analysis || generatingCoverLetter) {
      return;
    }

    try {
      setGeneratingCoverLetter(true);
      setCoverLetterError("");
      setCoverLetterMessage("");

      const generated =
        await generateCoverLetter(analysis.id);

      setCoverLetter(generated);
      setCoverLetterContent(
        generated.content
      );

      setCoverLetterMessage(
        "Lettre de motivation générée avec succès."
      );
    } catch (err) {
      console.error(
        "CAREERAI COVER LETTER GENERATION ERROR:",
        err
      );

      setCoverLetterError(
        "Impossible de générer la lettre de motivation."
      );
    } finally {
      setGeneratingCoverLetter(false);
    }
  }


  async function handleSaveCoverLetter() {
    if (!coverLetter || savingCoverLetter) {
      return;
    }

    const content =
      coverLetterContent.trim();

    if (!content) {
      setCoverLetterError(
        "La lettre de motivation ne peut pas être vide."
      );
      return;
    }

    try {
      setSavingCoverLetter(true);
      setCoverLetterError("");
      setCoverLetterMessage("");

      const updated =
        await updateCoverLetter(
          coverLetter.id,
          content
        );

      setCoverLetter(updated);
      setCoverLetterContent(
        updated.content
      );

      setCoverLetterMessage(
        "Modifications enregistrées."
      );
    } catch (err) {
      console.error(
        "CAREERAI COVER LETTER SAVE ERROR:",
        err
      );

      setCoverLetterError(
        "Impossible d'enregistrer la lettre."
      );
    } finally {
      setSavingCoverLetter(false);
    }
  }


  async function handlePrepareInterview() {
    if (!analysis || generatingInterview) {
      return;
    }

    if (interviewPreparation) {
      router.push(
        `/interview/${interviewPreparation.id}`
      );
      return;
    }

    try {
      setGeneratingInterview(true);
      setInterviewError("");

      const generated =
        await generateInterviewPreparation(
          analysis.id
        );

      setInterviewPreparation(generated);

      router.push(
        `/interview/${generated.id}`
      );
    } catch (err) {
      console.error(
        "CAREERAI INTERVIEW GENERATION ERROR:",
        err
      );

      setInterviewError(
        "Impossible de préparer l'entretien."
      );
    } finally {
      setGeneratingInterview(false);
    }
  }


  async function handleCopyCoverLetter() {
    if (!coverLetterContent.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        coverLetterContent
      );

      setCoverLetterError("");

      setCoverLetterMessage(
        "Lettre copiée dans le presse-papiers."
      );
    } catch (err) {
      console.error(
        "CAREERAI COVER LETTER COPY ERROR:",
        err
      );

      setCoverLetterError(
        "Impossible de copier la lettre."
      );
    }
  }


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex items-center gap-3 text-zinc-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement de l&apos;analyse...
        </div>
      </main>
    );
  }


  if (error || !analysis) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="max-w-md text-center">
          <TriangleAlert className="mx-auto h-10 w-10 text-amber-400" />

          <h1 className="mt-4 text-xl font-semibold">
            Analyse indisponible
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            {error ||
              "Cette analyse n'existe pas."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
          >
            Retour au dashboard
          </button>
        </div>
      </main>
    );
  }


  const ai = analysis.ai_analysis;


  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AppNavbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
                <BriefcaseBusiness className="h-4 w-4" />
                Analyse de candidature
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {analysis.job.title}
              </h1>

              <p className="mt-3 text-lg text-zinc-300">
                {analysis.job.company}
              </p>

              {analysis.job.location && (
                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                  <MapPin className="h-4 w-4" />
                  {analysis.job.location}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <FileText className="h-4 w-4" />
                CV : {analysis.resume.title}
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                Analyse du{" "}
                {new Date(
                  analysis.created_at
                ).toLocaleString("fr-FR")}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex h-40 w-40 shrink-0 flex-col items-center justify-center rounded-full border border-white/10 bg-black/30">
                <span className="text-4xl font-bold">
                  {analysis.matching.overall_score.toFixed(
                    1
                  )}
                  %
                </span>

                <span className="mt-1 max-w-28 text-center text-xs uppercase tracking-wider text-zinc-500">
                  Score de compatibilité
                </span>
              </div>

              <div className="text-center text-sm">
                <p className="text-zinc-300">
                  Couverture de l&apos;analyse :{" "}
                  <span className="font-semibold text-white">
                    {analysis.matching.coverage_score.toFixed(
                      0
                    )}
                    %
                  </span>
                </p>

                <p className="mt-1 text-zinc-400">
                  Fiabilité :{" "}
                  <span className="font-medium text-white">
                    {analysis.matching.confidence_level ===
                    "high"
                      ? "élevée"
                      : analysis.matching
                            .confidence_level ===
                          "medium"
                        ? "moyenne"
                        : "faible"}
                  </span>
                </p>

                <p className="mt-2 max-w-72 text-xs leading-5 text-zinc-500">
                  La couverture indique la part des critères que
                  CareerAI a pu évaluer à partir du CV et de
                  l&apos;offre.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />

              <h2 className="text-lg font-semibold text-white">
                Assistant de candidature
              </h2>
            </div>

            <p className="mt-2 text-sm text-zinc-400">
              Suivez les étapes pour préparer votre candidature
              à {analysis.job.title} chez {analysis.job.company}.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <ApplicationAssistantStep
              number={1}
              title="Analyse"
              completed={true}
            />

            <ApplicationAssistantStep
              number={2}
              title="CV optimisé"
              completed={cvOptimization !== null}
            />

            <ApplicationAssistantStep
              number={3}
              title="Lettre"
              completed={coverLetter !== null}
            />

            <ApplicationAssistantStep
              number={4}
              title="Candidature"
              completed={applicationId !== null}
            />

            <ApplicationAssistantStep
              number={5}
              title="Entretien"
              completed={interviewPreparation !== null}
            />
          </div>
        </section>

        {analysis.matching.coverage_score < 50 && (
          <section className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="font-semibold text-amber-200">
              Données insuffisantes pour une estimation globale fiable
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-100/70">
              Le score ci-dessus porte uniquement sur les
              critères que CareerAI a pu évaluer. La couverture
              actuelle est de{" "}
              {analysis.matching.coverage_score.toFixed(0)} %.
              L&apos;offre peut contenir trop peu
              d&apos;informations sur les compétences, la
              formation ou l&apos;expérience attendue.
            </p>
          </section>
        )}


        <ScoreBreakdown
          skillScore={analysis.matching.skill_score}
          experienceScore={analysis.matching.experience_score}
          educationScore={analysis.matching.education_score}
          overallScore={analysis.matching.overall_score}
        />

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <ScoreCard
            label="Compétences"
            value={
              analysis.matching.skill_score
            }
          />

          <ScoreCard
            label="Expérience"
            value={
              analysis.matching.experience_score
            }
          />

          <ScoreCard
            label="Formation"
            value={
              analysis.matching.education_score
            }
          />
        </section>


        {analysis.matching.essential_skills.length > 0 ||
        analysis.matching.complementary_skills.length > 0 ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-2 flex items-center gap-3">
                <Target className="h-5 w-5 text-violet-400" />

                <h2 className="text-lg font-semibold">
                  Compétences essentielles
                </h2>
              </div>

              <p className="mb-5 text-sm leading-6 text-zinc-400">
                Ces compétences ont davantage de poids dans le
                score de compatibilité.
              </p>

              <div className="space-y-2">
                {analysis.matching.essential_skills.map(
                  (skill) => {
                    const matched =
                      analysis.matching.matching_skills.includes(
                        skill
                      );

                    return (
                      <div
                        key={skill}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-zinc-200">
                          {skill}
                        </span>

                        {matched ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Détectée
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
                            <TriangleAlert className="h-4 w-4" />
                            Non détectée
                          </span>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-2 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                <h2 className="text-lg font-semibold">
                  Compétences complémentaires
                </h2>
              </div>

              <p className="mb-5 text-sm leading-6 text-zinc-400">
                Elles renforcent la candidature, avec un poids
                inférieur aux compétences essentielles.
              </p>

              {analysis.matching.complementary_skills.length >
              0 ? (
                <div className="space-y-2">
                  {analysis.matching.complementary_skills.map(
                    (skill) => {
                      const matched =
                        analysis.matching.matching_skills.includes(
                          skill
                        );

                      return (
                        <div
                          key={skill}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <span className="text-sm font-medium text-zinc-200">
                            {skill}
                          </span>

                          {matched ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                              <CheckCircle2 className="h-4 w-4" />
                              Détectée
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
                              <TriangleAlert className="h-4 w-4" />
                              Non détectée
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Aucune compétence complémentaire identifiée.
                </p>
              )}
            </div>

            <p className="lg:col-span-2 text-xs leading-5 text-zinc-500">
              Une compétence non détectée dans le CV ne signifie
              pas nécessairement qu&apos;elle n&apos;est pas
              maîtrisée. CareerAI se base uniquement sur les
              informations présentes dans le CV analysé.
            </p>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                <h2 className="text-lg font-semibold">
                  Compétences détectées
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {analysis.matching.matching_skills.length > 0 ? (
                  analysis.matching.matching_skills.map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300"
                      >
                        {skill}
                      </span>
                    )
                  )
                ) : (
                  <p className="text-sm text-zinc-400">
                    Aucune compétence commune détectée.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <Target className="h-5 w-5 text-amber-400" />

                <h2 className="text-lg font-semibold">
                  Compétences non détectées
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {analysis.matching.missing_skills.length > 0 ? (
                  analysis.matching.missing_skills.map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300"
                      >
                        {skill}
                      </span>
                    )
                  )
                ) : (
                  <p className="text-sm text-zinc-400">
                    Aucune compétence manquante détectée.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {ai ? (
          <>
            <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-violet-400" />

                <h2 className="text-lg font-semibold">
                  Analyse IA
                </h2>
              </div>

              <p className="leading-7 text-zinc-300">
                {ai.summary}
              </p>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ListSection
                title="Points forts"
                items={ai.strengths}
                icon={
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                }
              />

              <ListSection
                title="Points d'amélioration"
                items={ai.weaknesses}
                icon={
                  <TriangleAlert className="h-5 w-5 text-amber-400" />
                }
              />

              <ListSection
                title="Expérience pertinente"
                items={ai.relevant_experience}
                icon={
                  <BriefcaseBusiness className="h-5 w-5 text-blue-400" />
                }
              />

              <ListSection
                title="Formation pertinente"
                items={ai.relevant_education}
                icon={
                  <GraduationCap className="h-5 w-5 text-cyan-400" />
                }
              />
            </div>

            <div className="mt-6">
              <ListSection
                title="Recommandations"
                items={ai.recommendations}
                icon={
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                }
              />
            </div>
          </>
        ) : (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-zinc-400">
              L&apos;analyse IA n&apos;était pas disponible
              lors de cette analyse.
            </p>
          </section>
        )}


        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-cyan-400" />

                <h2 className="text-lg font-semibold text-white">
                  Optimisation du CV
                </h2>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Adaptez la présentation de votre CV à cette
                offre sans inventer de compétences ou
                d&apos;expériences.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateCVOptimization}
              disabled={generatingCVOptimization}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingCVOptimization ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cvOptimization ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}

              {generatingCVOptimization
                ? "Optimisation..."
                : cvOptimization
                  ? "Régénérer"
                  : "Optimiser mon CV"}
            </button>
          </div>

          {cvOptimizationError && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {cvOptimizationError}
            </div>
          )}

          {cvOptimization && (
            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h3 className="font-semibold text-white">
                  Résumé professionnel proposé
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  {
                    cvOptimization.optimization
                      .professional_summary
                  }
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h3 className="font-semibold text-white">
                  Compétences à valoriser
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {cvOptimization.optimization.skills_to_highlight.map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-300"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h3 className="font-semibold text-white">
                  Mots-clés de l&apos;offre
                </h3>

                <div className="mt-4 space-y-3">
                  {cvOptimization.optimization.relevant_keywords.map(
                    (item) => (
                      <div
                        key={item.keyword}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-medium text-white">
                            {item.keyword}
                          </span>

                          <span
                            className={
                              item.status === "present"
                                ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
                                : item.status ===
                                    "supported_but_not_explicit"
                                  ? "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300"
                                  : "rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-300"
                            }
                          >
                            {item.status === "present"
                              ? "Présent"
                              : item.status ===
                                  "supported_but_not_explicit"
                                ? "À mieux expliciter"
                                : "Non détecté"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {item.recommendation}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {cvOptimization.optimization.experience_rewrites.length >
                0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="font-semibold text-white">
                    Reformulations proposées
                  </h3>

                  <div className="mt-4 space-y-4">
                    {cvOptimization.optimization.experience_rewrites.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Texte actuel
                          </p>

                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {item.original}
                          </p>

                          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-cyan-400">
                            Proposition
                          </p>

                          <p className="mt-2 text-sm leading-6 text-zinc-200">
                            {item.optimized}
                          </p>

                          <p className="mt-3 text-xs leading-5 text-zinc-500">
                            {item.reason}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-emerald-400" />

                    <h3 className="font-semibold text-white">
                      Priorités
                    </h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    {cvOptimization.optimization.priority_recommendations.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex gap-3 text-sm leading-6 text-zinc-300"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          <p>{item}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <TriangleAlert className="h-5 w-5 text-amber-400" />

                    <h3 className="font-semibold text-white">
                      Points de vigilance
                    </h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    {cvOptimization.optimization.warnings.length >
                    0 ? (
                      cvOptimization.optimization.warnings.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 text-sm leading-6 text-zinc-300"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            <p>{item}</p>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-zinc-400">
                        Aucun point de vigilance particulier.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs leading-5 text-zinc-500">
                CareerAI reformule uniquement les informations
                appuyées par votre CV. Une compétence non détectée
                ne doit pas être ajoutée sans pouvoir la justifier.
              </p>
            </div>
          )}
        </section>


        <section className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-violet-400" />

                <h2 className="text-lg font-semibold text-white">
                  Lettre de motivation IA
                </h2>
              </div>

              <p className="mt-2 text-sm text-zinc-400">
                Générée à partir de votre CV et de cette offre.
                Vous pouvez la modifier avant de l&apos;utiliser.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateCoverLetter}
              disabled={generatingCoverLetter}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingCoverLetter ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : coverLetter ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}

              {generatingCoverLetter
                ? "Génération..."
                : coverLetter
                  ? "Régénérer"
                  : "Générer ma lettre"}
            </button>
          </div>


          {coverLetterError && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {coverLetterError}
            </div>
          )}


          {coverLetterMessage && (
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {coverLetterMessage}
            </div>
          )}


          {coverLetter && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
                <PenLine className="h-4 w-4" />
                Vous pouvez modifier le texte directement.
              </div>

              <textarea
                value={coverLetterContent}
                onChange={(event) => {
                  setCoverLetterContent(
                    event.target.value
                  );
                  setCoverLetterMessage("");
                }}
                rows={20}
                className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-500/50"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveCoverLetter}
                  disabled={savingCoverLetter}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCoverLetter ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {savingCoverLetter
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyCoverLetter}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  <Clipboard className="h-4 w-4" />
                  Copier
                </button>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                Dernière modification :{" "}
                {new Date(
                  coverLetter.updated_at
                ).toLocaleString("fr-FR")}
              </p>
            </div>
          )}
        </section>


        <section className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <MessageSquareText className="h-5 w-5 text-indigo-400" />

                <h2 className="text-lg font-semibold text-white">
                  Préparation à l&apos;entretien IA
                </h2>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Préparez-vous avec des questions RH,
                techniques et personnalisées à partir de
                votre CV et de cette offre.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrepareInterview}
              disabled={generatingInterview}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingInterview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquareText className="h-4 w-4" />
              )}

              {generatingInterview
                ? "Préparation..."
                : interviewPreparation
                  ? "Continuer ma préparation"
                  : "Préparer mon entretien"}
            </button>
          </div>

          {interviewPreparation && (
            <div className="mt-5 rounded-xl border border-indigo-500/20 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Préparation disponible
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {interviewPreparation.questions.length}
                    {" "}questions personnalisées
                  </p>
                </div>

                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                  Sauvegardée
                </span>
              </div>
            </div>
          )}

          {interviewError && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {interviewError}
            </div>
          )}
        </section>


        {applicationError && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {applicationError}
          </div>
        )}


        <div className="mt-8 flex flex-wrap gap-3">
          {applicationId !== null ? (
            <Link
              href={`/applications/${applicationId}`}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Voir ma candidature
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddApplication}
              disabled={creatingApplication}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingApplication ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BriefcaseBusiness className="h-4 w-4" />
              )}

              {creatingApplication
                ? "Ajout..."
                : "Ajouter à mes candidatures"}
            </button>
          )}

          <Link
            href="/analysis/new"
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <Sparkles className="h-4 w-4" />
            Nouvelle analyse
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
