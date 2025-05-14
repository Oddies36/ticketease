"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Typography, Container, Box, Grid, Paper, Button } from "@mui/material";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // ✅ Send the token to the server for verification
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    checkAuthentication();
  }, [router]);

  if (!isAuthenticated) {
    return null; // Do not render the dashboard until authenticated
  }

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" fontWeight="bold">Dashboard</Typography>
      <Box sx={{ flexGrow: 1, mt: 4 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Profile</Typography>
              <Button variant="contained" sx={{ mt: 1 }}>View Profile</Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Settings</Typography>
              <Button variant="contained" sx={{ mt: 1 }}>Open Settings</Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Analytics</Typography>
              <Button variant="contained" sx={{ mt: 1 }}>View Analytics</Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Reports</Typography>
              <Button variant="contained" sx={{ mt: 1 }}>Generate Report</Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}