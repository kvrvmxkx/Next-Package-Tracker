"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/password-input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Check, ChevronLeft, ChevronRight, Package } from "lucide-react";

const adminSchema = z.object({
  firstname: z.string().min(2, "Prénom requis"),
  lastname: z.string().min(2, "Nom requis"),
  email: z.email("Email invalide").toLowerCase().trim(),
  phone: z.string().min(6, "Téléphone requis"),
  password: z.string().min(8, "Minimum 8 caractères"),
  role: z.string(),
});

export default function SetupInstallForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      password: "",
      role: "SUPER_ADMIN",
    },
  });

  const handleFinalSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    const res = await fetch("/api/setup/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      window.location.href = "/login";
    } else {
      alert("Erreur lors de l'installation. Veuillez réessayer.");
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Package Tracker</h1>
            <p className="text-xs text-muted-foreground">
              Installation — Étape {step}/2
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Bienvenue dans l&apos;installation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Vous allez configurer votre application de suivi de colis
                    Chine → Mali & Côte d&apos;Ivoire. À l&apos;étape suivante, vous
                    créerez le compte Super Administrateur.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Gestion des colis et statuts
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Suivi public via lien unique
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Gestion financière (avance + solde)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Notifications SMS et PDF
                    </li>
                  </ul>
                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)}>
                      Commencer
                      <ChevronRight />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Créer le Super Administrateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <FieldGroup>
                      <div className="grid grid-cols-2 gap-4">
                        <Controller
                          name="firstname"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Prénom</FieldLabel>
                              <Input {...field} placeholder="Prénom" autoComplete="off" />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                        <Controller
                          name="lastname"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Nom</FieldLabel>
                              <Input {...field} placeholder="Nom" autoComplete="off" />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>

                      <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Courriel</FieldLabel>
                            <Input {...field} placeholder="admin@example.com" autoComplete="new-email" />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      <Controller
                        name="phone"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Téléphone</FieldLabel>
                            <Input {...field} placeholder="+223 XX XX XX XX" autoComplete="off" />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      <Controller
                        name="password"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Mot de passe</FieldLabel>
                            <PasswordInput {...field} placeholder="Minimum 8 caractères" autoComplete="new-password" />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      <div className="flex justify-between mt-2">
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                          <ChevronLeft />
                          Retour
                        </Button>
                        <Button type="button" onClick={handleFinalSubmit} disabled={loading}>
                          <Check />
                          {loading ? "Installation..." : "Terminer"}
                        </Button>
                      </div>
                    </FieldGroup>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
