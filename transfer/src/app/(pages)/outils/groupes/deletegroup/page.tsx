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
  MenuItem,
  Select,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

type GroupItem = {
  id: number;
  groupName: string;
  description: string | null;
  locationId: number | null;
  ownerId: number;
};

export default function DeleteGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationName = searchParams.get("location") || "";

  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadGroups() {
      setIsLoadingGroups(true);
      setErrorMessage("");

      try {
        const url =
          "/api/groupes/admin-groups-by-location?location=" +
          encodeURIComponent(locationName);

        const response = await fetch(url);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          setErrorMessage(err.error || "Erreur lors du chargement des groupes.");
          setGroups([]);
        } else {
          const data = await response.json();
          const loadedGroups: GroupItem[] = data.groups || [];
          setGroups(loadedGroups);
        }
      } catch (e) {
        setErrorMessage("Erreur réseau lors du chargement des groupes.");
        setGroups([]);
      }

      setIsLoadingGroups(false);
    }

    loadGroups();
  }, [locationName]);

  useEffect(() => {
    if (selectedGroupId === "") {
      setSelectedGroup(null);
      return;
    }

    let found: GroupItem | null = null;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (g.id === selectedGroupId) {
        found = g;
        break;
      }
    }

    if (found) {
      setSelectedGroup(found);
    } else {
      setSelectedGroup(null);
    }
  }, [selectedGroupId, groups]);

  async function handleDeleteConfirmed() {
    if (selectedGroupId === "") {
      alert("Veuillez sélectionner un groupe.");
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/groupes/delete-group", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const message = err.error || "Erreur lors de la suppression du groupe.";
        setErrorMessage(message);
        alert(message);
      } else {
        const remaining: GroupItem[] = [];
        for (let i = 0; i < groups.length; i++) {
          const g = groups[i];
          if (g.id !== selectedGroupId) {
            remaining.push(g);
          }
        }
        setGroups(remaining);
        setSelectedGroupId("");
        setSelectedGroup(null);
        alert("Groupe supprimé.");
        router.push("/outils");
      }
    } catch (e) {
      setErrorMessage("Erreur réseau lors de la suppression.");
      alert("Erreur réseau lors de la suppression.");
    }

    setIsDeleting(false);
    setConfirmOpen(false);
  }

  function renderContent() {
    if (isLoadingGroups) {
      return <CircularProgress />;
    } else {
      if (errorMessage && groups.length === 0) {
        return <Typography>{errorMessage}</Typography>;
      } else {
        if (groups.length === 0) {
          return (
            <Typography>
              Aucun groupe administré dans cette localisation.
            </Typography>
          );
        } else {
          return (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ backgroundColor: "#f4f5f7" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sélection du groupe
                    </Typography>

                    <Select
                      fullWidth
                      size="small"
                      value={selectedGroupId}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (isNaN(value)) {
                          setSelectedGroupId("");
                        } else {
                          setSelectedGroupId(value);
                        }
                      }}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        — Sélectionner —
                      </MenuItem>
                      {groups.map((g) => {
                        return (
                          <MenuItem key={g.id} value={g.id}>
                            {g.groupName}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </CardContent>
                </Card>
              </Grid>

              {selectedGroup ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ backgroundColor: "#f4f5f7" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Détails du groupe
                      </Typography>

                      <TextField
                        label="Nom du groupe"
                        value={selectedGroup.groupName}
                        fullWidth
                        size="small"
                        margin="dense"
                        disabled
                      />
                      <TextField
                        label="Localisation"
                        value={locationName}
                        fullWidth
                        size="small"
                        margin="dense"
                        disabled
                      />
                      <TextField
                        label="Description"
                        value={selectedGroup.description || ""}
                        fullWidth
                        size="small"
                        margin="dense"
                        disabled
                      />

                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => setConfirmOpen(true)}
                          disabled={isDeleting}
                        >
                          Supprimer
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => router.back()}
                          disabled={isDeleting}
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
              ) : null}
            </Grid>
          );
        }
      }
    }
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Supprimer un groupe — {locationName}
      </Typography>

      {renderContent()}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est
            définitive.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirmed}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
