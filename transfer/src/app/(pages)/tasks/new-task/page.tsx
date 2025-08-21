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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";

const NewTask: React.FC = () => {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  async function onSubmit(data: any) {
    try {
      const body = {
        title: data.title,
        description: data.description,
        categorie: data.categorie,
        demandePour: data.demandePour || "",
        informationsAdditionnelles: data.informationsAdditionnelles || "",
      };

      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || "Erreur lors de la création.");
        return;
      }

      await response.json();
      router.push("/tasks");
    } catch (error) {
      alert("Erreur réseau.");
    }
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Nouvelle demande
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "Le titre est requis" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Titre"
                  error={!!errors.title}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="demandePour"
              control={control}
              rules={{ required: "Ce champ est requis" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Demande pour"
                  error={!!errors.demandePour}
                />
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
                    <MenuItem value="Demande de laptop">
                      Demande de laptop
                    </MenuItem>
                    <MenuItem value="Demande de desktop">
                      Demande de desktop
                    </MenuItem>
                    <MenuItem value="Demande de matériel supplémentaire">
                      Demande de matériel supplémentaire
                    </MenuItem>
                    <MenuItem value="Création d'un nouvel utilisateur">
                      Création d'un nouvel utilisateur
                    </MenuItem>
                    <MenuItem value="Création d'un nouveau groupe">
                      Création d'un nouveau groupe
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="informationsAdditionnelles"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  minRows={3}
                  label="Informations additionnelles"
                />
              )}
            />
            <Typography variant="caption" color="text.secondary" mt={1}>
              Pour la création d’un utilisateur, indiquez l’email privé ici.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button type="submit" variant="contained" color="primary">
              Créer la demande
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default NewTask;
