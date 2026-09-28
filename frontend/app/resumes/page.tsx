"use client";

import { useEffect, useMemo, useState } from "react";

import axios from "axios";
import Link from "next/link";
import {
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"; 

import AppNavbar from "@/components/navigation/AppNavbar";
import {
  deleteResume,
  getResumes,
  Resume,
  uploadResume,
} from "@/lib/api/resumes";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    getResumes()
      .then((data) => {
        if (!cancelled) {
          setResumes(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Impossible de charger vos CV.");
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

  const filteredResumes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return resumes;
    }

    return resumes.filter((resume) => {
      return [
        resume.title,
        resume.skills,
        resume.education,
        resume.experience,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [resumes, search]);

  async function handleUpload(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim() || !file) {
      setError("Ajoutez un titre et un fichier PDF.");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const resume = await uploadResume(
        title.trim(),
        file
      );

      setResumes((current) => [
        resume,
        ...current,
      ]);

      setTitle("");
      setFile(null);
      setShowUpload(false);
    } catch {
      setError(
        "Impossible d'ajouter le CV. Vérifiez le fichier PDF."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(resume: Resume) {
    const confirmed = window.confirm(
      `Supprimer le CV « ${resume.title} » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(resume.id);
      setError(null);

      await deleteResume(resume.id);

      setResumes((current) =>
        current.filter(
          (item) => item.id !== resume.id
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

      setError("Impossible de supprimer ce CV.");
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
            <p className="mb-2 text-sm font-medium text-blue-400">
              CareerAI · CV Manager
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mes CV
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Centralisez vos CV, consultez les informations
              extraites et lancez une nouvelle analyse.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowUpload((current) => !current)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-500"
          >
            {showUpload ? (
              <Plus className="h-5 w-5 rotate-45" />
            ) : (
              <Upload className="h-5 w-5" />
            )}

            {showUpload
              ? "Fermer"
              : "Ajouter un CV"}
          </button>
        </div>

        {showUpload && (
          <form
            onSubmit={handleUpload}
            className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-lg font-semibold">
              Ajouter un nouveau CV
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Nom du CV
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Ex. CV Data Analyst"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Fichier PDF
                </label>

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setFile(
                      event.target.files?.[0] ?? null
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-500 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}

              {uploading
                ? "Analyse du PDF..."
                : "Importer le CV"}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un CV ou une compétence..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
            />
          </div>

          <p className="text-sm text-slate-400">
            {filteredResumes.length} CV
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-600" />

            <h2 className="mt-4 font-semibold">
              Aucun CV trouvé
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Ajoutez un CV PDF pour commencer.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {filteredResumes.map((resume) => (
              <article
                key={resume.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">
                        {resume.title}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Ajouté le{" "}
                        {formatDate(resume.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDelete(resume)
                    }
                    disabled={deletingId === resume.id}
                    title="Supprimer ce CV"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  >
                    {deletingId === resume.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Compétences détectées
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                    {resume.skills ||
                      "Aucune compétence structurée détectée."}
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-500">
                    Texte extrait
                  </p>

                  <p className="mt-1 font-medium">
                    {resume.extracted_text.length.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    caractères
                  </p>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                    {resume.extracted_text ||
                      "Aucun texte extrait."}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/analysis/new?resume=${resume.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium transition hover:bg-blue-500"
                  >
                    <Sparkles className="h-4 w-4" />
                    Analyser avec ce CV
                  </Link>

                  {resume.file && (
                    <a
                      href={resume.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                    >
                      <FileText className="h-4 w-4" />
                      Ouvrir le PDF
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
