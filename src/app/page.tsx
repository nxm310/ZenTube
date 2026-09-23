import Link from "next/link";
import { Sparkles, Shield, Compass, CheckCircle2, ArrowRight, EyeOff, Sliders } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center gap-12">
      {/* Badge Top */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Reprenez le contrôle de votre temps et de votre attention</span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-3xl space-y-5">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          L'expérience YouTube{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            apaisée, intentionnelle
          </span>{" "}
          et sur-mesure.
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Fini le doomscrolling et les pièges à clics. Définissez vos piliers d'apprentissage, éliminez les vidéos
          déjà vues et effectuez des recherches isolées sans polluer votre historique Google.
        </p>
      </div>

      {/* Boutons CTA */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm rounded-2xl transition-all shadow-xl shadow-emerald-950/60"
        >
          <span>Accéder à mon Flux Zen</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/one-shot"
          className="flex items-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-sm rounded-2xl transition-all"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Mode One-Shot (Sandbox)</span>
        </Link>
      </div>

      {/* 3 Piliers Fonctionnels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left pt-8">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-zinc-100 text-base">Piliers & Sérendipité</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Dosez de 0% à 100% le curseur entre créateurs familiers et découvertes émergentes alignées sur vos centres d'intérêt.
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center text-teal-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-zinc-100 text-base">Anti-Redondance 15 Jours</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Les vidéos vues ou saturées sont masquées automatiquement pour garantir un renouvellement constant de vos idées.
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-zinc-100 text-base">Recherche One-Shot Isolée</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Consultez une vidéo ponctuelle ou un dépannage express via <code>youtube-nocookie.com</code> sans corrompre votre profil.
          </p>
        </div>
      </div>
    </div>
  );
}
