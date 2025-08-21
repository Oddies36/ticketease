"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
} from "@mui/material";
import { useRouter } from "next/navigation";

/**
 * Composant: Incidents
 * Description:
 *   Page d’accueil des incidents. Affiche un bouton de création
 *   et la liste des localisations accessibles à l’utilisateur pour la gestion des incidents.
 *
 * Sources de données:
 *   - Localisations incidents : /api/groupes/available-locations?prefix=Support.Incidents.
 */
const Incidents: React.FC = () => {
  /* ============================== ETATS ============================== */

  // Liste des noms de localisations accessibles pour les incidents
  const [locations, setLocations] = useState<string[]>([]);
  const router = useRouter();

  /* ============================ USE EFFECTS =========================== */

  /**
   * Effet:
   *   Charge la liste des localisations d’incidents au montage du composant.
   */
  useEffect(() => {
    async function getLocations() {
      try {
        const res = await fetch(
          "/api/groupes/available-locations?prefix=Support.Incidents."
        );
        const data = await res.json();
        if (data && Array.isArray(data.locations)) {
          setLocations(data.locations);
        } else {
          setLocations([]);
        }
      } catch (e) {
        setLocations([]);
      }
    }
    getLocations();
  }, []);

  /* ================================ RENDER ================================ */

  return (
    <Box>
      {/* Titre */}
      <Typography variant="h4" mb={3}>
        Incidents
      </Typography>

      {/* Bandeau: action principale + aide contextuelle */}
      <Grid container spacing={5} alignItems="flex-start">
        {/* Colonne action: création d’un incident */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/incidents/new-incident")}
            >
              Créer un incident
            </Button>
          </Box>
        </Grid>

        {/* Séparateur vertical */}
        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

        {/* Colonne aide */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Quand créer un ticket ?
            </Typography>
            <Typography variant="body2">
              Créez un incident lorsque vous avez un problème avec votre
              ordinateur, votre connexion réseau, un logiciel, ou un accès que
              vous ne pouvez pas obtenir.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Liste des localisations */}
      {locations.length > 0 ? (
        <Box mt={5}>
          <Typography variant="h6" gutterBottom>
            Vos localisations de support :
          </Typography>
          <List>
            {locations.map((loc) => (
              <ListItem key={loc} disablePadding sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {/* Nom de la localisation */}
                  <Typography sx={{ flex: 1 }}>{loc}</Typography>

                  {/* Voir tous les incidents de la localisation */}
                  <Button
                    variant="outlined"
                    onClick={() =>
                      router.push(
                        "/incidents/incident-list?localisation=" +
                          encodeURIComponent(loc)
                      )
                    }
                  >
                    Voir
                  </Button>

                  {/* Voir uniquement les incidents en retard */}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      router.push(
                        "/incidents/incident-list?localisation=" +
                          encodeURIComponent(loc) +
                          "&breached=1"
                      )
                    }
                  >
                    En retard
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      ) : null}
    </Box>
  );
};

export default Incidents;
