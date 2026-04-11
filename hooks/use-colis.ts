"use client";

import { useState, useEffect } from "react";
import type { ColisListItem } from "@/lib/types";

export function useColis() {
  const [colis, setColis] = useState<NonNullable<ColisListItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColis = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/colis");
      if (!response.ok) throw new Error("Failed to fetch colis");
      const data = await response.json();
      setColis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getColisByCode = async (code: string) => {
    try {
      const response = await fetch(`/api/colis/${code}`);
      if (!response.ok) throw new Error("Failed to fetch colis");
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const createColis = async (data: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/colis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create colis");
      }
      await fetchColis();
      return { success: true, colis: await response.json() };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const updateStatut = async (code: string, statut: string, note?: string) => {
    try {
      const response = await fetch(`/api/colis/${code}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut, note }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update statut");
      }
      await fetchColis();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const enregistrerPaiement = async (
    code: string,
    type: "AVANCE" | "SOLDE",
    montant: number,
    note?: string
  ) => {
    try {
      const response = await fetch(`/api/colis/${code}/paiement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, montant, note }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to register payment");
      }
      await fetchColis();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const deleteColis = async (code: string) => {
    try {
      const response = await fetch(`/api/colis/${code}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete colis");
      }
      await fetchColis();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  useEffect(() => {
    fetchColis();
  }, []);

  return {
    colis,
    loading,
    error,
    createColis,
    getColisByCode,
    updateStatut,
    enregistrerPaiement,
    deleteColis,
    refetch: fetchColis,
  };
}
