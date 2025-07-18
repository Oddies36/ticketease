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
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useRouter } from "next/navigation";

const Incidents: React.FC = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await fetch("/api/groupes/available-locations?prefix=Support.Incidents.");
      const data = await res.json();
      setLocations(data.locations);
    };
    fetchLocations();
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Incidents
      </Typography>

      <Grid container spacing={5} alignItems="flex-start">
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

        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

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

      <Box mt={5}>
        <Typography variant="h6" gutterBottom>
          Vos localisations :
        </Typography>
        <List>
          {locations.map((loc) => (
            <ListItem key={loc} disablePadding>
              <ListItemButton
                onClick={() =>
                  router.push(`/incidents/${encodeURIComponent(loc)}`)
                }
              >
                <ListItemText primary={loc} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Incidents;
