"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
} from "@mui/material";

/**
 * Type: CategoryItem
 * Description:
 *   Elément de catégorie renvoyé par l’API des catégories de tâches.
 */
type CategoryItem = { id: number; label: string };

/**
 * Composant: NewTaskPage
 * Description:
 *   Formulaire de création d’une tâche (demande)
 *
 * Sources de données:
 *   - Catégories de tâches : GET  /api/tasks/categories?type=task
 *   - Création de tâche    : POST /api/tasks/create
 */
export default function NewTaskPage() {
  const router = useRouter();

  /* ============================== ÉTATS ============================== */

  // Champs du formulaire
  const [title, setTitle] = useState<string>("");
  const [demandePour, setDemandePour] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categorie, setCategorie] = useState<string>(""); // string label attendu par l’API
  const [informationsAdditionnelles, setInformationsAdditionnelles] =
    useState<string>("");

  // Données de référence
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Erreurs basiques de formulaire
  const [titleError, setTitleError] = useState<string>("");
  const [demandePourError, setDemandePourError] = useState<string>("");
  const [descriptionError, setDescriptionError] = useState<string>("");
  const [categorieError, setCategorieError] = useState<string>("");

  // Soumission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /* ============================ USE EFFECTS =========================== */

  /**
   * Effet:
   *   Charge la liste des catégories de tâches au montage.
   * Détail:
   *   - Appelle /api/tasks/categories?type=task
   *   - Alimente "categories" (liste vide en cas d’erreur)
   */
  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/tasks/categories?type=task");
        if (!res.ok) {
          setCategories([]);
          return;
        }
        const data = await res.json();

        // Construction simple et explicite
        const list: CategoryItem[] = [];
        if (data && Array.isArray(data.categories)) {
          for (let i = 0; i < data.categories.length; i++) {
            const x = data.categories[i];
            const item: CategoryItem = { id: x.id, label: x.label };
            list.push(item);
          }
        }
        setCategories(list);
      } catch {
        setCategories([]);
      }
      setIsLoading(false);
    }

    loadCategories();
  }, []);

  /* ======================== HANDLERS / HELPERS ======================== */

  /**
   * Fonction: validate
   * Description:
   *   Vérifie que tous les champs requis sont renseignés.
   * Retourne:
   *   - boolean — true si le formulaire est valide
   */
  function validate() {
    let ok = true;

    if (!title) {
      setTitleError("Le titre est requis");
      ok = false;
    } else if (title.trim().length < 5) {
      setTitleError("Minimum 5 caractères");
      ok = false;
    } else {
      setTitleError("");
    }

    if (!demandePour) {
      setDemandePourError("Ce champ est requis");
      ok = false;
    } else if (demandePour.trim().length < 3) {
      setDemandePourError("Minimum 3 caractères");
      ok = false;
    } else {
      setDemandePourError("");
    }

    if (!description) {
      setDescriptionError("La description est requise");
      ok = false;
    } else if (description.trim().length < 5) {
      setDescriptionError("Minimum 5 caractères");
      ok = false;
    } else {
      setDescriptionError("");
    }

    if (!categorie) {
      setCategorieError("La catégorie est requise");
      ok = false;
    } else {
      setCategorieError("");
    }

    return ok;
  }

  /**
   * Fonction: handleCreate
   * Description:
   *   Soumet le formulaire au backend pour créer la tâche.
   */
  async function handleCreate() {
    const ok = validate();
    if (!ok) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categorie: categorie, // label de catégorie (recherche côté backend)
          demandePour: demandePour.trim(),
          informationsAdditionnelles: informationsAdditionnelles.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Erreur lors de la création";
        try {
          const err = await response.json();
          if (err && typeof err.error === "string" && err.error) {
            message = err.error;
          }
        } catch {}
        alert(message);
        setIsSubmitting(false);
        return;
      }

      // Optionnel: lecture silencieuse de la réponse
      await response.json().catch(() => ({}));
      router.push("/tasks");
    } catch {
      alert("Erreur réseau lors de la création");
    }

    setIsSubmitting(false);
  }

  /* ================================ RENDER ================================ */

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Nouvelle demande
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Nouvelle demande
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <TextField
                fullWidth
                margin="dense"
                label="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!titleError}
                helperText={titleError}
              />

              <TextField
                fullWidth
                margin="dense"
                label="Demande pour"
                value={demandePour}
                onChange={(e) => setDemandePour(e.target.value)}
                error={!!demandePourError}
                helperText={demandePourError}
              />

              <TextField
                fullWidth
                margin="dense"
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!descriptionError}
                helperText={descriptionError}
                multiline
                minRows={4}
              />

              <FormControl fullWidth margin="dense" error={!!categorieError}>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  label="Catégorie"
                  value={categorie}
                  onChange={(e) => setCategorie(String(e.target.value))}
                >
                  {categories.length === 0 ? (
                    <MenuItem value="" disabled>
                      Aucune catégorie
                    </MenuItem>
                  ) : null}
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.label}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {categorieError ? (
                <Typography variant="caption" color="error">
                  {categorieError}
                </Typography>
              ) : null}

              <TextField
                fullWidth
                margin="dense"
                label="Informations additionnelles"
                value={informationsAdditionnelles}
                onChange={(e) => setInformationsAdditionnelles(e.target.value)}
                multiline
                minRows={3}
                helperText="Pour la création d’un utilisateur, indiquez l’email privé ici."
              />

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={isSubmitting}
                >
                  Créer la demande
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Retour
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
