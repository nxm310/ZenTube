"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Sparkles, Shield, Compass, LogIn, LogOut, Sliders } from "lucide-react";
import { OAuthSetupModal } from "@/components/auth/OAuthSetupModal";

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isOAuthConfigured, setIsOAuthConfigured] = useState<boolean | null>(null);

  // Vérifier si les identifiants OAuth sont renseignés
  useEffect(() => {
    fetch("/api/auth/config-check")
      .then((res) => res.json())
      .then((data) => setIsOAuthConfigured(data.configured))
      .catch(() => setIsOAuthConfigured(false));
  }, []);

  // Ouvrir automatiquement la modale si NextAuth a renvoyé une erreur OAuthSignin
  useEffect(() => {
    if (searchParams?.get("error") === "OAuthSignin") {
      setIsSetupModalOpen(true);
    }
  }, [searchParams]);

  const handleLoginClick = () => {
    if (isOAuthConfigured === false) {
      setIsSetupModalOpen(true);
      return;
    }
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const navLinks = [
    { href: "/dashboard", label: "Mon Flux Zen", icon: Sparkles },
    { href: "/one-shot", label: "One-Shot Sandbox", icon: Shield, badge: "Incognito" },
    { href: "/topics", label: "Piliers & Sérendipité", icon: Sliders },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                ZenTube
              </span>
              <span className="text-[10px] text-emerald-400 ml-1.5 font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                SmartFeed
              </span>
            </div>
          </Link>

          {/* Liens de navigation */}
          <nav className="flex items-center gap-1 md:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Profil / Auth */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Utilisateur"}
                    className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium rounded-xl transition-all shadow-sm active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Connexion YouTube</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modale d'aide OAuth si non configuré */}
      <OAuthSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </>
  );
}
