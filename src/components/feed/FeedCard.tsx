"use client";

import React, { useState } from "react";
import { CleanVideoItem } from "@/types";
import {
  ThumbsUp,
  RefreshCw,
  PauseCircle,
  EyeOff,
  Eye,
  Play,
  Check,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { formatBroadcastDate } from "@/lib/utils/date";

interface FeedCardProps {
  video: CleanVideoItem;
  onInteract: (
    action: "LIKE" | "REFRESH_TOPIC" | "PAUSE_7D" | "DISMISS" | "TOGGLE_WATCHED",
    video: CleanVideoItem
  ) => void;
  onPlay: (video: CleanVideoItem) => void;
}

export function FeedCard({ video, onInteract, onPlay }: FeedCardProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isWatchedLocal, setIsWatchedLocal] = useState<boolean>(!!video.isWatched);

  const handleAction = (
    action: "LIKE" | "REFRESH_TOPIC" | "PAUSE_7D" | "DISMISS" | "TOGGLE_WATCHED"
  ) => {
    if (action === "TOGGLE_WATCHED") {
      const nextState = !isWatchedLocal;
      setIsWatchedLocal(nextState);
      setFeedbackMessage(nextState ? "Marqué comme regardé" : "Marqué comme non vu");
    } else {
      const messages = {
        LIKE: "Sujet apprécié !",
        REFRESH_TOPIC: "Nouvelles suggestions demandées",
        PAUSE_7D: "Thématique mise en pause 7 jours",
        DISMISS: "Masqué de votre flux",
        TOGGLE_WATCHED: "",
      };
      setFeedbackMessage(messages[action]);
    }

    onInteract(action, { ...video, isWatched: isWatchedLocal });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handlePlayClick = () => {
    setIsWatchedLocal(true);
    onPlay(video);
  };

  const formattedDate = formatBroadcastDate(video.publishedAt);

  return (
    <div
      className={`flex flex-col bg-zinc-900/60 border rounded-2xl overflow-hidden transition-all duration-200 group ${
        isWatchedLocal
          ? "border-zinc-800/50 opacity-80 hover:opacity-100"
          : "border-zinc-800/80 hover:border-zinc-700/80 shadow-sm"
      }`}
    >
      {/* Vignette */}
      <div
        className="relative aspect-video w-full bg-zinc-950 cursor-pointer overflow-hidden"
        onClick={handlePlayClick}
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isWatchedLocal ? "grayscale-[35%]" : ""
          }`}
          loading="lazy"
        />

        {/* Badge Durée */}
        {video.duration && (
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-zinc-200 text-xs font-mono font-medium">
            {video.duration}
          </span>
        )}

        {/* Badge Déjà Vu */}
        {isWatchedLocal && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-950/90 border border-emerald-500/60 text-emerald-400 text-[11px] font-semibold backdrop-blur-md flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Déjà vue</span>
            </span>
          </div>
        )}

        {/* Badge Thématique Découverte (l'encart abonnement a été supprimé) */}
        {!isWatchedLocal && video.sourceType === "SERENDIPITY" && video.topicPillar && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-medium backdrop-blur-md">
              {video.topicPillar}
            </span>
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200 shadow-xl">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Contenu textuel */}
      <div className="flex flex-col justify-between flex-1 p-4 gap-3">
        <div>
          <h3
            className="font-medium text-zinc-100 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-emerald-400 transition-colors"
            onClick={handlePlayClick}
            title={video.originalTitle}
          >
            {video.title}
          </h3>

          {/* Nom de la chaîne */}
          <p className="text-xs font-medium text-zinc-300 mt-2">
            {video.channelTitle}
          </p>

          {/* Date de diffusion claire et visible */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
        </div>

        {/* Message d'action éphémère */}
        {feedbackMessage && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg animate-in fade-in duration-200">
            <Check className="w-3 h-3" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Boutons d'actions rapides */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAction("LIKE")}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="J'aime ce sujet"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction("REFRESH_TOPIC")}
              className="p-1.5 text-zinc-400 hover:text-teal-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Renouveler ce sujet"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction("PAUSE_7D")}
              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Mettre en pause 7 jours"
            >
              <PauseCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle Déjà vu */}
            <button
              onClick={() => handleAction("TOGGLE_WATCHED")}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                isWatchedLocal
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60"
                  : "bg-zinc-800/80 text-zinc-400 border-zinc-700/80 hover:text-zinc-200"
              }`}
              title={isWatchedLocal ? "Marquer comme non vu" : "Marquer comme déjà vu"}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isWatchedLocal ? "Vu" : "Non vu"}</span>
            </button>

            {/* Masquer */}
            <button
              onClick={() => handleAction("DISMISS")}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Masquer de mon flux"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
