"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const data = await login(username, password);

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Nom d'utilisateur ou mot de passe incorrect.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border p-8 shadow">
        <h1 className="mb-6 text-3xl font-bold">Connexion</h1>

        <input
          className="mb-4 w-full rounded border bg-background p-3"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="mb-6 w-full rounded border bg-background p-3"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full rounded bg-primary p-3 text-primary-foreground" type="submit">
          Se connecter
        </button>
      </form>
    </main>
  );
}
