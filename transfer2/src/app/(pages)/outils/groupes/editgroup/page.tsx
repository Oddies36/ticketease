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
} from "@mui/material";

// Représentation minimale d'un groupe
type GroupItem = {
  id: number;
  groupName: string;
  description: string | null;
  locationId: number | null;
  ownerId: number;
};

// Utilisateur simplifié
type UserItem = {
  id: number;
  firstName: string;
  lastName: string;
};

export default function EditGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationName = searchParams.get("location") || "";

  // Etats de chargement et erreurs
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(true);
  const [isLoadingOwners, setIsLoadingOwners] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Données pour groupes et propriétaires
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<UserItem[]>([]);

  // Séléctions de l'utilisateur
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [description, setDescription] = useState<string>("");
  const [ownerId, setOwnerId] = useState<number | "">("");

  // Charge les groupes de la localisation courante (où l'utilisateur est admin)
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
          setErrorMessage(
            err.error || "Erreur lors du chargement des groupes."
          );
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

  // Charge la liste des utilisateurs (pour sélectionner un propriétaire)
  useEffect(() => {
    async function loadOwners() {
      setIsLoadingOwners(true);

      try {
        const response = await fetch("/api/users/get-users");
        if (!response.ok) {
          setOwnerOptions([]);
        } else {
          const data = await response.json();
          const mapped: UserItem[] = (data || []).map((u: any) => {
            const item: UserItem = {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
            };
            return item;
          });
          setOwnerOptions(mapped);
        }
      } catch (e) {
        setOwnerOptions([]);
      }

      setIsLoadingOwners(false);
    }

    loadOwners();
  }, []);

  // Quand on change de groupe sélectionné -> remplir les champs éditables
  useEffect(() => {
    if (selectedGroupId === "") {
      setSelectedGroup(null);
      setDescription("");
      setOwnerId("");
      return;
    }

    let found: GroupItem | undefined = undefined;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (g.id === selectedGroupId) {
        found = g;
        break;
      }
    }

    if (found) {
      setSelectedGroup(found);
      if (typeof found.description === "string") {
        setDescription(found.description);
      } else {
        setDescription("");
      }
      setOwnerId(found.ownerId);
    } else {
      setSelectedGroup(null);
      setDescription("");
      setOwnerId("");
    }
  }, [selectedGroupId, groups]);

  // Sauvegarde les modifications
  async function handleSave() {
    if (selectedGroupId === "") {
      alert("Veuillez sélectionner un groupe.");
      return;
    }
    if (ownerId === "") {
      alert("Veuillez sélectionner un propriétaire.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const body = {
        groupId: selectedGroupId,
        description: description,
        ownerId: ownerId,
      };

      const response = await fetch("/api/groupes/update-group", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const message = err.error || "Erreur lors de la mise à jour du groupe.";
        setErrorMessage(message);
        alert(message);
      } else {
        // Met à jour la liste en local
        const updatedGroups: GroupItem[] = [];
        for (let i = 0; i < groups.length; i++) {
          const g = groups[i];
          if (g.id === selectedGroupId) {
            updatedGroups.push({
              ...g,
              description: description,
              ownerId: ownerId as number,
            });
          } else {
            updatedGroups.push(g);
          }
        }
        setGroups(updatedGroups);

        router.push("/outils");
      }
    } catch (e) {
      setErrorMessage("Erreur réseau lors de l'enregistrement.");
      alert("Erreur réseau lors de l'enregistrement.");
    }

    setIsSaving(false);
  }

  // Contenu dans une fonction qu'on appelle dans le render
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
                        - Sélectionner -
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

                      {/* Champs non-editables */}
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

                      {/* Champs editables */}
                      <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        size="small"
                        margin="dense"
                        multiline
                        minRows={2}
                      />

                      <Typography variant="body2" sx={{ mt: 2, mb: 0.5 }}>
                        Propriétaire
                      </Typography>
                      {isLoadingOwners ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Select
                          fullWidth
                          size="small"
                          value={ownerId}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (isNaN(value)) {
                              setOwnerId("");
                            } else {
                              setOwnerId(value);
                            }
                          }}
                        >
                          {ownerOptions.map((u) => {
                            const label = u.firstName + " " + u.lastName;
                            return (
                              <MenuItem key={u.id} value={u.id}>
                                {label}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      )}

                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          Enregistrer
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => router.back()}
                          disabled={isSaving}
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
        Modifier un groupe - {locationName}
      </Typography>
      {renderContent()}
    </Box>
  );
}
