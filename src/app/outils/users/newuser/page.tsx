import React from "react";
import { LayoutComponent } from "@/app/components/layout";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";

const Newuser: React.FC = () => {
  return (
    <LayoutComponent>
      <Box>
        <Typography variant="h4" mb={3}>
          Création d'un utilisateur
        </Typography>

        <Grid container spacing={5} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: "#f4f5f7", p: 3, width: "100%" }}>
              <Typography variant="h4" mb={3} textAlign="center">Création d'un utilisateur</Typography>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Prénom" variant="outlined" required />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Nom" variant="outlined" required />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Email privé" type="email" variant="outlined" required />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Email professionnel" variant="outlined" disabled value="prenom.nom@ticketease.be" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Mot de passe" type="password" variant="outlined" required />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Confirmation du mot de passe" type="password" variant="outlined" required />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Manager" variant="outlined" />
                  </Grid>
                  <Grid size={{ xs: 9, md: 5 }}>
                    <FormControlLabel control={<Checkbox />} label="Administrateur ?" />
                  </Grid>
                  <Grid size={{ xs: 9, md: 7 }}>
                    <FormControlLabel control={<Checkbox />} label="Doit changer au premier login" />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary">Créer l'utilisateur</Button>
                <Button variant="outlined">Annuler</Button>
              </CardActions>
            </Card>
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="h5" mb={2}>Informations importantes</Typography>
              <Typography variant="body2" mb={1}>- Le mot de passe doit contenir au moins 8 caractères.</Typography>
              <Typography variant="body2" mb={1}>- Les apostrophes dans les noms sont interdites.</Typography>
              <Typography variant="body2" mb={1}>- Les administrateurs ont des droits spéciaux, cochez uniquement si nécessaire.</Typography>
              <Typography variant="body2" mb={1}>- "Doit changer au premier login" doit être coché sauf cas exceptionnel.</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LayoutComponent>
  );
};

export default Newuser;
