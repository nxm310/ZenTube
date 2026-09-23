export function formatBroadcastDate(dateString?: string): string {
  if (!dateString) return "Date inconnue";

  // Si c'est déjà un texte relatif (ex: "il y a 2 jours", "3 weeks ago")
  if (dateString.toLowerCase().includes("il y a") || dateString.toLowerCase().includes("ago")) {
    return dateString;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  let relative = "";
  if (diffHours < 1) {
    relative = "Il y a quelques minutes";
  } else if (diffHours < 24) {
    relative = `Il y a ${diffHours} h`;
  } else if (diffDays === 1) {
    relative = "Hier";
  } else if (diffDays < 7) {
    relative = `Il y a ${diffDays} jours`;
  } else if (diffWeeks < 5) {
    relative = `Il y a ${diffWeeks} sem.`;
  } else if (diffMonths < 12) {
    relative = `Il y a ${diffMonths} mois`;
  } else {
    relative = `Il y a ${diffYears} an${diffYears > 1 ? "s" : ""}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${relative} (${day}/${month}/${year})`;
}

/**
 * Convertit une date relative (ex: "il y a 2 jours", "il y a 3 semaines")
 * ou une date ISO en timestamp numérique comparable (en ms).
 */
export function parseRelativeDateToTimestamp(timeStr?: string): number {
  if (!timeStr) return 0;

  // Test ISO
  const isoTime = new Date(timeStr).getTime();
  if (!isNaN(isoTime)) return isoTime;

  const now = Date.now();
  const text = timeStr.toLowerCase().trim();

  // Extraction du nombre (ex: "il y a 3 jours" -> 3)
  const numMatch = text.match(/(\d+)/);
  const val = numMatch ? parseInt(numMatch[1], 10) : 1;

  if (text.includes("seconde") || text.includes("sec")) {
    return now - val * 1000;
  }
  if (text.includes("minute") || text.includes("min")) {
    return now - val * 60 * 1000;
  }
  if (text.includes("heure") || text.includes(" h")) {
    return now - val * 3600 * 1000;
  }
  if (text.includes("hier")) {
    return now - 86400 * 1000;
  }
  if (text.includes("jour") || text.includes(" j")) {
    return now - val * 86400 * 1000;
  }
  if (text.includes("semaine") || text.includes("sem")) {
    return now - val * 7 * 86400 * 1000;
  }
  if (text.includes("mois")) {
    return now - val * 30 * 86400 * 1000;
  }
  if (text.includes("an") || text.includes("année")) {
    return now - val * 365 * 86400 * 1000;
  }

  return now - 100000000;
}
