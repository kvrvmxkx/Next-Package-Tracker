"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/utilisateurs");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) => {
    try {
      const response = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create user");
      }
      await fetchUsers();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const updateUser = async (
    id: string,
    data: {
      firstname: string;
      lastname: string;
      phone: string;
      role: string;
    }
  ) => {
    try {
      const response = await fetch(`/api/utilisateurs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update user");
      }
      await fetchUsers();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/utilisateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle user");
      }
      await fetchUsers();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    toggleActive,
    refetch: fetchUsers,
  };
}
