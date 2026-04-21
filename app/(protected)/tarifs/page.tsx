"use client";

import { useState } from "react";
import { useTarifs } from "@/hooks/use-tarifs";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, PlusCircle, Zap, Loader2, Check } from "lucide-react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Destination } from "@/lib/enums";
import { amountFormatXOF } from "@/lib/utils";
import { toast } from "sonner";
import type { TarifWithTranches } from "@/lib/types";

const tarifFormSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  destination: z.enum(["MALI", "COTE_DIVOIRE"]),
  express: z.boolean(),
  tranches: z.array(
    z.object({
      poidsMin: z.string(),
      poidsMax: z.string().optional(),
      prixParKg: z.string(),
    })
  ),
});

export default function TarifsPage() {
  const { tarifs, loading, createTarif, updateTarif, deleteTarif, refetch } =
    useTarifs();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof tarifFormSchema>>({
    resolver: zodResolver(tarifFormSchema),
    defaultValues: {
      nom: "",
      destination: "MALI",
      express: false,
      tranches: [{ poidsMin: "0", poidsMax: "", prixParKg: "" }],
    },
  });
  const { isSubmitting } = form.formState;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tranches",
  });

  function openCreate() {
    setEditId(null);
    form.reset({
      nom: "",
      destination: "MALI",
      express: false,
      tranches: [{ poidsMin: "0", poidsMax: "", prixParKg: "" }],
    });
    setOpen(true);
  }

  function openEdit(tarif: TarifWithTranches) {
    setEditId(tarif.id);
    form.reset({
      nom: tarif.nom,
      destination: tarif.destination as "MALI" | "COTE_DIVOIRE",
      express: tarif.express ?? false,
      tranches: tarif.tranches.map((t) => ({
        poidsMin: String(t.poidsMin),
        poidsMax: t.poidsMax ? String(t.poidsMax) : "",
        prixParKg: String(t.prixParKg),
      })),
    });
    setOpen(true);
  }

  async function onSubmit(values: z.infer<typeof tarifFormSchema>) {
    const payload = {
      nom: values.nom,
      destination: values.destination,
      express: values.express,
      tranches: values.tranches.map((t) => ({
        poidsMin: parseFloat(t.poidsMin),
        poidsMax: t.poidsMax ? parseFloat(t.poidsMax) : null,
        prixParKg: parseFloat(t.prixParKg),
      })),
    };
    if (editId) {
      const res = await updateTarif(editId, payload);
      if (res.success) {
        toast.success("Tarif mis à jour", { position: "bottom-right" });
        setOpen(false);
      } else {
        toast.error(res.error ?? "Erreur", { position: "bottom-right" });
      }
    } else {
      const res = await createTarif(payload);
      if (res.success) {
        toast.success("Tarif créé", { position: "bottom-right" });
        setOpen(false);
      } else {
        toast.error(res.error ?? "Erreur", { position: "bottom-right" });
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold uppercase tracking-[0.2em]">Tarification</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Nouveau tarif
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse" />
          ))}
        </div>
      ) : tarifs.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Aucun tarif configuré
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tarifs.map((tarif) => (
            <Card key={tarif.id} className={tarif.express ? "border-orange-500 border-2" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tarif.express && <Zap className="w-4 h-4 text-orange-500" />}
                    <CardTitle className="text-base">{tarif.nom}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {tarif.express && (
                      <Badge className="bg-orange-500 text-white border-orange-500">Express</Badge>
                    )}
                    <Badge
                      variant={
                        tarif.destination === "MALI" ? "info" : "warning"
                      }
                    >
                      {tarif.destination === "MALI"
                        ? "Mali"
                        : "Côte d'Ivoire"}
                    </Badge>
                    <Badge variant={tarif.active ? "success" : "secondary"}>
                      {tarif.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground text-xs">
                      <th className="pb-1">Poids min (kg)</th>
                      <th className="pb-1">Poids max (kg)</th>
                      <th className="pb-1 text-right">Prix/kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarif.tranches
                      .sort((a, b) => a.poidsMin - b.poidsMin)
                      .map((t) => (
                        <tr key={t.id} className="border-t border-border">
                          <td className="py-1">{t.poidsMin}</td>
                          <td className="py-1">
                            {t.poidsMax ?? "∞"}
                          </td>
                          <td className="py-1 text-right font-medium">
                            {amountFormatXOF(t.prixParKg)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="flex gap-2 mt-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(tarif)}
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === tarif.id}
                    onClick={async () => {
                      if (confirm("Supprimer ce tarif ?")) {
                        setDeletingId(tarif.id);
                        await deleteTarif(tarif.id);
                        refetch();
                        setDeletingId(null);
                      }
                    }}
                  >
                    {deletingId === tarif.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 mr-1 text-destructive" />
                    )}
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Modifier le tarif" : "Nouveau tarif"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="nom"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Nom du tarif</FieldLabel>
                    <Input {...field} placeholder="Ex: Tarif Standard Mali" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="destination"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Destination</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALI">Mali</SelectItem>
                        <SelectItem value="COTE_DIVOIRE">
                          Côte d&apos;Ivoire
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="express"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <FieldLabel className="!mb-0">Tarif Express</FieldLabel>
                      </div>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ce tarif est automatiquement sélectionné pour les envois express.
                    </p>
                  </Field>
                )}
              />

              {/* Tranches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Tranches de tarification</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      append({ poidsMin: "", poidsMax: "", prixParKg: "" })
                    }
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-4 gap-2 items-end"
                  >
                    <Field>
                      <FieldLabel className="text-xs">Min (kg)</FieldLabel>
                      <Input
                        {...form.register(`tranches.${index}.poidsMin`)}
                        type="number"
                        step="0.1"
                        placeholder="0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">Max (kg)</FieldLabel>
                      <Input
                        {...form.register(`tranches.${index}.poidsMax`)}
                        type="number"
                        step="0.1"
                        placeholder="∞"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">Prix/kg (XOF)</FieldLabel>
                      <Input
                        {...form.register(`tranches.${index}.prixParKg`)}
                        type="number"
                        step="100"
                        placeholder="3000"
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mb-0.5"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editId ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
