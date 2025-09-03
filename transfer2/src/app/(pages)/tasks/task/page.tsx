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

// Type pour un statut
type StatusItem = { id: number; label: string };

// Type pour un utilisateur assignable
type UserItem = { id: number; firstName: string; lastName: string };

export default function TaskPage() {
  const search = useSearchParams();
  const router = useRouter();
  const taskIdParam = search.get("id") || ""; // ID de la tâche reçu dans l'URL

  // états de chargement et d'erreurs
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // données principales
  const [task, setTask] = useState<any>(null);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  // champs éditables
  const [statusId, setStatusId] = useState<number | "">("");
  const [assignedToId, setAssignedToId] = useState<number | "">("");
  const [newComment, setNewComment] = useState<string>("");

  // Chargement de la tâche + statuts
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setErrorMessage("");

      try {
        const res = await fetch(
          "/api/tasks/get?id=" + encodeURIComponent(taskIdParam)
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErrorMessage(
            err.error || "Erreur lors du chargement de la demande."
          );
          setTask(null);
        } else {
          const data = await res.json();
          setTask(data.task || null);
          if (data.task) {
            if (typeof data.task.statusId === "number") {
              setStatusId(data.task.statusId);
            } else {
              setStatusId("");
            }
            if (typeof data.task.assignedToId === "number") {
              setAssignedToId(data.task.assignedToId);
            } else {
              setAssignedToId("");
            }
          }
        }
      } catch (e) {
        setErrorMessage("Erreur réseau (demande).");
        setTask(null);
      }

      try {
        // on réutilise l'API incidents/statuses pour récupérer les statuts
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

      setLoading(false);
    }

    loadAll();
  }, [taskIdParam]);

  // Chargement des utilisateurs assignables
  useEffect(() => {
    async function loadUsers() {
      if (!task || typeof task.assignmentGroupId !== "number") {
        setUsers([]);
        return;
      }
      try {
        const url =
          "/api/groupes/view-users?groupId=" + String(task.assignmentGroupId);
        const res = await fetch(url);
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
  }, [task]);

  // Récupère l'ID du statut "Clôturé"
  function getClosedStatusId(): number | null {
    let closedId: number | null = null;
    for (let i = 0; i < statuses.length; i++) {
      const text = (statuses[i].label || "").toLowerCase();
      if (
        text === "clôturé" ||
        text === "cloturé" ||
        text === "fermé" ||
        text === "ferme" ||
        text === "closed"
      ) {
        closedId = statuses[i].id;
        break;
      }
    }
    return closedId;
  }

  // Sauvegarde
  async function saveTask() {
    if (!task) {
      return;
    }

    const closedId = getClosedStatusId();
    // si statut = "clôturé", on appelle directement closeTask()
    if (
      typeof statusId === "number" &&
      closedId !== null &&
      statusId === closedId
    ) {
      await closeTask();
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const body: any = {
      ticketId: task.id,
      statusId: statusId === "" ? null : statusId,
      assignedToId: assignedToId === "" ? null : assignedToId,
    };

    try {
      const res = await fetch("/api/tasks/update", {
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
        const reload = await fetch("/api/tasks/get?id=" + String(task.id));
        const fresh = await reload.json();
        setTask(fresh.task);
        if (typeof fresh.task.statusId === "number") {
          setStatusId(fresh.task.statusId);
        }
        if (typeof fresh.task.assignedToId === "number") {
          setAssignedToId(fresh.task.assignedToId);
        }
      }
    } catch (e) {
      setErrorMessage("Erreur réseau.");
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  // Clôture
  async function closeTask() {
    if (!task) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      let closedStatusId: number | null = getClosedStatusId();
      if (!closedStatusId) {
        alert("Statut 'Clôturé' introuvable.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: task.id,
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
        const reload = await fetch("/api/tasks/get?id=" + String(task.id));
        const fresh = await reload.json();
        setTask(fresh.task);
        if (typeof fresh.task.statusId === "number") {
          setStatusId(fresh.task.statusId);
        }
      }
    } catch (e) {
      setErrorMessage("Erreur réseau.");
      alert("Erreur réseau.");
    }

    setSaving(false);
  }

  // Ajout de commentaire
  async function addComment() {
    if (!task) return;
    if (!newComment) {
      alert("Le commentaire est vide.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/tasks/addcomment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: task.id, content: newComment }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          (data && data.error) || "Erreur lors de l'ajout du commentaire.";
        alert(msg);
      } else {
        setNewComment("");
        // recharge les commentaires
        const reload = await fetch("/api/tasks/get?id=" + String(task.id));
        const fresh = await reload.json();
        setTask(fresh.task);
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
          Demande
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Demande
        </Typography>
        <Typography>{errorMessage || "Demande introuvable."}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Demande {task.number}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ backgroundColor: "#f4f5f7" }}>
            <CardContent>
              <TextField
                fullWidth
                label="Titre"
                value={task.title || ""}
                margin="dense"
                disabled
              />
              <TextField
                fullWidth
                label="Créé par"
                value={
                  task.createdBy
                    ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                    : ""
                }
                margin="dense"
                multiline
                disabled
              />
              <TextField
                fullWidth
                label="Description"
                value={task.description || ""}
                margin="dense"
                multiline
                minRows={3}
                disabled
              />
              <TextField
                fullWidth
                label="Localisation"
                value={task.location ? task.location.name : ""}
                margin="dense"
                disabled
              />
              <TextField
                fullWidth
                label="Priorité"
                value={task.priority ? task.priority.label : ""}
                margin="dense"
                disabled
              />
              <TextField
                fullWidth
                label="Catégorie"
                value={task.category ? task.category.label : ""}
                margin="dense"
                disabled
              />
              <TextField
                fullWidth
                label="Approuvée"
                value={task.isApproved ? "Oui" : "Non"}
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
                  onClick={saveTask}
                  disabled={saving}
                >
                  Enregistrer
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={closeTask}
                  disabled={saving}
                >
                  Clore la demande
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
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((c: any) => (
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
