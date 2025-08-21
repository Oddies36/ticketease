"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Divider,
  TableSortLabel,
} from "@mui/material";

/**
 * Structure minimale d’un ticket (incident ou tâche) renvoyé par les endpoints "mes tickets".
 */
type TicketRow = {
  id: number;
  number: string;
  title: string;
  creationDate: string;
  closedDate?: string | null;
  responseDate?: string | null;
  status?: { label: string } | null;
  priority?: { label: string } | null;
  assignedTo?: { id: number; firstName: string; lastName: string } | null;
  sla?: { responseTime: number; resolutionTime: number } | null;
};

type ColumnKey =
  | "number"
  | "title"
  | "status"
  | "priority"
  | "assignedTo"
  | "slaResponse"
  | "slaResolution"
  | "creationDate";

type Order = "asc" | "desc";

/**
 * Page: Mes tickets
 * - Deux tableaux (Incidents / Tâches)
 * - Toutes les colonnes triables
 * - Clic -> page de détail correspondante
 * Endpoints attendus:
 *   - GET /api/incidents/myinc  -> { tickets: TicketRow[] }
 *   - GET /api/tasks/mytask     -> { tasks: TicketRow[] } ou { tickets: TicketRow[] }
 */
export default function MyTicketsPage() {
  /* ============================== ÉTATS ============================== */
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [incidentTickets, setIncidentTickets] = useState<TicketRow[]>([]);
  const [taskTickets, setTaskTickets] = useState<TicketRow[]>([]);

  // Tri incidents
  const [incSortBy, setIncSortBy] = useState<ColumnKey>("creationDate");
  const [incOrder, setIncOrder] = useState<Order>("desc");

  // Tri tâches
  const [taskSortBy, setTaskSortBy] = useState<ColumnKey>("creationDate");
  const [taskOrder, setTaskOrder] = useState<Order>("desc");

  // Tick toutes les 60s pour recalcul SLA à l’affichage (impacte tri SLA aussi)
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  /* ============================ DATA FETCH =========================== */
  useEffect(() => {
    async function loadMyTickets() {
      setLoading(true);
      setErrorMessage("");

      try {
        // Incidents
        const resInc = await fetch("/api/incidents/myinc");
        let inc: TicketRow[] = [];
        if (resInc.ok) {
          const d = await resInc.json();
          if (Array.isArray(d?.tickets)) inc = d.tickets;
        }

        // Tâches
        const resTask = await fetch("/api/tasks/mytask");
        let tasks: TicketRow[] = [];
        if (resTask.ok) {
          const dt = await resTask.json();
          if (Array.isArray(dt?.tasks)) tasks = dt.tasks;
          else if (Array.isArray(dt?.tickets)) tasks = dt.tickets;
        }

        setIncidentTickets(inc);
        setTaskTickets(tasks);

        if (!resInc.ok && !resTask.ok) {
          setErrorMessage("Erreur lors du chargement de vos tickets.");
        }
      } catch {
        setErrorMessage("Erreur réseau.");
        setIncidentTickets([]);
        setTaskTickets([]);
      } finally {
        setLoading(false);
      }
    }

    loadMyTickets();
  }, []);

  /* ======================== HELPERS & TRI ======================== */

  function openIncident(id: number) {
    router.push("/incidents/ticket?id=" + String(id));
  }
  function openTask(id: number) {
    // Adapte le chemin si différent dans ton app
    router.push("/tasks/task?id=" + String(id));
  }

  function isOpenStatus(label?: string | null): boolean {
    if (!label) return false;
    return label.toLowerCase() === "ouvert";
  }

  function addMinutes(iso: string, minutes: number): number {
    const t = new Date(iso).getTime();
    return t + minutes * 60000;
  }

  // Valeur d’affichage SLA réponse
  function displaySlaResponse(t: TicketRow): string {
    if (t.responseDate && isOpenStatus(t.status?.label)) {
      const end = new Date(t.responseDate).getTime();
      let diff = end - now;
      const late = diff < 0;
      if (late) diff = -diff;
      const totalMin = Math.floor(diff / 60000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return late ? `En retard ${h}h ${m}m` : `${h}h ${m}m`;
    }
    return "Répondu";
  }

  // Valeur d’affichage SLA résolution
  function displaySlaResolution(t: TicketRow): string {
    if (t.closedDate) return "Clos";
    if (t.sla?.resolutionTime != null) {
      const end = addMinutes(t.creationDate, t.sla.resolutionTime);
      let diff = end - now;
      const late = diff < 0;
      if (late) diff = -diff;
      const totalMin = Math.floor(diff / 60000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return late ? `En retard ${h}h ${m}m` : `${h}h ${m}m`;
    }
    return "-";
  }

  // Clés de tri calculables (numériques pour SLA et dates; texte pour le reste)
  function sortValue(t: TicketRow, key: ColumnKey): number | string {
    switch (key) {
      case "number":
        return (t.number || "").toLowerCase();
      case "title":
        return (t.title || "").toLowerCase();
      case "status":
        return (t.status?.label || "").toLowerCase();
      case "priority":
        return (t.priority?.label || "").toLowerCase();
      case "assignedTo":
        return t.assignedTo
          ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`.toLowerCase()
          : ""; // les non assignés en haut en tri asc
      case "creationDate":
        return new Date(t.creationDate).getTime();
      case "slaResponse": {
        // Tickets ouverts avec responseDate: temps restant (peut être négatif si en retard) -> tri pertinent
        // Sinon -> Infinity pour les mettre en bas en tri asc
        if (t.responseDate && isOpenStatus(t.status?.label)) {
          return new Date(t.responseDate).getTime() - now;
        }
        return Number.POSITIVE_INFINITY;
      }
      case "slaResolution": {
        // Tickets clos ou sans SLA -> Infinity (en bas en tri asc)
        if (t.closedDate) return Number.POSITIVE_INFINITY;
        if (t.sla?.resolutionTime != null) {
          const end = addMinutes(t.creationDate, t.sla.resolutionTime);
          return end - now; // négatif = en retard
        }
        return Number.POSITIVE_INFINITY;
      }
      default:
        return "";
    }
  }

  function compare(
    a: TicketRow,
    b: TicketRow,
    key: ColumnKey,
    order: Order
  ): number {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    let res: number;
    if (typeof av === "number" && typeof bv === "number") {
      res = av - bv;
    } else {
      res = String(av).localeCompare(String(bv), "fr", {
        numeric: true,
        sensitivity: "base",
      });
    }
    return order === "asc" ? res : -res;
  }

  function sortTickets(rows: TicketRow[], key: ColumnKey, order: Order) {
    return [...rows].sort((a, b) => compare(a, b, key, order));
  }

  function toggleIncSort(key: ColumnKey) {
    if (incSortBy === key) {
      setIncOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setIncSortBy(key);
      setIncOrder("asc");
    }
  }

  function toggleTaskSort(key: ColumnKey) {
    if (taskSortBy === key) {
      setTaskOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setTaskSortBy(key);
      setTaskOrder("asc");
    }
  }

  const incRows = sortTickets(incidentTickets, incSortBy, incOrder);
  const taskRows = sortTickets(taskTickets, taskSortBy, taskOrder);

  /* ================================ RENDER ================================ */

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Mes tickets
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Mes tickets
      </Typography>

      {errorMessage ? (
        <Typography sx={{ mb: 2 }}>{errorMessage}</Typography>
      ) : null}

      {/* ========================= Incidents ========================= */}
      <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
        Incidents
      </Typography>

      <Paper sx={{ width: "100%", mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sortDirection={incSortBy === "number" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "number"}
                  direction={incSortBy === "number" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("number")}
                >
                  Numéro
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={incSortBy === "title" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "title"}
                  direction={incSortBy === "title" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("title")}
                >
                  Titre
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={incSortBy === "status" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "status"}
                  direction={incSortBy === "status" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("status")}
                >
                  Statut
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={incSortBy === "priority" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "priority"}
                  direction={incSortBy === "priority" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("priority")}
                >
                  Priorité
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={incSortBy === "assignedTo" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "assignedTo"}
                  direction={incSortBy === "assignedTo" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("assignedTo")}
                >
                  Assigné à
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={incSortBy === "slaResponse" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "slaResponse"}
                  direction={incSortBy === "slaResponse" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("slaResponse")}
                >
                  SLA réponse
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={incSortBy === "slaResolution" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "slaResolution"}
                  direction={incSortBy === "slaResolution" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("slaResolution")}
                >
                  SLA résolution
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={incSortBy === "creationDate" ? incOrder : false}
              >
                <TableSortLabel
                  active={incSortBy === "creationDate"}
                  direction={incSortBy === "creationDate" ? incOrder : "asc"}
                  onClick={() => toggleIncSort("creationDate")}
                >
                  Créé le
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {incRows.map((t) => {
              const assigned = t.assignedTo
                ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                : "-";

              return (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => openIncident(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{t.number}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.status ? t.status.label : "-"}</TableCell>
                  <TableCell>{t.priority ? t.priority.label : "-"}</TableCell>
                  <TableCell>{assigned}</TableCell>
                  <TableCell>{displaySlaResponse(t)}</TableCell>
                  <TableCell>{displaySlaResolution(t)}</TableCell>
                  <TableCell>
                    {t.creationDate
                      ? new Date(t.creationDate).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
            {incRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>Aucun incident.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* =========================== Tâches =========================== */}
      <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>
        Tâches
      </Typography>

      <Paper sx={{ width: "100%" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sortDirection={taskSortBy === "number" ? taskOrder : false}
              >
                <TableSortLabel
                  active={taskSortBy === "number"}
                  direction={taskSortBy === "number" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("number")}
                >
                  Numéro
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={taskSortBy === "title" ? taskOrder : false}
              >
                <TableSortLabel
                  active={taskSortBy === "title"}
                  direction={taskSortBy === "title" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("title")}
                >
                  Titre
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={taskSortBy === "status" ? taskOrder : false}
              >
                <TableSortLabel
                  active={taskSortBy === "status"}
                  direction={taskSortBy === "status" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("status")}
                >
                  Statut
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={taskSortBy === "priority" ? taskOrder : false}
              >
                <TableSortLabel
                  active={taskSortBy === "priority"}
                  direction={taskSortBy === "priority" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("priority")}
                >
                  Priorité
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={taskSortBy === "assignedTo" ? taskOrder : false}
              >
                <TableSortLabel
                  active={taskSortBy === "assignedTo"}
                  direction={taskSortBy === "assignedTo" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("assignedTo")}
                >
                  Assigné à
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={taskSortBy === "slaResponse" ? taskOrder : false}
              >
                <TableSortLabel
                  active={taskSortBy === "slaResponse"}
                  direction={taskSortBy === "slaResponse" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("slaResponse")}
                >
                  SLA réponse
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={
                  taskSortBy === "slaResolution" ? taskOrder : false
                }
              >
                <TableSortLabel
                  active={taskSortBy === "slaResolution"}
                  direction={taskSortBy === "slaResolution" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("slaResolution")}
                >
                  SLA résolution
                </TableSortLabel>
              </TableCell>
              <TableCell
                sortDirection={
                  taskSortBy === "creationDate" ? taskOrder : false
                }
              >
                <TableSortLabel
                  active={taskSortBy === "creationDate"}
                  direction={taskSortBy === "creationDate" ? taskOrder : "asc"}
                  onClick={() => toggleTaskSort("creationDate")}
                >
                  Créé le
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {taskRows.map((t) => {
              const assigned = t.assignedTo
                ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}`
                : "-";

              return (
                <TableRow
                  key={t.id}
                  hover
                  onClick={() => openTask(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{t.number}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.status ? t.status.label : "-"}</TableCell>
                  <TableCell>{t.priority ? t.priority.label : "-"}</TableCell>
                  <TableCell>{assigned}</TableCell>
                  <TableCell>{displaySlaResponse(t)}</TableCell>
                  <TableCell>{displaySlaResolution(t)}</TableCell>
                  <TableCell>
                    {t.creationDate
                      ? new Date(t.creationDate).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
            {taskRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>Aucune tâche.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
