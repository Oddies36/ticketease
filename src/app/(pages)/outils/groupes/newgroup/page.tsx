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
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SearchIcon from "@mui/icons-material/Search";

const groupSchema = z.object({
  groupName: z.enum([
    "Gestion.Utilisateurs.",
    "Gestion.Groupes.",
    "Support.Incidents.",
    "Support.Taches.",
  ]),
  description: z.string().optional(),
  location: z.coerce.number(),
  owner: z.number(),
});

const NewGroup: React.FC = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<{ id: number; name: string }[]>(
    []
  );

  type UserOption = {
    id: string;
    firstName: string;
    lastName: string;
  };
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(groupSchema),
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await res.json();
        setLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  const fetchUsers = async (query: string) => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/get-users?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setUserOptions(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    setApiError(null);

    try {
      const selectedLocation = locations.find((l) => l.id === data.location);

      let groupType = data.groupName;
      let groupLocation = selectedLocation?.name;

      let newGroupName = groupType + groupLocation;

      // Prepare the data with correct types
      const submissionData = {
        groupName: newGroupName,
        description: data.description || "",
        location: data.location, // This will be a number from the schema coercion
        owner: data.owner,
      };

      console.log("Sending data to API:", submissionData);

      const response = await fetch("/api/groupes/newgroup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      console.log("API Response status:", response.status);

      const result = await response.json();
      console.log("API Response data:", result);

      if (result.success) {
        router.push("/outils");
      } else {
        setApiError(result.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setApiError("Erreur de connexion");
    } finally {
      setIsSubmitting(false);
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
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="groupName"
                      defaultValue="Gestion.Utilisateurs."
                      control={control}
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
                        <Autocomplete
                          freeSolo
                          loading={loading}
                          options={userOptions}
                          getOptionLabel={(option) =>
                            typeof option === "string"
                              ? option
                              : option.firstName + " " + option.lastName
                          }
                          onInputChange={(_, value) => fetchUsers(value)}
                          onChange={(_, value) =>
                            field.onChange(
                              typeof value === "string"
                                ? 0
                                : parseInt(value?.id || "0")
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              label="Propriétaire"
                              error={!!errors.owner}
                              helperText={errors.owner?.message}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loading ? (
                                      <CircularProgress size={20} />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.location}>
                          <InputLabel>Localisation</InputLabel>
                          <Select
                            label="Localisation"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          >
                            {locations.map((loc) => (
                              <MenuItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.location && (
                            <Typography variant="caption" color="error">
                              {errors.location.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </form>
            </CardContent>
            {apiError && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {apiError}
              </Typography>
            )}
            <CardActions sx={{ justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Création..." : "Créer le groupe"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
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
              - Le type de groupe est requis.
            </Typography>
            <Typography variant="body2" mb={1}>
              - La description est optionnelle.
            </Typography>
            <Typography variant="body2" mb={1}>
              - La localisation est requis. 
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
