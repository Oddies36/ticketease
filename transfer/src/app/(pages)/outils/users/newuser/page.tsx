"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function Newuser() {
  const searchParams = useSearchParams();
  const locationName = searchParams.get("location") || "";

  const router = useRouter();

  // Champs du formulaire
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [emailPrivate, setEmailPrivate] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  // Données liées
  const [locationId, setLocationId] = useState<number | null>(null);
  const [emailExists, setEmailExists] = useState<boolean>(false);

  // Messages d'erreur par champ
  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [emailPrivateError, setEmailPrivateError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  // Récupère l'ID de la localisation
  useEffect(() => {
    async function fetchLocationId() {
      if (!locationName) {
        setLocationId(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/locations?location=${encodeURIComponent(locationName)}`
        );
        const data = await res.json();
        if (data && typeof data.id === "number") {
          setLocationId(data.id);
        } else {
          setLocationId(null);
        }
      } catch (e) {
        setLocationId(null);
      }
    }
    fetchLocationId();
  }, [locationName]);

  // Génère l'email pro
  function generateProMail() {
    const f = firstName ? firstName.toLowerCase() : "";
    const l = lastName ? lastName.toLowerCase() : "";
    return f + "." + l + "@ticketease.be";
  }

  // Vérifie si l'email pro existe déjà
  useEffect(() => {
    const email = generateProMail();
    if (!email) {
      setEmailExists(false);
      return;
    }

    let timeoutId: any = null;
    async function checkEmail() {
      try {
        const response = await fetch(
          `/api/users/check-email?email=${encodeURIComponent(email)}`
        );
        const data = await response.json();
        if (data && typeof data.exists === "boolean") {
          setEmailExists(data.exists);
        } else {
          setEmailExists(false);
        }
      } catch (e) {
        setEmailExists(false);
      }
    }

    timeoutId = setTimeout(checkEmail, 300);
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [firstName, lastName]);

  function validateNamesPattern(value: string) {
    // Majuscule obligatoire + majuscule après un tiret, pas d'apostrophe
    const regex = /^[A-Z][a-z]*(-[A-Z][a-z]*)*$/;
    return regex.test(value);
  }

  // Validation du formulaire
  function validateForm() {
    let ok = true;

    // Prénom
    if (!firstName) {
      setFirstNameError("Le prénom est requis");
      ok = false;
    } else {
      if (!validateNamesPattern(firstName)) {
        setFirstNameError(
          "Le prénom doit commencer par une majuscule, les lettres après un tiret doivent être en majuscule, et ne doit pas contenir d'apostrophe"
        );
        ok = false;
      } else {
        setFirstNameError("");
      }
    }

    // Nom
    if (!lastName) {
      setLastNameError("Le nom est requis");
      ok = false;
    } else {
      if (!validateNamesPattern(lastName)) {
        setLastNameError(
          "Le nom doit commencer par une majuscule, les lettres après un tiret doivent être en majuscule, et ne doit pas contenir d'apostrophe"
        );
        ok = false;
      } else {
        setLastNameError("");
      }
    }

    // Email privé
    if (!emailPrivate) {
      setEmailPrivateError("Email privé invalide");
      ok = false;
    } else {
      if (!emailPrivate.includes("@") || !emailPrivate.includes(".")) {
        setEmailPrivateError("Email privé invalide");
        ok = false;
      } else {
        setEmailPrivateError("");
      }
    }

    // Mot de passe
    if (!password || password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      ok = false;
    } else {
      setPasswordError("");
    }

    // Confirmation mot de passe
    if (!confirmPassword || confirmPassword.length < 8) {
      setConfirmPasswordError(
        "Le mot de passe doit contenir au moins 8 caractères"
      );
      ok = false;
    } else {
      if (confirmPassword !== password) {
        setConfirmPasswordError("Les mots de passe ne correspondent pas");
        ok = false;
      } else {
        setConfirmPasswordError("");
      }
    }

    // Vérif email pro existant
    if (emailExists) {
      ok = false;
      alert(
        "L'email professionnel existe déjà. Choisissez un autre prénom/nom."
      );
    }

    // Localisation
    if (!locationId) {
      ok = false;
      alert("Localisation inconnue.");
    }

    return ok;
  }

  // Création
  async function handleCreate() {
    const ok = validateForm();
    if (!ok) {
      return;
    }

    const payload: any = {
      firstName: firstName,
      lastName: lastName,
      emailPrivate: emailPrivate,
      password: password,
      isAdmin: isAdmin,
      mustChangePassword: mustChangePassword,
      locationId: locationId,
    };

    try {
      const response = await fetch("/api/users/new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result && result.success) {
        router.push("/outils");
      } else {
        const msg =
          result && result.message
            ? result.message
            : "Erreur lors de la création de l'utilisateur.";
        alert("Erreur: " + msg);
      }
    } catch (e) {
      alert("Erreur réseau lors de la création de l'utilisateur.");
    }
  }

  function handleCancel() {
    router.push("/outils");
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Création d'un utilisateur
      </Typography>

      <Grid container spacing={5} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ backgroundColor: "#f4f5f7", p: 3, width: "100%" }}>
            <Typography variant="h4" mb={3} textAlign="center">
              Création d'un utilisateur
            </Typography>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    error={!!firstNameError}
                    helperText={firstNameError}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    error={!!lastNameError}
                    helperText={lastNameError}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Localisation"
                    value={locationName}
                    disabled
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email privé"
                    value={emailPrivate}
                    onChange={(e) => setEmailPrivate(e.target.value)}
                    error={!!emailPrivateError}
                    helperText={emailPrivateError}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email professionnel"
                    variant="outlined"
                    disabled
                    value={generateProMail()}
                    helperText={
                      emailExists ? "Cet email professionnel existe déjà" : ""
                    }
                    error={emailExists}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!passwordError}
                    helperText={passwordError}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirmation du mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!confirmPasswordError}
                    helperText={confirmPasswordError}
                  />
                </Grid>
                <Grid size={{ xs: 9, md: 5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                      />
                    }
                    label="Administrateur ?"
                  />
                </Grid>
                <Grid size={{ xs: 9, md: 7 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={mustChangePassword}
                        onChange={(e) =>
                          setMustChangePassword(e.target.checked)
                        }
                      />
                    }
                    label="Doit changer au premier login"
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreate}
              >
                Créer l'utilisateur
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
              - Le mot de passe doit contenir au moins 8 caractères.
            </Typography>
            <Typography variant="body2" mb={1}>
              - Les apostrophes dans les noms sont interdites.
            </Typography>
            <Typography variant="body2" mb={1}>
              - Les administrateurs ont des droits spéciaux, cochez uniquement
              si nécessaire.
            </Typography>
            <Typography variant="body2" mb={1}>
              - "Doit changer au premier login" doit être coché sauf cas
              exceptionnel.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
