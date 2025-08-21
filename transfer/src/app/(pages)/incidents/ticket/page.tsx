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

function remainingText(deadlineIso?: string | null): string {
  if (!deadlineIso) {
    return "-";
  }
  const end = new Date(deadlineIso).getTime();
  const now = Date.now();
  let diff = end - now;
  const late = diff < 0;
  if (late) {
    diff = -diff;
  }
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (late) {
    return "En retard " + String(hours) + "h " + String(minutes) + "m";
  } else {
    return String(hours) + "h " + String(minutes) + "m";
  }
}

function deadlineFromCreation(
  creationIso?: string,
  minutes?: number | null
): string | null {
  if (!creationIso) {
    return null;
  }
  if (!minutes || minutes <= 0) {
    return null;
  }
  const base = new Date(creationIso).getTime();
  const out = new Date(base + minutes * 60 * 1000).toISOString();
  return out;
}

function isOpenStatus(label?: string | null): boolean {
  if (!label) return false;
  const t = label.toLowerCase();
  if (t === "ouvert") return true;
  return false;
}

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

  // refresh remaining-time every minute
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setNowTick(Date.now());
    }, 60000);
    return () => clearInterval(id);
  }, []);

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
          const msg = err.error || "Erreur lors du chargement du ticket.";
          setErrorMessage(msg);
          setTicket(null);
        } else {
          const data = await res.json();
          const t = data.ticket || null;
          setTicket(t);
          if (t && typeof t.statusId === "number") {
            setStatusId(t.statusId);
          } else {
            setStatusId("");
          }
          if (t && typeof t.assignedToId === "number") {
            setAssignedToId(t.assignedToId);
          } else {
            setAssignedToId("");
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
            const item: StatusItem = { id: s.id, label: s.label };
            list.push(item);
          }
        }
        setStatuses(list);
      } catch (e) {
        setStatuses([]);
      }

      setLoading(false);
    }

    loadAll();
  }, [ticketIdParam]);

  // load group members (only from assignmentGroup)
  useEffect(() => {
    async function loadUsers() {
      if (!ticket || typeof ticket.assignmentGroupId !== "number") {
        setUsers([]);
        return;
      }
      try {
        const res = await fetch(
          "/api/groupes/view-users?groupId=" + String(ticket.assignmentGroupId)
        );
        const data = await res.json();
        const list: UserItem[] = [];
        if (Array.isArray(data)) {
          for (let i = 0; i < data.length; i++) {
            const u = data[i];
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

  function getClosedStatusId(): number | null {
    let closedId: number | null = null;
    for (let i = 0; i < statuses.length; i++) {
      const text = (statuses[i].label || "").toLowerCase();
      // cover common labels you might use
      if (
        text === "clôturé" ||
        text === "cloturé" || // just in case accents differ
        text === "fermé" ||
        text === "ferme" ||
        text === "clos" ||
        text === "closed"
      ) {
        closedId = statuses[i].id;
        break;
      }
    }
    return closedId;
  }

  async function saveTicket() {
    if (!ticket) {
      return;
    }

    const closedId = getClosedStatusId();
    if (
      typeof statusId === "number" &&
      closedId !== null &&
      statusId === closedId
    ) {
      // If user selected the closed status in the dropdown,
      // just run the close flow and exit.
      await closeTicket();
      return;
    }

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
        const msg = (data && data.error) || "Erreur lors de l'enregistrement.";
        setErrorMessage(msg);
        alert(msg);
      } else {
        const reload = await fetch(
          "/api/incidents/get-ticket?id=" + String(ticket.id)
        );
        const fresh = await reload.json();
        setTicket(fresh.ticket);
        if (typeof fresh.ticket.statusId === "number") {
          setStatusId(fresh.ticket.statusId);
        }
        if (typeof fresh.ticket.assignedToId === "number") {
          setAssignedToId(fresh.ticket.assignedToId);
        }
      }
    } catch (e) {
      setErrorMessage("Erreur réseau.");
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  async function closeTicket() {
    if (!ticket) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      let closedStatusId: number | null = null;
      for (let i = 0; i < statuses.length; i++) {
        console.log(statuses[i]);
        const text = (statuses[i].label || "").toLowerCase();
        if (text === "clôturé") {
          closedStatusId = statuses[i].id;
          break;
        }
      }
      if (!closedStatusId) {
        alert("Statut 'Clôturé' introuvable.");
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
        const msg = (data && data.error) || "Erreur lors de la clôture.";
        setErrorMessage(msg);
        alert(msg);
      } else {
        const reload = await fetch(
          "/api/incidents/get-ticket?id=" + String(ticket.id)
        );
        const fresh = await reload.json();
        setTicket(fresh.ticket);
        if (typeof fresh.ticket.statusId === "number") {
          setStatusId(fresh.ticket.statusId);
        }
      }
    } catch (e) {
      setErrorMessage("Erreur réseau.");
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  async function addComment() {
    if (!ticket) {
      return;
    }
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
          (data && data.error) || "Erreur lors de l'ajout du commentaire.";
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

  // compute resolution deadline from creation + sla.resolutionTime
  let resolutionDeadlineIso: string | null = null;
  if (ticket.sla && typeof ticket.sla.resolutionTime === "number") {
    resolutionDeadlineIso = deadlineFromCreation(
      ticket.creationDate,
      ticket.sla.resolutionTime
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
                label="crée par"
                value={
                  ticket.createdBy.firstName + " " + ticket.createdBy.lastName
                }
                margin="dense"
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

              {/* SLA réponse */}
              <TextField
                fullWidth
                label="Date limite de réponse (SLA)"
                value={
                  ticket.responseDate
                    ? new Date(ticket.responseDate).toLocaleString()
                    : "Répondu"
                }
                margin="dense"
                disabled
              />
              <Typography sx={{ mb: 1 }}>
                {ticket.responseDate && isOpenStatus(ticket.status?.label)
                  ? "Temps restant (réponse): " +
                    remainingText(ticket.responseDate)
                  : "Temps restant (réponse): —"}
              </Typography>

              {/* SLA résolution */}
              <TextField
                fullWidth
                label="Date limite de résolution (SLA)"
                value={
                  ticket.closedDate
                    ? "Clos"
                    : resolutionDeadlineIso
                      ? new Date(resolutionDeadlineIso).toLocaleString()
                      : "-"
                }
                margin="dense"
                disabled
              />
              <Typography sx={{ mb: 2 }}>
                {ticket.closedDate
                  ? "Temps restant (résolution): —"
                  : resolutionDeadlineIso
                    ? "Temps restant (résolution): " +
                      remainingText(resolutionDeadlineIso)
                    : "Temps restant (résolution): —"}
              </Typography>

              <Typography sx={{ mt: 2, mb: 0.5 }}>Statut</Typography>
              <Select
                fullWidth
                size="small"
                value={statusId}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (isNaN(v)) {
                    setStatusId("");
                  } else {
                    setStatusId(v);
                  }
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
                  if (isNaN(v)) {
                    setAssignedToId("");
                  } else {
                    setAssignedToId(v);
                  }
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
