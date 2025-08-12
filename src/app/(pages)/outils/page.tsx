"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from "@mui/material";

const Outils: React.FC = () => {
  const router = useRouter();
  const [modalType, setModalType] = useState<"user" | "group" | null>(null);
  const [locations, setLocations] = useState<string[] | null>(null);
  const [groupIntent, setGroupIntent] = useState<"create" | "edit" | "delete" | null>(null);
  const [userIntent, setUserIntent] = useState<"create" | "edit" | "delete" | null>(null);

  useEffect(() => {
    if (!modalType) {
      return;
    }

    async function fetchLocations() {
      let prefix = "";
      if (modalType === "user") {
        prefix = "Gestion.Utilisateurs.";
      } else {
        prefix = "Gestion.Groupes.";
      }

      try {
        const endpoint = `/api/groupes/available-locations?prefix=${prefix}`;
        const result = await fetch(endpoint);
        const data = await result.json();
        setLocations(data.locations);
      } catch (e) {
        setLocations([]);
      }
    }

    fetchLocations();
  }, [modalType, groupIntent, userIntent]);

  function handleClose() {
    setModalType(null);
    setGroupIntent(null);
    setUserIntent(null);
    setLocations(null);
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Outils
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h5">Gestion des utilisateurs</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Gérer les comptes utilisateurs, créer, modifier et supprimer des
                utilisateurs.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={() => {
                  setUserIntent("create");
                  setModalType("user");
                }}
              >
                Créer un utilisateur
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setUserIntent("edit");
                  setModalType("user");
                }}
              >
                Modifier un utilisateur
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setUserIntent("delete");
                  setModalType("user");
                }}
              >
                Supprimer un utilisateur
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h5">Gestion des groupes</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Gérer les groupes, créer, modifier et supprimer des groupes.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={() => {
                  setGroupIntent("create");
                  setModalType("group");
                }}
              >
                Créer un groupe
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setGroupIntent("edit");
                  setModalType("group");
                }}
              >
                Modifier un groupe
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setGroupIntent("delete");
                  setModalType("group");
                }}
              >
                Supprimer un groupe
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* MODAL COMMUN */}
      <Dialog open={!!modalType} onClose={handleClose} fullWidth>
        <DialogTitle>
          {modalType === "user"
            ? userIntent === "create"
              ? "Créer un utilisateur"
              : userIntent === "edit"
              ? "Modifier un utilisateur"
              : userIntent === "delete"
              ? "Supprimer un utilisateur"
              : "Utilisateurs"
            : groupIntent === "create"
            ? "Créer un groupe"
            : groupIntent === "edit"
            ? "Modifier un groupe"
            : groupIntent === "delete"
            ? "Supprimer un groupe"
            : "Groupes"}
        </DialogTitle>
        <DialogContent>
          {locations === null ? (
            <CircularProgress />
          ) : locations.length === 0 ? (
            <Typography>Pas de groupes trouvés</Typography>
          ) : (
            locations.map((location) => (
              <Button
                key={location}
                fullWidth
                sx={{ my: 1 }}
                onClick={() => {
                  if (modalType === "user") {
                    if (userIntent === "create") {
                      router.push(
                        `/outils/users/newuser?location=${encodeURIComponent(location)}`
                      );
                    } else if (userIntent === "edit") {
                      router.push(
                        `/outils/users/edituser?location=${encodeURIComponent(location)}`
                      );
                    } else if (userIntent === "delete") {
                      router.push(
                        `/outils/users/deleteuser?location=${encodeURIComponent(location)}`
                      );
                    }
                  } else {
                    if (groupIntent === "create") {
                      router.push(
                        `/outils/groupes/newgroup?location=${encodeURIComponent(location)}`
                      );
                    } else if (groupIntent === "edit") {
                      router.push(
                        `/outils/groupes/editgroup?location=${encodeURIComponent(location)}`
                      );
                    } else if (groupIntent === "delete") {
                      router.push(
                        `/outils/groupes/deletegroup?location=${encodeURIComponent(location)}`
                      );
                    }
                  }
                }}
              >
                {location}
              </Button>
            ))
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Outils;
