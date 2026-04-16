"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/status-badge";
import {
  ArrowLeft,
  Layers,
  Store,
  User,
  Eye,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { amountFormatXOF, getDestinationText } from "@/lib/utils";

type SousColis = {
  id: string;
  code: string;
  statut: string;
  destinataireNom: string;
  destinatairePhone: string;
  destinataireVille: string | null;
  poids: number;
  prixTotal: number;
  avance: number;
  solde: number;
  avancePaye: boolean;
  soldePaye: boolean;
  tokenPublic: string;
  tarif: { nom: string } | null;
};

type Groupe = {
  id: string;
  code: string;
  destination: string;
  expediteurEstFournisseur: boolean;
  expediteurNom: string;
  expediteurPhone: string;
  notes: string | null;
  createdAt: string;
  agent: { firstname: string; lastname: string };
  colis: SousColis[];
};

export default function GroupeDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [groupe, setGroupe] = useState<Groupe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groupes/${code}`)
      .then((r) => r.json())
      .then(setGroupe)
      .finally(() => setLoading(false));
  }, [code]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse" />
        <div className="h-40 bg-muted animate-pulse" />
        <div className="h-64 bg-muted animate-pulse" />
      </div>
    );
  }

  if (!groupe) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">Groupe introuvable.</p>
      </div>
    );
  }

  const totalPrix = groupe.colis.reduce((s, c) => s + c.prixTotal, 0);
  const totalAvance = groupe.colis.reduce((s, c) => s + c.avance, 0);
  const totalSolde = groupe.colis.reduce((s, c) => s + c.solde, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/colis/groupe">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-bold uppercase tracking-[0.2em] font-mono">
            {groupe.code}
          </h1>
          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
            {getDestinationText(groupe.destination)}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(groupe.createdAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Infos envoi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expéditeur</CardTitle>
        </CardHeader>
        <CardContent>
          {groupe.expediteurEstFournisseur ? (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Store className="w-4 h-4" />
              <span className="text-sm font-medium">Fournisseur</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{groupe.expediteurNom}</p>
                <p className="text-xs text-muted-foreground">{groupe.expediteurPhone}</p>
              </div>
            </div>
          )}
          {groupe.notes && (
            <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
              {groupe.notes}
            </p>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground uppercase tracking-wider">
            Enregistré par {groupe.agent.firstname} {groupe.agent.lastname}
          </p>
        </CardContent>
      </Card>

      {/* Récap financier */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total prix", value: amountFormatXOF(totalPrix) },
          { label: "Total avance", value: amountFormatXOF(totalAvance) },
          { label: "Total solde", value: amountFormatXOF(totalSolde) },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Liste des colis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Colis
            <Badge variant="secondary">{groupe.colis.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {groupe.colis.map((c, index) => (
              <div key={c.id} className="p-4 space-y-2">
                {/* Ligne 1 : numéro + code + statut */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-5">
                      #{index + 1}
                    </span>
                    <span className="font-mono text-xs font-bold">{c.code}</span>
                    {c.tarif && (
                      <span className="text-[10px] text-muted-foreground">{c.tarif.nom}</span>
                    )}
                  </div>
                  <StatusBadge statut={c.statut} />
                </div>

                {/* Ligne 2 : destinataire */}
                <div className="pl-7">
                  <p className="text-sm">{c.destinataireNom}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.destinatairePhone}
                    {c.destinataireVille ? ` · ${c.destinataireVille}` : ""}
                  </p>
                </div>

                {/* Ligne 3 : poids + finances + actions */}
                <div className="pl-7 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs tabular-nums">
                    <span className="text-muted-foreground">{c.poids} kg</span>
                    <span className="font-bold">{amountFormatXOF(c.prixTotal)}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${c.avancePaye ? "" : "text-muted-foreground"}`}>
                      Av {c.avancePaye ? "✓" : "✗"}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${c.soldePaye ? "" : "text-muted-foreground"}`}>
                      Solde {c.soldePaye ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/colis/${c.code}`}>
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Lien public de suivi">
                      <a
                        href={`${appUrl}/suivi/${c.tokenPublic}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
