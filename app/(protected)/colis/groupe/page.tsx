"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Search, Eye, Layers, Trash2 } from "lucide-react";
import Link from "next/link";
import { getDestinationText } from "@/lib/utils";

type GroupeItem = {
  id: string;
  code: string;
  destination: string;
  expediteurEstFournisseur: boolean;
  expediteurNom: string;
  createdAt: string;
  agent: { firstname: string; lastname: string };
  colis: { id: string; statut: string }[];
};

export default function GroupesPage() {
  const [groupes, setGroupes] = useState<GroupeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const fetchGroupes = () => {
    setLoading(true);
    fetch("/api/groupes")
      .then((r) => r.json())
      .then((data) => setGroupes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGroupes(); }, []);

  async function handleDelete(code: string) {
    if (!confirm(`Supprimer l'envoi groupé ${code} et tous ses colis ?`)) return;
    setDeletingCode(code);
    await fetch(`/api/groupes/${code}`, { method: "DELETE" });
    setDeletingCode(null);
    fetchGroupes();
  }

  const filtered = groupes.filter(
    (g) =>
      search === "" ||
      g.code.toLowerCase().includes(search.toLowerCase()) ||
      g.expediteurNom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/colis">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-sm font-bold uppercase tracking-[0.2em]">
            Envois groupés
          </h1>
        </div>
        <Button asChild>
          <Link href="/colis/groupe/ajouter">
            <Plus className="w-4 h-4 mr-1" />
            Nouvel envoi groupé
          </Link>
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par code ou expéditeur..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      <div className="border border-border divide-y divide-border">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2 animate-pulse">
              <div className="h-4 w-24 bg-muted" />
              <div className="h-3 w-48 bg-muted" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            {search ? "Aucun résultat" : "Aucun envoi groupé enregistré"}
          </div>
        ) : (
          filtered.map((g) => (
            <div
              key={g.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Code CF */}
                <div className="flex items-center gap-2 shrink-0">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono font-bold text-sm tracking-widest">
                    {g.code}
                  </span>
                </div>

                {/* Infos */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                    >
                      {getDestinationText(g.destination)}
                    </Badge>
                    <span className="text-sm truncate">
                      {g.expediteurEstFournisseur ? (
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                          Fournisseur
                        </span>
                      ) : (
                        g.expediteurNom
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {g.colis.length} colis &middot;{" "}
                    {new Date(g.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    &middot; {g.agent.firstname} {g.agent.lastname}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/colis/groupe/${g.code}`}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(g.code)} disabled={deletingCode === g.code}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {filtered.length} envoi{filtered.length > 1 ? "s" : ""}
        {filtered.length !== groupes.length ? ` sur ${groupes.length}` : ""}
      </p>
    </div>
  );
}
