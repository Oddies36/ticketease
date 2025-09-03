"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Container,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useUserStore } from "@/app/store/userStore";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const LoginPage = () => {
  // L'affichage qui montre ou bien le login, ou bien le mot de passe
  const [step, setStep] = useState(0);
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const [loading, setLoading] = useState(true);

  /**
   * Vérifie si une session utilisateur est déjà active
   * Si oui, redirige vers le dashboard, sinon affiche le formulaire
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          router.push("/dashboard");
        } else {
          clearUser();
          setLoading(false);
        }
      } catch {
        clearUser();
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Passe au step 1 qui affiche le mot de passe
  const handleNext = () => {
    setStep(1);
    setError("");
  };

  // Retourne au step 0 ce qui montre le login
  const handleBack = () => {
    setStep(0);
    setPassword("");
    setError("");
  };

  // Gère la modification du champ mail
  const handleMailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMail(e.target.value.toLowerCase());
  };

  // Gère la modification du champ password
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  /**
   * Soumet le formulaire de connexion
   * l'api login signe un jwt et ajoute ça dans un cookie dans la réponse
   * En cas d'échec, revient au step 1 et affiche une erreur
   */
  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Stringify converti un objet javascript en string JSON
        body: JSON.stringify({ email: mail, password }),
      });

      if (!response.ok) {
        setPassword("");
        setMail("");
        setStep(0);
        setError("Email ou mot de passe incorrecte");
        return;
      }

      // Ici on vérifie le token. Si c'est ok, on retourne le user
      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (!meResponse.ok) {
        throw new Error("Impossible de récupérer les informations utilisateur");
      }

      /**
       * Pour finir on vérifie si mustChangePassword est true.
       * Si oui, redirige vers change-password, si non vers dashboard
       */
      const meUser = await meResponse.json();
      setUser(meUser);
      if (meUser.mustChangePassword) router.push("/change-password");
      else router.push("/dashboard");
    } catch {
      setError("Email ou mot de passe incorrecte");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f4f6f8",
          p: { xs: 2, md: 4 },
        }}
      >
        <Paper
          elevation={3}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Container maxWidth={false} sx={{ p: { xs: 3, md: 6 } }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ color: "#000000", textAlign: "center" }}
            >
              Connexion
            </Typography>

            <Box
              sx={{
                minHeight: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {step === 0 ? (
                <Box>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleNext();
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Adresse mail"
                      margin="normal"
                      variant="outlined"
                      value={mail}
                      onChange={handleMailChange}
                      autoComplete="email"
                      inputMode="email"
                    />
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      sx={{ mt: 2, bgcolor: "#6366F1" }}
                    >
                      Suivant
                    </Button>
                  </form>
                  {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                      {error}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleLogin();
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Mot de passe"
                      type="password"
                      margin="normal"
                      variant="outlined"
                      value={password}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleLogin}
                      sx={{ mt: 2, bgcolor: "#6366F1" }}
                    >
                      Connexion
                    </Button>
                  </form>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{
                      position: "absolute",
                      top: 5,
                      left: 5,
                      color: "#6366F1",
                      textTransform: "none",
                      fontWeight: "bold",
                    }}
                  >
                    Retour
                  </Button>
                </Box>
              )}
            </Box>
          </Container>
        </Paper>
      </Grid>
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          textAlign: "center",
          backgroundImage: "url('/ticketeaseteams.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100vh",
        }}
      />
    </Grid>
  );
};

export default LoginPage;
