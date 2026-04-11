"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/password-input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const formSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Le mot de passe actuel est requis." }),
    newPassword: z
      .string()
      .min(8, {
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      }),
    confirm: z.string(),
  })
  .refine((data) => data.newPassword === data.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

const Page = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirm: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: false,
    });

    if (error) {
      toast.error(
        "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel.",
        { position: "bottom-right" }
      );
      return;
    }

    // Mark mustChangePassword as false
    await fetch("/api/utilisateurs/moi", { method: "PATCH" });

    toast.success("Mot de passe mis à jour avec succès", {
      position: "bottom-right",
    });
    router.push("/tableau-de-bord");
    router.refresh();
  }

  return (
    <div className="flex flex-col my-5 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6 mt-20">
        Changer le mot de passe
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe actuel</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Mot de passe actuel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Nouveau mot de passe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Confirmer le nouveau mot de passe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2Icon className="animate-spin" /> : <Save />}
              Enregistrer
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Page;
