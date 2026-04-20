import { z } from "zod";
import { Destination } from "./enums";

// Les inputs HTML type="number" retournent des strings → on garde string + coerce dans onSubmit
export const colisSchema = z.object({
  description: z.string().optional(),
  poids: z.string().min(1, "Poids requis"),
  nombreColis: z.string().optional(),
  destination: z.nativeEnum(Destination, { message: "Destination invalide" }),
  tarifId: z.string().optional(),
  expediteurEstFournisseur: z.boolean(),
  expediteurNom: z.string().optional(),
  expediteurPhone: z.string().optional(),
  destinataireNom: z.string().min(2, "Nom destinataire requis"),
  destinatairePhone: z.string().min(8, "Téléphone destinataire requis"),
  destinataireVille: z.string().optional(),
  destinataireAdresse: z.string().optional(),
  avance: z.string().optional(),
  notes: z.string().optional(),
  express: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (!data.expediteurEstFournisseur) {
    if (!data.expediteurNom || data.expediteurNom.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nom expéditeur requis", path: ["expediteurNom"] });
    }
    if (!data.expediteurPhone || data.expediteurPhone.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Téléphone expéditeur requis", path: ["expediteurPhone"] });
    }
  }
  if (!data.express && (!data.tarifId || data.tarifId.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tarif requis", path: ["tarifId"] });
  }
});

export const userSchema = z.object({
  firstname: z.string().min(2, "Prénom requis"),
  lastname: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Téléphone requis"),
  password: z.string().min(6, "Mot de passe : 6 caractères minimum"),
  role: z.string().min(1, "Rôle requis"),
  agenceId: z.string().optional(),
});

export const updateUserSchema = userSchema
  .omit({ password: true })
  .extend({ password: z.string().optional() });
