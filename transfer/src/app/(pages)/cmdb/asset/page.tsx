"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";

// Utilisateur renvoyé par l'API
type UserItem = { id: number; firstName: string; lastName: string };

export default function AssetPage() {
  const router = useRouter();
  const search = useSearchParams();
  const idParam = search.get("id") || "";

  // Etats de chargement / sauvegarde
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Liste des utilisateurs
  const [users, setUsers] = useState<UserItem[]>([]);

  // Champs du formulaire
  const [computerName, setComputerName] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [assignedToId, setAssignedToId] = useState<number | "">("");

  // Charge les infos de l'ordinateur + les utilisateurs
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setErrorMessage("");

      // Charge l'ordinateur
      try {
        const url =
          "/api/cmdb/get-computer?id=" + encodeURIComponent(String(idParam));
        console.log("Fetching computer:", url);
        const res = await fetch(url);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg =
            (err && err.error) || "Erreur lors du chargement de l'ordinateur.";
          setErrorMessage(msg);
        } else {
          const data = await res.json();
          console.log("Computer data reçu:", data);
          const comp = data && data.computer ? data.computer : null;
          if (comp) {
            setComputerName(comp.computerName || "");
            setSerialNumber(comp.serialNumber || "");
            if (comp.assignedTo && typeof comp.assignedTo.id === "number") {
              setAssignedToId(comp.assignedTo.id);
            } else if (typeof comp.assignedToId === "number") {
              setAssignedToId(comp.assignedToId);
            } else {
              setAssignedToId("");
            }
          }
        }
      } catch (e) {
        console.error("Erreur réseau (détails):", e);
        setErrorMessage("Erreur réseau (détails).");
      }

      // Charge les utilisateurs pour l'assignation
      try {
        console.log("Fetching users…");
        const res = await fetch("/api/users/get-users");
        if (!res.ok) {
          setUsers([]);
        } else {
          const data = await res.json();
          console.log("Users data reçu:", data);
          const list: UserItem[] = [];

          if (Array.isArray(data)) {
            data.forEach((u: any) => {
              list.push({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
              });
            });
          } else if (Array.isArray(data.users)) {
            data.users.forEach((u: any) => {
              list.push({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
              });
            });
          }
          setUsers(list);
        }
      } catch (e) {
        console.error("Erreur réseau (users):", e);
        setUsers([]);
      }
      setLoading(false);
    }
    loadAll();
  }, [idParam]);

  // Sauvegarde les modifications
  async function handleSave() {
    if (!idParam) {
      alert("Identifiant manquant.");
      return;
    }
    if (!computerName) {
      alert("Le nom de l'ordinateur est requis.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const body: any = {
      id: Number(idParam),
      computerName: computerName,
      assignedToId: assignedToId === "" ? null : assignedToId,
    };

    console.log("Payload envoyé au PATCH /api/cmdb/update:", body);

    try {
      const res = await fetch("/api/cmdb/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      console.log("Réponse API update:", data);

      if (!res.ok) {
        const msg = (data && data.error) || "Erreur lors de la mise à jour.";
        setErrorMessage(msg);
        alert(msg);
      } else {
        router.push("/cmdb");
      }
    } catch (e) {
      console.error("Erreur réseau (update):", e);
      setErrorMessage("Erreur réseau.");
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Ordinateur
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Ordinateur
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <TextField
                label="Nom de l'ordinateur"
                fullWidth
                value={computerName}
                onChange={(e) => {
                  console.log("Nom ordinateur modifié:", e.target.value);
                  setComputerName(e.target.value);
                }}
                margin="dense"
              />

              <TextField
                label="Numéro de série"
                fullWidth
                value={serialNumber}
                margin="dense"
                disabled
              />

              <Typography sx={{ mt: 2, mb: 0.5 }}>Attribué à</Typography>
              <Select
                fullWidth
                size="small"
                value={assignedToId}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  console.log("Nouvelle sélection assignedToId:", v);
                  if (isNaN(v)) {
                    setAssignedToId("");
                  } else {
                    setAssignedToId(v);
                  }
                }}
                displayEmpty
              >
                <MenuItem value="">Aucun</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </MenuItem>
                ))}
              </Select>

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                >
                  Enregistrer
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Retour
                </Button>
              </Box>

              {errorMessage ? (
                <Typography sx={{ mt: 1 }}>{errorMessage}</Typography>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
