"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Globe,
  Link,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";

import AppNavbar from "@/components/navigation/AppNavbar";
import {
  getProfile,
  updateProfile,
  UserProfile,
} from "@/lib/api/profile";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setError("");
        const data = await getProfile();
        setProfile(data);
      } catch {
        setError("Impossible de charger ton profil.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  function updateField(
    field: keyof UserProfile,
    value: string
  ) {
    setProfile((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );

    setSuccess("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateProfile({
        phone: profile.phone,
        city: profile.city,
        target_role: profile.target_role,
        bio: profile.bio,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
      });

      setProfile(updated);
      setSuccess("Ton profil a bien été mis à jour.");
    } catch {
      setError(
        "Impossible d'enregistrer les modifications. Vérifie les informations saisies."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <AppNavbar />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center text-slate-400">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4">Chargement de ton profil...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <AppNavbar />

        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error || "Profil introuvable."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNavbar />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <User className="h-4 w-4" />
            Profil candidat
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight">
            Mon profil
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Centralise tes informations professionnelles pour
            personnaliser ton expérience CareerAI.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6"
        >
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <h2 className="text-xl font-semibold">
              Informations du compte
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ces informations proviennent de ton compte CareerAI.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <ReadOnlyField
                label="Nom d'utilisateur"
                value={profile.username}
                icon={<User className="h-4 w-4" />}
              />

              <ReadOnlyField
                label="Adresse e-mail"
                value={profile.email}
                icon={<Mail className="h-4 w-4" />}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <BriefcaseBusiness className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Objectif professionnel
                </h2>

                <p className="text-sm text-slate-500">
                  Indique le type de poste que tu recherches.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-300">
                Poste recherché
              </label>

              <input
                value={profile.target_role}
                onChange={(event) =>
                  updateField(
                    "target_role",
                    event.target.value
                  )
                }
                placeholder="Ex. Data Analyst"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-300">
                Présentation
              </label>

              <textarea
                rows={5}
                value={profile.bio}
                onChange={(event) =>
                  updateField("bio", event.target.value)
                }
                placeholder="Présente brièvement ton profil, tes compétences et ton objectif professionnel..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 leading-7 outline-none transition focus:border-blue-500"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <h2 className="text-xl font-semibold">
              Coordonnées
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <EditableField
                label="Téléphone"
                value={profile.phone}
                placeholder="+33..."
                icon={<Phone className="h-4 w-4" />}
                onChange={(value) =>
                  updateField("phone", value)
                }
              />

              <EditableField
                label="Ville"
                value={profile.city}
                placeholder="Paris"
                icon={<MapPin className="h-4 w-4" />}
                onChange={(value) =>
                  updateField("city", value)
                }
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <h2 className="text-xl font-semibold">
              Présence professionnelle
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ajoute tes profils professionnels et ton portfolio.
            </p>

            <div className="mt-6 space-y-5">
              <EditableField
                label="LinkedIn"
                value={profile.linkedin_url}
                placeholder="https://linkedin.com/in/..."
                icon={<Link className="h-4 w-4" />}
                onChange={(value) =>
                  updateField("linkedin_url", value)
                }
              />

              <EditableField
                label="GitHub"
                value={profile.github_url}
                placeholder="https://github.com/..."
                icon={<Code2 className="h-4 w-4" />}
                onChange={(value) =>
                  updateField("github_url", value)
                }
              />

              <EditableField
                label="Portfolio"
                value={profile.portfolio_url}
                placeholder="https://..."
                icon={<Globe className="h-4 w-4" />}
                onChange={(value) =>
                  updateField("portfolio_url", value)
                }
              />
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-400">
        {icon}
        <span>{value || "Non renseigné"}</span>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  placeholder,
  icon,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 transition focus-within:border-blue-500">
        <span className="text-slate-500">{icon}</span>

        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="w-full bg-transparent py-3 outline-none placeholder:text-slate-600"
        />
      </div>
    </div>
  );
}
