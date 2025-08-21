"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type UserItem = { id: number; firstName: string; lastName: string };

export default function NewAssetPage() {
  const router = useRouter();

  const [computerName, setComputerName] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [assignedToId, setAssignedToId] = useState<number | "">("");

  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      setErrorMessage("");

      try {
        const res = await fetch("/api/users/get-users");
        if (!res.ok) {
          setUsers([]);
        } else {
          const data = await res.json();
          const list: UserItem[] = [];
          if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
              const u = data[i];
              list.push({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
              });
            }
          } else if (Array.isArray(data.users)) {
            // in case your endpoint returns { users: [...] }
            for (let i = 0; i < data.users.length; i++) {
              const u = data.users[i];
              list.push({
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
              });
            }
          }
          setUsers(list);
        }
      } catch (e) {
        setUsers([]);
      }

      setLoadingUsers(false);
    }

    loadUsers();
  }, []);

  async function handleCreate() {
    if (!computerName) {
      alert("Le nom de l'ordinateur est requis.");
      return;
    }
    if (!serialNumber) {
      alert("Le numéro de série est requis.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const body: any = {
      computerName: computerName,
      serialNumber: serialNumber,
      assignedToId: assignedToId === "" ? null : assignedToId,
    };

    try {
      const res = await fetch("/api/cmdb/computers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data && data.error) || "Erreur lors de la création de l'ordinateur.";
        setErrorMessage(msg);
        alert(msg);
      } else {
        router.push("/cmdb");
      }
    } catch (e) {
      setErrorMessage("Erreur réseau lors de la création.");
      alert("Erreur réseau lors de la création.");
    }

    setSaving(false);
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Nouvel ordinateur
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <TextField
                label="Nom de l'ordinateur"
                fullWidth
                value={computerName}
                onChange={(e) => setComputerName(e.target.value)}
                margin="dense"
              />

              <TextField
                label="Numéro de série"
                fullWidth
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                margin="dense"
              />

              <Typography sx={{ mt: 2, mb: 0.5 }}>Attribué à</Typography>
              {loadingUsers ? (
                <CircularProgress size={20} />
              ) : (
                <Select
                  fullWidth
                  size="small"
                  value={assignedToId}
                  onChange={(e) => {
                    const v = Number(e.target.value);
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
              )}

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={saving}
                >
                  Créer
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
