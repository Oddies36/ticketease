"use client";

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
  InputAdornment,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SearchIcon from "@mui/icons-material/Search";

const groupSchema = z.object({
  groupName: z.enum([
    "Groupe de gestion d'utilisateurs",
    "Groupe de gestion des groupes",
    "Groupe de gestion des incidents",
    "Groupe de gestion des tâches",
  ]),
  description: z.string().optional(),
  location: z.string(),
  owner: z.string(),
});

const NewGroup: React.FC = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<string[]>([]);

  const {control, handleSubmit, formState: { errors } } = useForm({
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

    let groupType = data.groupName;
    let groupLocation = data.location;

    let newGroupName = groupType + groupLocation;
    data.groupName = newGroupName;

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
                    defaultValue="Groupe de gestion d'utilisateurs"
                    render={({ field }) => (
                      <FormControl
                        component="fieldset"
                        fullWidth
                        error={!!errors.groupName}
                      >
                        <Typography variant="subtitle1" gutterBottom>
                          Type de groupe
                        </Typography>
                        <RadioGroup {...field}>
                          <FormControlLabel
                            value="Gestion.Utilisateurs."
                            control={<Radio />}
                            label="Groupe de gestion d'utilisateurs"
                          />
                          <FormControlLabel
                            value="Gestion.Groupes."
                            control={<Radio />}
                            label="Groupe de gestion des groupes"
                          />
                          <FormControlLabel
                            value="Support.Incidents."
                            control={<Radio />}
                            label="Groupe de gestion des incidents"
                          />
                          <FormControlLabel
                            value="Support.Taches."
                            control={<Radio />}
                            label="Groupe de gestion des tâches"
                          />
                        </RadioGroup>
                        {errors.groupName && (
                          <Typography variant="caption" color="error">
                            {errors.groupName.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Description"
                        {...field}
                        multiline
                        minRows={4}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="owner"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Propriétaire"
                        {...field}
                        error={!!errors.owner}
                        helperText={errors.owner?.message}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => console.log("Search clicked")}
                              >
                                <SearchIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
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
              - La description est optionnelle.
            </Typography>
            <Typography variant="body2" mb={1}>
              - Le propriétaire est la personne qui a fait la demande de
              création.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NewGroup;
