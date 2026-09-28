"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

import {
  getResume,
  getResumes,
  Resume,
  uploadResume,
} from "@/lib/api/resumes";
import {
  createJob,
  getJob,
  Job,
} from "@/lib/api/jobs";
import { analyzeApplication } from "@/lib/api/analysis";
import AppNavbar from "@/components/navigation/AppNavbar";

type NewAnalysisClientProps = {
  resumeParam: string | null;
  jobParam: string | null;
};

export default function NewAnalysisClient({
  resumeParam,
  jobParam,
}: NewAnalysisClientProps) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [selectedResume, setSelectedResume] =
    useState<Resume | null>(null);
  const [resumeLoading, setResumeLoading] =
    useState(Boolean(resumeParam));
  const [availableResumes, setAvailableResumes] =
    useState<Resume[]>([]);
  const [showResumePicker, setShowResumePicker] =
    useState(false);
  const [resumesLoading, setResumesLoading] =
    useState(false);
  const [selectedJob, setSelectedJob] =
    useState<Job | null>(null);
  const [jobLoading, setJobLoading] =
    useState(Boolean(jobParam));
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!resumeParam) {
      return;
    }

    const resumeId = Number(resumeParam);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return;
    }

    let cancelled = false;

    getResume(resumeId)
      .then((resume) => {
        if (!cancelled) {
          setSelectedResume(resume);
          setFile(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Le CV sélectionné est introuvable. Choisis un autre CV."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResumeLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resumeParam]);

  useEffect(() => {
    if (!jobParam) {
      return;
    }

    const jobId = Number(jobParam);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return;
    }

    let cancelled = false;

    getJob(jobId)
      .then((job) => {
        if (!cancelled) {
          setSelectedJob(job);
          setCompany(job.company);
          setJobTitle(job.title);
          setLocation(job.location);
          setDescription(job.description);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "L'offre sélectionnée est introuvable."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setJobLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jobParam]);

  async function openResumePicker() {
    setShowResumePicker(true);
    setResumesLoading(true);
    setError("");

    try {
      const resumes = await getResumes();
      setAvailableResumes(resumes);
    } catch {
      setError(
        "Impossible de charger tes CV enregistrés."
      );
    } finally {
      setResumesLoading(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!file && !selectedResume) {
      setError(
        "Sélectionne un CV existant ou importe un PDF."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      let resume: Resume;

      if (selectedResume) {
        setStep("Utilisation du CV sélectionné...");
        resume = selectedResume;
      } else {
        if (!file) {
          throw new Error("Aucun CV sélectionné.");
        }

        setStep("Import et lecture du CV...");

        resume = await uploadResume(
          file.name.replace(/\.pdf$/i, ""),
          file
        );
      }

      setStep("Préparation de l'offre...");

      let job: Job;

      if (selectedJob) {
        job = selectedJob;
      } else {
        job = await createJob({
          company,
          title: jobTitle,
          location,
          description,
        });
      }

      setStep("CareerAI analyse ta candidature...");

      const analysis = await analyzeApplication(
        resume.id,
        job.id
      );

      setStep(
        "Analyse terminée. Ouverture des résultats..."
      );

      router.push(`/analysis/${analysis.id}`);
    } catch (err: unknown) {
      console.error("CAREERAI ERROR:", err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setError(
            "Ta session a expiré. Reconnecte-toi puis relance l'analyse."
          );
        } else if (status === 400) {
          setError(
            "Certaines informations sont invalides. Vérifie ton CV et les informations de l'offre."
          );
        } else if (status && status >= 500) {
          setError(
            "Le serveur CareerAI rencontre temporairement un problème. Réessaie dans quelques instants."
          );
        } else {
          setError(
            "L'analyse n'a pas pu être terminée. Vérifie les informations puis réessaie."
          );
        }
      } else {
        setError(
          "Une erreur inattendue est survenue pendant l'analyse."
        );
      }

      setStep("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AppNavbar />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />
            Analyse intelligente
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Analyse ta candidature
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-400">
            Compare ton CV à une offre d&apos;emploi et
            découvre tes points forts, les compétences à
            mettre davantage en avant et les recommandations
            de CareerAI.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-8"
        >
          <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  1. Ton CV
                </h2>

                <p className="text-sm text-zinc-400">
                  Utilise un CV existant ou importe un PDF
                </p>
              </div>
            </div>

            {resumeLoading ? (
              <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-6 py-10 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement du CV...
              </div>
            ) : selectedResume ? (
              <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-blue-300">
                      CV sélectionné
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {selectedResume.title}
                    </p>

                    <p className="mt-2 text-sm text-zinc-400">
                      {selectedResume.extracted_text.length.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      caractères extraits
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResume(null);
                      setFile(null);

                      if (selectedJob) {
                        router.replace(
                          `/analysis/new?job=${selectedJob.id}`
                        );
                      } else {
                        router.replace("/analysis/new");
                      }
                    }}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Changer de CV
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      void openResumePicker()
                    }
                    className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 px-6 py-6 text-center transition hover:bg-blue-500/15"
                  >
                    <FileText className="h-7 w-7 text-blue-400" />

                    <span className="mt-3 font-medium">
                      Choisir parmi mes CV
                    </span>

                    <span className="mt-1 text-sm text-zinc-400">
                      Réutiliser un CV déjà enregistré
                    </span>
                  </button>

                  <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-6 text-center transition hover:border-blue-500/50 hover:bg-blue-500/5">
                    <Upload className="h-7 w-7 text-blue-400" />

                    <span className="mt-3 max-w-full truncate font-medium">
                      {file
                        ? file.name
                        : "Importer un nouveau PDF"}
                    </span>

                    <span className="mt-1 text-sm text-zinc-500">
                      {file
                        ? "Nouveau CV sélectionné"
                        : "Ajouter un nouveau CV"}
                    </span>

                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        setFile(
                          event.target.files?.[0] ?? null
                        );
                        setShowResumePicker(false);
                      }}
                    />
                  </label>
                </div>

                {showResumePicker && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          Mes CV enregistrés
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Sélectionne le CV à comparer
                          avec cette offre.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowResumePicker(false)
                        }
                        className="text-sm text-zinc-400 transition hover:text-white"
                      >
                        Fermer
                      </button>
                    </div>

                    {resumesLoading ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement de tes CV...
                      </div>
                    ) : availableResumes.length === 0 ? (
                      <p className="py-8 text-center text-sm text-zinc-500">
                        Aucun CV enregistré.
                      </p>
                    ) : (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {availableResumes.map(
                          (resume) => (
                            <button
                              key={resume.id}
                              type="button"
                              onClick={() => {
                                setSelectedResume(
                                  resume
                                );
                                setFile(null);
                                setShowResumePicker(
                                  false
                                );

                                const params =
                                  new URLSearchParams();

                                params.set(
                                  "resume",
                                  String(resume.id)
                                );

                                if (selectedJob) {
                                  params.set(
                                    "job",
                                    String(
                                      selectedJob.id
                                    )
                                  );
                                }

                                router.replace(
                                  `/analysis/new?${params.toString()}`
                                );
                              }}
                              className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-blue-500/40 hover:bg-blue-500/10"
                            >
                              <p className="font-medium">
                                {resume.title}
                              </p>

                              <p className="mt-2 text-xs text-zinc-500">
                                {resume.extracted_text.length.toLocaleString(
                                  "fr-FR"
                                )}{" "}
                                caractères extraits
                              </p>

                              {resume.skills && (
                                <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-400">
                                  {resume.skills}
                                </p>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                <BriefcaseBusiness className="h-5 w-5 text-violet-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  2. L&apos;offre
                </h2>

                <p className="text-sm text-zinc-400">
                  Utilise une offre existante ou renseigne
                  les informations du poste
                </p>
              </div>
            </div>

            {jobLoading ? (
              <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-6 py-10 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement de l&apos;offre...
              </div>
            ) : selectedJob ? (
              <div className="mt-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-violet-300">
                      Offre sélectionnée
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {selectedJob.title}
                    </p>

                    <p className="mt-2 text-sm text-zinc-300">
                      {selectedJob.company}
                      {selectedJob.location
                        ? ` · ${selectedJob.location}`
                        : ""}
                    </p>

                    <p className="mt-3 text-sm text-zinc-400">
                      {selectedJob.description.length.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      caractères dans la description
                    </p>

                    <p className="mt-4 line-clamp-4 max-w-3xl text-sm leading-6 text-zinc-400">
                      {selectedJob.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob(null);
                      setCompany("");
                      setJobTitle("");
                      setLocation("");
                      setDescription("");

                      const params = new URLSearchParams();

                      if (selectedResume) {
                        params.set(
                          "resume",
                          String(selectedResume.id)
                        );
                      }

                      const query = params.toString();

                      router.replace(
                        query
                          ? `/analysis/new?${query}`
                          : "/analysis/new"
                      );
                    }}
                    className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Changer d&apos;offre
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-zinc-300">
                      Poste
                    </label>

                    <input
                      required
                      value={jobTitle}
                      onChange={(event) =>
                        setJobTitle(event.target.value)
                      }
                      placeholder="Data Analyst"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-300">
                      Entreprise
                    </label>

                    <input
                      required
                      value={company}
                      onChange={(event) =>
                        setCompany(event.target.value)
                      }
                      placeholder="Nom de l'entreprise"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm text-zinc-300">
                    Localisation
                  </label>

                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="Paris, France"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-blue-500"
                  />
                </div>

                <div className="mt-5">
                  <label className="text-sm text-zinc-300">
                    Description de l&apos;offre
                  </label>

                  <textarea
                    required
                    rows={10}
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Colle ici la description complète de l'offre..."
                    className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-6 outline-none transition focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </section>

          {error && (
            <div className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {step || "Analyse en cours..."}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Analyser ma candidature
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
