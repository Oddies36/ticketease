"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  List,
  ListItem,
} from "@mui/material";

type StatusItem = { id: number; label: string };
type UserItem = { id: number; firstName: string; lastName: string };

export default function TicketPage() {
  const search = useSearchParams();
  const router = useRouter();
  const ticketIdParam = search.get("id") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [ticket, setTicket] = useState<any>(null);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [statusId, setStatusId] = useState<number | "">("");
  const [assignedToId, setAssignedToId] = useState<number | "">("");
  const [newComment, setNewComment] = useState<string>("");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setErrorMessage("");

      // ticket details
      try {
        const res = await fetch(
          "/api/incidents/get-ticket?id=" + encodeURIComponent(ticketIdParam)
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErrorMessage(err.error || "Erreur lors du chargement du ticket.");
          setTicket(null);
        } else {
          const data = await res.json();
          setTicket(data.ticket || null);
          if (data.ticket) {
            if (typeof data.ticket.statusId === "number") {
              setStatusId(data.ticket.statusId);
            } else {
              setStatusId("");
            }
            if (typeof data.ticket.assignedToId === "number") {
              setAssignedToId(data.ticket.assignedToId);
            } else {
              setAssignedToId("");
            }
          }
        }
      } catch (e) {
        setErrorMessage("Erreur réseau (ticket).");
        setTicket(null);
      }

      // statuses
      try {
        const res = await fetch("/api/incidents/statuses");
        const data = await res.json();
        const list: StatusItem[] = [];
        if (data && Array.isArray(data.statuses)) {
          for (let i = 0; i < data.statuses.length; i++) {
            const s = data.statuses[i];
            list.push({ id: s.id, label: s.label });
          }
        }
        setStatuses(list);
      } catch (e) {
        setStatuses([]);
      }

      // users in the ticket location
      try {
        if (ticket && ticket.location && ticket.location.name) {
          // if ticket already loaded; otherwise load after first pass
        }
      } catch (e) {}

      setLoading(false);
    }

    loadAll();
  }, [ticketIdParam]);

  // load users after ticket is present (need location name)
  useEffect(() => {
    async function loadUsers() {
      if (!ticket || !ticket.location || !ticket.location.name) {
        setUsers([]);
        return;
      }
      try {
        const url =
          "/api/users/by-location?location=" +
          encodeURIComponent(ticket.location.name);
        const res = await fetch(url);
        const data = await res.json();
        const list: UserItem[] = [];
        if (data && Array.isArray(data.users)) {
          for (let i = 0; i < data.users.length; i++) {
            const u = data.users[i];
            list.push({
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
            });
          }
        }
        setUsers(list);
      } catch (e) {
        setUsers([]);
      }
    }
    loadUsers();
  }, [ticket]);

  async function saveTicket() {
    if (!ticket) return;

    setSaving(true);
    setErrorMessage("");

    const body: any = {
      ticketId: ticket.id,
      statusId: statusId === "" ? null : statusId,
      assignedToId: assignedToId === "" ? null : assignedToId,
    };

    try {
      const res = await fetch("/api/incidents/update-ticket", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data && data.error ? data.error : "Erreur lors de l'enregistrement.";
        setErrorMessage(msg);
        alert(msg);
      } else {
        // refresh
        const reload = await fetch(
          "/api/incidents/get-ticket?id=" + String(ticket.id)
        );
        const fresh = await reload.json();
        setTicket(fresh.ticket);
        if (typeof fresh.ticket.statusId === "number")
          setStatusId(fresh.ticket.statusId);
        if (typeof fresh.ticket.assignedToId === "number")
          setAssignedToId(fresh.ticket.assignedToId);
      }
    } catch (e) {
      setErrorMessage("Erreur réseau.");
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  async function closeTicket() {
    if (!ticket) return;

    setSaving(true);
    setErrorMessage("");

    try {
      // find "Fermé"
      let closedStatusId: number | null = null;
      for (let i = 0; i < statuses.length; i++) {
        if (
          statuses[i].label.toLowerCase() === "fermé" ||
          statuses[i].label.toLowerCase() === "ferme"
        ) {
          closedStatusId = statuses[i].id;
          break;
        }
      }
      if (!closedStatusId) {
        alert("Statut 'Fermé' introuvable.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/incidents/update-ticket", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          statusId: closedStatusId,
          close: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data && data.error ? data.error : "Erreur lors de la clôture.";
        setErrorMessage(msg);
        alert(msg);
      } else {
        const reload = await fetch(
          "/api/incidents/get-ticket?id=" + String(ticket.id)
        );
        const fresh = await reload.json();
        setTicket(fresh.ticket);
        if (typeof fresh.ticket.statusId === "number")
          setStatusId(fresh.ticket.statusId);
      }
    } catch (e) {
      setErrorMessage("Erreur réseau.");
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  async function addComment() {
    if (!ticket) return;
    if (!newComment) {
      alert("Le commentaire est vide.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/incidents/add-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, content: newComment }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data && data.error
            ? data.error
            : "Erreur lors de l'ajout du commentaire.";
        alert(msg);
      } else {
        setNewComment("");
        const reload = await fetch(
          "/api/incidents/get-ticket?id=" + String(ticket.id)
        );
        const fresh = await reload.json();
        setTicket(fresh.ticket);
      }
    } catch (e) {
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Ticket
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Ticket
        </Typography>
        <Typography>{errorMessage || "Ticket introuvable."}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Ticket {ticket.number}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <TextField
                fullWidth
                label="Titre"
                value={ticket.title || ""}
                margin="dense"
                disabled
              />
              <TextField
                fullWidth
                label="Description"
                value={ticket.description || ""}
                margin="dense"
                multiline
                minRows={3}
                disabled
              />
              <TextField
                fullWidth
                label="Localisation"
                value={ticket.location ? ticket.location.name : ""}
                margin="dense"
                disabled
              />
              <TextField
                fullWidth
                label="Priorité"
                value={ticket.priority ? ticket.priority.label : ""}
                margin="dense"
                disabled
              />
              <TextField
                fullWidth
                label="Catégorie"
                value={ticket.category ? ticket.category.label : ""}
                margin="dense"
                disabled
              />

              <Typography sx={{ mt: 2, mb: 0.5 }}>Statut</Typography>
              <Select
                fullWidth
                size="small"
                value={statusId}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (isNaN(v)) setStatusId("");
                  else setStatusId(v);
                }}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Sélectionner
                </MenuItem>
                {statuses.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>

              <Typography sx={{ mt: 2, mb: 0.5 }}>Assigner à</Typography>
              <Select
                fullWidth
                size="small"
                value={assignedToId}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (isNaN(v)) setAssignedToId("");
                  else setAssignedToId(v);
                }}
                displayEmpty
              >
                <MenuItem value="">Non assigné</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </MenuItem>
                ))}
              </Select>

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={saveTicket}
                  disabled={saving}
                >
                  Enregistrer
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={closeTicket}
                  disabled={saving}
                >
                  Clore le ticket
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Retour
                </Button>
              </Box>

              {errorMessage ? (
                <Typography sx={{ mt: 1 }}>{errorMessage}</Typography>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Commentaires
              </Typography>

              <List dense>
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c: any) => (
                    <ListItem key={c.id} sx={{ display: "block" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {c.createdBy
                          ? c.createdBy.firstName + " " + c.createdBy.lastName
                          : "Utilisateur"}
                        {" - "}
                        {new Date(c.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">{c.content}</Typography>
                    </ListItem>
                  ))
                ) : (
                  <Typography>Aucun commentaire.</Typography>
                )}
              </List>

              <TextField
                fullWidth
                label="Nouveau commentaire"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                margin="dense"
                multiline
                minRows={2}
              />
              <Button
                variant="contained"
                onClick={addComment}
                disabled={saving || !newComment}
              >
                Ajouter
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
