"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { CleanVideoItem, OneShotVideo, TopicPillarItem } from "@/types";
import { FeedCard } from "@/components/feed/FeedCard";
import {
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  LogIn,
  SlidersHorizontal,
  Loader2,
  Search,
  PlusCircle,
  Check,
  Compass,
  Gamepad2,
  Cpu,
  Newspaper,
  Atom,
  Music,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { PRESET_CATEGORIES, detectCategory } from "@/lib/utils/categories";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [feed, setFeed] = useState<CleanVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string } | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Thématiques personnalisées de l'utilisateur
  const [userTopics, setUserTopics] = useState<TopicPillarItem[]>([]);

  // Filtres et Tri
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [watchFilter, setWatchFilter] = useState<"all" | "unwatched" | "watched">("all");
  const [sortBy, setSortBy] = useState<"recent" | "duration_desc" | "duration_asc" | "default">("recent");

  // Recherche directe YouTube dans le flux
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OneShotVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedPillars, setAddedPillars] = useState<Set<string>>(new Set());

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const [feedRes, topicsRes] = await Promise.all([
        fetch("/api/feed"),
        fetch("/api/topics"),
      ]);

      const feedData = await feedRes.json();
      const topicsData = await topicsRes.json();

      setFeed(feedData.feed || []);
      setIsDemo(!!feedData.isDemo);
      setUserTopics(topicsData.topics || []);
    } catch (err) {
      console.error("Erreur de chargement du flux:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [session]);

  // Bloquer le scroll d'arrière-plan quand la vidéo est ouverte dans le modal pour rester centré
  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeVideo]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/one-shot/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.videos || []);
    } catch (err) {
      console.error("Erreur lors de la recherche YouTube:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleAddAsTopic = async (title: string) => {
    try {
      await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          keywords: [title.toLowerCase()],
          weight: 1.0,
        }),
      });
      setAddedPillars((prev) => new Set(prev).add(title));
      fetchFeed();
    } catch (e) {
      console.error("Erreur ajout pilier:", e);
    }
  };

  const handleInteract = async (
    action: "LIKE" | "REFRESH_TOPIC" | "PAUSE_7D" | "DISMISS" | "TOGGLE_WATCHED",
    video: CleanVideoItem
  ) => {
    if (action === "DISMISS") {
      setFeed((prev) => prev.filter((item) => item.id !== video.id));
    } else if (action === "TOGGLE_WATCHED") {
      setFeed((prev) =>
        prev.map((item) =>
          item.id === video.id ? { ...item, isWatched: !item.isWatched } : item
        )
      );
    }

    try {
      await fetch("/api/feed/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          youtubeId: video.id,
          channelId: video.channelId,
        }),
      });

      if (action === "REFRESH_TOPIC" || action === "PAUSE_7D") {
        fetchFeed();
      }
    } catch (e) {
      console.error("Erreur d'interaction:", e);
    }
  };

  // Convertisseur durée "MM:SS" ou "HH:MM:SS" en secondes pour le tri
  const parseDurationInSeconds = (durationStr?: string): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(":").map((p) => parseInt(p, 10));
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  // Filtrage et Tri des vidéos en direct
  const filteredAndSortedFeed = useMemo(() => {
    let result = [...feed];

    // 1. Filtre par statut de visionnage
    if (watchFilter === "unwatched") {
      result = result.filter((v) => !v.isWatched);
    } else if (watchFilter === "watched") {
      result = result.filter((v) => v.isWatched);
    }

    // 2. Filtre par catégorie / thématique
    if (selectedCategory !== "all") {
      // Vérifier si c'est un pilier personnalisé de l'utilisateur
      const isCustomTopic = userTopics.some((t) => t.id === selectedCategory);
      if (isCustomTopic) {
        const customTopic = userTopics.find((t) => t.id === selectedCategory);
        const kws = customTopic?.keywords || [];
        result = result.filter((v) => {
          const matchTitle = v.title.toLowerCase();
          const matchPillar = v.topicPillar?.toLowerCase();
          return (
            (matchPillar && matchPillar === customTopic?.title.toLowerCase()) ||
            kws.some((kw) => matchTitle.includes(kw.toLowerCase()))
          );
        });
      } else {
        // Catégories prédéfinies
        result = result.filter((v) => {
          const detected = detectCategory(v.title, v.channelTitle);
          return detected === selectedCategory;
        });
      }
    }

    // 3. Tri
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else if (sortBy === "duration_desc") {
      result.sort((a, b) => parseDurationInSeconds(b.duration) - parseDurationInSeconds(a.duration));
    } else if (sortBy === "duration_asc") {
      result.sort((a, b) => parseDurationInSeconds(a.duration) - parseDurationInSeconds(b.duration));
    }

    return result;
  }, [feed, watchFilter, selectedCategory, sortBy, userTopics]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Gamepad2":
        return <Gamepad2 className="w-3.5 h-3.5" />;
      case "Cpu":
        return <Cpu className="w-3.5 h-3.5" />;
      case "Newspaper":
        return <Newspaper className="w-3.5 h-3.5" />;
      case "Atom":
        return <Atom className="w-3.5 h-3.5" />;
      case "Music":
        return <Music className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête du flux */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <span>Votre Flux Zen</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Contenus épurés, date de diffusion, détection des déjà-vus et tri par centres d'intérêt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/topics"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Gérer mes Piliers</span>
          </Link>
          <button
            onClick={fetchFeed}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-xs font-medium text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Renouveler</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche directe YouTube */}
      <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher en direct sur YouTube (jeux vidéo, actualités, tech, docu...)"
            className="w-full pl-12 pr-10 py-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/40 text-sm flex-shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Rechercher</span>
        </button>
      </form>

      {/* Barre de Catégories & Thématiques */}
      <div className="flex flex-col gap-3 p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
        {/* Catégories principales */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mr-2 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Thématiques :</span>
          </span>

          {PRESET_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                    : "bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60"
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.label}</span>
              </button>
            );
          })}

          {/* Piliers personnels de l'utilisateur */}
          {userTopics.map((topic) => {
            const isSelected = selectedCategory === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedCategory(topic.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-950/40"
                    : "bg-zinc-900/90 hover:bg-zinc-800 text-teal-300 border-teal-800/50"
                }`}
              >
                <span>⭐ {topic.title}</span>
              </button>
            );
          })}
        </div>

        {/* Ligne secondaire : Filtre Déjà Vu & Ordre de Tri */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60 text-xs">
          {/* Filtre Visionnage */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Statut :</span>
            <button
              onClick={() => setWatchFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                watchFilter === "all"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setWatchFilter("unwatched")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                watchFilter === "unwatched"
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3 h-3 text-emerald-400" />
              <span>À regarder (Non vues)</span>
            </button>
            <button
              onClick={() => setWatchFilter("watched")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                watchFilter === "watched"
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Déjà vues</span>
            </button>
          </div>

          {/* Menu de tri */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>Trier par :</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              <option value="recent">Plus récentes d'abord</option>
              <option value="duration_desc">Les plus longues</option>
              <option value="duration_asc">Formats courts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Avertissement Mode Démo si non connecté */}
      {isDemo && !hasSearched && (
        <div className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-xs text-zinc-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Flux d'exemple. Vous pouvez filtrer par thématiques ci-dessus ou connecter votre compte YouTube officiel.
            </span>
          </div>
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg text-xs ml-4 flex-shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Connexion</span>
          </button>
        </div>
      )}

      {/* Lecteur Modal si vidéo sélectionnée */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-200 truncate pr-4">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?enablejsapi=1&rel=0&autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* CAS 1 : Résultats d'une recherche ponctuelle */}
      {hasSearched ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 text-sm text-zinc-200">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>
                Résultats YouTube pour : <strong className="text-emerald-400">« {searchQuery} »</strong> ({searchResults.length} vidéos trouvées)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddAsTopic(searchQuery)}
                disabled={addedPillars.has(searchQuery)}
                className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all disabled:opacity-70"
              >
                {addedPillars.has(searchQuery) ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pilier ajouté !</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>En faire un Pilier Thématique</span>
                  </>
                )}
              </button>
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Revenir à mon flux</span>
              </button>
            </div>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs">Recherche en direct sur YouTube...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800 p-8">
              <p className="text-zinc-400 text-sm">Aucune vidéo trouvée pour cette recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {searchResults.map((video) => (
                <div
                  key={video.id}
                  className="flex flex-col bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-200 group"
                >
                  <div
                    className="relative aspect-video w-full bg-zinc-950 cursor-pointer overflow-hidden"
                    onClick={() => setActiveVideo(video)}
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200 shadow-xl">
                        ▶
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between flex-1 p-4 gap-3">
                    <div>
                      <h3
                        className="font-medium text-zinc-100 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-emerald-400 transition-colors"
                        onClick={() => setActiveVideo(video)}
                      >
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                        <span className="truncate">{video.channelTitle}</span>
                        {video.publishedAt && <span className="text-[11px] text-zinc-500">{video.publishedAt}</span>}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between">
                      <button
                        onClick={() => setActiveVideo(video)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        Regarder en mode Zen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CAS 2 : Le flux personnalisé normal avec filtres et tri */
        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs">Chargement et optimisation du flux intelligent...</p>
            </div>
          ) : filteredAndSortedFeed.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 p-8 space-y-4">
              <p className="text-zinc-400 text-sm">
                Aucune vidéo ne correspond à ce filtre actuellement.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setWatchFilter("all");
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredAndSortedFeed.map((video) => (
                <FeedCard
                  key={video.id}
                  video={video}
                  onInteract={handleInteract}
                  onPlay={(v) => setActiveVideo(v)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
