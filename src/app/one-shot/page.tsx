import { OneShotSandbox } from "@/components/one-shot/OneShotSandbox";
import { Shield } from "lucide-react";

export default function OneShotPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="pb-3 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span>Mode One-Shot (Recherche Isolée)</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Explorez des sujets spécifiques sans modifier votre historique de visionnage ni influencer l'algorithme YouTube officiel.
        </p>
      </div>

      <OneShotSandbox />
    </div>
  );
}
