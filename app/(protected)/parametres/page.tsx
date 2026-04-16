"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import {
  getFormSettings,
  saveFormSettings,
  type FormSettings,
} from "@/lib/form-settings";
import { toast } from "sonner";

const CHAMPS = [
  {
    key: "afficherDescription" as const,
    label: "Description du contenu",
    description: "Champ libre pour décrire le contenu du colis.",
  },
  {
    key: "afficherVille" as const,
    label: "Ville du destinataire",
    description: "Ville de livraison du destinataire.",
  },
  {
    key: "afficherAdresse" as const,
    label: "Adresse du destinataire",
    description: "Adresse détaillée (quartier, rue…) du destinataire.",
  },
  {
    key: "afficherNotes" as const,
    label: "Notes internes",
    description: "Remarques internes visibles uniquement par les agents.",
  },
];

export default function ParametresPage() {
  const [settings, setSettings] = useState<FormSettings | null>(null);

  useEffect(() => {
    setSettings(getFormSettings());
  }, []);

  function toggle(key: keyof FormSettings) {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveFormSettings(next);
    toast.success("Paramètre mis à jour", { position: "bottom-right" });
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-[0.2em]">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Champs du formulaire
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Choisissez les champs à afficher lors de la création d&apos;un colis.
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {settings === null ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="py-4 flex items-center justify-between animate-pulse">
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-56 bg-muted rounded" />
                </div>
                <div className="h-6 w-10 bg-muted rounded-full" />
              </div>
            ))
          ) : (
            CHAMPS.map(({ key, label, description }) => (
              <div key={key} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={() => toggle(key)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
