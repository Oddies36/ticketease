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
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";

// Structure d'un utilisateur minimal pour la suppression
type UserItem = {
  id: number;
  firstName: string;
  lastName: string;
  emailProfessional: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
};

export default function DeleteUserPage() {
  const router = useRouter();
  const search = useSearchParams();
  const locationName = search.get("location") || "";

  // États globaux
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Liste et recherche d'utilisateurs
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  // Sélection de l'utilisateur à supprimer
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // États pour la suppression
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Charge les utilisateurs de la localisation
  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const url =
          "/api/users/users-by-location?location=" +
          encodeURIComponent(locationName);
        const res = await fetch(url);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErrorMessage(
            err.error || "Erreur lors du chargement des utilisateurs."
          );
          setUsers([]);
          setFilteredUsers([]);
        } else {
          const data = await res.json();
          const loaded: UserItem[] = data.users || [];
          setUsers(loaded);
          setFilteredUsers(loaded);
        }
      } catch (e) {
        setErrorMessage("Erreur réseau lors du chargement des utilisateurs.");
        setUsers([]);
        setFilteredUsers([]);
      }

      setIsLoading(false);
    }

    loadUsers();
  }, [locationName]);

  // Filtrage par recherche
  useEffect(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) {
      setFilteredUsers(users);
    } else {
      const list: UserItem[] = [];
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const fullName = (u.firstName + " " + u.lastName).toLowerCase();
        const email = u.emailProfessional.toLowerCase();

        if (fullName.includes(text) || email.includes(text)) {
          list.push(u);
        }
      }
      setFilteredUsers(list);

      // Réinitialiser la sélection si l'utilisateur filtré disparaît
      if (selectedUserId !== "") {
        let stillExists = false;
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === selectedUserId) {
            stillExists = true;
            break;
          }
        }
        if (!stillExists) {
          setSelectedUserId("");
          setSelectedUser(null);
        }
      }
    }
  }, [searchText, users]);

  // Mise à jour sélection
  useEffect(() => {
    if (selectedUserId === "") {
      setSelectedUser(null);
      return;
    }

    let found: UserItem | null = null;
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (u.id === selectedUserId) {
        found = u;
        break;
      }
    }

    if (found) {
      setSelectedUser(found);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, users]);

  // Suppression
  async function handleDeleteConfirmed() {
    if (selectedUserId === "") {
      alert("Veuillez sélectionner un utilisateur.");
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch("/api/users/delete-user?id=" + selectedUserId, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message || "Erreur lors de la suppression.");
      } else {
        // Retirer l'utilisateur supprimé de la liste locale
        const remaining: UserItem[] = [];
        for (let i = 0; i < users.length; i++) {
          const u = users[i];
          if (u.id !== selectedUserId) {
            remaining.push(u);
          }
        }
        setUsers(remaining);
        setFilteredUsers(remaining);
        setSelectedUserId("");
        setSelectedUser(null);
        alert("Utilisateur supprimé.");
        router.push("/outils");
      }
    } catch (e) {
      alert("Erreur réseau lors de la suppression.");
    }

    setIsDeleting(false);
    setConfirmOpen(false);
  }

  function renderContent() {
    if (isLoading) {
      return <CircularProgress />;
    } else {
      if (errorMessage && users.length === 0) {
        return <Typography>{errorMessage}</Typography>;
      } else {
        if (users.length === 0) {
          return (
            <Typography>Aucun utilisateur dans cette localisation.</Typography>
          );
        } else {
          return (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ backgroundColor: "#f4f5f7" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sélection de l'utilisateur
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      label="Recherche (nom, email)"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Box
                      sx={{
                        border: "1px solid #ddd",
                        borderRadius: 1,
                        maxHeight: 360,
                        overflow: "auto",
                      }}
                    >
                      <List dense>
                        {filteredUsers.map((u, idx) => {
                          const label =
                            u.lastName +
                            " " +
                            u.firstName +
                            " - " +
                            u.emailProfessional;
                          const isSelected = selectedUserId === u.id;

                          return (
                            <React.Fragment key={u.id}>
                              <ListItemButton
                                selected={isSelected}
                                onClick={() => setSelectedUserId(u.id)}
                              >
                                <ListItemText primary={label} />
                              </ListItemButton>
                              {idx < filteredUsers.length - 1 ? (
                                <Divider component="li" />
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {selectedUser ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ backgroundColor: "#f4f5f7" }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Détails de l'utilisateur
                      </Typography>

                      <TextField
                        label="Localisation"
                        value={locationName}
                        fullWidth
                        size="small"
                        margin="dense"
                        disabled
                      />
                      <TextField
                        label="Email professionnel"
                        value={selectedUser.emailProfessional}
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
        Supprimer un utilisateur - {locationName}
      </Typography>

      {renderContent()}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cet utilisateur ?
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
