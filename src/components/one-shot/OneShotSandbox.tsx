"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  PlusCircle,
  Check,
  EyeOff,
  X,
  ShieldCheck,
  Loader2,
  Calendar,
  ArrowUpDown,
  Flame,
  Clock,
  Sparkles,
  ArrowUp,
  ArrowLeft,
} from "lucide-react";
import { OneShotVideo } from "@/types";
import { parseRelativeDateToTimestamp } from "@/lib/utils/date";

export function OneShotSandbox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OneShotVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<OneShotVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);

  // Référence vers le lecteur pour le scroll automatique
  const playerRef = useRef<HTMLDivElement>(null);

  // Tri dans le One-Shot
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "relevance" | "views">("date_desc");

  // 1. Restaurer la recherche précédente depuis le cache de session
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("zentube_oneshot_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.query) setQuery(parsed.query);
        if (parsed.results && parsed.results.length > 0) setResults(parsed.results);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
      }
    } catch (e) {
      console.warn("Erreur lecture cache session:", e);
    }
  }, []);

  // 2. Sauvegarder la recherche dans la session dès qu'elle est chargée
  useEffect(() => {
    if (results.length > 0) {
      try {
        sessionStorage.setItem(
          "zentube_oneshot_cache",
          JSON.stringify({ query, results, sortBy })
        );
      } catch (e) {
        console.warn("Erreur écriture cache session:", e);
      }
    }
  }, [results, query, sortBy]);

  const scrollToPlayer = () => {
    if (playerRef.current) {
      const topOffset = playerRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
    }
  };

  // 3. Défilement automatique vers le lecteur dès qu'une vidéo est sélectionnée
  useEffect(() => {
    if (activeVideo) {
      // Défilement immédiat et réaffirmé pour être sûr d'arriver au lecteur
      requestAnimationFrame(() => {
        scrollToPlayer();
      });
      const timer = setTimeout(() => {
        scrollToPlayer();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [activeVideo]);

  // 4. Gestion du bouton "Retour" du navigateur et de la touche Échap : fermer le lecteur SANS quitter la recherche
  useEffect(() => {
    const handlePopState = () => {
      // Si une vidéo est ouverte et qu'on clique sur Précédent/Retour du navigateur
      if (activeVideo) {
        setActiveVideo(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeVideo) {
        handleClosePlayer();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeVideo]);

  const executeSearch = async (searchTerm: string, sortParam?: string) => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const activeSort = sortParam || (sortBy === "date_desc" ? "date" : sortBy === "views" ? "views" : "relevance");
      const res = await fetch(
        `/api/one-shot/search?q=${encodeURIComponent(searchTerm)}&sort=${activeSort}`
      );
      const data = await res.json();
      setResults(data.videos || []);
    } catch (err) {
      console.error("Erreur de recherche One-Shot:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    executeSearch(term);
  };

  const handleSelectVideo = (video: OneShotVideo) => {
    setActiveVideo(video);
    setLastPlayedId(video.id);

    // Ajoute un état dans l'historique du navigateur pour que le bouton "Retour" ferme le lecteur au lieu de quitter la recherche
    if (!window.history.state?.playerOpen) {
      window.history.pushState({ playerOpen: true, videoId: video.id }, "");
    } else {
      window.history.replaceState({ playerOpen: true, videoId: video.id }, "");
    }

    // Scroll immédiat vers le lecteur
    requestAnimationFrame(() => {
      scrollToPlayer();
    });
    setTimeout(() => {
      scrollToPlayer();
    }, 80);
  };

  const handleClosePlayer = () => {
    setActiveVideo(null);
    // Si l'état playerOpen existe dans l'historique, revenir en arrière pour nettoyer l'historique du navigateur
    if (window.history.state?.playerOpen) {
      window.history.back();
    }
  };

  const handleSortChange = (newSort: "date_desc" | "date_asc" | "relevance" | "views") => {
    setSortBy(newSort);
    if (query.trim()) {
      const apiSort = newSort === "date_desc" ? "date" : newSort === "views" ? "views" : "relevance";
      executeSearch(query, apiSort);
    }
  };

  const promoteToFeed = async (video: OneShotVideo) => {
    try {
      await fetch("/api/feed/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LIKE",
          youtubeId: video.id,
          title: video.title,
        }),
      });
      setSavedVideos((prev) => new Set(prev).add(video.id));
    } catch (err) {
      console.error("Erreur de promotion:", err);
    }
  };

  // Tri côté client appliqué sur la liste actuelle
  const sortedResults = useMemo(() => {
    const list = [...results];
    if (sortBy === "date_desc") {
      list.sort((a, b) => parseRelativeDateToTimestamp(b.publishedAt) - parseRelativeDateToTimestamp(a.publishedAt));
    } else if (sortBy === "date_asc") {
      list.sort((a, b) => parseRelativeDateToTimestamp(a.publishedAt) - parseRelativeDateToTimestamp(b.publishedAt));
    }
    return list;
  }, [results, sortBy]);

  const quickSearches = [
    "Démonter filtre machine à laver",
    "Réglage dérailleur vélo",
    "Recette pâte feuilletée rapide",
    "Comprendre l'architecture microservices",
    "Bruit suspect alternateur voiture",
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto relative">
      {/* Alerte d'isolation stricte */}
      <div className="flex items-start sm:items-center gap-3.5 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-emerald-300 text-sm backdrop-blur-sm">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5 sm:mt-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-emerald-200">Recherche YouTube 100% Réelle & Isolée : </span>
          Vos requêtes explorent YouTube en direct sans écrire dans votre historique Google ni fausser vos recommandations futures grâce au lecteur{" "}
          <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200 text-xs">
            youtube-nocookie.com
          </code>.
        </div>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher n'importe quelle vidéo sur YouTube..."
            className="w-full pl-12 pr-10 py-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                sessionStorage.removeItem("zentube_oneshot_cache");
              }}
              className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/40 text-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Recherche YouTube</span>
        </button>
      </form>

      {/* Raccourcis de recherche typiques One-Shot */}
      {results.length === 0 && !isLoading && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-zinc-500">Suggestions rapides :</span>
          {quickSearches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleQuickSearch(s)}
              className="text-xs px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Barre de Tri du One-Shot */}
      {results.length > 0 && !isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="font-semibold text-zinc-200">{sortedResults.length} vidéos trouvées</span>
            <span>•</span>
            <span className="text-emerald-400">Résultats conservés</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trier par :</span>
            </span>

            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => handleSortChange("date_desc")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  sortBy === "date_desc"
                    ? "bg-emerald-600 text-white font-medium shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Les vidéos les plus récentes en premier"
              >
                <Clock className="w-3 h-3" />
                <span>Plus récentes</span>
              </button>

              <button
                onClick={() => handleSortChange("date_asc")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  sortBy === "date_asc"
                    ? "bg-emerald-600 text-white font-medium shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Les vidéos les plus anciennes en premier"
              >
                <Calendar className="w-3 h-3" />
                <span>Plus anciennes</span>
              </button>

              <button
                onClick={() => handleSortChange("views")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  sortBy === "views"
                    ? "bg-emerald-600 text-white font-medium shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Trier par nombre de vues"
              >
                <Flame className="w-3 h-3" />
                <span>Plus vues</span>
              </button>

              <button
                onClick={() => handleSortChange("relevance")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                  sortBy === "relevance"
                    ? "bg-emerald-600 text-white font-medium shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Trier par pertinence"
              >
                <Sparkles className="w-3 h-3" />
                <span>Pertinence</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecteur Sandboxé avec référence de défilement automatique */}
      {activeVideo && (
        <div
          ref={playerRef}
          className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/80 animate-in fade-in zoom-in-95 duration-200 scroll-mt-20"
        >
          {/* En-tête du lecteur avec bouton RETOUR explicite */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/95 border-b border-zinc-800 text-xs gap-3">
            <div className="flex items-center gap-2 truncate flex-1 pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="font-semibold text-emerald-300 flex-shrink-0">En cours :</span>
              <span className="font-medium text-zinc-200 truncate">{activeVideo.title}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Bouton Retour clair pour fermer le lecteur et garder la recherche */}
              <button
                onClick={handleClosePlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium transition-colors border border-zinc-700 text-xs shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fermer le lecteur & rester sur la recherche</span>
              </button>

              <button
                onClick={handleClosePlayer}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&autoplay=1`}
              title="Lecteur Isolé One-Shot"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Bouton flottant pour remonter au lecteur si la vidéo est ouverte et qu'on a scrollé */}
      {activeVideo && (
        <button
          onClick={scrollToPlayer}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 animate-in slide-in-from-bottom-4 duration-300"
          title="Remonter au lecteur vidéo"
        >
          <ArrowUp className="w-4 h-4" />
          <span>Revenir au lecteur</span>
        </button>
      )}

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm">Recherche directe sur YouTube en cours...</p>
        </div>
      )}

      {/* Liste des résultats triés (toujours conservée, même après lecture) */}
      {!isLoading && sortedResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResults.map((video) => {
            const isSaved = savedVideos.has(video.id);
            const isPlaying = activeVideo?.id === video.id;

            return (
              <div
                key={video.id}
                className={`flex flex-col bg-zinc-900/60 border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isPlaying
                    ? "border-emerald-500 shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/50"
                    : lastPlayedId === video.id
                    ? "border-emerald-600/40 bg-zinc-900/80 ring-1 ring-emerald-500/30"
                    : "border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div
                  className="relative aspect-video cursor-pointer group bg-zinc-950 overflow-hidden"
                  onClick={() => handleSelectVideo(video)}
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {lastPlayedId === video.id && !isPlaying && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-emerald-500/60 text-emerald-400 text-[10px] font-semibold backdrop-blur-md">
                      Dernière vidéo consultée
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      ▶
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between flex-1 p-4 gap-3">
                  <div>
                    <h3
                      className="font-medium text-zinc-100 text-sm line-clamp-2 cursor-pointer hover:text-emerald-400 transition-colors"
                      onClick={() => handleSelectVideo(video)}
                    >
                      {video.title}
                    </h3>

                    <p className="text-xs font-medium text-zinc-300 mt-2">{video.channelTitle}</p>

                    {/* Date de diffusion claire */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                      <span>{video.publishedAt || "Date récente"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                    <button
                      onClick={() => promoteToFeed(video)}
                      disabled={isSaved}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        isSaved
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                          : "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Ajouté au profil
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" /> Intégrer au profil
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
