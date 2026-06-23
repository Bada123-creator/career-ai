export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">

        <span className="rounded-full border border-blue-500 px-4 py-1 text-sm text-blue-400">
          🚀 AI Career Platform
        </span>

        <h1 className="mt-8 text-6xl font-extrabold">
          ApplyPilot AI
        </h1>

        <p className="mt-6 max-w-3xl text-xl text-gray-400">
          L'assistant intelligent qui analyse votre CV, compare les offres,
          génère des lettres de motivation et vous aide à réussir vos entretiens.
        </p>

        <div className="mt-12 flex gap-5">

          <button className="rounded-xl bg-blue-600 px-8 py-4 font-semibold transition hover:bg-blue-700">
            Commencer
          </button>

          <button className="rounded-xl border border-gray-600 px-8 py-4 transition hover:bg-gray-800">
            Découvrir
          </button>

        </div>

      </div>
    </main>
  );
}