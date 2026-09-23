export interface CategoryDefinition {
  id: string;
  label: string;
  iconName: string;
  keywords: string[];
}

export const PRESET_CATEGORIES: CategoryDefinition[] = [
  {
    id: "all",
    label: "Tous les sujets",
    iconName: "Sparkles",
    keywords: [],
  },
  {
    id: "gaming",
    label: "Jeux Vidéo",
    iconName: "Gamepad2",
    keywords: [
      "game",
      "gaming",
      "jeu",
      "jeux",
      "gameplay",
      "nintendo",
      "playstation",
      "xbox",
      "steam",
      "zelda",
      "mario",
      "minecraft",
      "gta",
      "pokemon",
      "trailer",
      "walkthrough",
      "esport",
      "rpg",
      "fps",
    ],
  },
  {
    id: "tech",
    label: "Technologie",
    iconName: "Cpu",
    keywords: [
      "tech",
      "technologie",
      "informatique",
      "code",
      "dev",
      "software",
      "programmation",
      "ia",
      "ai",
      "intelligence artificielle",
      "apple",
      "linux",
      "windows",
      "hardware",
      "smartphone",
      "nextjs",
      "react",
      "python",
      "architecture",
    ],
  },
  {
    id: "news",
    label: "Informations & Actu",
    iconName: "Newspaper",
    keywords: [
      "info",
      "infos",
      "actualité",
      "actualités",
      "actu",
      "journal",
      "news",
      "reportage",
      "politique",
      "géopolitique",
      "société",
      "france",
      "monde",
      "économie",
      "enquête",
    ],
  },
  {
    id: "science",
    label: "Sciences & Documentaires",
    iconName: "Atom",
    keywords: [
      "science",
      "sciences",
      "espace",
      "astronomie",
      "univers",
      "physique",
      "histoire",
      "documentaire",
      "nature",
      "biologie",
      "cerveau",
      "climat",
      "planète",
      "découverte",
    ],
  },
  {
    id: "music",
    label: "Musique & Audio",
    iconName: "Music",
    keywords: [
      "musique",
      "music",
      "chanson",
      "album",
      "concert",
      "live",
      "guitare",
      "piano",
      "lofi",
      "jazz",
      "rap",
      "rock",
      "beats",
      "soundtrack",
    ],
  },
];

export function detectCategory(title: string, channel: string = ""): string {
  const text = `${title} ${channel}`.toLowerCase();

  for (const cat of PRESET_CATEGORIES) {
    if (cat.id === "all") continue;
    for (const kw of cat.keywords) {
      // Vérification mot entier ou sous-chaîne significative
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(text)) {
        return cat.id;
      }
    }
  }

  return "other";
}
