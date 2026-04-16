const STORAGE_KEY = "pt-form-settings";

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
