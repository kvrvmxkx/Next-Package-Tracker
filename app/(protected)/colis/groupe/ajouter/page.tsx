"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Destination } from "@/lib/enums";
import { calculatePrixTotal, amountFormatXOF } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Store,
  Users,
  Package,
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import type { TarifWithTranches } from "@/lib/types";
import { getFormSettings, type FormSettings } from "@/lib/form-settings";

// ─── Schema ──────────────────────────────────────────────────

const sousColis = z.object({
  destinataireNom: z.string().min(2, "Nom requis"),
  destinatairePhone: z.string().min(8, "Téléphone requis"),
  destinataireVille: z.string().optional(),
  destinataireAdresse: z.string().optional(),
  description: z.string().optional(),
  poids: z.string().min(1, "Poids requis"),
  tarifId: z.string().min(1, "Tarif requis"),
  avance: z.string().optional(),
});

const groupeSchema = z
  .object({
    destination: z.nativeEnum(Destination, { message: "Destination invalide" }),
    expediteurEstFournisseur: z.boolean(),
    expediteurNom: z.string().optional(),
    expediteurPhone: z.string().optional(),
    notes: z.string().optional(),
    colis: z.array(sousColis).min(1, "Au moins un destinataire requis"),
  })
  .superRefine((data, ctx) => {
    if (!data.expediteurEstFournisseur) {
      if (!data.expediteurNom || data.expediteurNom.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nom expéditeur requis",
          path: ["expediteurNom"],
        });
      }
      if (!data.expediteurPhone || data.expediteurPhone.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Téléphone expéditeur requis",
          path: ["expediteurPhone"],
        });
      }
    }
  });

type GroupeFormValues = z.infer<typeof groupeSchema>;

// ─── Composant prix d'un sous-colis ──────────────────────────

