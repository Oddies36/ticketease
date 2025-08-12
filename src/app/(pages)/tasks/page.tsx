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

const Task: React.FC = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await fetch(
        "/api/groupes/available-locations?prefix=Support.Tasks."
      );
      const data = await res.json();
      setLocations(data.locations);
    };
    fetchLocations();
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Tasks
      </Typography>

      <Grid container spacing={5} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/tasks/new-task")}
            >
              Créer une demande
            </Button>
          </Box>
        </Grid>

        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Quand créer une demande ?
            </Typography>
            <Typography variant="body2">
              Créez une demande lorsque vous avez besoin d'une action ou d’un
              service spécifique, comme par exemple : demander l'installation
              d’un logiciel, obtenir un accès à une application, commander du
              matériel informatique ou toute autre intervention planifiée.
              <br />
              <br />
              Les créations de groupes de support ou de nouveaux utilisateurs
              doivent également être introduites via une demande.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {locations.length > 0 && (
        <Box mt={5}>
          <Typography variant="h6" gutterBottom>
            Vos localisations :
          </Typography>
          <List>
            {locations.map((loc) => (
              <ListItem key={loc} disablePadding>
                <ListItemButton
                  onClick={() =>
                    router.push(
                      `/tasks/task-list?localisation=${encodeURIComponent(loc)}`
                    )
                  }
                >
                  <ListItemText primary={loc} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default Task;
