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
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const userSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").regex(/^[A-Z][a-z]*(-[A-Z][a-z]*)*$/, "Le prénom doit commencer par une majuscule, les lettres après un tiret doivent être en majuscule, et ne doit pas contenir d'apostrophe"),
  lastName: z.string().min(1, "Le nom est requis").regex(/^[A-Z][a-z]*(-[A-Z][a-z]*)*$/, "Le nom doit commencer par une majuscule, les lettres après un tiret doivent être en majuscule, et ne doit pas contenir d'apostrophe"),
  emailPrivate: z.string().email("Email privé invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  isAdmin: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});

const Newuser: React.FC = () => {
  const router = useRouter();

    const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (data: any) => {
    const response = await fetch("/api/users/new-user", {
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

    const firstName = useWatch({ control, name: "firstName" });
    const lastName = useWatch({ control, name: "lastName" });
    const [emailExists, setEmailExists] = useState(false);

    const generateProMail = () => {
    return `${firstName?.toLowerCase() ?? ""}.${lastName?.toLowerCase() ?? ""}@ticketease.be`;
  };



  const handleCancel = () => {
    router.push("/outils");
  };

    useEffect(() => {
    const email = generateProMail();
    if (email) {
      const checkEmailExists = async () => {
        const response = await fetch(`/api/users/check-email?email=${email}`);
        const data = await response.json();
        setEmailExists(data.exists);
      };

      const debounceTimeout = setTimeout(checkEmailExists, 300);
      return () => clearTimeout(debounceTimeout);
    }
  }, [firstName, lastName]);
  return (
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
                  <Grid size={{ xs: 12, md: 6 }}><Controller name="firstName" control={control} render={({ field }) => <TextField fullWidth label="Prénom" {...field} error={!!errors.firstName} helperText={errors.firstName?.message} />} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><Controller name="lastName" control={control} render={({ field }) => <TextField fullWidth label="Nom" {...field} error={!!errors.lastName} helperText={errors.lastName?.message} />} /></Grid>
                  <Grid size={{ xs: 12 }}><Controller name="emailPrivate" control={control} render={({ field }) => <TextField fullWidth label="Email privé" {...field} error={!!errors.emailPrivate} helperText={errors.emailPrivate?.message} />} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth label="Email professionnel" variant="outlined" disabled value={generateProMail()} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><Controller name="password" control={control} render={({ field }) => <TextField fullWidth type="password" label="Mot de passe" {...field} error={!!errors.password} helperText={errors.password?.message} />} /></Grid>
                  <Grid size={{ xs: 12, md: 6 }}><Controller name="confirmPassword" control={control} render={({ field }) => <TextField fullWidth type="password" label="Confirmation du mot de passe" {...field} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />} /></Grid>
                  <Grid size={{ xs: 9, md: 5 }}><Controller name="isAdmin" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Administrateur ?" />} /></Grid>
                  <Grid size={{ xs: 9, md: 7 }}><Controller name="mustChangePassword" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Doit changer au premier login" />} /></Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary" onClick={handleSubmit(onSubmit)}>Créer l'utilisateur</Button>
                <Button variant="outlined" onClick={handleCancel}>Annuler</Button>
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
  );
};

export default Newuser;
