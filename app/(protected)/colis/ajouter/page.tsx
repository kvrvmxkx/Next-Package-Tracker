"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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
import { colisSchema } from "@/lib/validation-schema";
import { Destination } from "@/lib/enums";
import { calculatePrixTotal, amountFormatXOF } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import type { TarifWithTranches } from "@/lib/types";

export default function AjouterColisPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [tarifs, setTarifs] = useState<TarifWithTranches[]>([]);
  const [prixCalcule, setPrixCalcule] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof colisSchema>>({
    resolver: zodResolver(colisSchema),
    defaultValues: {
      description: "",
      poids: "",
      destination:
        (session?.user as any)?.role === "AGENT_CI"
          ? Destination.COTE_DIVOIRE
          : Destination.MALI,
      expediteurNom: "",
      expediteurPhone: "",
      destinataireNom: "",
      destinatairePhone: "",
      destinataireVille: "",
      destinataireAdresse: "",
      avance: "0",
      notes: "",
      tarifId: "",
    },
  });

  const poids = parseFloat(form.watch("poids") || "0");
  const tarifId = form.watch("tarifId");
  const destination = form.watch("destination");

  // Load tarifs on mount
  useEffect(() => {
    fetch("/api/tarifs")
      .then((r) => r.json())
      .then((data) => setTarifs(data));
  }, []);

  // Recalculate price when poids or tarif changes
  useEffect(() => {
    if (!tarifId || !poids) {
      setPrixCalcule(0);
      return;
    }
    const tarif = tarifs.find((t) => String(t!.id) === tarifId) ?? null;
    if (!tarif) {
      setPrixCalcule(0);
      return;
    }
    const prix = calculatePrixTotal(poids, tarif!.tranches);
    setPrixCalcule(prix);
  }, [poids, tarifId, tarifs]);

  // Filter tarifs by destination
  const tarifsFiltered = tarifs.filter(
    (t) => t!.active && t!.destination === destination
  );

  async function onSubmit(values: z.infer<typeof colisSchema>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/colis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          poids: parseFloat(values.poids),
          avance: parseFloat(values.avance || "0"),
          prixTotal: prixCalcule,
          agentId: session?.user?.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de l'enregistrement");
      }

      const newColis = await res.json();
      toast.success(`Colis ${newColis.code} enregistré avec succès`, {
        position: "bottom-right",
      });
      router.push(`/colis/${newColis.code}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur inconnue",
        { position: "bottom-right" }
      );
    } finally {
      setIsLoading(false);
    }
  }

  const avance = parseFloat(form.watch("avance") || "0");
  const solde = prixCalcule - avance;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/colis">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-sm font-bold uppercase tracking-[0.2em]">Enregistrer un colis</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Infos colis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Informations du colis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="destination"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Destination *</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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

                <Controller
                  name="poids"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Poids (kg) *</FieldLabel>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="ex: 5.5"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="tarifId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Tarif *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un tarif" />
                      </SelectTrigger>
                      <SelectContent>
                        {tarifsFiltered.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Aucun tarif pour cette destination
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
                  </Field>
                )}
              />

              {prixCalcule > 0 && (
                <div className="bg-muted/50 border border-border p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix calculé</span>
                    <span className="font-semibold">
                      {amountFormatXOF(prixCalcule)}
                    </span>
                  </div>
                  {avance > 0 && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Avance</span>
                        <span>- {amountFormatXOF(avance)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Solde restant</span>
                        <span>{amountFormatXOF(Math.max(0, solde))}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Description du contenu</FieldLabel>
                    <Input {...field} placeholder="Ex: Vêtements, électronique..." />
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Expéditeur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expéditeur (Chine)</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="expediteurNom"
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
                  name="expediteurPhone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Téléphone *</FieldLabel>
                      <Input {...field} placeholder="+86 XX XXXX XXXX" />
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

        {/* Destinataire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destinataire</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="destinataireNom"
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
                  name="destinatairePhone"
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
                <Controller
                  name="destinataireVille"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Ville</FieldLabel>
                      <Input {...field} placeholder="Ex: Bamako" />
                    </Field>
                  )}
                />
                <Controller
                  name="destinataireAdresse"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Adresse</FieldLabel>
                      <Input {...field} placeholder="Quartier, rue..." />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="avance"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Avance perçue (XOF)</FieldLabel>
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
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Notes internes</FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="Remarques, instructions de livraison..."
                      rows={3}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/colis">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enregistrer le colis
          </Button>
        </div>
      </form>
    </div>
  );
}
