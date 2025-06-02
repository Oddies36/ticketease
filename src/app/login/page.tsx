"use client";

import * as React from "react";
import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Grid,
  Container,
  useTheme,
  Paper,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { useEffect } from "react";
import { useUserStore } from "@/app/store/userStore";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const [loading, setLoading] = useState(true);

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

  //Change d'étape pour afficher le mot de passe
  const handleNext = () => {
    setStep(1);
  };
  //Change d'étape pour afficher l'adresse mail
  const handleBack = () => {
    setStep(0);
    setPassword("");
    setError("");
  };

  //Met à jour l'adresse mail qui vient de TextField
  const handleMailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMail(event.target.value.toLowerCase());
  };
  //Met à jour le mot de passe qui vient de TextField
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: mail, password: password }),
      });

      if (!response.ok) {
        throw new Error("Email ou mot de passe incorrecte");
      }

      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!meResponse.ok) {
        throw new Error("Impossible de récupérer les informations utilisateur");
      }

      const user = await meResponse.json();
      console.log("Info user: ", user);
      setUser(user);
      router.push("/dashboard");
    } catch (error) {
      setError("Email ou mot de passe incorrecte");
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Grid container sx={{ height: "100vh", overflow: "hidden" }}>
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f4f6f8",
          padding: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            overflow: "hidden",
            position: "relative",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Container maxWidth="xs" sx={{ padding: "50px" }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{
                color: "#000000",
                display: "flex",
                justifyContent: "center",
              }}
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
                      label="E-mail"
                      margin="normal"
                      variant="outlined"
                      value={mail}
                      onChange={handleMailChange}
                    />
                    <Tooltip title="Contactez votre administrateur">
                      <Link href="#" variant="body2">
                        Pas de compte?
                      </Link>
                    </Tooltip>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      sx={{ mt: 2, bgcolor: "#6366F1" }}
                    >
                      Suivant
                    </Button>
                  </form>
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
                    />
                    <Link href="#" variant="body2">
                      Mot de passe oublié?
                    </Link>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleLogin}
                      sx={{ mt: 2, bgcolor: "#6366F1" }}
                    >
                      Connexion
                    </Button>
                  </form>
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      margin: "5px",
                    }}
                  >
                    <Button variant="text" onClick={handleBack}>
                      Retour
                    </Button>
                  </Box>
                  {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                      {error}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Container>
        </Paper>
      </Grid>

      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          backgroundColor: theme.palette.primary.dark,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          textAlign: "center",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Box sx={{ width: "100%", height: "100%" }}>
          <img
            src="/ticketeaseteams.png"
            alt="TicketEase Team"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      </Grid>
    </Grid>
  );
};

export default LoginPage;
