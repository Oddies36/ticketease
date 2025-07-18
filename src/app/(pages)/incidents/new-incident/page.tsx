"use client";

import React from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";

const NewIncident: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    console.log("Submitted incident:", data);
    // TODO: handle creation logic here
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Nouveau ticket d'incident
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="titre"
              control={control}
              rules={{ required: "Le titre est requis" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Titre"
                  error={!!errors.titre}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="priorite"
              control={control}
              rules={{ required: "La priorité est requise" }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.priorite}>
                  <InputLabel>Priorité</InputLabel>
                  <Select {...field} label="Priorité">
                    <MenuItem value="bas">Bas</MenuItem>
                    <MenuItem value="moyen">Moyen</MenuItem>
                    <MenuItem value="haut">Haut</MenuItem>
                    <MenuItem value="critique">Critique</MenuItem>
                  </Select>
                  <Typography variant="caption" color="error">
                  </Typography>
                </FormControl>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="description"
              control={control}
              rules={{ required: "La description est requise" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={4}
                  label="Description"
                  error={!!errors.description}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="categorie"
              control={control}
              rules={{ required: "La catégorie est requise" }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.categorie}>
                  <InputLabel>Catégorie</InputLabel>
                  <Select {...field} label="Catégorie">
                    <MenuItem value="Réseau">Réseau</MenuItem>
                    <MenuItem value="Matériel">Matériel</MenuItem>
                    <MenuItem value="Logiciel">Logiciel</MenuItem>
                    <MenuItem value="Accès">Accès</MenuItem>
                    <MenuItem value="Autre">Autre</MenuItem>
                  </Select>
                  <Typography variant="caption" color="error">
                  </Typography>
                </FormControl>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="informationsSupplementaires"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Informations supplémentaires"
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button type="submit" variant="contained" color="primary">
              Créer l'incident
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default NewIncident;