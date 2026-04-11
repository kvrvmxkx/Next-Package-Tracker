"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function SetupSecretPage() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifySecret() {
    setLoading(true);
    const res = await fetch("/api/setup/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });

    if (res.ok) {
      window.location.href = "/setup/install";
    } else {
      setError("Secret invalide");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-bold">Vérification Setup</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="secret">Code secret</FieldLabel>
            <Input
              id="secret"
              type="password"
              placeholder="Entrez le code secret d'installation"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <Button disabled={!secret || loading} onClick={verifySecret}>
            Vérifier
          </Button>
        </CardContent>
        <p className="text-xs text-center text-muted-foreground pb-4">
          Cette étape est obligatoire pour continuer l&apos;installation.
        </p>
      </Card>
    </div>
  );
}
