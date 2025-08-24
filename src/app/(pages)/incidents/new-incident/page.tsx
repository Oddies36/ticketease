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
 *   Elément de catégorie renvoyé par l’API des catégories d’incidents.
 */
type CategoryItem = { id: number; label: string };

/**
 * Composant: NewIncidentPage
 * Description:
 *   Formulaire de création d’un incident
 *
 * Sources de données:
 *   - Catégories d’incident : GET  /api/incidents/categories
 *   - Création d’incident   : POST /api/incidents/create
 */
export default function NewIncidentPage() {
  const router = useRouter();

  /* ============================== ÉTATS ============================== */

  // Champs du formulaire
  const [title, setTitle] = useState<string>("");
  const [impact, setImpact] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categorie, setCategorie] = useState<string>(""); // string label attendu par l’API

  // Données de référence
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Erreurs basiques de formulaire
  const [titleError, setTitleError] = useState<string>("");
  const [impactError, setImpactError] = useState<string>("");
  const [descriptionError, setDescriptionError] = useState<string>("");
  const [categorieError, setCategorieError] = useState<string>("");

  // Soumission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /* ============================ USE EFFECTS =========================== */

  /**
   * Effet:
   *   Charge la liste des catégories d’incident au montage.
   * Détail:
   *   - Appelle /api/incidents/categories
   *   - Alimente "categories" (liste vide en cas d’erreur)
   */
  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/incidents/categories?type=incident");
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

    if (!impact) {
      setImpactError("L'impact est requis");
      ok = false;
    } else {
      setImpactError("");
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
   *   Soumet le formulaire au backend pour créer l’incident.
   */
  async function handleCreate() {
    const ok = validate();
    if (!ok) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/incidents/create-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          impact: impact, // "individuel" | "plusieurs" | "service" | "global"
          description: description.trim(),
          categorie: categorie, // label de catégorie (recherche côté backend)
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
      router.push("/incidents");
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
          Nouveau ticket d'incident
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Nouveau ticket d'incident
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

              <FormControl fullWidth margin="dense" error={!!impactError}>
                <InputLabel>Impact</InputLabel>
                <Select
                  label="Impact"
                  value={impact}
                  onChange={(e) => setImpact(String(e.target.value))}
                >
                  <MenuItem value="individuel">
                    Je suis le seul impacté
                  </MenuItem>
                  <MenuItem value="plusieurs">
                    Plusieurs collègues sont impactés
                  </MenuItem>
                  <MenuItem value="service">
                    Mon service entier est impacté
                  </MenuItem>
                  <MenuItem value="global">
                    L'ensemble du site est impacté
                  </MenuItem>
                </Select>
              </FormControl>
              {impactError ? (
                <Typography variant="caption" color="error">
                  {impactError}
                </Typography>
              ) : null}

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

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={isSubmitting}
                >
                  Créer l'incident
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
