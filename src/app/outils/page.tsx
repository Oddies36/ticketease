"use client";

import React from "react";
import { LayoutComponent } from "../components/layout";
import { useRouter } from "next/navigation";
import { Typography, Box, Card, CardContent, CardActions, Button, Grid } from "@mui/material";

const Outils: React.FC = () => {
      const router = useRouter();
    
      const handleNavigation = (path: string) => {
        router.push(path);
      };
  return (
    <LayoutComponent>
      <Box>
        <Typography variant="h4" mb={3}>Outils</Typography>

        <Grid container spacing={3}>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ backgroundColor: "#f4f5f7" }}>
              <CardContent>
                <Typography variant="h5">Gestion des utilisateurs</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Gérer les comptes utilisateurs, créer, modifier et supprimer des utilisateurs.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => router.push("/outils/users/newuser")}>Créer un utilisateur</Button>
                <Button size="small">Modifier un utilisateur</Button>
                <Button size="small">Supprimer un utilisateur</Button>
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
                <Button size="small">Créer un groupe</Button>
                <Button size="small">Modifier un groupe</Button>
                <Button size="small">Supprimer un groupe</Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LayoutComponent>
  );
};

export default Outils;