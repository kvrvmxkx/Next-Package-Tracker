const STORAGE_KEY = "pt-form-settings";
const COUNTRY_KEY = "pt-active-destination";

export type FormSettings = {
  afficherDescription: boolean;
  afficherVille: boolean;
  afficherAdresse: boolean;
  afficherNotes: boolean;
};

export const defaultFormSettings: FormSettings = {
  afficherDescription: true,
  afficherVille: true,
  afficherAdresse: true,
  afficherNotes: true,
};

export function getFormSettings(): FormSettings {
  if (typeof window === "undefined") return defaultFormSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultFormSettings;
    return { ...defaultFormSettings, ...JSON.parse(stored) };
  } catch {
    return defaultFormSettings;
  }
}

export function saveFormSettings(settings: FormSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export type ActiveDestination = "MALI" | "COTE_DIVOIRE";

export function getActiveDestination(): ActiveDestination {
  if (typeof window === "undefined") return "MALI";
  return (localStorage.getItem(COUNTRY_KEY) as ActiveDestination) ?? "MALI";
}

export function saveActiveDestination(dest: ActiveDestination): void {
  localStorage.setItem(COUNTRY_KEY, dest);
}
