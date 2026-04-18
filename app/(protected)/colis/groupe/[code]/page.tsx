"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import StatusBadge from "@/components/status-badge";
import {
  ArrowLeft,
  Layers,
  Store,
  User,
  Eye,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { amountFormatXOF, getDestinationText } from "@/lib/utils";
import { toast } from "sonner";

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
  const router = useRouter();
  const [groupe, setGroupe] = useState<Groupe | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    expediteurEstFournisseur: false,
    expediteurNom: "",
    expediteurPhone: "",
    notes: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchGroupe = () => {
    setLoading(true);
    fetch(`/api/groupes/${code}`)
      .then((r) => r.json())
      .then(setGroupe)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGroupe(); }, [code]);

  function openEdit() {
    if (!groupe) return;
    setEditForm({
      expediteurEstFournisseur: groupe.expediteurEstFournisseur,
      expediteurNom: groupe.expediteurNom,
      expediteurPhone: groupe.expediteurPhone,
      notes: groupe.notes ?? "",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    setEditLoading(true);
    const res = await fetch(`/api/groupes/${code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      toast.success("Groupe mis à jour", { position: "bottom-right" });
      setEditOpen(false);
      fetchGroupe();
    } else {
      toast.error("Erreur lors de la mise à jour", { position: "bottom-right" });
    }
    setEditLoading(false);
  }

  async function deleteGroupe() {
    if (!confirm(`Supprimer le groupe ${code} et tous ses colis ?`)) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/groupes/${code}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Groupe supprimé", { position: "bottom-right" });
      router.push("/colis/groupe");
    } else {
      toast.error("Erreur lors de la suppression", { position: "bottom-right" });
      setDeleteLoading(false);
    }
  }

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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(groupe.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </span>
          <Button variant="outline" size="icon" onClick={openEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={deleteGroupe} disabled={deleteLoading}>
            {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
          </Button>
        </div>
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
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le groupe {groupe.code}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.expediteurEstFournisseur}
                onCheckedChange={(v) => setEditForm((f) => ({ ...f, expediteurEstFournisseur: v }))}
              />
              <span className="text-sm">Expéditeur = Fournisseur</span>
            </div>
            {!editForm.expediteurEstFournisseur && (
              <>
                <Field>
                  <FieldLabel>Nom expéditeur</FieldLabel>
                  <Input value={editForm.expediteurNom}
                    onChange={(e) => setEditForm((f) => ({ ...f, expediteurNom: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel>Tél. expéditeur</FieldLabel>
                  <Input value={editForm.expediteurPhone}
                    onChange={(e) => setEditForm((f) => ({ ...f, expediteurPhone: e.target.value }))} />
                </Field>
              </>
            )}
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Input value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button onClick={saveEdit} disabled={editLoading}>
                {editLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Enregistrer
              </Button>
            </div>
          </FieldGroup>
        </DialogContent>
      </Dialog>
    </div>
  );
}
