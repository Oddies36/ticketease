"use client";

import { LayoutComponent } from "@/app/components/layout";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const groupSchema = z.object({
  groupName: z.string().min(1, "Le nom du groupe est requis"),
  description: z.string().optional(),
  location: z.string().optional(),
});

const NewGroup: React.FC = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(groupSchema),
  });

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await fetch("/api/locations");
      const data = await res.json();
      setLocations(data.map((loc: { name: string }) => loc.name));
    };
    fetchLocations();
  }, []);

  const onSubmit = async (data: any) => {
    const response = await fetch("/api/groupes/newgroup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      router.push("/outils");
    } else {
      alert("Erreur: " + result.message);
    }
  };

  const handleCancel = () => {
    router.push("/outils");
  };

  return (
    <LayoutComponent>
      <Box>
        <Typography variant="h4" mb={3}>
          Création d'un groupe
        </Typography>

        <Grid container spacing={5} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: "#f4f5f7", p: 3, width: "100%" }}>
              <Typography variant="h4" mb={3} textAlign="center">
                Création d'un groupe
              </Typography>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="groupName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          label="Nom du groupe"
                          {...field}
                          error={!!errors.groupName}
                          helperText={errors.groupName?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField fullWidth label="Description" {...field} multiline minRows={4} />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="location"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Localisation</InputLabel>
                          <Select
                            label="Localisation"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          >

                            {locations.map((loc) => (
                              <MenuItem key={loc} value={loc}>
                                {loc}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit(onSubmit)}
                >
                  Créer le groupe
                </Button>
                <Button variant="outlined" onClick={handleCancel}>
                  Annuler
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="h5" mb={2}>
                Informations importantes
              </Typography>
              <Typography variant="body2" mb={1}>
                - Le nom du groupe est requis.
              </Typography>
              <Typography variant="body2" mb={1}>
                - La description et la localisation sont optionnelles.
              </Typography>
              <Typography variant="body2" mb={1}>
                - Vous deviendrez automatiquement le propriétaire du groupe à sa
                création.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LayoutComponent>
  );
};

export default NewGroup;
