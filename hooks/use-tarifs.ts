"use client";

import { useState, useEffect } from "react";
import type { TarifWithTranches } from "@/lib/types";

export function useTarifs() {
  const [tarifs, setTarifs] = useState<TarifWithTranches[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTarifs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tarifs");
      if (!response.ok) throw new Error("Failed to fetch tarifs");
      const data = await response.json();
      setTarifs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createTarif = async (data: {
    nom: string;
    destination: string;
    tranches: { poidsMin: number; poidsMax: number | null; prixParKg: number }[];
  }) => {
    try {
      const response = await fetch("/api/tarifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create tarif");
      }
      await fetchTarifs();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const updateTarif = async (
    id: number,
    data: {
      nom: string;
      destination: string;
      tranches: { poidsMin: number; poidsMax: number | null; prixParKg: number }[];
    }
  ) => {
    try {
      const response = await fetch(`/api/tarifs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update tarif");
      }
      await fetchTarifs();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const deleteTarif = async (id: number) => {
    try {
      const response = await fetch(`/api/tarifs/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete tarif");
      }
      await fetchTarifs();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  useEffect(() => {
    fetchTarifs();
  }, []);

  return {
    tarifs,
    loading,
    error,
    createTarif,
    updateTarif,
    deleteTarif,
    refetch: fetchTarifs,
  };
}
