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

  useEffect(() => {
    if (!modalType) return;

    const fetchLocations = async () => {
      const prefix =
        modalType === "user" ? "Gestion.Utilisateurs." : "Gestion.Groupes.";

      try {
        const result = await fetch(`/api/groupes/available-locations?prefix=${prefix}`);
        const data = await result.json();
        setLocations(data.locations);
      } catch {
        setLocations([]);
      }
    };

    fetchLocations();
  }, [modalType]);

  const handleClose = () => {
    setModalType(null);
    setLocations(null);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };
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
              <Button size="small" onClick={() => setModalType("user")}>
                Créer un utilisateur
              </Button>
              <Button
                size="small"
                onClick={() => router.push("/outils/users/edituser")}
              >
                Modifier un utilisateur
              </Button>
              <Button
                size="small"
                onClick={() => router.push("/outils/users/deleteuser")}
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
              <Button size="small" onClick={() => setModalType("group")}>
                Créer un groupe
              </Button>
              <Button
                size="small"
                onClick={() => router.push("/outils/groupes/editgroup")}
              >
                Modifier un groupe
              </Button>
              <Button
                size="small"
                onClick={() => router.push("/outils/groupes/deletegroup")}
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
          {modalType === "user" ? "Créer un utilisateur" : "Créer un groupe"}
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
                    router.push(
                      `/outils/users/newuser?location=${encodeURIComponent(location)}`
                    );
                  } else {
                    router.push(
                      `/outils/groupes/newgroup?location=${encodeURIComponent(location)}`
                    );
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
