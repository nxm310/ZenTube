"use client";

import React, { useEffect, useState } from "react";
import { SerendipitySlider } from "@/components/feed/SerendipitySlider";
import { TopicPillarItem } from "@/types";
import { Sliders, Plus, Trash2, Tag, Check, Sparkles, AlertCircle } from "lucide-react";

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicPillarItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cleanTitles, setCleanTitles] = useState(true);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/topics");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (e) {
      console.error("Erreur chargement thématiques:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const keywordsArray = newKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          keywords: keywordsArray,
          weight: 1.0,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewKeywords("");
        fetchTopics();
      }
    } catch (err) {
      console.error("Erreur création thématique:", err);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      await fetch(`/api/topics?id=${id}`, { method: "DELETE" });
      setTopics((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error("Erreur suppression:", e);
    }
  };

  const toggleCleanTitles = async () => {
    const nextVal = !cleanTitles;
    setCleanTitles(nextVal);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanTitles: nextVal }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="pb-3 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-emerald-400" />
          <span>Gestion des Piliers & Personnalisation</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Définissez vos thématiques de prédilection, le dosage de découverte et les règles de nettoyage visuel.
        </p>
      </div>

      {/* 1. Curseur de Sérendipité */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          1. Équilibre du flux
        </h2>
        <SerendipitySlider />
      </section>

      {/* 2. Options Anti-Clickbait */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          2. Confort visuel & Titres
        </h2>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">Filtre Anti-Clickbait</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Normalise automatiquement les titres en MAJUSCULES et supprime les ponctuations tapageuses (!!!, ???).
            </p>
          </div>
          <button
            onClick={toggleCleanTitles}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              cleanTitles ? "bg-emerald-600 justify-end" : "bg-zinc-800 justify-start"
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </section>

      {/* 3. Vos Piliers Thématiques */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          3. Piliers Thématiques (Centres d'intérêt)
        </h2>

        {/* Formulaire d'ajout */}
        <form onSubmit={handleAddTopic} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Nom du Pilier</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Architecture Logicielle, Histoire Romaine"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mots-clés (séparés par virgules)</label>
              <input
                type="text"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                placeholder="Ex: system design, kubernetes, microservices"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter ce pilier</span>
            </button>
          </div>
        </form>

        {/* Liste des piliers */}
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/70 rounded-xl hover:border-zinc-700/80 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-zinc-200">{topic.title}</h4>
                  {topic.pausedUntil && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 font-mono">
                      En pause
                    </span>
                  )}
                </div>
                {topic.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {topic.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-zinc-800/70 text-zinc-400"
                      >
                        <Tag className="w-2.5 h-2.5 text-zinc-500" />
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeleteTopic(topic.id)}
                className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Supprimer ce pilier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
