"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  CircularProgress,
  TableContainer,
  TablePagination,
} from "@mui/material";

// Structure d'une tâche reçue depuis l'API
type TaskRow = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  closedDate?: string | null;
  responseDate?: string | null;
  status?: { label: string } | null;
  priority?: { label: string } | null;
  assignmentGroup?: { groupName: string | null } | null;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  sla?: { responseTime: number; resolutionTime: number } | null;
  isBreached: boolean;
};

type Order = "asc" | "desc";

export default function TaskListPage() {
  const router = useRouter();
  const search = useSearchParams();

  // paramètres de l'URL
  const locationName = search.get("localisation") || "";
  const breached = search.get("breached") || "";

  // états liés aux données
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  // tri
  const [orderBy, setOrderBy] = useState<keyof TaskRow>("number");
  const [order, setOrder] = useState<Order>("asc");

  // pagination
  const [page, setPage] = useState(0);
  const rowsPerPage = 30;

  // rafraîchit le temps restant
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Chargement des tâches
  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setErrorMessage("");

      try {
        let url =
          "/api/tasks/listbylocation?location=" +
          encodeURIComponent(locationName);

        if (breached) url += "&breached=1";

        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg =
            (err && (err as any).error) ||
            "Erreur lors du chargement des demandes.";
          setErrorMessage(msg);
          setTasks([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      } catch {
        setErrorMessage("Erreur réseau.");
        setTasks([]);
      }

      setLoading(false);
    }

    if (locationName.trim()) {
      loadTasks();
    } else {
      setErrorMessage("Paramètre 'localisation' manquant.");
      setTasks([]);
      setLoading(false);
    }
  }, [locationName, breached]);

  // Navigation vers une tâche
  function openTask(id: number) {
    router.push("/tasks/task?id=" + String(id));
  }

  // Affiche temps restant ou "En retard"
  function formatRemaining(deadline: string): string {
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;
    if (diff <= 0) return "En retard";
    const totalMinutes = Math.floor(diff / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m restants`;
  }

  // SLA Réponse avant première réponse
  function formatSlaResponse(task: TaskRow): React.ReactNode {
    if (task.responseDate) {
      const deadline = new Date(task.responseDate).getTime();
      if (now > deadline || task.isBreached) {
        return <span style={{ color: "red" }}>En retard</span>;
      }
      return <>{formatRemaining(task.responseDate)}</>;
    }
    return <>Répondu</>;
  }

  // SLA Résolution avant clôture
  function formatSlaResolution(task: TaskRow): React.ReactNode {
    if (task.closedDate) {
      return <>Clos</>;
    }
    if (task.sla?.resolutionTime) {
      const deadline =
        new Date(task.creationDate).getTime() + task.sla.resolutionTime * 60000;
      if (now > deadline || task.isBreached) {
        return <span style={{ color: "red" }}>En retard</span>;
      }
      return <>{formatRemaining(new Date(deadline).toISOString())}</>;
    }
    return <>-</>;
  }

  // Valeur numérique pour tri SLA Réponse
  function getSlaResponseSortValue(task: TaskRow): number {
    if (!task.responseDate) return 0; // déjà répondu
    const deadline = new Date(task.responseDate).getTime();
    return deadline - now; // négatif = en retard, positif = temps restant
  }

  // Valeur numérique pour tri SLA Résolution
  function getSlaResolutionSortValue(task: TaskRow): number {
    if (task.closedDate) return 0;
    if (task.sla?.resolutionTime) {
      const deadline =
        new Date(task.creationDate).getTime() + task.sla.resolutionTime * 60000;
      return deadline - now;
    }
    return 0;
  }

  // Permet d'obtenir une valeur triable pour chaque colonne
  function getSortableValue(
    task: TaskRow,
    key: keyof TaskRow | "slaResolution"
  ): any {
    switch (key) {
      case "status":
        return task.status?.label || "";
      case "priority":
        return task.priority?.label || "";
      case "assignedTo":
        return task.assignedTo
          ? `${task.assignedTo.lastName} ${task.assignedTo.firstName}`
          : "";
      case "creationDate":
        return task.creationDate ? new Date(task.creationDate).getTime() : 0;
      case "closedDate":
        return task.closedDate ? new Date(task.closedDate).getTime() : 0;
      case "responseDate":
        return getSlaResponseSortValue(task);
      case "slaResolution":
        return getSlaResolutionSortValue(task);
      case "number":
        return task.number || "";
      default:
        return (task as any)[key] ?? "";
    }
  }

  // Tri et pagination
  const handleSort = (property: keyof TaskRow | "slaResolution") => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property as keyof TaskRow);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aValue = getSortableValue(a, orderBy);
    const bValue = getSortableValue(b, orderBy);
    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedTasks = sortedTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Demandes - {locationName || "-"}
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Demandes - {locationName || "-"} {breached ? "en retard" : ""}
      </Typography>

      {errorMessage && <Typography sx={{ mb: 2 }}>{errorMessage}</Typography>}

      <Paper sx={{ width: "100%" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  { id: "number", label: "Numéro" },
                  { id: "title", label: "Titre" },
                  { id: "status", label: "Statut" },
                  { id: "priority", label: "Priorité" },
                  { id: "assignedTo", label: "Assigné à" },
                  { id: "responseDate", label: "SLA réponse" },
                  { id: "slaResolution", label: "SLA résolution" },
                  { id: "creationDate", label: "Créé le" },
                ].map((col) => (
                  <TableCell key={col.id}>
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : "asc"}
                      onClick={() => handleSort(col.id as any)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTasks.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => openTask(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{t.number}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.status?.label || "-"}</TableCell>
                  <TableCell>{t.priority?.label || "-"}</TableCell>
                  <TableCell>
                    {t.assignedTo
                      ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatSlaResponse(t)}</TableCell>
                  <TableCell>{formatSlaResolution(t)}</TableCell>
                  <TableCell>
                    {new Date(t.creationDate).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={tasks.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[30]}
          labelRowsPerPage="Lignes par page"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
}
