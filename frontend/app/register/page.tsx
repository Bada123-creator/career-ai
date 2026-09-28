"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2 } from "lucide-react";

import { login, register } from "@/lib/api/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await register(
        username,
        email,
        password
      );

      const tokens = await login(
        username,
        password
      );

      localStorage.setItem(
        "access",
        tokens.access
      );

      localStorage.setItem(
        "refresh",
        tokens.refresh
      );

      router.push("/dashboard");
    } catch (err) {
      console.error(err);

      setError(
        "Impossible de créer le compte. Vérifie les informations saisies."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <BrainCircuit className="h-6 w-6" />
          </div>

          <span className="text-xl font-bold">
            Career
            <span className="text-blue-500">
              AI
            </span>
          </span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold">
            Créer un compte
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Commence à analyser tes candidatures avec CareerAI.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-8">
            <label className="text-sm font-medium text-slate-300">
              Nom d&apos;utilisateur
            </label>

            <input
              required
              minLength={3}
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="ex. badadiop"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-300">
              Email
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-300">
              Mot de passe
            </label>

            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="8 caractères minimum"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}

            {loading
              ? "Création..."
              : "Créer mon compte"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
