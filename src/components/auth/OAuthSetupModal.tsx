"use client";

import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, KeyRound, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface OAuthSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OAuthSetupModal({ isOpen, onClose }: OAuthSetupModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const redirectUri = "http://localhost:3000/api/auth/callback/google";

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Configuration Google OAuth requise</h2>
              <p className="text-xs text-zinc-400">Pourquoi le bouton ne redirige pas encore ?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explication */}
        <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl text-xs text-amber-200/90 leading-relaxed">
          Pour vous connecter avec votre <strong>vrai compte YouTube</strong> de façon sécurisée, Google exige que votre application soit déclarée avec vos propres identifiants (Client ID & Secret).
          Actuellement, les variables <code className="bg-amber-900/40 px-1 py-0.5 rounded text-amber-100">GOOGLE_CLIENT_ID</code> sont encore vides dans votre fichier <code className="bg-amber-900/40 px-1 py-0.5 rounded text-amber-100">.env</code>.
        </div>

        {/* Étapes clés */}
        <div className="space-y-3 text-xs text-zinc-300">
          <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <span>En 3 étapes rapides :</span>
          </div>

          <ol className="space-y-2.5 list-decimal list-inside text-zinc-400">
            <li className="leading-relaxed">
              Ouvrez la{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Google Cloud Console (Identifiants) <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li className="leading-relaxed">
              Créez un <strong>ID client OAuth (Application Web)</strong> et copiez cette URL de redirection :
              <div className="flex items-center justify-between gap-2 mt-1.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-200">
                <span className="truncate">{redirectUri}</span>
                <button
                  type="button"
                  onClick={copyRedirectUri}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copié" : "Copier"}</span>
                </button>
              </div>
            </li>
            <li className="leading-relaxed">
              Collez vos clés dans le fichier <code className="text-zinc-200 font-mono">.env</code> du projet :
              <pre className="mt-1.5 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`GOOGLE_CLIENT_ID="votre-id-google.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-client-secret"`}
              </pre>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="w-full sm:w-auto text-center px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 transition-colors"
          >
            Tester en Mode Démo (sans compte)
          </Link>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition-all shadow-md shadow-emerald-950/50"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
