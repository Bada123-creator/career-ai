"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";

import AppNavbar from "@/components/navigation/AppNavbar";
import api from "@/lib/api/client";
import {
  getSkillsGap,
  SkillGapItem,
  SkillsGapResponse,
} from "@/lib/api/skills-gap";
import {
  getLearningPlan,
  LearningPlanResponse,
  LearningSkill,
  LearningSkillStatus,
  syncLearningPlan,
  updateLearningSkill,
} from "@/lib/api/learning-plan";

type ResumeOption = {
  id: number;
  title: string;
};

function getPriorityLabel(skill: SkillGapItem) {
  if (skill.mastered) {
    return "Maîtrisée";
  }

  if (skill.priority === "high") {
    return "Priorité haute";
  }

  if (skill.priority === "medium") {
    return "Priorité moyenne";
  }

  return "Priorité faible";
}

function getPriorityClasses(skill: SkillGapItem) {
  if (skill.mastered) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (skill.priority === "high") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (skill.priority === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-slate-600 bg-slate-800 text-slate-300";
}

export default function SkillsGapPage() {
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] =
    useState<number | null>(null);

  const [result, setResult] =
    useState<SkillsGapResponse | null>(null);

  const [loadingResumes, setLoadingResumes] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [learningPlan, setLearningPlan] =
    useState<LearningPlanResponse | null>(null);

  const [learningPlanLoading, setLearningPlanLoading] =
    useState(false);

  const [savingSkillId, setSavingSkillId] =
    useState<number | null>(null);

  const [learningMessage, setLearningMessage] =
    useState("");

  useEffect(() => {
    async function loadResumes() {
      try {
        setLoadingResumes(true);

        const response = await api.get("/cvs/");

        const raw = response.data;

        const items: ResumeOption[] = Array.isArray(raw)
          ? raw
          : raw.results ?? raw.resumes ?? [];

        setResumes(items);

        if (items.length > 0) {
          setSelectedResumeId(items[0].id);
        }
      } catch {
        setError(
          "Impossible de charger les CV."
        );
      } finally {
        setLoadingResumes(false);
      }
    }

    loadResumes();
  }, []);

  async function loadLearningPlan(
    resumeId: number
  ) {
    try {
      const data = await getLearningPlan(resumeId);
      setLearningPlan(data);
    } catch {
      setLearningPlan(null);
    }
  }

  async function handleSyncLearningPlan() {
    if (!selectedResumeId) {
      return;
    }

    try {
      setLearningPlanLoading(true);
      setError("");
      setLearningMessage("");

      const data =
        await syncLearningPlan(selectedResumeId);

      setLearningPlan(data);

      if (data.created_count > 0) {
        setLearningMessage(
          `${data.created_count} compétence${
            data.created_count !== 1 ? "s" : ""
          } ajoutée${
            data.created_count !== 1 ? "s" : ""
          } au plan.`
        );
      } else {
        setLearningMessage(
          "Ton plan d’apprentissage est à jour."
        );
      }
    } catch {
      setError(
        "Impossible de synchroniser le plan d’apprentissage."
      );
    } finally {
      setLearningPlanLoading(false);
    }
  }

  async function handleUpdateLearningSkill(
    item: LearningSkill,
    payload: {
      status?: LearningSkillStatus;
      progress?: number;
      objective?: string;
      notes?: string;
    }
  ) {
    try {
      setSavingSkillId(item.id);
      setError("");

      const updated = await updateLearningSkill(
        item.id,
        payload
      );

      setLearningPlan((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          skills: current.skills.map((skill) =>
            skill.id === updated.id
              ? updated
              : skill
          ),
        };
      });
    } catch {
      setError(
        "Impossible de mettre à jour cette compétence."
      );
    } finally {
      setSavingSkillId(null);
    }
  }

  async function analyzeSkills() {
    if (!selectedResumeId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getSkillsGap(selectedResumeId);

      setResult(data);
      await loadLearningPlan(selectedResumeId);
    } catch {
      setError(
        "Impossible d'analyser les compétences."
      );
    } finally {
      setLoading(false);
    }
  }

  const masteredSkills = useMemo(
    () =>
      result?.skills.filter(
        (skill) => skill.mastered
      ) ?? [],
    [result]
  );

  const missingSkills = useMemo(
    () =>
      result?.skills.filter(
        (skill) => !skill.mastered
      ) ?? [],
    [result]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-400">
              <BarChart3 className="h-4 w-4" />
              Skills Gap Analyzer
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Analyse tes compétences
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Compare ton CV aux offres enregistrées
              pour identifier les compétences les plus
              recherchées et celles à développer en priorité.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <select
              value={selectedResumeId ?? ""}
              disabled={loadingResumes}
              onChange={(event) => {
                setSelectedResumeId(
                  Number(event.target.value)
                );
                setResult(null);
                setLearningPlan(null);
                setLearningMessage("");
              }}
              className="min-w-64 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500"
            >
              {loadingResumes ? (
                <option>
                  Chargement des CV...
                </option>
              ) : resumes.length === 0 ? (
                <option>
                  Aucun CV disponible
                </option>
              ) : (
                resumes.map((resume) => (
                  <option
                    key={resume.id}
                    value={resume.id}
                  >
                    {resume.title}
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={analyzeSkills}
              disabled={
                loading ||
                !selectedResumeId
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  Analyser mes compétences
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {!result && !loading && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-16 text-center">
            <Target className="mx-auto h-10 w-10 text-slate-600" />

            <h2 className="mt-4 text-lg font-semibold">
              Découvre les compétences à développer
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              Sélectionne un CV puis lance l&apos;analyse.
              CareerAI comparera tes compétences aux
              offres que tu as enregistr&eacute;es.
            </p>
          </div>
        )}

        {result && (
          <>
            <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Couverture
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-400">
                  {result.coverage}%
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  des compétences détectées
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Maîtrisées
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-400">
                  {result.mastered_count}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  compétences présentes dans le CV
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  À développer
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-400">
                  {result.missing_count}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  compétences non détectées
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Offres analysées
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {result.total_jobs}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  offres enregistrées
                </p>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    Priorités d&apos;apprentissage
                  </h2>

                  <p className="text-sm text-slate-500">
                    Compétences absentes du CV class&eacute;es
                    selon leur fréquence dans les offres.
                  </p>
                </div>
              </div>

              {result.priority_skills.length === 0 ? (
                <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-300">
                  Aucune compétence prioritaire manquante
                  n&apos;a été détectée.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {result.priority_skills.map(
                    (skill) => (
                      <div
                        key={skill.skill}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">
                              {skill.skill}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              Demandée dans{" "}
                              {skill.job_count}/
                              {result.total_jobs} offres
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityClasses(
                              skill
                            )}`}
                          >
                            {getPriorityLabel(skill)}
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex justify-between text-xs text-slate-500">
                            <span>
                              Fréquence
                            </span>
                            <span>
                              {skill.frequency}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{
                                width: `${Math.min(
                                  skill.frequency,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {skill.companies.length > 0 && (
                          <p className="mt-4 text-xs text-slate-500">
                            Entreprises :{" "}
                            {skill.companies.join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-2xl border border-blue-500/20 bg-slate-900 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-500/10 p-2">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      Mon plan d&apos;apprentissage
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Suis ta progression sur les compétences
                      prioritaires détectées par CareerAI.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncLearningPlan}
                  disabled={learningPlanLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {learningPlanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  Synchroniser mon plan
                </button>
              </div>

              {learningMessage && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
                  {learningMessage}
                </div>
              )}

              {!learningPlan ||
              learningPlan.skills.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-600" />

                  <p className="mt-3 font-medium">
                    Ton plan est encore vide
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Clique sur « Synchroniser mon plan » pour
                    ajouter tes compétences prioritaires.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {learningPlan.skills.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                              {item.skill}
                            </h3>

                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                              {item.priority === "high"
                                ? "Priorité haute"
                                : item.priority === "medium"
                                  ? "Priorité moyenne"
                                  : "Priorité faible"}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {item.job_count} offre
                            {item.job_count !== 1 ? "s" : ""}
                            {" • "}
                            {item.frequency}% de fréquence
                          </p>
                        </div>

                        <select
                          value={item.status}
                          disabled={savingSkillId === item.id}
                          onChange={(event) =>
                            handleUpdateLearningSkill(item, {
                              status:
                                event.target
                                  .value as LearningSkillStatus,
                            })
                          }
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="todo">
                            À apprendre
                          </option>
                          <option value="learning">
                            En cours
                          </option>
                          <option value="completed">
                            Maîtrisée
                          </option>
                        </select>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-400">
                            Progression
                          </span>

                          <span className="font-semibold text-blue-400">
                            {item.progress}%
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={item.progress}
                          disabled={savingSkillId === item.id}
                          onChange={(event) => {
                            const progress = Number(
                              event.target.value
                            );

                            setLearningPlan((current) => {
                              if (!current) return current;

                              return {
                                ...current,
                                skills: current.skills.map(
                                  (skill) =>
                                    skill.id === item.id
                                      ? {
                                          ...skill,
                                          progress,
                                        }
                                      : skill
                                ),
                              };
                            });
                          }}
                          onMouseUp={(event) =>
                            handleUpdateLearningSkill(item, {
                              progress: Number(
                                event.currentTarget.value
                              ),
                            })
                          }
                          onTouchEnd={(event) =>
                            handleUpdateLearningSkill(item, {
                              progress: Number(
                                event.currentTarget.value
                              ),
                            })
                          }
                          className="w-full accent-blue-500"
                        />
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Objectif
                          </label>

                          <input
                            type="text"
                            defaultValue={item.objective}
                            placeholder="Ex. Créer un dashboard Power BI"
                            onBlur={(event) => {
                              if (
                                event.target.value !==
                                item.objective
                              ) {
                                handleUpdateLearningSkill(
                                  item,
                                  {
                                    objective:
                                      event.target.value,
                                  }
                                );
                              }
                            }}
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium text-slate-400">
                            Notes
                          </label>

                          <input
                            type="text"
                            defaultValue={item.notes}
                            placeholder="Cours, ressources, prochaines étapes..."
                            onBlur={(event) => {
                              if (
                                event.target.value !==
                                item.notes
                              ) {
                                handleUpdateLearningSkill(
                                  item,
                                  {
                                    notes:
                                      event.target.value,
                                  }
                                );
                              }
                            }}
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {savingSkillId === item.id && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-blue-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Sauvegarde...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                  <h2 className="text-lg font-semibold">
                    Compétences maîtrisées
                  </h2>
                </div>

                <div className="mt-5 space-y-3">
                  {masteredSkills.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Aucune compétence correspondante
                      détectée.
                    </p>
                  ) : (
                    masteredSkills.map((skill) => (
                      <div
                        key={skill.skill}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {skill.skill}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {skill.job_count} offre
                            {skill.job_count !== 1
                              ? "s"
                              : ""}
                            {" • "}
                            {skill.frequency}%
                          </p>
                        </div>

                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-amber-400" />

                  <h2 className="text-lg font-semibold">
                    Compétences à développer
                  </h2>
                </div>

                <div className="mt-5 space-y-3">
                  {missingSkills.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Aucune compétence manquante détectée.
                    </p>
                  ) : (
                    missingSkills.map((skill) => (
                      <div
                        key={skill.skill}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {skill.skill}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {skill.job_count} offre
                              {skill.job_count !== 1
                                ? "s"
                                : ""}
                              {" • "}
                              {skill.frequency}%
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityClasses(
                              skill
                            )}`}
                          >
                            {getPriorityLabel(skill)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
