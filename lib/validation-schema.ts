import { z } from "zod";
import { Destination } from "./enums";

// Les inputs HTML type="number" retournent des strings → on garde string + coerce dans onSubmit
export const colisSchema = z.object({
  description: z.string().optional(),
  poids: z.string().min(1, "Poids requis"),
  destination: z.nativeEnum(Destination, { message: "Destination invalide" }),
  tarifId: z.string().optional(),
  expediteurNom: z.string().min(2, "Nom expéditeur requis"),
  expediteurPhone: z.string().min(8, "Téléphone expéditeur requis"),
  destinataireNom: z.string().min(2, "Nom destinataire requis"),
  destinatairePhone: z.string().min(8, "Téléphone destinataire requis"),
  destinataireVille: z.string().optional(),
  destinataireAdresse: z.string().optional(),
  avance: z.string().optional(),
  notes: z.string().optional(),
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
