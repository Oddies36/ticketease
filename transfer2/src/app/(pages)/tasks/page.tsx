"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";

/**
 * Type : PendingItem
 * Description :
 *   Représente une demande en attente d'approbation.
 */
type PendingItem = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  createdBy?: { firstName: string; lastName: string } | null;
};

/**
 * Composant: Tasks
 * Description:
 *   Page d'accueil des demandes (tasks). Affiche un bouton de création,
 *   une aide contextuelle, la liste des localisations accessibles à
 *   l'utilisateur et les demandes en attente d'approbation.
 *
 * Sources de données:
 *   - Localisations tasks : /api/groupes/available-locations?prefix=Support.Tasks.
 *   - Demandes en attente : /api/tasks/pendingapprovals
 */
const Tasks: React.FC = () => {
  /* ============================== ETATS ============================== */

  // Liste des noms de localisations accessibles pour les tâches
  const [locations, setLocations] = useState<string[]>([]);

  // Liste des demandes en attente d'approbation
  const [pending, setPending] = useState<PendingItem[]>([]);

  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const router = useRouter();

  /* ============================ USE EFFECTS =========================== */

  /**
   * Effet:
   *   Charge la liste des localisations disponibles pour les tâches.
   */
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch(
          "/api/groupes/available-locations?prefix=Support.Taches."
        );
        const data = await res.json();
        if (data && Array.isArray(data.locations)) {
          setLocations(data.locations);
        } else {
          setLocations([]);
        }
      } catch {
        setLocations([]);
      }
    }
    fetchLocations();
  }, []);

  /**
   * Effet:
   *   Charge les demandes en attente d'approbation.
   */
  useEffect(() => {
    async function fetchPending() {
      setLoadingPending(true);
      try {
        const res = await fetch("/api/tasks/pendingapprovals");
        if (!res.ok) {
          setPending([]);
        } else {
          const data = await res.json();
          if (data && Array.isArray(data.tasks)) {
            setPending(data.tasks);
          } else {
            setPending([]);
          }
        }
      } catch {
        setPending([]);
      }
      setLoadingPending(false);
    }
    fetchPending();
  }, []);

  /* ============================ HANDLERS ============================ */

  async function handleApprove(ticketId: number) {
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, approve: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Erreur lors de l'approbation.");
        return;
      }
      setPending((prev) => prev.filter((p) => p.id !== ticketId));
      alert("Demande approuvée.");
    } catch {
      alert("Erreur réseau.");
    }
  }

  async function handleReject(ticketId: number) {
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, approve: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Erreur lors du refus.");
        return;
      }
      setPending((prev) => prev.filter((p) => p.id !== ticketId));
      alert("Demande refusée.");
    } catch {
      alert("Erreur réseau.");
    }
  }

  /* ================================ RENDER ================================ */

  return (
    <Box>
      {/* Titre */}
      <Typography variant="h4" mb={3}>
        Demandes
      </Typography>

      {/* Bandeau: action principale + aide contextuelle */}
      <Grid container spacing={5} alignItems="flex-start">
        {/* Colonne action: création d'une demande */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/tasks/new-task")}
            >
              Créer une demande
            </Button>
          </Box>
        </Grid>

        {/* Séparateur vertical */}
        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

        {/* Colonne aide */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Quand créer une demande ?
            </Typography>
            <Typography variant="body2">
              Créez une demande pour une action planifiée (logiciel, accès,
              matériel, etc.). Les créations d'utilisateurs et de groupes
              passent aussi par une demande.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Liste des localisations */}
      {locations.length > 0 ? (
        <Box mt={5}>
          <Typography variant="h6" gutterBottom>
            Vos localisations de support :
          </Typography>
          <List>
            {locations.map((loc) => (
              <ListItem key={loc} disablePadding sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {/* Nom de la localisation */}
                  <Typography sx={{ flex: 1 }}>{loc}</Typography>

                  {/* Voir toutes les demandes */}
                  <Button
                    variant="outlined"
                    onClick={() =>
                      router.push(
                        "/tasks/task-list?localisation=" +
                          encodeURIComponent(loc)
                      )
                    }
                  >
                    Voir
                  </Button>

                  {/* Voir uniquement les demandes en retard */}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      router.push(
                        "/tasks/task-list?localisation=" +
                          encodeURIComponent(loc) +
                          "&breached=1"
                      )
                    }
                  >
                    En retard
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      ) : null}

      {/* Section demandes à valider */}
      <Box mt={5}>
        <Typography variant="h6" gutterBottom>
          Demandes à valider (manager)
        </Typography>

        <Paper sx={{ p: 2 }}>
          {loadingPending ? (
            <Typography>Chargement…</Typography>
          ) : pending.length === 0 ? (
            <Typography>Aucune demande en attente.</Typography>
          ) : (
            <List>
              {pending.map((t) => {
                const who = t.createdBy
                  ? t.createdBy.firstName + " " + t.createdBy.lastName
                  : "-";
                return (
                  <ListItem
                    key={t.id}
                    secondaryAction={
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleApprove(t.id)}
                        >
                          Approuver
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(t.id)}
                        >
                          Refuser
                        </Button>
                      </Box>
                    }
                  >
                    <Typography>
                      {t.number} - {t.title} (créé par {who} -{" "}
                      {new Date(t.creationDate).toLocaleString()})
                    </Typography>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Tasks;
