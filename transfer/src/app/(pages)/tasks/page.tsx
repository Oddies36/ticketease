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
  ListItemButton,
  ListItemText,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";

type PendingItem = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  createdBy?: { firstName: string; lastName: string } | null;
};

const TaskPage: React.FC = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const router = useRouter();

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
      } catch (e) {
        setLocations([]);
      }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchPending() {
      setLoadingPending(true);
      try {
        const res = await fetch("/api/tasks/pendingapprovals");
        if (!res.ok) {
          setPending([]);
        } else {
          const data = await res.json();
          const list: PendingItem[] = [];
          if (data && Array.isArray(data.tasks)) {
            for (let i = 0; i < data.tasks.length; i++) {
              const t = data.tasks[i];
              list.push({
                id: t.id,
                number: t.number,
                title: t.title,
                creationDate: t.creationDate,
                createdBy: t.createdBy || null,
              });
            }
          }
          setPending(list);
        }
      } catch (e) {
        setPending([]);
      }
      setLoadingPending(false);
    }
    fetchPending();
  }, []);

  async function handleApprove(ticketId: number) {
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticketId, approve: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Erreur lors de l'approbation.");
        return;
      }
      const next: PendingItem[] = [];
      for (let i = 0; i < pending.length; i++) {
        if (pending[i].id !== ticketId) {
          next.push(pending[i]);
        }
      }
      setPending(next);
      alert("Demande approuvée.");
    } catch (e) {
      alert("Erreur réseau.");
    }
  }

  async function handleReject(ticketId: number) {
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticketId, approve: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Erreur lors du refus.");
        return;
      }
      const next: PendingItem[] = [];
      for (let i = 0; i < pending.length; i++) {
        if (pending[i].id !== ticketId) {
          next.push(pending[i]);
        }
      }
      setPending(next);
      alert("Demande refusée.");
    } catch (e) {
      alert("Erreur réseau.");
    }
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Tasks
      </Typography>

      <Grid container spacing={5} alignItems="flex-start">
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

        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

        <Grid size={{ xs: 12, md: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Quand créer une demande ?
            </Typography>
            <Typography variant="body2">
              Créez une demande pour une action planifiée (logiciel, accès,
              matériel, etc.). Les créations d’utilisateurs et de groupes
              passent aussi par une demande.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {locations.length > 0 ? (
        <Box mt={5}>
          <Typography variant="h6" gutterBottom>
            Vos localisations :
          </Typography>
          <List>
            {locations.map((loc) => (
              <ListItem key={loc} disablePadding>
                <ListItemButton
                  onClick={() =>
                    router.push(
                      "/tasks/task-list?localisation=" + encodeURIComponent(loc)
                    )
                  }
                >
                  <ListItemText primary={loc} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      ) : null}

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
                let who = "-";
                if (t.createdBy) {
                  who = t.createdBy.firstName + " " + t.createdBy.lastName;
                }
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
                    <ListItemText
                      primary={t.number + " — " + t.title}
                      secondary={
                        "Créé par " +
                        who +
                        " — " +
                        new Date(t.creationDate).toLocaleString()
                      }
                    />
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

export default TaskPage;
