"use client";

import React, { useState } from "react";
import { Compass, Users, Sparkles } from "lucide-react";

interface SerendipitySliderProps {
  initialValue?: number;
  onSave?: (val: number) => void;
}

export function SerendipitySlider({ initialValue = 30, onSave }: SerendipitySliderProps) {
  const [value, setValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (newVal: number) => {
    setValue(newVal);
    if (onSave) onSave(newVal);

    setIsUpdating(true);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serendipityRatio: newVal }),
      });
    } catch (e) {
      console.error("Erreur sauvegarde préférences:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Dosage Sérendipité & Nouveauté</h2>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          {value}% Découverte
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-4">
        Ajustez le ratio entre vos créateurs familiers et l'exploration de nouveaux horizons selon vos piliers thématiques.
      </p>

      {/* Slider input */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => handleChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />

        {/* Labels bas de slider */}
        <div className="flex justify-between items-center text-[11px] text-zinc-400 font-medium">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Users className="w-3.5 h-3.5" />
            <span>0% (100% Abonnements)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% (Pure Exploration)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
