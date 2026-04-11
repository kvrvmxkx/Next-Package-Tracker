"use client";

import { useEffect, useState } from "react";
import { useColis } from "@/hooks/use-colis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/status-badge";
import { Plus, Search, Eye, ExternalLink, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { amountFormatXOF, getDestinationText } from "@/lib/utils";
import { StatutColis } from "@/lib/enums";

const STATUTS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: StatutColis.ENREGISTRE, label: "Enregistré" },
  { value: StatutColis.EN_COURS_ENVOI, label: "En cours d'envoi" },
  { value: StatutColis.EN_TRANSIT, label: "En transit" },
  { value: StatutColis.ARRIVE_AGENCE, label: "Arrivé agence" },
  { value: StatutColis.PRET_RETIRER, label: "Prêt à retirer" },
  { value: StatutColis.LIVRE, label: "Livré" },
  { value: StatutColis.LITIGE, label: "Litige" },
  { value: StatutColis.ANNULE, label: "Annulé" },
];

const PER_PAGE = 10;

export default function ColisPage() {
  const { colis, loading } = useColis();
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("ALL");
  const [page, setPage] = useState(1);

  const filtered = colis.filter((c) => {
    if (!c) return false;
    const matchSearch =
      search === "" ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.expediteurNom.toLowerCase().includes(search.toLowerCase()) ||
      c.destinataireNom.toLowerCase().includes(search.toLowerCase()) ||
      c.destinatairePhone.includes(search);
    const matchStatut = filterStatut === "ALL" || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterStatut]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold uppercase tracking-[0.2em]">Colis</h1>
        <Button asChild>
          <Link href="/colis/ajouter">
            <Plus className="w-4 h-4 mr-1" />
            Nouveau colis
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code, nom, téléphone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards — mobile only */}
      <div className="flex flex-col gap-px md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border p-4 space-y-3 animate-pulse">
              <div className="h-4 w-24 bg-muted" />
              <div className="h-3 w-48 bg-muted" />
              <div className="h-3 w-32 bg-muted" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="border border-border py-12 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            {search || filterStatut !== "ALL" ? "Aucun résultat" : "Aucun colis enregistré"}
          </div>
        ) : (
          paginated.map((c) => (
            <div key={c.id} className="border border-border p-4 space-y-3">
              {/* Row 1 : code + date + status */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-bold">{c.code}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                  <StatusBadge statut={c.statut} />
                </div>
              </div>
              {/* Row 2 : expéditeur → destinataire */}
              <div className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Expéditeur</p>
                  <p>{c.expediteurNom}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Destinataire</p>
                  <p>{c.destinataireNom}</p>
                  <p className="text-xs text-muted-foreground">{c.destinatairePhone}</p>
                </div>
              </div>
              {/* Row 3 : destination + poids + prix */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                  {getDestinationText(c.destination)}
                </Badge>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="text-muted-foreground">{c.poids} kg</span>
                  <span className="font-bold font-display">{amountFormatXOF(c.prixTotal)}</span>
                </div>
              </div>
              {/* Row 4 : paiement + actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
                  <span className={c.avancePaye ? "" : "text-muted-foreground"}>Avance {c.avancePaye ? "✓" : "✗"}</span>
                  <span className={c.soldePaye ? "" : "text-muted-foreground"}>Solde {c.soldePaye ? "✓" : "✗"}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/colis/${c.code}`}><Eye className="w-4 h-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild title="Lien public de suivi">
                    <a href={`${process.env.NEXT_PUBLIC_APP_URL}/suivi/${c.tokenPublic}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table — md+ only */}
      <div className="hidden md:block border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Code</TableHead>
              <TableHead className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Expéditeur</TableHead>
              <TableHead className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Destinataire</TableHead>
              <TableHead className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Destination</TableHead>
              <TableHead className="text-right text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Poids</TableHead>
              <TableHead className="text-right text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Prix</TableHead>
              <TableHead className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Paiement</TableHead>
              <TableHead className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Statut</TableHead>
              <TableHead className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: PER_PAGE }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-12 text-[10px] uppercase tracking-widest">
                  {search || filterStatut !== "ALL" ? "Aucun résultat" : "Aucun colis enregistré"}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-display text-xs font-bold whitespace-nowrap">{c.code}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{c.expediteurNom}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">{c.destinataireNom}</div>
                    <div className="text-xs text-muted-foreground">{c.destinatairePhone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap text-[9px] font-bold uppercase tracking-wider">
                      {getDestinationText(c.destination)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums whitespace-nowrap">{c.poids} kg</TableCell>
                  <TableCell className="text-right font-bold font-display text-sm tabular-nums whitespace-nowrap">
                    {amountFormatXOF(c.prixTotal)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-0.5 items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className={c.avancePaye ? "" : "text-muted-foreground"}>
                        Avance {c.avancePaye ? "✓" : "✗"}
                      </span>
                      <span className={c.soldePaye ? "" : "text-muted-foreground"}>
                        Solde {c.soldePaye ? "✓" : "✗"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge statut={c.statut} />
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/colis/${c.code}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="Lien public de suivi">
                        <a href={`${process.env.NEXT_PUBLIC_APP_URL}/suivi/${c.tokenPublic}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer : count + pagination */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {filtered.length} colis{filtered.length !== colis.length ? ` sur ${colis.length}` : ""}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