function PrixColis({
  poids,
  tarifId,
  tarifs,
}: {
  poids: string;
  tarifId: string | undefined;
  tarifs: TarifWithTranches[];
}) {
  const p = parseFloat(poids || "0");
  const tarif = tarifs.find((t) => String(t!.id) === tarifId) ?? null;
  if (!p || !tarif) return null;
  const prix = calculatePrixTotal(p, tarif!.tranches);
  return (
    <p className="text-xs text-muted-foreground mt-1">
      Prix estimé : <span className="font-semibold text-foreground">{amountFormatXOF(prix)}</span>
    </p>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function AjouterGroupePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [tarifs, setTarifs] = useState<TarifWithTranches[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [estFournisseur, setEstFournisseur] = useState(false);
  const [fs, setFs] = useState<FormSettings | null>(null);

  useEffect(() => { setFs(getFormSettings()); }, []);
  const [codeGroupe, setCodeGroupe] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);

  const form = useForm<GroupeFormValues>({
    resolver: zodResolver(groupeSchema),
    defaultValues: {
      destination:
        (session?.user as any)?.role === "AGENT_CI"
          ? Destination.COTE_DIVOIRE
          : Destination.MALI,
      expediteurEstFournisseur: false,
      expediteurNom: "",
      expediteurPhone: "",
      notes: "",
      colis: [
        {
          destinataireNom: "",
          destinatairePhone: "",
          destinataireVille: "",
          destinataireAdresse: "",
          description: "",
          poids: "",
          tarifId: "",
          avance: "0",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "colis",
  });

  const destination = form.watch("destination");
  const colisValues = form.watch("colis");

  // Charger les tarifs
  useEffect(() => {
    fetch("/api/tarifs")
      .then((r) => r.json())
      .then(setTarifs);
  }, []);

  // Pré-générer le code CF dès l'ouverture du formulaire
  useEffect(() => {
    setCodeLoading(true);
    fetch("/api/groupes/code")
      .then((r) => r.json())
      .then((data) => {
        setCodeGroupe(data.code ?? null);
      })
      .catch(() => setCodeGroupe(null))
      .finally(() => setCodeLoading(false));
  }, []);

  const tarifsFiltered = tarifs.filter(
    (t) => t!.active && t!.destination === destination
  );

  // Pré-sélectionner automatiquement si un seul tarif disponible
  useEffect(() => {
    if (tarifsFiltered.length === 1) {
      const id = String(tarifsFiltered[0]!.id);
      fields.forEach((_, index) => {
        form.setValue(`colis.${index}.tarifId`, id);
      });
    }
  }, [tarifsFiltered.length, destination]);

  async function onSubmit(values: GroupeFormValues) {
    if (!codeGroupe) {
      toast.error("Code CF non disponible, veuillez recharger la page");
      return;
    }
    setIsLoading(true);
    try {
      // Calculer le prixTotal de chaque sous-colis
      const colisWithPrix = values.colis.map((item) => {
        const p = parseFloat(item.poids || "0");
        const tarif = tarifs.find((t) => String(t!.id) === item.tarifId) ?? null;
        const prixTotal = tarif ? calculatePrixTotal(p, tarif!.tranches) : 0;
        return {
          ...item,
          poids: p,
          prixTotal,
          avance: parseFloat(item.avance || "0"),
        };
      });

      const res = await fetch("/api/groupes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeGroupe,
          destination: values.destination,
          expediteurEstFournisseur: values.expediteurEstFournisseur,
          expediteurNom: values.expediteurNom,
          expediteurPhone: values.expediteurPhone,
          notes: values.notes,
          colis: colisWithPrix,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de l'enregistrement");
      }

      toast.success(`Envoi groupé ${codeGroupe} enregistré (${values.colis.length} colis)`, {
        position: "bottom-right",
      });
      router.push("/colis");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue", {
        position: "bottom-right",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/colis">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-sm font-bold uppercase tracking-[0.2em]">
            Envoi groupé
          </h1>
          {/* Code CF — visible avant insertion */}
          <div className="flex items-center gap-1.5">
            {codeLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : codeGroupe ? (
              <Badge variant="outline" className="font-mono text-sm px-2.5 py-0.5 tracking-widest">
                {codeGroupe}
              </Badge>
            ) : (
              <span className="text-xs text-destructive">Code indisponible</span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Destination */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Envoi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="destination"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Destination *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Destination.MALI}>Mali</SelectItem>
                        <SelectItem value={Destination.COTE_DIVOIRE}>
                          Côte d&apos;Ivoire
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {fs?.afficherNotes !== false && (
                <Controller
                  name="notes"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Notes internes</FieldLabel>
                      <Textarea
                        {...field}
                        placeholder="Remarques sur l'envoi..."
                        rows={2}
                      />
                    </Field>
                  )}
                />
              )}
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Expéditeur */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Expéditeur (Chine)</CardTitle>
              <button
                type="button"
                onClick={() => {
                  const next = !estFournisseur;
                  setEstFournisseur(next);
                  form.setValue("expediteurEstFournisseur", next);
                  if (next) {
                    form.setValue("expediteurNom", "");
                    form.setValue("expediteurPhone", "");
                    form.clearErrors(["expediteurNom", "expediteurPhone"]);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  estFournisseur
                    ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Store className="w-3 h-3" />
                Fournisseur
              </button>
            </div>
            {estFournisseur && (
              <p className="text-xs text-muted-foreground mt-1">
                L&apos;expéditeur est un fournisseur — informations non requises.
              </p>
            )}
          </CardHeader>
          <CardContent
            className={estFournisseur ? "opacity-40 pointer-events-none select-none" : ""}
          >
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="expediteurNom"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Nom {!estFournisseur && "*"}</FieldLabel>
                      <Input
                        {...field}
                        placeholder="Nom complet"
                        disabled={estFournisseur}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="expediteurPhone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Téléphone {!estFournisseur && "*"}</FieldLabel>
                      <Input
                        {...field}
                        placeholder="+86 XX XXXX XXXX"
                        disabled={estFournisseur}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Liste des destinataires */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Destinataires
                <Badge variant="secondary" className="ml-1">
                  {fields.length}
                </Badge>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    destinataireNom: "",
                    destinatairePhone: "",
                    destinataireVille: "",
                    destinataireAdresse: "",
                    description: "",
                    poids: "",
                    tarifId: tarifsFiltered.length === 1 ? String(tarifsFiltered[0]!.id) : "",
                    avance: "0",
                  })
                }
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="border border-border rounded-md p-4 space-y-3 relative"
              >
                {/* Numéro + bouton supprimer */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Colis #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Destinataire */}
                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    name={`colis.${index}.destinataireNom`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Nom *</FieldLabel>
                        <Input {...field} placeholder="Nom complet" />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name={`colis.${index}.destinatairePhone`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Téléphone *</FieldLabel>
                        <Input {...field} placeholder="+223 XX XX XX XX" />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  {fs?.afficherVille !== false && (
                    <Controller
                      name={`colis.${index}.destinataireVille`}
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Ville</FieldLabel>
                          <Input {...field} placeholder="Ex: Bamako" />
                        </Field>
                      )}
                    />
                  )}
                  {fs?.afficherAdresse !== false && (
                    <Controller
                      name={`colis.${index}.destinataireAdresse`}
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Adresse</FieldLabel>
                          <Input {...field} placeholder="Quartier, rue..." />
                        </Field>
                      )}
                    />
                  )}
                </div>

                {/* Colis info */}
                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    name={`colis.${index}.poids`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Poids (kg) *</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="ex: 2.5"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name={`colis.${index}.tarifId`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Tarif *</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            {tarifsFiltered.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Aucun tarif
                              </SelectItem>
                            ) : (
                              tarifsFiltered.map((t) => (
                                <SelectItem key={t!.id} value={String(t!.id)}>
                                  {t!.nom}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                        <PrixColis
                          poids={colisValues[index]?.poids ?? ""}
                          tarifId={colisValues[index]?.tarifId}
                          tarifs={tarifs}
                        />
                      </Field>
                    )}
                  />
                  {fs?.afficherDescription !== false && (
                    <Controller
                      name={`colis.${index}.description`}
                      control={form.control}
                      render={({ field }) => (
                        <Field className="col-span-2">
                          <FieldLabel>Description</FieldLabel>
                          <Input {...field} placeholder="Contenu du colis..." />
                        </Field>
                      )}
                    />
                  )}
                  <Controller
                    name={`colis.${index}.avance`}
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Avance (XOF)</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="500"
                          placeholder="0"
                        />
                      </Field>
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/colis">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isLoading || !codeGroupe}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enregistrer l&apos;envoi groupé
          </Button>
        </div>
      </form>
    </div>
  );
}
