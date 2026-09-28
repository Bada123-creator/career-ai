"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  GeneratedResume,
  generateResume,
  getAnalysis,
  getGeneratedResume,
  getGeneratedResumeHistory,
} from "@/lib/api/analysis";

import {
  createApplication,
  getApplications,
  updateApplication,
} from "@/lib/api/applications";

export default function ResumeBuilderPage() {
  const params = useParams();
  const analysisId = Number(params.id);

  const [resume, setResume] =
    useState<GeneratedResume | null>(null);

  const [resumeVersions, setResumeVersions] =
    useState<GeneratedResume[]>([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [linkingApplication, setLinkingApplication] =
    useState(false);
  const [applicationLinked, setApplicationLinked] =
    useState(false);
  const [applicationId, setApplicationId] =
    useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] =
    useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResume() {
      try {
        setLoading(true);
        setError("");

        const [data, history] = await Promise.all([
          getGeneratedResume(analysisId),
          getGeneratedResumeHistory(analysisId),
        ]);

        setResume(data);
        setResumeVersions(history);
      } catch {
        setError(
          "Aucun CV optimisé n'est encore disponible."
        );
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(analysisId)) {
      loadResume();
    }
  }, [analysisId]);

  function handleDownloadPDF() {
    window.print();
  }

  async function handleUseForApplication() {
    if (!resume) {
      return;
    }

    try {
      setLinkingApplication(true);
      setApplicationMessage("");
      setError("");

      const analysis = await getAnalysis(analysisId);
      const applications = await getApplications();

      const linkedApplication = applications.find(
        (application) => application.analysis === analysisId
      );

      if (linkedApplication) {
        const updatedApplication = await updateApplication(
          linkedApplication.id,
          {
            analysis: analysisId,
            generated_resume: resume.id,
          }
        );

        setApplicationId(updatedApplication.id);
        setApplicationLinked(true);
        setApplicationMessage(
          `Version ${resume.version} du CV associée à votre candidature.`
        );
        return;
      }

      const existingApplication = applications.find(
        (application) => application.job === analysis.job.id
      );

      if (existingApplication) {
        const updatedApplication = await updateApplication(
          existingApplication.id,
          {
            analysis: analysisId,
            generated_resume: resume.id,
          }
        );

        setApplicationId(updatedApplication.id);
        setApplicationLinked(true);
        setApplicationMessage(
          `Version ${resume.version} du CV ajoutée à votre candidature.`
        );
        return;
      }

      const createdApplication = await createApplication({
        job: analysis.job.id,
        analysis: analysisId,
        generated_resume: resume.id,
        status: "draft",
      });

      setApplicationId(createdApplication.id);
      setApplicationLinked(true);
      setApplicationMessage(
        `Candidature créée avec la version ${resume.version} du CV.`
      );
    } catch (err) {
      console.error(
        "CAREERAI APPLICATION LINK ERROR:",
        err
      );

      setApplicationMessage(
        "Impossible d'ajouter ce CV à la candidature."
      );
    } finally {
      setLinkingApplication(false);
    }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError("");

      const data = await generateResume(analysisId);
      setResume(data);

      const history =
        await getGeneratedResumeHistory(analysisId);

      setResumeVersions(history);
    } catch (err) {
      console.error(
        "CAREERAI GENERATED RESUME ERROR:",
        err
      );

      setError(
        "Impossible de générer le CV optimisé."
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  const content = resume?.content;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <Link
              href={`/analysis/${analysisId}`}
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;analyse
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-3">
                <FileText className="h-6 w-6 text-cyan-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  CV Builder
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  CV optimisé pour cette candidature
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {resume && (
              <button
                type="button"
                onClick={handleUseForApplication}
                disabled={linkingApplication}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {linkingApplication ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BriefcaseBusiness className="h-4 w-4" />
                )}

                {linkingApplication
                  ? "Association en cours..."
                  : applicationLinked
                    ? `Utiliser la version ${resume.version}`
                    : "Utiliser pour ma candidature"}
              </button>
            )}

            {applicationLinked && applicationId && (
              <Link
                href={`/applications/${applicationId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                Voir ma candidature
              </Link>
            )}

            {resume && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Télécharger en PDF
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              {resume
                ? "Régénérer le CV"
                : "Générer le CV"}
            </button>
          </div>
        </div>

        {resume && resumeVersions.length > 0 && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 print:hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Historique du CV
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Consulte les différentes versions générées pour cette candidature.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {resumeVersions.map((version) => {
                  const isSelected =
                    version.id === resume.id;

                  const isLatest =
                    version.version ===
                    resumeVersions[0]?.version;

                  return (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => setResume(version)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      Version {version.version}
                      {isLatest ? " · actuelle" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {applicationMessage && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm print:hidden ${
              applicationLinked
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
                : "border-red-500/20 bg-red-500/5 text-red-200"
            }`}
          >
            {applicationMessage}
          </div>
        )}

        {error && !resume && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 print:hidden">
            <p className="text-amber-200">
              {error}
            </p>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="mt-4 rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 disabled:opacity-60"
            >
              Générer maintenant
            </button>
          </div>
        )}

        {error && resume && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200 print:hidden">
            {error}
          </div>
        )}

        {resume && content && (
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] print:block">
            <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-6 print:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Version générée
              </p>

              <h2 className="mt-3 font-semibold">
                {resume.title}
              </h2>

              <div className="mt-6 space-y-4 text-sm text-slate-400">
                <div>
                  <p className="text-slate-500">
                    Compétences
                  </p>
                  <p className="mt-1 text-white">
                    {content.skills.length}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Expériences
                  </p>
                  <p className="mt-1 text-white">
                    {content.experiences.length}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Formations
                  </p>
                  <p className="mt-1 text-white">
                    {content.education.length}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Projets
                  </p>
                  <p className="mt-1 text-white">
                    {content.projects.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">
                CareerAI reformule et organise les
                informations présentes dans ton CV
                source sans ajouter volontairement
                de compétences absentes.
              </div>
            </aside>

            <section className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900 p-3 sm:p-6 print:overflow-visible print:border-0 print:bg-white print:p-0">
              <article
                id="careerai-resume"
                className="mx-auto min-h-[1123px] w-full max-w-[794px] bg-white px-8 py-10 text-slate-900 shadow-2xl sm:px-12 print:min-h-0 print:max-w-none print:shadow-none"
              >
                <header className="border-b-2 border-slate-900 pb-5">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {content.header.name}
                  </h1>

                  {content.header.headline && (
                    <p className="mt-2 text-base font-semibold text-slate-600">
                      {content.header.headline}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    {content.header.email && (
                      <span>{content.header.email}</span>
                    )}

                    {content.header.phone && (
                      <span>{content.header.phone}</span>
                    )}

                    {content.header.location && (
                      <span>{content.header.location}</span>
                    )}

                    {content.header.linkedin && (
                      <span>{content.header.linkedin}</span>
                    )}

                    {content.header.github && (
                      <span>{content.header.github}</span>
                    )}
                  </div>
                </header>

                {content.professional_summary && (
                  <ResumeSection title="Profil">
                    <p className="text-sm leading-6 text-slate-700">
                      {content.professional_summary}
                    </p>
                  </ResumeSection>
                )}

                {content.skills.length > 0 && (
                  <ResumeSection title="Compétences">
                    <div className="flex flex-wrap gap-2">
                      {content.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </ResumeSection>
                )}

                {content.experiences.length > 0 && (
                  <ResumeSection title="Expériences professionnelles">
                    <div className="space-y-5">
                      {content.experiences.map(
                        (experience, index) => (
                          <div key={`${experience.company}-${index}`}>
                            <div className="flex flex-col justify-between gap-1 sm:flex-row">
                              <div>
                                <h3 className="text-sm font-bold">
                                  {experience.title}
                                </h3>

                                <p className="text-sm text-slate-600">
                                  {experience.company}
                                  {experience.location
                                    ? ` · ${experience.location}`
                                    : ""}
                                </p>
                              </div>

                              <p className="text-xs font-medium text-slate-500">
                                {experience.dates}
                              </p>
                            </div>

                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-slate-700">
                              {experience.bullets.map(
                                (bullet, bulletIndex) => (
                                  <li key={bulletIndex}>
                                    {bullet}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </ResumeSection>
                )}

                {content.education.length > 0 && (
                  <ResumeSection title="Formation">
                    <div className="space-y-4">
                      {content.education.map(
                        (education, index) => (
                          <div key={`${education.institution}-${index}`}>
                            <div className="flex flex-col justify-between gap-1 sm:flex-row">
                              <div>
                                <h3 className="text-sm font-bold">
                                  {education.degree}
                                </h3>

                                <p className="text-sm text-slate-600">
                                  {education.institution}
                                  {education.location
                                    ? ` · ${education.location}`
                                    : ""}
                                </p>
                              </div>

                              <p className="text-xs font-medium text-slate-500">
                                {education.dates}
                              </p>
                            </div>

                            {education.details.length > 0 && (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                {education.details.map(
                                  (detail, detailIndex) => (
                                    <li key={detailIndex}>
                                      {detail}
                                    </li>
                                  )
                                )}
                              </ul>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </ResumeSection>
                )}

                {content.projects.length > 0 && (
                  <ResumeSection title="Projets">
                    <div className="space-y-5">
                      {content.projects.map(
                        (project, index) => (
                          <div key={`${project.name}-${index}`}>
                            <h3 className="text-sm font-bold">
                              {project.name}
                            </h3>

                            {project.technologies.length > 0 && (
                              <p className="mt-1 text-xs font-medium text-slate-500">
                                {project.technologies.join(" · ")}
                              </p>
                            )}

                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-slate-700">
                              {project.description.map(
                                (item, itemIndex) => (
                                  <li key={itemIndex}>
                                    {item}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </ResumeSection>
                )}

                {content.languages.length > 0 && (
                  <ResumeSection title="Langues">
                    <p className="text-sm text-slate-700">
                      {content.languages.join(" · ")}
                    </p>
                  </ResumeSection>
                )}

                {content.additional_sections.map(
                  (section, index) => (
                    <ResumeSection
                      key={`${section.title}-${index}`}
                      title={section.title}
                    >
                      <p className="text-sm text-slate-700">
                        {section.items.join(" · ")}
                      </p>
                    </ResumeSection>
                  )
                )}
              </article>
            </section>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #careerai-resume,
          #careerai-resume * {
            visibility: visible;
          }

          #careerai-resume {
            position: absolute;
            top: 0;
            left: 0;
            width: 210mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-sizing: border-box;
            background: white !important;
            font-size: 10px !important;
          }

          #careerai-resume header {
            padding-bottom: 3mm !important;
          }

          #careerai-resume section {
            margin-top: 3mm !important;
          }

          #careerai-resume section h2 {
            margin-bottom: 1.5mm !important;
            padding-bottom: 1mm !important;
          }

          #careerai-resume p,
          #careerai-resume li {
            line-height: 1.35 !important;
          }

          #careerai-resume ul {
            margin-top: 1.5mm !important;
          }

          #careerai-resume section,
          #careerai-resume header {
            break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wider">
        {title}
      </h2>

      {children}
    </section>
  );
}
